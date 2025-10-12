import { ethers } from 'ethers';

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

class EvmHandler {
  constructor(onStateChanged) {
    this.onStateChanged = onStateChanged;
    this.provider = null;
    this.originalProvider = null;
    this.boundAccountsChanged = this.handleAccountsChanged.bind(this);
    this.boundChainChanged = this.handleChainChanged.bind(this);
  }

  async connect(providerDetails, isReconnect = false) {
    try {
      this.originalProvider = providerDetails.provider;
      this.provider = new ethers.BrowserProvider(this.originalProvider);
      
      const method = isReconnect ? 'eth_accounts' : 'eth_requestAccounts';
      const accounts = await this.provider.send(method, []);

      if (accounts.length === 0) {
        if (isReconnect) {
          console.log('No accounts found during reconnect');
          return null;
        }
        throw new Error('No accounts found.');
      }

      const address = ethers.getAddress(accounts[0]); // Checksummed
      const chainId = await this.getChainId();

      this.originalProvider.on('accountsChanged', this.boundAccountsChanged);
      this.originalProvider.on('chainChanged', this.boundChainChanged);

      return {
        provider: this.provider,
        address,
        chainId,
        name: providerDetails.info.name,
        rdns: providerDetails.info.rdns,
        family: 'evm',
        chains: [`eip155:${chainId}`],
      };
    } catch (error) {
      if (error.code === 4001) {
        throw new Error('User rejected connection request');
      }
      console.error('EVM connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (!this.originalProvider) return;

    // Try to revoke permissions
    try {
      await this.originalProvider.request({
        method: 'wallet_revokePermissions',
        params: [{ eth_accounts: {} }]
      });
    } catch (error) {
      console.debug('wallet_revokePermissions not supported:', error.message);
    }

    // Remove listeners
    this.originalProvider.removeListener('accountsChanged', this.boundAccountsChanged);
    this.originalProvider.removeListener('chainChanged', this.boundChainChanged);
    
    this.provider = null;
    this.originalProvider = null;
    console.log('Disconnected from EVM wallet');
  }

  handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      this.onStateChanged({ address: null, chainId: null });
    } else {
      this.onStateChanged({ address: ethers.getAddress(accounts[0]) });
    }
  }

  handleChainChanged(chainId) {
    // Use chainId from event directly (it's already hex string)
    const decimal = parseInt(chainId, 16).toString();
    this.onStateChanged({ chainId: decimal });
  }

  async getChainId() {
    const network = await this.provider.getNetwork();
    return network.chainId.toString();
  }
}

export default EvmHandler;