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
    this.boundDisconnect = this.handleDisconnect.bind(this);
  }

  setupEventListeners() {
    if (typeof this.provider.on === 'function') {
      try {
        this.provider.on('accountChanged', this.boundAccountChanged);
      } catch (e) {
        console.debug('accountChanged event not supported by this provider or listener invalid:', e.message);
      }
      
      try {
        this.provider.on('connect', this.boundChainChanged);
      } catch (e) {
        console.debug('connect event not supported by this provider or listener invalid:', e.message);
      }
      
      try {
        this.provider.on('disconnect', this.boundDisconnect);
      } catch (e) {
        console.debug('disconnect event not supported by this provider or listener invalid:', e.message);
      }
      
      // Some Solana providers may emit networkChanged, but it's not standard
      try {
        this.provider.on('networkChanged', this.boundChainChanged);
      } catch (e) {
        // networkChanged event might not be supported by all providers, that's ok
        console.debug('networkChanged event not supported by this provider or listener invalid:', e.message);
      }
    }
  }

  async connect(providerDetails, isReconnect = false) {
    this.provider = providerDetails.provider;
    
    try {
      // Check if the provider is already connected (like MIPD providers might be)
      if (this.provider.isConnected || this.provider.isReady || this.provider.publicKey) {
        // If already connected, just get the address directly
        if (this.provider.publicKey) {
          const address = this.provider.publicKey.toBase58();
          // Set up event listeners
          this.setupEventListeners();
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
        }
      }
      
      // If not connected, try using the connect method
      if (typeof this.provider.connect === 'function') {
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
        
        // Set up event listeners
        this.setupEventListeners();
        
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
      } else {
        // Special handling for Phantom and other Solana providers that might need initialization
        // Check if it's a Phantom wallet that might need to be activated differently
        if (this.provider.isPhantom || providerDetails.info.rdns.includes('phantom')) {
          // Phantom wallets can sometimes be accessed differently
          // Wait a bit for the provider to fully initialize if needed
          if (typeof window !== 'undefined' && window.phantom && window.phantom.solana) {
            // Phantom might be available through its own namespace
            this.provider = window.phantom.solana;
          }
          
          // Check again if the provider now has a connect method after potential initialization
          if (typeof this.provider.connect === 'function') {
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
            
            // Set up event listeners
            this.setupEventListeners();
            
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
          } else if (this.provider.publicKey) {
            // If there's already a public key, use it directly
            const address = this.provider.publicKey.toBase58();
            
            // Set up event listeners
            this.setupEventListeners();
            
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
          }
        }
        
        // For providers without a connect method but with request function (older standards)
        if (typeof this.provider.request === 'function') {
          try {
            // Try connecting via request method
            const resp = await this.provider.request({
              method: 'connect',
              params: isReconnect ? { onlyIfTrusted: true } : {}
            });
            
            if (resp && resp.publicKey) {
              const address = resp.publicKey.toBase58();
              
              // Set up event listeners
              this.setupEventListeners();
              
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
            }
          } catch (requestError) {
            console.warn('Request-based connection failed, attempting fallback methods:', requestError);
          }
        }
        
        // If connect method doesn't exist, try alternative approach for MIPD providers
        if (this.provider.publicKey) {
          const address = this.provider.publicKey.toBase58();
          
          // Set up event listeners
          this.setupEventListeners();
          
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
        } else {
          // If all methods fail, try checking if it's a global provider that might need initialization
          if (providerDetails.info.rdns.includes('phantom') && typeof window !== 'undefined') {
            // Sometimes Phantom is available as window.solana but needs to be accessed differently
            if (window.solana && window.solana.isPhantom) {
              // Try connecting to the global Phantom provider
              const globalPhantom = window.solana;
              if (typeof globalPhantom.connect === 'function') {
                const resp = isReconnect 
                  ? await globalPhantom.connect({ onlyIfTrusted: true })
                  : await globalPhantom.connect();

                if (resp.publicKey) {
                  const address = resp.publicKey.toString();
                  
                  // Update our provider reference
                  this.provider = globalPhantom;
                  
                  // Set up event listeners
                  this.setupEventListeners();
                  
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
                }
              }
            }
          }
          
          throw new Error('Provider does not have connect method and is not already connected');
        }
      }
    } catch (error) {
      console.error('Solana connection error:', error);
      throw error;
    }
  }

  disconnect() {
    if (this.provider && typeof this.provider.removeListener === 'function') {
      try {
        this.provider.removeListener('accountChanged', this.boundAccountChanged);
      } catch (e) {
        console.debug('Error removing accountChanged listener:', e.message);
      }
      
      try {
        this.provider.removeListener('connect', this.boundChainChanged);
      } catch (e) {
        console.debug('Error removing connect listener:', e.message);
      }
      
      try {
        this.provider.removeListener('disconnect', this.boundDisconnect);
      } catch (e) {
        console.debug('Error removing disconnect listener:', e.message);
      }
      
      try {
        this.provider.removeListener('networkChanged', this.boundChainChanged);
      } catch (e) {
        console.debug('Error removing networkChanged listener:', e.message);
      }
    }
    
    // Use disconnect method if available
    if (this.provider && typeof this.provider.disconnect === 'function') {
      try {
        this.provider.disconnect();
      } catch (e) {
        console.debug('Error calling disconnect method:', e.message);
      }
    }
    
    this.provider = null;
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
