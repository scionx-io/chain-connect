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

class TronHandler {
  constructor(onStateChanged) {
    this.onStateChanged = onStateChanged;
    this.tronWeb = null;
    this.boundAccountChanged = this.handleAccountChanged.bind(this);
    this.boundChainChanged = this.handleChainChanged.bind(this);
    this.boundMessageListener = this.handleMessage.bind(this);
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

      const accounts = await this.tronWeb.request({
        method: 'tron_requestAccounts',
      });
      const address = accounts[0] || this.tronWeb.defaultAddress?.base58;

      if (!address) {
        throw new Error('No Tron address found');
      }

      this.setupListeners();
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

  setupListeners() {
    // TronLink uses window messages for account changes
    window.addEventListener('message', this.boundMessageListener);

    // Network change events (if supported)
    if (typeof this.tronWeb.on === 'function') {
      this.tronWeb.on('connect', this.boundChainChanged);
      this.tronWeb.on('networkChanged', this.boundChainChanged);
    }
  }

  async disconnect() {
    window.removeEventListener('message', this.boundMessageListener);

    if (this.tronWeb && typeof this.tronWeb.removeListener === 'function') {
      this.tronWeb.removeListener('connect', this.boundChainChanged);
      this.tronWeb.removeListener('networkChanged', this.boundChainChanged);
    }

    this.tronWeb = null;
    console.log('Disconnected from Tron wallet');
  }

  handleMessage(event) {
    // Only process messages with the expected TronLink structure
    if (!event.data || typeof event.data !== 'object') return;

    const message = event.data.message;
    if (!message || typeof message !== 'object') return;

    // Validate this is a TronLink message
    if (message.action === 'setAccount') {
      const address = message.data?.address;
      if (address && typeof address === 'string') {
        this.onStateChanged({ address });
      }
    }
  }

  handleAccountChanged(address) {
    this.onStateChanged({ address });
  }

  async handleChainChanged() {
    const newChainId = await this.getChainId();
    this.onStateChanged({ chainId: newChainId });
  }

  async getChainId() {
    if (!this.tronWeb) {
      throw new Error('TronWeb not initialized');
    }

    try {
      const nodeInfo = await this.tronWeb.fullNode.request(
        '/wallet/getnodeinfo',
        {},
        'post'
      );
      if (nodeInfo?.config?.chainId !== undefined) {
        return String(nodeInfo.config.chainId);
      }
    } catch (error) {
      console.debug('Could not fetch node info:', error.message);
    }

    // Fallback: detect from endpoint
    const nodes = [
      this.tronWeb.fullNode,
      this.tronWeb.solidityNode,
      this.tronWeb.eventServer,
    ];

    for (const node of nodes) {
      if (!node?.host) continue;

      const host = node.host.toLowerCase();
      if (
        host.includes('api.trongrid.io') ||
        host.includes('tronstackapi.com')
      ) {
        return '728126428'; // Mainnet
      }
      if (host.includes('api.shasta.trongrid.io')) {
        return '2494104990'; // Shasta Testnet
      }
      if (host.includes('nile.trongrid.io')) {
        return '3448148188'; // Nile Testnet
      }
    }

    return '728126428'; // Default mainnet
  }
}

export default TronHandler;
