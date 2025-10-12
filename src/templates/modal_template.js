import { html } from 'uhtml';

/**
 * Modal template using Stimulus actions for event handling
 * @param {Array} wallets - Array of detected wallet objects
 * @returns {TemplateResult} uhtml template
 */
export function modalTemplate(wallets) {
  return html`
    <dialog id="walletModal">
      <div class="modal-header">
        <h2>Connect Wallet</h2>
        <button
          class="close-modal-btn"
          data-action="click->wallet#closeModal">×</button>
      </div>

      ${wallets.length === 0
        ? html`<p class="no-wallets-message">No wallets detected. Please install a wallet extension.</p>`
        : html`
          <div class="wallet-group">
            ${wallets.map(wallet => walletButtonTemplate(wallet))}
          </div>
        `
      }
    </dialog>
  `;
}

/**
 * Individual wallet button template
 * Uses Stimulus action for wallet selection
 */
function walletButtonTemplate(wallet) {
  return html`
    <button
      class="wallet-button"
      data-wallet-rdns="${wallet.rdns}"
      data-action="click->wallet#selectWallet">
      ${wallet.icon
        ? html`<img src="${wallet.icon}" alt="${wallet.name}" width="40" height="40" />`
        : ''
      }
      <span>${wallet.name}</span>
    </button>
  `;
}
