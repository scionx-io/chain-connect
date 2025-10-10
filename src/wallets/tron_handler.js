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
class TronHandler {
  constructor(onStateChanged) {
    this.onStateChanged = onStateChanged;
    this.tronWeb = null;
    this.accountChangedListener = null;
    this.boundChainChanged = this.handleChainChanged.bind(this);
  }

  async connect(providerDetails, isReconnect = false) {
    this.tronWeb = window.tronWeb || window.tronLink;
    if (!this.tronWeb) {
      throw new Error('Tron wallet not found');
    }

    try {
      if (isReconnect && !this.tronWeb.ready) {
        console.log('TronWeb not ready, skipping reconnect');
        return null;
      }

      const accounts = await this.tronWeb.request({ method: 'tron_requestAccounts' });
      const address = accounts[0] || this.tronWeb.defaultAddress.base58;

      if (!address) {
        throw new Error('No Tron address found');
      }

      this.accountChangedListener = (e) => {
        if (e.data.message && e.data.message.action === 'setAccount') {
          this.handleAccountChanged(e.data.message.data.address);
        }
      };
      window.addEventListener('message', this.accountChangedListener);

      // Tron wallets typically don't emit chain changed events, but we'll check if available
      if (this.tronWeb.on && typeof this.tronWeb.on === 'function') {
        this.tronWeb.on('connect', this.boundChainChanged); // Connection to wallet established
        this.tronWeb.on('networkChanged', this.boundChainChanged); // Network changed
      }

      const chainId = await this.getChainId();

      return {
        provider: this.tronWeb,
        address,
        chainId,
        name: providerDetails.info.name,
        rdns: providerDetails.info.rdns,
        family: 'tron',
        chains: [`tron:${chainId}`],
      };
    } catch (error) {
      console.error('Tron connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.accountChangedListener) {
      window.removeEventListener('message', this.accountChangedListener);
      this.accountChangedListener = null;
    }
    
    // Remove Tron wallet event listeners if they were added
    if (this.tronWeb && this.tronWeb.removeListener && typeof this.tronWeb.removeListener === 'function') {
      this.tronWeb.removeListener('connect', this.boundChainChanged);
      this.tronWeb.removeListener('networkChanged', this.boundChainChanged);
    }
    
    // Try to disconnect from Tron wallet if the method is available
    if (this.tronWeb && this.tronWeb.disconnect && typeof this.tronWeb.disconnect === 'function') {
      try {
        await this.tronWeb.disconnect();
        console.log('Disconnected from Tron wallet');
      } catch (error) {
        console.log('Tron wallet disconnect method failed or not supported', error);
      }
    }
    
    console.log('TronLink handler cleaned up.');
  }

  handleAccountChanged(address) {
    this.onStateChanged({ address });
  }

  async handleChainChanged() {
    // Handle Tron chain changes by fetching the new chain ID
    const newChainId = await this.getChainId();
    this.onStateChanged({ chainId: newChainId });
  }

  async getChainId() {
    if (!this.tronWeb) {
      throw new Error('TronWeb not initialized');
    }

    try {
      // Use TronWeb's API to get the node information which includes the chain ID
      const nodeInfo = await this.tronWeb.fullNode.request('/wallet/getnodeinfo', {}, 'post');
      if (nodeInfo && nodeInfo.config) {
        // Extract chain ID from the node configuration
        const chainId = nodeInfo.config.chainId;
        if (chainId !== undefined) {
          // Tron uses decimal chain IDs, but we'll convert to hex as used in the original code
          return '0x' + parseInt(chainId).toString(16);
        }
      }

      // If the above fails, try to determine from the node endpoints
      const nodes = [
        this.tronWeb.fullNode,
        this.tronWeb.solidityNode,
        this.tronWeb.eventServer
      ];

      for (const node of nodes) {
        if (node && node.host) {
          const host = node.host;
          if (host.includes('api.trongrid.io') || host.includes('tronstackapi.com')) {
            return '0x2b6653dc'; // Mainnet
          } else if (host.includes('api.shasta.trongrid.io')) {
            return '0x94a9059e'; // Shasta Testnet
          } else if (host.includes('nile.trongrid.io')) {
            return '0xcd8690dc'; // Nile Testnet
          }
        }
      }

      // If we still can't determine, use the default mainnet ID
      return '0x2b6653dc';
    } catch (error) {
      console.error('Error fetching Tron chain ID:', error);
      // Default to Mainnet if we can't detect the network
      return '0x2b6653dc';
    }
  }
}

export default TronHandler;