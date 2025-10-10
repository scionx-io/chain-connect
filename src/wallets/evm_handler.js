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
import { ethers } from 'ethers';

class EvmHandler {
  constructor(onStateChanged) {
    this.onStateChanged = onStateChanged;
    this.provider = null;
    this.originalProvider = null; // Store the original injected provider
    this.boundAccountsChanged = this.handleAccountsChanged.bind(this);
    this.boundChainChanged = this.handleChainChanged.bind(this);
  }

  async connect(providerDetails, isReconnect = false) {
    try {
      this.originalProvider = providerDetails.provider; // Store the original injected provider
      this.provider = new ethers.BrowserProvider(this.originalProvider);
      
      const accounts = isReconnect 
        ? await this.provider.send('eth_accounts', [])
        : await this.provider.send('eth_requestAccounts', []);

      if (accounts.length === 0) {
        if (isReconnect) {
          console.log('No accounts found during reconnect');
          return null;
        }
        throw new Error('No accounts found.');
      }

      const signer = await this.provider.getSigner();
      const address = await signer.getAddress();
      const network = await this.provider.getNetwork();
      const chainId = network.chainId.toString();

      // Add event listeners for state changes to the injected provider directly
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
        console.log('User rejected connection request');
      } else {
        console.error('EVM connection error:', error);
      }
      throw error;
    }
  }

  disconnect() {
    if (this.originalProvider) {
      // Remove event listeners from the injected provider
      this.originalProvider.removeListener('accountsChanged', this.boundAccountsChanged);
      this.originalProvider.removeListener('chainChanged', this.boundChainChanged);
    }
    this.provider = null;
    this.originalProvider = null;
    console.log('Disconnected from EVM handler');
  }

  handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      this.onStateChanged({ address: null, chainId: null });
    } else {
      this.onStateChanged({ address: accounts[0] });
    }
  }

  async handleChainChanged(chainId) {
    const network = await this.provider.getNetwork();
    this.onStateChanged({ chainId: network.chainId.toString() });
  }
}

export default EvmHandler;
