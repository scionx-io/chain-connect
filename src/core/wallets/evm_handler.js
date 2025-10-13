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
      console.log('[EvmHandler] Connecting with provider details:', providerDetails);
      this.originalProvider = providerDetails.provider;
      this.provider = new ethers.BrowserProvider(this.originalProvider);

      const method = isReconnect ? 'eth_accounts' : 'eth_requestAccounts';
      console.log(`[EvmHandler] Sending ${method} request`);
      const accounts = await this.provider.send(method, []);
      console.log('[EvmHandler] Accounts received:', accounts);

      if (accounts.length === 0) {
        if (isReconnect) {
          console.warn('[EvmHandler] No accounts found during reconnect.');
          return null;
        }
        throw new Error('No accounts found. User may have rejected.');
      }

      const address = ethers.getAddress(accounts[0]);
      const chainId = await this.getChainId();
      console.log(`[EvmHandler] Address: ${address}, ChainID: ${chainId}`);

      this.originalProvider.on('accountsChanged', this.boundAccountsChanged);
      this.originalProvider.on('chainChanged', this.boundChainChanged);
      console.log('[EvmHandler] Event listeners attached.');

      const connection = {
        provider: this.provider,
        address,
        chainId,
        name: providerDetails.info.name,
        rdns: providerDetails.info.rdns,
        family: 'evm',
        chains: [`eip155:${chainId}`],
      };
      console.log('[EvmHandler] Connection object created:', connection);
      return connection;
    } catch (error) {
      if (error.code === 4001) {
        console.error('[EvmHandler] User rejected connection request.');
        throw new Error('User rejected connection request');
      }
      console.error('[EvmHandler] Connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (!this.originalProvider) return;

    // Try to revoke permissions
    try {
      await this.originalProvider.request({
        method: 'wallet_revokePermissions',
        params: [{ eth_accounts: {} }],
      });
    } catch (error) {
      console.debug('wallet_revokePermissions not supported:', error.message);
    }

    // Remove listeners
    this.originalProvider.removeListener(
      'accountsChanged',
      this.boundAccountsChanged
    );
    this.originalProvider.removeListener(
      'chainChanged',
      this.boundChainChanged
    );

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
