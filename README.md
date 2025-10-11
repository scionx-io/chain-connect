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
- Built-in error handling with user-friendly error messages
- 30-second connection timeout to prevent hanging connections

## Installation

```bash
npm install @scionx/chain-connect
```

Or with yarn:

```bash
yarn add @scionx/chain-connect
```

## Usage

### HTML Structure

First, set up the HTML structure for the wallet connector:

```html
<div data-controller="wallet">
  <button data-action="click->wallet#openModal" 
          data-wallet-target="connectWalletBtn">
    Connect Wallet
  </button>
  
  <dialog data-wallet-target="modal" class="wallet-modal">
    <div class="wallet-modal-content">
      <div class="wallet-modal-header">
        <h2>Connect your wallet</h2>
        <button data-action="click->wallet#closeModal" 
                data-wallet-target="closeModalBtn">&times;</button>
      </div>
      <div data-wallet-target="walletButtons" class="wallet-buttons">
        <!-- Wallet buttons will be dynamically rendered here -->
      </div>
    </div>
  </dialog>
  
  <div data-wallet-target="walletInfo" class="wallet-info" style="display:none;">
    <div class="wallet-details">
      <span data-wallet-target="walletName"></span>
      <span data-wallet-target="walletAddress"></span>
      <span data-wallet-target="walletChain"></span>
    </div>
    <button data-action="click->wallet#disconnectWallet" 
            data-wallet-target="disconnectBtn">Disconnect</button>
  </div>
</div>
```

### With Stimulus (Recommended)

If you're using Stimulus (Hotwire), use the provided controller:

```javascript
// controllers/wallet_controller.js
import { Controller } from '@hotwired/stimulus';
import { WalletController } from '@scionx/chain-connect';

// Extend the WalletController to customize functionality
export default class extends WalletController {
  // Extend or customize functionality as needed
}
```

### Direct Usage

For direct usage without Stimulus:

```javascript
import { createWalletConnector } from '@scionx/chain-connect';

// Create and initialize the wallet connector
const walletConnector = await createWalletConnector();
```

## API Reference

### WalletManager

The main class that manages wallet connections:

- `connect(rdns, isReconnect)` - Connect to a wallet by its RDNS identifier
- `disconnect(rdns?)` - Disconnect from a wallet (if no RDNS provided, disconnects from active connection)
- `init()` - Initialize the manager and attempt auto-reconnection from stored state
- `addEventListener(type, listener)` - Add event listeners
- `removeEventListener(type, listener)` - Remove event listeners
- `findProvider(rdns)` - Find a wallet provider by its RDNS identifier

### WalletController (Stimulus)

A Stimulus controller with UI functionality:

- `openModal()` - Open the wallet selection modal
- `closeModal()` - Close the wallet selection modal
- `disconnectWallet()` - Disconnect the currently connected wallet
- `selectWallet(event)` - Handle wallet selection
- `toggleAllWallets(event)` - Toggle visibility of additional wallet options

### Utility Functions

- `createWalletConnector()` - Creates and initializes a new wallet connector
- `renderWallets(mipdStore, controller)` - Render wallet buttons based on detected wallets

### Events

The WalletManager emits the following events:

- `connected` - When a wallet is successfully connected
- `disconnected` - When a wallet is disconnected
- `chainChanged` - When the connected wallet's chain changes
- `accountChanged` - When the connected wallet's account changes
- `stateChanged` - When any state changes occur (chain or account)

## Auto-detection & Multi-chain Support

The library automatically detects wallets using multiple methods:

1. MIPD (Multi Injected Provider Discovery) for EIP-6963 compliant wallets
2. Direct checks for `window.solana` (for Solana wallets like Phantom)
3. Direct checks for `window.tronWeb` or `window.tronLink` (for Tron wallets like TronLink)

Wallets are grouped by blockchain family (EVM, Solana, Tron, Multi-chain) and prioritized (Phantom, MetaMask, Coinbase Wallet).

## Error Handling

The library provides comprehensive error handling with user-friendly messages for:
- Connection timeout (30 seconds)
- Wallet not found or not available
- Unsupported wallet family
- User rejection of connection request
- Network errors
- Account not found in wallet
- Tron wallet not accessible

## Supported Wallets

This library supports:

- Ethereum/EVM wallets via EIP-6963 (MetaMask, Rabby, Trust Wallet, etc.)
- Solana wallets (Phantom, Solflare, etc.)
- Tron wallets (TronLink, TokenPocket, etc.)
- Multi-chain wallets that support multiple networks

## CSS Styling and Swiss Design

The library includes built-in CSS styles following Swiss design principles:
- Minimalist, clean interface
- 8px grid system
- Mobile-first responsive design
- Helvetica Neue typography
- Monochromatic color palette with accent colors for wallet brands

## Browser Compatibility

Modern browsers with Web3 wallet support (Chrome, Firefox, Edge, Safari)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

ISC