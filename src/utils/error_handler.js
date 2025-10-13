/**
 * Error handling utilities for wallet operations
 */

/**
 * Shows an error modal with the given error message
 * @param {Object} controller - The Stimulus controller instance
 * @param {string} message - The error message to display
 */
export function showError(controller, message) {
  // Display error in modal
  if (controller.hasErrorMessageTarget) {
    controller.errorMessageTarget.textContent = message;
  }

  if (controller.hasErrorModalTarget) {
    controller.errorModalTarget.showModal();
  }

  // Resolve the promise with 'ok' to continue with the flow
  if (controller.errorModalPromiseResolver) {
    controller.errorModalPromiseResolver('ok');
    controller.errorModalPromiseResolver = null;
  }
}

/**
 * Closes the error modal
 * @param {Object} controller - The Stimulus controller instance
 */
export function closeErrorModal(controller) {
  if (controller.hasErrorModalTarget) {
    controller.errorModalTarget.close();
  }

  // Resolve the promise to continue with the flow
  if (controller.errorModalPromiseResolver) {
    controller.errorModalPromiseResolver();
    controller.errorModalPromiseResolver = null;
  }
}

/**
 * Shows an error modal and returns a promise that resolves when user acknowledges
 * @param {Object} controller - The Stimulus controller instance
 * @param {string} message - The error message to display
 * @returns {Promise} A promise that resolves when user closes the modal
 */
export function showErrorAndWait(controller, message) {
  return new Promise((resolve) => {
    // Store the resolve function to be called when user responds
    controller.errorModalPromiseResolver = resolve;

    // Display error in modal
    if (controller.hasErrorMessageTarget) {
      controller.errorMessageTarget.textContent = message;
    }

    if (controller.hasErrorModalTarget) {
      controller.errorModalTarget.showModal();
    }
  });
}

/**
 * Maps error messages to user-friendly messages
 * @param {Error} error - The error object to process
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(error) {
  let errorMessage =
    'An unexpected error occurred while connecting to the wallet.';

  // Handle specific error types
  if (error.message.includes('not found or not available')) {
    errorMessage =
      'Wallet not found or not available. Please make sure the wallet extension is installed and enabled.';
  } else if (error.message.includes('No handler for wallet family')) {
    errorMessage =
      'Wallet family not supported. This type of wallet is not currently supported.';
  } else if (
    error.code === 4001 ||
    error.message.toLowerCase().includes('user rejected')
  ) {
    errorMessage = 'User rejected the connection request. Please try again.';
  } else if (error.message.includes('timeout')) {
    errorMessage =
      'Connection timed out. Please check your internet connection and try again.';
  } else if (error.message.includes('No accounts found')) {
    errorMessage =
      'No accounts found in the wallet. Please create an account in your wallet application.';
  } else if (error.message.includes('Tron wallet not found')) {
    errorMessage =
      'Tron wallet not found. Please ensure TronLink or TronWeb is installed and accessible.';
  } else if (
    error.message.includes('Network Error') ||
    error.message.includes('Failed to fetch')
  ) {
    errorMessage =
      'Network error occurred. Please check your internet connection.';
  }

  return errorMessage;
}
