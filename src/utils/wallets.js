// Simple wallet rendering - show first 4, then "View all" for rest

export function renderWallets(walletManager, controller) {
  const walletButtonsContainer = controller.walletButtonsTarget;
  walletButtonsContainer.innerHTML = '';

  const wallets = walletManager.getDetectedWallets();

  if (wallets.length === 0) {
    walletButtonsContainer.innerHTML = '<p class="no-wallets-message">No wallets detected</p>';
    return;
  }

  // Show first 4 wallets
  const topWallets = wallets.slice(0, 4);
  const remainingWallets = wallets.slice(4);

  // Create grid for top wallets
  const walletGrid = document.createElement('div');
  walletGrid.className = 'top-wallets-grid';

  topWallets.forEach(wallet => {
    const button = createWalletButton(wallet.name, wallet.icon, wallet.rdns);
    walletGrid.appendChild(button);
  });

  walletButtonsContainer.appendChild(walletGrid);

  // If there are more wallets, add "View all" button
  if (remainingWallets.length > 0) {
    const viewAllButton = document.createElement('button');
    viewAllButton.className = 'view-all-wallets-btn';
    viewAllButton.innerHTML = `View all wallets (<span class="wallet-count">${wallets.length}</span>) <span class="dropdown-arrow">▼</span>`;
    viewAllButton.setAttribute('data-action', 'click->wallet#toggleAllWallets');
    viewAllButton.setAttribute('aria-expanded', 'false');

    walletButtonsContainer.appendChild(viewAllButton);

    // Container for remaining wallets (initially hidden)
    const allWalletsContainer = document.createElement('div');
    allWalletsContainer.className = 'all-wallets-container';
    allWalletsContainer.setAttribute('hidden', '');

    const walletGroup = document.createElement('div');
    walletGroup.className = 'wallet-group';

    remainingWallets.forEach(wallet => {
      const button = createWalletButton(wallet.name, wallet.icon, wallet.rdns);
      walletGroup.appendChild(button);
    });

    allWalletsContainer.appendChild(walletGroup);
    walletButtonsContainer.appendChild(allWalletsContainer);
  }
}

function createWalletButton(name, icon, rdns) {
  const button = document.createElement('button');
  button.className = 'wallet-button';
  button.setAttribute('data-wallet-rdns', rdns);
  button.setAttribute('data-action', 'click->wallet#selectWallet');

  const img = document.createElement('img');
  img.src = icon;
  img.alt = name;
  img.width = 40;
  img.height = 40;

  const span = document.createElement('span');
  span.textContent = name;

  button.appendChild(img);
  button.appendChild(span);
  return button;
}
