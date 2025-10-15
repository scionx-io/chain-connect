# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-10-14

### Added

- New unified WalletController that merges functionality from ConnectorController, ModalController, and WalletsController
- Modal management with loading and error states
- Status value tracking with reactive callbacks
- Turbo compatibility for Rails applications
- Compact Swiss design modal interface
- Retry connection functionality for failed connections
- Standardized error handling with user-friendly messages
- Wallet detection using MIPD (EIP-6963) and global objects
- Support for Ethereum (EVM), Solana, and Tron wallets

### Changed

- Complete refactoring of the architecture to use a single WalletController
- Enhanced event-driven architecture with proper event dispatching
- Improved wallet connection flow with timeout handling
- Better error message formatting and display
- Enhanced wallet detection using both MIPD and direct checks
- Streamlined build process with Vite
- Updated project structure with better separation of concerns

### Deprecated

- Old separate controllers: ConnectorController, ModalController, and WalletsController

### Removed

- Old connector controller implementation
- Separate modal and wallets controllers
- Legacy modal implementation
- Old wallet detection mechanisms

## [1.0.0] - 2025-01-01

### Added

- Initial release of multi-chain wallet connector
- Support for Ethereum wallets via EIP-6963
- Support for Solana wallets
- Support for Tron wallets
- Stimulus-based architecture
- Swiss minimalist design
- Event-driven communication pattern
- Connection and disconnection functionality
- Chain and account change event handling
- Auto-reconnection on page load
- Storage persistence for wallet state
