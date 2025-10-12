/**
 * Maps error messages to user-friendly messages
 * @param {Error} error - The error object to process
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(error) {
  let errorMessage = 'An unexpected error occurred while connecting to the wallet.';
  
  // Handle specific error types
  if (error.message.includes('not found or not available')) {
    errorMessage = 'Wallet not found or not available. Please make sure the wallet extension is installed and enabled.';
  } else if (error.message.includes('No handler for wallet family')) {
    errorMessage = 'Wallet family not supported. This type of wallet is not currently supported.';
  } else if (error.code === 4001 || error.message.toLowerCase().includes('user rejected')) {
    errorMessage = 'User rejected the connection request. Please try again.';
  } else if (error.message.includes('timeout')) {
    errorMessage = 'Connection timed out. Please check your internet connection and try again.';
  } else if (error.message.includes('No accounts found')) {
    errorMessage = 'No accounts found in the wallet. Please create an account in your wallet application.';
  } else if (error.message.includes('Tron wallet not found')) {
    errorMessage = 'Tron wallet not found. Please ensure TronLink or TronWeb is installed and accessible.';
  } else if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
    errorMessage = 'Network error occurred. Please check your internet connection.';
  }
  
  return errorMessage;
}