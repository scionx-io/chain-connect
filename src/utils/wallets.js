import { render, html } from 'uhtml';

// Simple wallet rendering using uhtml - show first 4, then "View all" for rest
export function renderWallets(walletManager, controller) {
  const walletButtonsContainer = controller.walletButtonsTarget;
  const wallets = walletManager.getDetectedWallets();

  if (wallets.length === 0) {
    render(
      walletButtonsContainer,
      html` <p class="no-wallets-message">No wallets detected</p> `
    );
    return;
  }

  const topWallets = wallets.slice(0, 4);
  const remainingWallets = wallets.slice(4);

  render(
    walletButtonsContainer,
    html`
      <div class="top-wallets-grid">
        ${topWallets.map((wallet) => walletButton(wallet))}
      </div>

      ${remainingWallets.length > 0
        ? html`
            <button
              class="view-all-wallets-btn"
              data-action="click->wallet#toggleAllWallets"
              aria-expanded="false"
            >
              View all wallets (<span class="wallet-count"
                >${wallets.length}</span
              >)
              <span class="dropdown-arrow">▼</span>
            </button>

            <div class="all-wallets-container" hidden>
              <div class="wallet-group">
                ${remainingWallets.map((wallet) => walletButton(wallet))}
              </div>
            </div>
          `
        : ''}
    `
  );
}

// Wallet button template
function walletButton(wallet) {
  return html`
    <button
      class="wallet-button"
      data-wallet-rdns="${wallet.rdns}"
      data-action="click->wallet#selectWallet"
    >
      <img src="${wallet.icon}" alt="${wallet.name}" width="40" height="40" />
      <span>${wallet.name}</span>
    </button>
  `;
}
