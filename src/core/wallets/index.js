import walletRegistry from '../wallet_registry.js';
import EvmHandler from './evm_handler.js';
import SolanaHandler from './solana_handler.js';
import TronHandler from './tron_handler.js';

walletRegistry.register('evm', EvmHandler);
walletRegistry.register('solana', SolanaHandler);
walletRegistry.register('tron', TronHandler);
