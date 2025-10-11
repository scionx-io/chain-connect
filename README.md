# @scionx/chain-connect

Multi-chain wallet connector supporting Ethereum, Solana, and Tron with minimalist Swiss design. This library provides a clean, easy-to-use interface for connecting to various blockchain wallets in your applications.

## Features

- Multi-chain support (Ethereum/EVM, Solana, Tron)
- Single modal interface for all wallet types
- Automatic wallet detection using EIP-6963 standard
- Auto-reconnection on page load
- Clean, responsive UI with Swiss design principles
- Event-driven architecture
- Supports all major wallet providers

## Installation

```bash
npm install @scionx/chain-connect
```

Or with yarn:

```bash
yarn add @scionx/chain-connect
```

## Usage

### Basic Usage

```javascript
import { createWalletConnector, renderWallets } from '@scionx/chain-connect';

// Create the wallet connector
const walletConnector = await createWalletConnector();

// Get a reference to your wallet modal element
const modalElement = document.getElementById('wallet-modal');

// Render wallet buttons
renderWallets(walletConnector.mipdStore, {
  walletButtonsTarget: { /* your wallet buttons container */ }
});

// Listen for connection events
walletConnector.addEventListener('connected', (event) => {
  console.log('Connected to wallet:', event.detail.connection);
});

walletConnector.addEventListener('disconnected', () => {
  console.log('Wallet disconnected');
});
```

### With Stimulus

If you're using Stimulus (Hotwire), you can use the provided controller:

```javascript
// controllers/wallet_controller.js
import { Controller } from '@hotwired/stimulus';
import { WalletController } from '@scionx/chain-connect';

// Use WalletController as a base class or reference implementation
export default class extends WalletController {
  // Extend or customize functionality as needed
}
```

### Advanced Usage

```javascript
import { WalletManager, WalletProviderResolver } from '@your-org/wallet-connector';

// Create a custom wallet manager
const { createStore } = await import('mipd');
const mipdStore = createStore();
const walletManager = new WalletManager(mipdStore);

// Initialize the wallet manager
await walletManager.init();

// Connect to a specific wallet
await walletManager.connect('io.metamask'); // Using wallet RDNS

// Disconnect
await walletManager.disconnect();

// Add event listeners
walletManager.addEventListener('connected', (event) => {
  console.log('Connected to wallet:', event.detail.connection);
});

walletManager.addEventListener('disconnected', () => {
  console.log('Wallet disconnected');
});

walletManager.addEventListener('chainChanged', (event) => {
  console.log('Chain changed:', event.detail.connection.chainId);
});

walletManager.addEventListener('accountChanged', (event) => {
  console.log('Account changed:', event.detail.connection.address);
});
```

## API Reference

### WalletManager

The main class that manages wallet connections:

- `connect(rdns, isReconnect)` - Connect to a wallet by its RDNS identifier
- `disconnect(rdns)` - Disconnect from a wallet
- `init()` - Initialize the manager and attempt auto-reconnection
- `addEventListener(type, listener)` - Add event listeners
- `removeEventListener(type, listener)` - Remove event listeners

### Events

The WalletManager emits the following events:

- `connected` - When a wallet is successfully connected
- `disconnected` - When a wallet is disconnected
- `chainChanged` - When the connected wallet's chain changes
- `accountChanged` - When the connected wallet's account changes
- `stateChanged` - When any state changes occur

### WalletController

A Stimulus controller that provides UI functionality:

- `openModal()` - Open the wallet selection modal
- `closeModal()` - Close the wallet selection modal
- `disconnectWallet()` - Disconnect the currently connected wallet
- `selectWallet(event)` - Handle wallet selection

## Supported Wallets

This library supports:

- Ethereum/EVM wallets via EIP-6963 (MetaMask, Rabby, etc.)
- Solana wallets (Phantom, etc.)
- Tron wallets (TronLink, etc.)

## Browser Compatibility

Modern browsers with Web3 wallet support (Chrome, Firefox, Edge, Safari)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

ISC