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

  // Render modal structure using uhtml
  render(container, html`
    <div class="modal-backdrop" onclick=${onClose}>
      <div class="modal-content" onclick=${(e) => e.stopPropagation()}>
        <div class="modal-header">
          <h2>Connect Wallet</h2>
          <button class="modal-close" data-action="close" onclick=${onClose}>×</button>
        </div>
        <div class="modal-body">
          <div class="wallet-grid">
            ${wallets.map(wallet => html`
              <button
                class="wallet-button"
                data-wallet-rdns=${wallet.rdns}
                onclick=${onSelect}>
                <img
                  src=${wallet.icon || WALLET_ICONS[wallet.rdns] || WALLET_ICONS.default}
                  alt=${wallet.name}
                  class="wallet-icon" />
                <span class="wallet-name">${wallet.name}</span>
              </button>
            `)}
          </div>
        </div>
      </div>
    </div>
  `);

  return container.firstElementChild;
}
