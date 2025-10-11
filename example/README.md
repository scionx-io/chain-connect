# @scionx/chain-connect Example

This example demonstrates how to use the `@scionx/chain-connect` package in a project with proper package management.

## Prerequisites

Before running the example, ensure you have built the main package:

```bash
# From the project root directory
yarn build && yarn pack
```

This creates the `scionx-chain-connect-x.x.x.tgz` file required by the example.

## How to Run

First, install the dependencies:

```bash
cd example
# Using npm:
npm install
# Or using yarn:
yarn install
```

Then start the development server:

```bash
# Using npm:
npm run dev
# Or using yarn:
yarn dev
```

Your example will be available at http://localhost:5173 (or another available port).

## Code Structure

The example contains:

- `index.html`: HTML structure with CSS styling
- `main.js`: JavaScript file that imports and initializes the wallet connector
- `package.json`: Configuration for dependencies and scripts
- `README.md`: This file

## Usage

The example shows:
1. How to set up the HTML structure required by the wallet connector
2. How to import and register the Stimulus controller via package management
3. How to connect to different wallets (Ethereum/EVM, Solana, Tron)
4. How to display wallet information after connection
5. How to disconnect from a wallet

For a more detailed implementation in your own project, please refer to the main README file in the repository root.