import { renderWalletModal } from './modal_renderer.js';
import { getErrorMessage } from './error_handler.js';

class ModalManager {
  constructor(walletManager) {
    this.walletManager = walletManager;
    this.modalElement = null;
    this.callbacks = {};
    this.elementRefs = {};
  }

  open(onSelectWallet, onClose) {
    if (this.modalElement) {
      return; // Already open
    }

    const wallets = this.walletManager.getDetectedWallets();

    // Bind callbacks
    this.callbacks.selectWallet = onSelectWallet;
    this.callbacks.close = onClose;

    // Render modal
    this.modalElement = renderWalletModal(
      wallets,
      this.callbacks.selectWallet,
      this.callbacks.close
    );
    document.body.appendChild(this.modalElement);

    this.setupElementReferences();
    this.bindEventHandlers();

    return this.modalElement;
  }

  setupElementReferences() {
    // Store references for loading state (can't use Stimulus targets since modal is outside controller element)
    this.elementRefs.loadingOverlay = this.modalElement.querySelector(
      '.wallet-loading-overlay'
    );
    this.elementRefs.buttonsContainer = this.modalElement.querySelector(
      '.wallet-buttons-container'
    );
    this.elementRefs.walletButtons =
      this.modalElement.querySelectorAll('.wallet-button');

    // Store references for error state
    this.elementRefs.errorOverlay = this.modalElement.querySelector(
      '.wallet-error-overlay'
    );
    this.elementRefs.errorMessage = this.modalElement.querySelector(
      '.wallet-error-message'
    );
    this.elementRefs.errorBackButton =
      this.modalElement.querySelector('.wallet-error-back');
    this.elementRefs.errorRetryButton = this.modalElement.querySelector(
      '.wallet-error-retry'
    );
  }

  bindEventHandlers() {
    // Bind error button handlers
    if (this.elementRefs.errorBackButton) {
      this.elementRefs.errorBackButton.addEventListener('click', () =>
        this.hideError()
      );
    }
    if (this.elementRefs.errorRetryButton) {
      this.elementRefs.errorRetryButton.addEventListener('click', () =>
        this.retryConnection()
      );
    }
  }

  close() {
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
      // Clean up references
      this.elementRefs = {};
    }
  }

  showLoading() {
    if (this.elementRefs.loadingOverlay)
      this.elementRefs.loadingOverlay.classList.remove('hidden');
    if (this.elementRefs.buttonsContainer) {
      this.elementRefs.buttonsContainer.style.pointerEvents = 'none';
      this.elementRefs.buttonsContainer.style.opacity = '0.5';
    }
    if (this.elementRefs.walletButtons) {
      this.elementRefs.walletButtons.forEach((btn) => (btn.disabled = true));
    }
  }

  hideLoading() {
    if (this.elementRefs.loadingOverlay)
      this.elementRefs.loadingOverlay.classList.add('hidden');
    if (this.elementRefs.buttonsContainer) {
      this.elementRefs.buttonsContainer.style.pointerEvents = '';
      this.elementRefs.buttonsContainer.style.opacity = '';
    }
    if (this.elementRefs.walletButtons) {
      this.elementRefs.walletButtons.forEach((btn) => (btn.disabled = false));
    }
  }

  showError(message) {
    if (!this.modalElement || !this.elementRefs.errorOverlay) return;

    // Update error message text
    if (this.elementRefs.errorMessage) {
      this.elementRefs.errorMessage.textContent = message;
    }

    // Show error overlay
    this.elementRefs.errorOverlay.classList.remove('hidden');
  }

  hideError() {
    if (this.elementRefs.errorOverlay) {
      this.elementRefs.errorOverlay.classList.add('hidden');
    }
  }

  isModalOpen() {
    return !!this.modalElement;
  }

  setRetryHandler(retryHandler) {
    this.retryConnection = retryHandler;
  }

  formatErrorMessage(error) {
    // Use the standardized error handler to get a user-friendly message
    // If the error doesn't match any known patterns, default to a generic message
    let message = getErrorMessage(error);

    // Check for specific wallet cancellation or timeout errors that need modal-specific messages
    if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
      message = 'You cancelled the connection request.';
    } else if (
      error.message &&
      error.message.toLowerCase().includes('timeout')
    ) {
      message = 'Connection request timed out.';
    }

    // If no specific message was found, use a generic message
    if (message.includes('unexpected error')) {
      message = 'Please try again or choose a different wallet.';
    }

    return message;
  }
}

export default ModalManager;
