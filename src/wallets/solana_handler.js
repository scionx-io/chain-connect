import { Connection } from '@solana/web3.js';

/**
 * @typedef {object} Connection
 * @property {object} provider - The wallet provider object.
 * @property {string} address - The user's wallet address.
 * @property {string} chainId - The current chain ID.
 * @property {string} name - The name of the wallet.
 * @property {string} rdns - The reverse domain name service of the wallet.
 * @property {string} family - The wallet family (evm, solana, tron).
 * @property {string[]} chains - An array of supported chains.
 */

/**
 * @interface WalletHandler
 * @method connect - Connects to the wallet and returns a Connection object.
 * @method disconnect - Disconnects from the wallet.
 */
class SolanaHandler {
  constructor(onStateChanged) {
    this.onStateChanged = onStateChanged;
    this.provider = null;
    this.boundAccountChanged = this.handleAccountChanged.bind(this);
    this.boundChainChanged = this.handleChainChanged.bind(this);
  }

  async connect(providerDetails, isReconnect = false) {
    this.provider = providerDetails.provider;
    try {
      const resp = isReconnect 
        ? await this.provider.connect({ onlyIfTrusted: true })
        : await this.provider.connect();

      if (!resp.publicKey) {
        if (isReconnect) {
          console.log('No accounts found during reconnect');
          return null;
        }
        throw new Error('No accounts found.');
      }

      const address = resp.publicKey.toString();

      this.provider.on('accountChanged', this.boundAccountChanged);
      
      // Attempt to listen for network/cluster changes and disconnect events if the provider supports it
      if (typeof this.provider.on === 'function') {
        this.provider.on('connect', this.boundChainChanged); // When connected to wallet
        this.provider.on('disconnect', this.handleDisconnect.bind(this)); // When disconnected
        // Some Solana providers may emit networkChanged, but it's not standard
        if (this.provider.on('networkChanged')) {
          this.provider.on('networkChanged', this.boundChainChanged);
        }
      }

      const chainId = await this.getChainId();

      return {
        provider: this.provider,
        address,
        chainId,
        name: providerDetails.info.name,
        rdns: providerDetails.info.rdns,
        family: 'solana',
        chains: [`solana:${chainId}`],
      };
    } catch (error) {
      console.error('Solana connection error:', error);
      throw error;
    }
  }

  disconnect() {
    if (this.provider) {
      this.provider.removeListener('accountChanged', this.boundAccountChanged);
      // Remove other event listeners if they were added
      this.provider.removeListener('connect', this.boundChainChanged);
      this.provider.removeListener('disconnect', this.boundChainChanged);
      if (this.provider.removeListener) {
        this.provider.removeListener('networkChanged', this.boundChainChanged);
      }
      this.provider.disconnect();
      this.provider = null;
    }
    console.log('Disconnected from Solana wallet');
  }

  handleAccountChanged(publicKey) {
    if (publicKey) {
      this.onStateChanged({ address: publicKey.toString() });
    } else {
      this.onStateChanged({ address: null, chainId: null });
    }
  }

  async handleChainChanged() {
    // For Solana, network/cluster changes typically require reconnecting
    // Get the new chain ID after a network change
    const newChainId = await this.getChainId();
    this.onStateChanged({ chainId: newChainId });
  }

  handleDisconnect() {
    // When the wallet is disconnected externally, update the state
    this.onStateChanged({ address: null, chainId: null });
  }

  /**
   * Dynamically determines the Solana chain ID based on the connection endpoint
   * @returns {Promise<string>} The chain ID corresponding to the current cluster
   */
  async getChainId() {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      // Most Solana wallets expose the connection object which contains the endpoint
      const endpoint = this.provider._rpcEndpoint || this.provider._apiEndpoint || this.provider.connection?.rpcEndpoint || this.provider.connection?.endpoint;
      
      if (endpoint) {
        if (endpoint.includes('mainnet') || endpoint.includes('mainnet-beta')) {
          return '101'; // Mainnet-beta
        } else if (endpoint.includes('devnet')) {
          return '103'; // Devnet
        } else if (endpoint.includes('testnet')) {
          return '102'; // Testnet
        }
      }
      
      // If we can't determine from endpoint, try to fetch from the cluster
      // This requires a network call to get the version or genesis hash
      if (this.provider.connection) {
        // Using a network call to identify the cluster
        try {
          const version = await this.provider.connection.getVersion();
          if (version) {
            // Check for specific identifiers in the version response
            if (version['solana-core']) {
              // Check if connected to mainnet by attempting to get a known mainnet-specific account
              // This is a more robust way, but for now we'll try to get the cluster type
              const genesis = await this.provider.connection.getGenesisHash();
              // Mainnet-beta genesis hash starts with '4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z'
              if (genesis.startsWith('4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z')) {
                return '101'; // Mainnet-beta
              }
            }
          }
        } catch (e) {
          console.warn('Could not fetch cluster info via connection, using fallback method');
        }
      }
      
      // Fallback to checking available methods or properties specific to wallet providers
      if (this.provider.isPhantom) {
        // Phantom provider specific check
        if (this.provider.publicKey) {
          // If available, try to get cluster information based on network settings
          if (typeof this.provider.publicKey.toBase58 === 'function') {
            // For Phantom, often the endpoint is accessible through connection property
          }
        }
      }
      
      // Default fallback - if all methods fail, return '101' (mainnet-beta)
      // But we should try to determine it from the connection endpoint URL if possible
      return '101';
    } catch (error) {
      console.error('Error fetching Solana chain ID:', error);
      // Fallback to mainnet-beta if we can't detect the network
      return '101';
    }
  }
}

export default SolanaHandler;
