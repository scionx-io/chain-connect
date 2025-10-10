# Multi-Chain Wallet Connector

A minimalist wallet connector for Ethereum (EIP-6963), Solana, and Tron. Built with Stimulus for clean, event-driven architecture.

## Quick Start

```bash
yarn install
yarn dev
```

## Commands

```bash
yarn dev              # Start dev server
yarn build            # Production build
yarn test             # Run tests
yarn test:coverage    # Test coverage
```

## Features

- Multi-chain support (Ethereum, Solana, Tron)
- EIP-6963 compliant wallet discovery
- Auto-reconnection with localStorage
- Swiss minimalist design
- Event-driven architecture

## Tech Stack

- Vite + Stimulus
- mipd (EIP-6963 discovery)
- ethers.js, @solana/web3.js, @tronweb3/tronwallet-adapters

## Architecture

**Stimulus MVC pattern:**
- `WalletController` - UI interactions
- `WalletManager` - State & events
- Wallet Handlers - Chain-specific logic
- `WalletProviderResolver` - Provider discovery

Tests in `src/__tests__/` using Vitest.
