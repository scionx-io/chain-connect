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

class SolanaHandler {
  constructor(onStateChanged) {
    this.onStateChanged = onStateChanged;
    this.provider = null;
    this.boundAccountChanged = this.handleAccountChanged.bind(this);
    this.boundChainChanged = this.handleChainChanged.bind(this);
    this.boundDisconnect = this.handleDisconnect.bind(this);
  }

  setupEventListeners() {
    if (typeof this.provider.on !== 'function') return;

    this.provider.on('accountChanged', this.boundAccountChanged);
    this.provider.on('connect', this.boundChainChanged);
    this.provider.on('disconnect', this.boundDisconnect);
    this.provider.on('networkChanged', this.boundChainChanged);
  }

  async connect(providerDetails, isReconnect = false) {
    this.provider = providerDetails.provider;

    try {
      const options = isReconnect ? { onlyIfTrusted: true } : {};
      const resp = await this.provider.connect(options);

      if (!resp?.publicKey) {
        return null;
      }

      const address = resp.publicKey.toBase58();
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
    } catch (error) {
      console.error('Solana connection error:', error);
      throw error;
    }
  }

  disconnect() {
    if (!this.provider) return;

    if (typeof this.provider.removeListener === 'function') {
      this.provider.removeListener('accountChanged', this.boundAccountChanged);
      this.provider.removeListener('connect', this.boundChainChanged);
      this.provider.removeListener('disconnect', this.boundDisconnect);
      this.provider.removeListener('networkChanged', this.boundChainChanged);
    }

    this.provider = null;
    console.log('Disconnected from Solana wallet');
  }

  handleAccountChanged(publicKey) {
    if (publicKey) {
      this.onStateChanged({ address: publicKey.toBase58() });
    } else {
      this.onStateChanged({ address: null, chainId: null });
    }
  }

  async handleChainChanged() {
    const newChainId = await this.getChainId();
    this.onStateChanged({ chainId: newChainId });
  }

  handleDisconnect() {
    this.onStateChanged({ address: null, chainId: null });
  }

  async getChainId() {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const endpoint =
      this.provider._rpcEndpoint ||
      this.provider._apiEndpoint ||
      this.provider.connection?.rpcEndpoint;

    if (endpoint) {
      const lower = endpoint.toLowerCase();
      if (lower.includes('mainnet')) return '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
      if (lower.includes('devnet')) return 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1';
      if (lower.includes('testnet')) return '4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z';
    }

    return '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
  }
}

export default SolanaHandler;
