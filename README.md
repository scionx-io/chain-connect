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

## Quick Start

### Installation

```bash
npm install @scionx/chain-connect
# or
yarn add @scionx/chain-connect
```

### Basic Usage

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

That's it! The controller handles everything:
- EIP-6963 wallet detection
- Modal rendering
- Connection management
- State persistence

### Listening to Events

```html
<div data-controller="wallet"
     data-action="wallet:connected->mycontroller#handleConnected
                  wallet:disconnected->mycontroller#handleDisconnected">
  <button data-action="click->wallet#open">Connect Wallet</button>
</div>
```

### Accessing Wallet State

```javascript
// Via Stimulus values
const address = walletController.addressValue;
const chainId = walletController.chainIdValue;
const isConnected = walletController.isConnectedValue;

// Via outlets
static outlets = ['wallet'];

if (this.walletOutlet.isConnectedValue) {
  console.log('Connected to:', this.walletOutlet.addressValue);
}
```

### Supported Wallets

- **Ethereum**: MetaMask, Coinbase Wallet, Rainbow, any EIP-6963 wallet
- **Solana**: Phantom, Solflare, any wallet with `window.solana`
- **Tron**: TronLink, any wallet with `window.tronWeb`

## API Reference

### WalletController (Stimulus)

Main controller for wallet connection management:

**Actions:**
- `open()` - Open the wallet selection modal
- `close()` - Close the wallet selection modal
- `selectWallet(event)` - Handle wallet selection from modal
- `disconnectWallet()` - Disconnect the currently connected wallet

**Stimulus Values:**
- `addressValue` - Connected wallet address
- `chainIdValue` - Current chain ID
- `walletNameValue` - Name of connected wallet
- `rdnsValue` - RDNS identifier of connected wallet
- `familyValue` - Wallet family (evm, solana, tron)
- `isConnectedValue` - Boolean connection state
- `connectingValue` - Boolean loading state

**Events Dispatched:**
- `wallet:connected` - When a wallet successfully connects
- `wallet:disconnected` - When a wallet disconnects
- `wallet:chainChanged` - When the connected wallet's chain changes
- `wallet:accountChanged` - When the connected wallet's account changes
- `wallet:connecting` - When a connection attempt starts
- `wallet:error` - When a connection error occurs

### WalletManager

The main class that manages wallet connections:

- `connect(rdns, isReconnect)` - Connect to a wallet by its RDNS identifier
- `disconnect(rdns?)` - Disconnect from a wallet (if no RDNS provided, disconnects from active connection)
- `init()` - Initialize the manager and attempt auto-reconnection from stored state
- `addEventListener(type, listener)` - Add event listeners
- `removeEventListener(type, listener)` - Remove event listeners
- `getActiveConnection()` - Get the currently active connection
- `getDetectedWallets()` - Get list of detected wallets

**Events Emitted:**
- `connected` - When a wallet is successfully connected
- `disconnected` - When a wallet is disconnected
- `chainChanged` - When the connected wallet's chain changes
- `accountChanged` - When the connected wallet's account changes
- `stateChanged` - When any state changes occur (chain or account)

### Utility Functions

- `createWalletConnector()` - Creates and initializes a new wallet connector
- `renderWalletModal(wallets, onSelect, onClose)` - Render wallet modal DOM
- `getChainName(chainId)` - Get human-readable chain name
- `formatChainDisplay(chainId)` - Format chain for display

## Wallet Detection

Automatically discovers wallets using:
- **EIP-6963** (MIPD) for Ethereum wallets
- **window.solana** for Solana wallets
- **window.tronWeb** for Tron wallets

## Swiss Design

Built-in minimalist styling:
- 8px grid system
- Mobile-first responsive
- Helvetica Neue typography
- Clean monochromatic palette

## Architecture

Clean separation between UI and business logic:

- **WalletController** - Single Stimulus controller managing UI and events
- **WalletManager** - Core connection logic and state management
- **Chain Handlers** - EVM, Solana, and Tron-specific implementations
- **Modal Renderer** - Pure function for modal UI generation

## Example

See `example/` directory for a complete working implementation.

```bash
cd example && yarn dev
```

## License

ISC