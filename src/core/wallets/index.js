import EvmHandler from './evm_handler.js';
import SolanaHandler from './solana_handler.js';
import TronHandler from './tron_handler.js';

// Simple handler lookup - no need for a registry class
export const WALLET_HANDLERS = {
  evm: EvmHandler,
  solana: SolanaHandler,
  tron: TronHandler,
};
