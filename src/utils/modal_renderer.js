import { html, render } from 'uhtml';
import { WALLET_ICONS } from './config.js';

/**
 * Renders a wallet connection modal with wallet buttons
 * @param {Array} wallets - Array of wallet provider details from MIPD/detection
 * @param {Function} onSelect - Callback when wallet button is clicked, receives click event
 * @param {Function} onClose - Callback when modal is closed (backdrop or close button)
 * @returns {HTMLElement} Modal DOM element ready to append to body
 */
export function renderWalletModal(wallets, onSelect, onClose) {
  // Create container element
  const container = document.createElement('div');

  // Render modal structure using uhtml - class names match dist/chain-connect.css
  render(
    container,
    html`
      <div class="wallet-connector-modal modal-backdrop" onclick=${onClose}>
        <div
          class="wallet-connector-content"
          onclick=${(e) => e.stopPropagation()}
        >
          <button
            class="close-modal-button"
            data-action="close"
            onclick=${onClose}
          >
            ×
          </button>
          <h2 class="wallet-connector-title">Connect Wallet</h2>
          <div class="wallet-loading-overlay hidden">
            <div class="wallet-loading-content">
              <div class="wallet-loading-spinner"></div>
              <p class="wallet-loading-text">Requesting connection...</p>
              <p class="wallet-loading-subtext">Check your wallet extension</p>
            </div>
          </div>
          <div class="wallet-error-overlay hidden">
            <div class="wallet-error-content">
              <div class="wallet-error-icon">⚠</div>
              <p class="wallet-error-title">Connection Failed</p>
              <p class="wallet-error-message"></p>
              <div class="wallet-error-actions">
                <button class="wallet-error-button wallet-error-back">
                  Back
                </button>
                <button class="wallet-error-button wallet-error-retry">
                  Retry
                </button>
              </div>
            </div>
          </div>
          <div class="wallet-buttons-container">
            ${wallets.map(
              (wallet) => html`
                <button
                  class="wallet-button"
                  data-wallet-rdns=${wallet.rdns}
                  onclick=${onSelect}
                >
                  <img
                    src=${wallet.icon ||
                    WALLET_ICONS[wallet.rdns] ||
                    WALLET_ICONS.default}
                    alt=${wallet.name}
                    class="wallet-button-icon"
                  />
                  <span class="wallet-button-name">${wallet.name}</span>
                </button>
              `
            )}
          </div>
        </div>
      </div>
    `
  );

  return container.firstElementChild;
}
