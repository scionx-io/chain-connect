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
walletController.statusValue       // Wallet lifecycle status ('idle', 'connecting', 'connected', 'disconnected')

// Via outlets
static outlets = ['wallet'];
this.walletOutlet.addressValue
this.walletOutlet.statusValue
```

## Status Value

The WalletController now provides a `status` value that represents the wallet connection lifecycle:

- `'idle'` - Initial state when no saved wallet state exists
- `'connecting'` - When a connection attempt is in progress (both manual and auto-reconnect)
- `'connected'` - When a wallet is successfully connected
- `'disconnected'` - When disconnected, connection attempt fails, or auto-reconnect fails

### Status Change Events

The controller dispatches a `status-changed` event when the status changes:

```javascript
// Listen to status changes
document.addEventListener('wallet:status-changed', (event) => {
  console.log('New status:', event.detail.status);
});
```

### Outlet Integration

You can use the outlet system to react to status changes in other controllers:

```javascript
// In your controller that uses the wallet outlet
static outlets = ['wallet'];

// This method is automatically called when the wallet outlet's status changes
walletOutletStatusValueChanged(status) {
  switch (status) {
    case 'connected':
      this.showPay();
      break;
    case 'connecting':
      this.showLoader();
      break;
    case 'idle':
    case 'disconnected':
      this.showConnect();
      break;
  }
}
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

## Hotwire/Turbo Compatibility

The wallet connection state is now preserved across Turbo Stream updates. When a Turbo update replaces the DOM element containing the WalletController, the connection session is maintained in localStorage, allowing for seamless auto-reconnection. The session is only cleared when the user explicitly disconnects from the wallet.
