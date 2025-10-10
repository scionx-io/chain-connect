# Minimalist Multi-Chain Wallet Connector

A multi-chain wallet connector with a minimalist Swiss design. It detects and connects to Ethereum (via EIP-6963), Solana, and Tron wallets using a single, clean modal interface. The project is built with a Stimulus-based architecture for a clear separation of concerns and maintainability.

## Features

- **Multi-Chain Support**: Connect to Ethereum, Solana, and Tron wallets seamlessly.
- **EIP-6963 Compliant**: Automatically discovers multiple injected Ethereum providers.
- **Minimalist Design**: A clean, Swiss-inspired UI for a great user experience.
- **Event-Driven**: Built with a modern Stimulus architecture.
- **Automatic Reconnection**: Remembers the last used wallet for a smooth return experience.
- **Lightweight**: No heavy dependencies, keeping the footprint small.

## Tech Stack

- **Vite**: Build tool and development server.
- **Stimulus**: A modest JavaScript framework for the HTML you already have.
- **mipd**: For EIP-6963 multi-injected provider discovery.
- **ethers.js**: For Ethereum provider interactions.
- **@solana/web3.js**: For Solana wallet support.
- **@tronweb3/tronwallet-adapters**: For Tron wallet support.

## Getting Started

### Prerequisites

Ensure you have [Yarn](https://yarnpkg.com/) installed.

### Installation & Development

1.  **Install dependencies:**
    ```bash
    yarn install
    ```

2.  **Start the development server:**
    ```bash
    yarn dev
    ```

### Available Commands

- `yarn install`: Install dependencies
- `yarn dev`: Start the dev server (Vite)
- `yarn build`: Create a production-ready build
- `yarn preview`: Preview the production build locally
- `yarn test`: Run the test suite
- `yarn test:coverage`: Run tests with a coverage report

## Architecture

This project follows Stimulus (Rails/Hotwire) conventions, emphasizing direct controller-to-model communication.

- **`WalletController`**: The main Stimulus controller that manages all UI interactions and state.
- **`WalletManager`**: The core state machine, handling connection logic, state persistence, and events.
- **Wallet Handlers**: Chain-specific modules (`evm_handler`, `solana_handler`, `tron_handler`) that manage the connection lifecycle for each wallet family.
- **`WalletProviderResolver`**: Discovers available wallet providers from the browser.

The architecture is event-driven, with the `WalletManager` emitting events that the `WalletController` subscribes to for updating the UI.

## Testing

Tests are written with [Vitest](https://vitest.dev/) for both unit and integration testing. Test files are located in the `src/__tests__/` directory and follow the `*.test.js` naming convention.
