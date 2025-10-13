# @scionx/chain-connect

Multi-chain wallet connector. Connect to Ethereum, Solana, and Tron wallets with a single interface.

## Features

- Multi-chain: Ethereum, Solana, Tron
- Auto-detect wallets (EIP-6963)
- Auto-reconnect on page load
- Mobile-first responsive
- Built with Stimulus

## Install

```bash
npm install @scionx/chain-connect
```

## Usage

```html
<div data-controller="wallet">
  <button data-action="click->wallet#open">Connect Wallet</button>
  <button data-action="click->wallet#disconnectWallet">Disconnect</button>
</div>
```

```javascript
import { Application } from '@hotwired/stimulus';
import { WalletController } from '@scionx/chain-connect';
import '@scionx/chain-connect/style';

const application = Application.start();
application.register('wallet', WalletController);
```

## Events

```html
<div
  data-controller="wallet"
  data-action="wallet:connected->app#handleConnected
               wallet:disconnected->app#handleDisconnected"
>
  <button data-action="click->wallet#open">Connect</button>
</div>
```

## Access State

```javascript
// Stimulus values
walletController.addressValue      // Wallet address
walletController.chainIdValue      // Chain ID
walletController.isConnectedValue  // Connection status

// Via outlets
static outlets = ['wallet'];
this.walletOutlet.addressValue
```

## Supported Wallets

- **Ethereum**: MetaMask, Coinbase Wallet, Rainbow, any EIP-6963 wallet
- **Solana**: Phantom, Solflare
- **Tron**: TronLink

## Example

```bash
yarn dev
```

## License

ISC
