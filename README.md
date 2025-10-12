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

### CSS Styles

The wallet connector uses built-in CSS styles following Swiss design principles. You need to import the CSS file in your application:

```javascript
// Option 1: Named export (recommended)
import '@scionx/chain-connect/style';

// Option 2: Direct file path
import '@scionx/chain-connect/dist/chain-connect.css';
```

Alternatively, you can link the CSS in your HTML:
```html
<link rel="stylesheet" href="node_modules/@scionx/chain-connect/dist/chain-connect.css">
```

### HTML Structure

Set up a minimal HTML structure for the wallet connector:

```html
<div data-controller="wallet">
  <button data-action="wallet#openModal">Connect Wallet</button>
  <!-- The controller creates all other UI elements dynamically -->
</div>
```

### With Stimulus (Recommended)

If you're using Stimulus (Hotwire), use the provided controller:

```javascript
// Import CSS in your main application file
import '@scionx/chain-connect/style';

import { Application } from '@hotwired/stimulus';
import { ConnectorController } from '@scionx/chain-connect';

const application = Application.start();
application.register('wallet', ConnectorController);
```

The controller will dynamically create all necessary UI elements (modal, wallet buttons, connection info, etc.) when needed. You only need to provide a trigger button in your HTML.

### Direct Usage

For direct usage without Stimulus:

```javascript
// Import CSS in your main application file
import '@scionx/chain-connect/style';

import { createWalletConnector } from '@scionx/chain-connect';

// Create and initialize the wallet connector
const walletConnector = await createWalletConnector();
```

Note: The direct usage approach bypasses the Stimulus controller and requires manual UI implementation. For the full UI experience with modals and wallet selection, the Stimulus approach is recommended.

## API Reference

### WalletManager

The main class that manages wallet connections:

- `connect(rdns, isReconnect)` - Connect to a wallet by its RDNS identifier
- `disconnect(rdns?)` - Disconnect from a wallet (if no RDNS provided, disconnects from active connection)
- `init()` - Initialize the manager and attempt auto-reconnection from stored state
- `addEventListener(type, listener)` - Add event listeners
- `removeEventListener(type, listener)` - Remove event listeners
- `findProvider(rdns)` - Find a wallet provider by its RDNS identifier

### ConnectorController (Stimulus)

A Stimulus controller with UI functionality:

- `openModal()` - Open the wallet selection modal
- `closeModal()` - Close the wallet selection modal
- `disconnectWallet()` - Disconnect the currently connected wallet
- `selectWallet(event)` - Handle wallet selection
- `toggleAllWallets(event)` - Toggle visibility of additional wallet options

### WalletController (Stimulus)

A Stimulus controller for displaying wallet status and information:

- `updateStatusDisplay()` - Updates the display of wallet status, address, and chain
- `handleConnected(event)` - Handles wallet connection events
- `handleDisconnected()` - Handles wallet disconnection events
- `handleChainChanged(event)` - Handles chain change events
- `handleAccountChanged(event)` - Handles account change events

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
│   ├── connector_controller.js # Main UI controller for wallet interactions
│   ├── wallet_controller.js    # Utility controller for displaying wallet status
│   └── modal_controller.js     # Controller for modal interactions
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