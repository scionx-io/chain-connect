import { html } from 'uhtml';

export function modalTemplate(wallets, onSelectWallet, onClose) {
  return html`
    <dialog id="walletModal">
      <div class="modal-header">
        <h2>Connect Wallet</h2>
        <button class="close-modal-btn" onclick=\${onClose}>×</button>
      </div>

      \${wallets.length === 0
        ? html\`<p class="no-wallets-message">No wallets detected</p>\`
        : html\`
          <div class="wallet-group">
            \${wallets.map(wallet => walletButtonTemplate(wallet, onSelectWallet))}
          </div>
        \`
      }
    </dialog>
  `;
}

function walletButtonTemplate(wallet, onSelect) {
  return html`
    <button 
      class="wallet-button"
      data-wallet-rdns="\${wallet.rdns}"
      onclick=\${(e) => onSelect(e, wallet.rdns)}>
      \${wallet.icon
        ? html\`<img src="\${wallet.icon}" alt="\${wallet.name}" width="40" height="40" />\`
        : ''
      }
      <span>\${wallet.name}</span>
    </button>
  `;
}