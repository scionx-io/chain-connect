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

## Project Structure

This library follows a modular architecture with clear separation of concerns:

```
src/
├── core/                    # Core wallet business logic
│   ├── wallet_manager.js    # Main wallet management class
│   ├── wallet_discovery.js  # Wallet detection and discovery
│   ├── wallet_registry.js   # Handler registry for different wallet families
│   ├── connection_manager.js # Connection lifecycle management
│   └── wallets/             # Wallet family handlers
│       ├── evm_handler.js   # EVM-based wallet (MetaMask, etc.) handler
│       ├── solana_handler.js # Solana wallet (Phantom, etc.) handler
│       ├── tron_handler.js   # Tron wallet (TronLink, etc.) handler
│       └── index.js          # Handler registration
├── controllers/             # Stimulus controllers (UI layer)
│   ├── connector_controller.js # Central hub controller for all wallet operations
│   ├── wallets_controller.js   # Controller for wallet list management and selection modal
│   └── modal_controller.js     # Controller for general modal interactions
├── services/                # External service integrations
│   └── (currently empty)    # Reserved for future services
├── utils/                   # Utility functions
│   ├── chain_utils.js       # Chain utility functions
│   └── utils.js             # General utility functions
├── config.js                # Configuration constants and wallet icons
├── index.js                 # Main entry point
└── wallets.js               # Wallet rendering utilities
```

### Architecture Overview

- **Core Logic (`core/`)**: Contains all wallet business logic including connection management, wallet discovery, and chain-specific handlers
- **Controllers (`controllers/`)**: Stimulus controllers managing UI interactions
- **Services (`services/`)**: Service layer for external integrations (future use)
- **Utils (`utils/`)**: Reusable utility functions

## Example Implementation

A complete example implementation demonstrating how to use this package is available in the `example/` directory:

```bash
# Clone the repository
git clone <repository-url>
cd chain-connect

# Build the package
yarn build && yarn pack

# Navigate to the example directory
cd example

# Install dependencies
npm install  # or yarn install

# Run the development server
npm run dev  # or yarn dev
```

The example shows how to integrate the wallet connector in a standalone project with all the necessary HTML structure, JavaScript setup, and styling.

## Browser Compatibility

Modern browsers with Web3 wallet support (Chrome, Firefox, Edge, Safari)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

ISC