# Simplify Wallet Rendering Implementation Plan

> **For Claude:** Use `${CLAUDE_PLUGIN_ROOT}/skills/collaboration/executing-plans/SKILL.md` to implement this plan task-by-task.

**Goal:** Refactor wallet detection and rendering to follow Stimulus conventions (fat model, thin view) - move business logic from wallets.js to WalletManager, reduce wallets.js from 328 to ~150 lines.

**Architecture:** WalletManager becomes responsible for wallet detection, categorization, and sorting. It exposes `getDetectedWallets()` returning structured data. wallets.js becomes pure rendering function that only creates DOM from data structure. Debug logging controlled by `window.WALLET_DEBUG` flag.

**Tech Stack:** Stimulus, MIPD (EIP-6963), Vite

---

## Task 1: Add MIPD Store to WalletManager Constructor

**Files:**
- Modify: `src/wallet_manager.js:1-20`
- Test: Manual verification

**Step 1: Update WalletManager constructor to accept mipdStore**

In `src/wallet_manager.js`, modify the constructor:

```javascript
constructor(mipdStore) {
  super();
  this.mipdStore = mipdStore; // Add this line
  this.connections = new Map();
  this.activeConnection = null;
  this.handlers = new Map();
}
```

**Step 2: Update ConnectorController to pass mipdStore**

In `src/controllers/connector_controller.js:29-31`, the constructor call already exists. Verify it looks like:

```javascript
connect() {
  this.mipdStore = createStore();
  this.walletManager = new WalletManager(this.mipdStore); // Already passes mipdStore
  // ... rest of code
}
```

**Step 3: Verify the change**

Run: `yarn dev`
Expected: No errors, app starts normally

**Step 4: Commit**

```bash
git add src/wallet_manager.js
git commit -m "refactor: add mipdStore to WalletManager constructor"
```

---

## Task 2: Add Debug Logging Helper to WalletManager

**Files:**
- Modify: `src/wallet_manager.js` (top of file)

**Step 1: Add debug logging helper method**

Add this method at the beginning of the WalletManager class (after constructor):

```javascript
_debug(...args) {
  if (window.WALLET_DEBUG) {
    console.log('[WalletManager]', ...args);
  }
}
```

**Step 2: Verify the change**

Run: `yarn dev`
Open browser console and test:
```javascript
window.WALLET_DEBUG = true;
// Should enable debug logging for future calls
```

**Step 3: Commit**

```bash
git add src/wallet_manager.js
git commit -m "feat: add debug logging helper with WALLET_DEBUG flag"
```

---

## Task 3: Add Helper Method to Get Families from Chains

**Files:**
- Modify: `src/wallet_manager.js` (add new private method)

**Step 1: Add _getFamiliesFromChains method**

Add this method to WalletManager class:

```javascript
_getFamiliesFromChains(chains) {
  const families = [];

  if (!chains) {
    this._debug('No chain info provided for wallet family detection');
    return families;
  }

  this._debug('Detecting wallet families from chains:', chains);

  if (chains.some(chain => chain.startsWith('eip155:'))) {
    this._debug('  -> Identified as EVM wallet');
    families.push('evm');
  }
  if (chains.some(chain => chain.startsWith('solana:'))) {
    this._debug('  -> Identified as Solana wallet');
    families.push('solana');
  }
  if (chains.some(chain => chain.startsWith('tron:'))) {
    this._debug('  -> Identified as Tron wallet');
    families.push('tron');
  }

  if (families.length === 0) {
    this._debug('  -> Could not identify wallet family from chains');
  }

  return families;
}
```

**Step 2: Verify the change**

Run: `yarn dev`
Expected: No errors, app starts normally

**Step 3: Commit**

```bash
git add src/wallet_manager.js
git commit -m "feat: add _getFamiliesFromChains helper method"
```

---

## Task 4: Add Helper Method to Get Families from RDNS

**Files:**
- Modify: `src/wallet_manager.js` (add new private method)

**Step 1: Add _getFamiliesFromRdns method**

Add this method to WalletManager class:

```javascript
_getFamiliesFromRdns(rdns) {
  const families = [];

  // EVM wallets
  if (rdns.includes('metamask') || rdns.includes('coinbase') ||
      rdns.includes('rabby') || rdns.includes('trust') ||
      rdns.includes('mathwallet')) {
    families.push('evm');
    this._debug(`  -> Categorized as EVM based on RDNS: ${rdns}`);
  }
  // Multi-chain wallets
  else if (rdns.includes('phantom')) {
    families.push('evm', 'solana');
    this._debug(`  -> Categorized as Multi-chain (EVM and Solana) based on RDNS: ${rdns}`);
  }
  // Solana wallets
  else if (rdns.includes('solflare') || rdns.includes('sollet')) {
    families.push('solana');
    this._debug(`  -> Categorized as Solana based on RDNS: ${rdns}`);
  }
  // Tron wallets
  else if (rdns.includes('tron') || rdns.includes('tokenpocket')) {
    families.push('tron');
    this._debug(`  -> Categorized as Tron based on RDNS: ${rdns}`);
  }
  else {
    this._debug(`  -> Skipping wallet with RDNS ${rdns} - not recognized as EVM, Solana, or Tron wallet`);
  }

  return families;
}
```

**Step 2: Verify the change**

Run: `yarn dev`
Expected: No errors, app starts normally

**Step 3: Commit**

```bash
git add src/wallet_manager.js
git commit -m "feat: add _getFamiliesFromRdns helper method"
```

---

## Task 5: Add Helper Method to Categorize Wallets

**Files:**
- Modify: `src/wallet_manager.js` (add new private method)

**Step 1: Add _categorizeWallet method**

Add this method to WalletManager class:

```javascript
_categorizeWallet(wallet) {
  this._debug(`Processing wallet: ${wallet.info.name} (RDNS: ${wallet.info.rdns}), chains:`, wallet.info.chains);

  // Primary: Use MIPD chain info (most reliable)
  const families = this._getFamiliesFromChains(wallet.info.chains);

  // Only return families if we found supported chains (EVM, Solana, Tron)
  const supportedFamilies = families.filter(family => ['evm', 'solana', 'tron'].includes(family));

  if (supportedFamilies.length > 0) {
    return supportedFamilies;
  }

  // Fallback: RDNS matching for known wallets
  if (wallet.info.rdns) {
    return this._getFamiliesFromRdns(wallet.info.rdns);
  }

  this._debug(`  -> Skipping wallet ${wallet.info.name} - doesn't support EVM, Solana, or Tron chains`);
  return [];
}
```

**Step 2: Verify the change**

Run: `yarn dev`
Expected: No errors, app starts normally

**Step 3: Commit**

```bash
git add src/wallet_manager.js
git commit -m "feat: add _categorizeWallet helper method"
```

---

## Task 6: Add Helper Method to Get Global Providers

**Files:**
- Modify: `src/wallet_manager.js` (add new private method)
- Modify: `src/config.js` (import WALLET_ICONS)

**Step 1: Add import at top of wallet_manager.js**

```javascript
import { WALLET_ICONS } from './config.js';
```

**Step 2: Add _getGlobalProviders method**

Add this method to WalletManager class:

```javascript
_getGlobalProviders() {
  const globalWallets = [];

  // Check for Phantom (window.solana)
  if (window.solana) {
    this._debug('Phantom/Solana wallet detected in browser');
    globalWallets.push({
      info: {
        name: 'Phantom',
        icon: WALLET_ICONS.phantom,
        rdns: 'phantom'
      },
      families: ['evm', 'solana']
    });
  }

  // Check for TronLink (window.tronWeb or window.tronLink)
  if (window.tronWeb || window.tronLink) {
    this._debug('TronLink/Tron wallet detected in browser');
    globalWallets.push({
      info: {
        name: 'TronLink',
        icon: WALLET_ICONS.tronlink,
        rdns: 'tronlink'
      },
      families: ['tron']
    });
  }

  return globalWallets;
}
```

**Step 3: Verify the change**

Run: `yarn dev`
Expected: No errors, app starts normally

**Step 4: Commit**

```bash
git add src/wallet_manager.js
git commit -m "feat: add _getGlobalProviders helper method"
```

---

## Task 7: Add Helper Method to Sort by Priority

**Files:**
- Modify: `src/wallet_manager.js` (add new private method)

**Step 1: Add _sortByPriority method**

Add this method to WalletManager class:

```javascript
_sortByPriority(wallets) {
  const priorityWallets = ['Phantom', 'MetaMask', 'Coinbase Wallet'];

  return wallets.sort((a, b) => {
    const aPriority = priorityWallets.indexOf(a.info.name);
    const bPriority = priorityWallets.indexOf(b.info.name);

    // If both are in priority list, sort by position in priority list
    if (aPriority !== -1 && bPriority !== -1) {
      return aPriority - bPriority;
    }

    // If only a is in priority list, a comes first
    if (aPriority !== -1) {
      return -1;
    }

    // If only b is in priority list, b comes first
    if (bPriority !== -1) {
      return 1;
    }

    // If neither is in priority list, maintain original order
    return 0;
  });
}
```

**Step 2: Verify the change**

Run: `yarn dev`
Expected: No errors, app starts normally

**Step 3: Commit**

```bash
git add src/wallet_manager.js
git commit -m "feat: add _sortByPriority helper method"
```

---

## Task 8: Add Main getDetectedWallets Method

**Files:**
- Modify: `src/wallet_manager.js` (add new public method)

**Step 1: Add getDetectedWallets method**

Add this method to WalletManager class:

```javascript
getDetectedWallets() {
  // Group all wallets by blockchain family
  const allGroupedWallets = {
    evm: [],
    solana: [],
    tron: [],
    multiChain: []
  };

  // Get MIPD wallets
  const mipdWallets = this.mipdStore.getProviders();
  this._debug('Total MIPD wallets detected:', mipdWallets.length);

  // Categorize MIPD wallets
  mipdWallets.forEach(wallet => {
    const families = this._categorizeWallet(wallet);

    if (families.length === 0) return; // Skip unsupported wallets

    const walletWithFamilies = { ...wallet, families };

    if (families.length > 1) {
      // Multi-chain wallet
      allGroupedWallets.multiChain.push(walletWithFamilies);
      this._debug(`  -> Categorized as Multi-chain (${families.join(', ')}) based on chain info`);
    } else {
      allGroupedWallets[families[0]].push(walletWithFamilies);
      this._debug(`  -> Categorized as ${families[0]} based on chain info`);
    }
  });

  // Add global providers (non-MIPD wallets)
  const globalWallets = this._getGlobalProviders();
  globalWallets.forEach(wallet => {
    // Check if wallet already exists in grouped wallets (avoid duplicates)
    const existsInMultiChain = allGroupedWallets.multiChain.some(w => w.info.name === wallet.info.name);
    const existsInSingleChain = [...allGroupedWallets.evm, ...allGroupedWallets.solana, ...allGroupedWallets.tron]
      .some(w => w.info.name === wallet.info.name);

    if (!existsInMultiChain && !existsInSingleChain) {
      if (wallet.families.length > 1) {
        allGroupedWallets.multiChain.push(wallet);
      } else {
        allGroupedWallets[wallet.families[0]].push(wallet);
      }
    }
  });

  this._debug('All grouped wallets:', {
    evm: allGroupedWallets.evm.map(w => w.info.name),
    solana: allGroupedWallets.solana.map(w => w.info.name),
    tron: allGroupedWallets.tron.map(w => w.info.name),
    multiChain: allGroupedWallets.multiChain.map(w => `${w.info.name} (${w.families.join(', ')})`)
  });

  // Flatten all wallets into a single array
  const allWallets = [
    ...allGroupedWallets.multiChain,
    ...allGroupedWallets.evm,
    ...allGroupedWallets.solana,
    ...allGroupedWallets.tron
  ];

  // Sort by priority
  this._sortByPriority(allWallets);

  this._debug('Sorted all wallets:', allWallets.map(w => w.info.name));

  // Split into top 4 and remaining
  const topWallets = allWallets.slice(0, 4);
  const remainingWallets = allWallets.slice(4);

  // Group remaining wallets by family
  const groupedWallets = {
    multiChain: [],
    evm: [],
    solana: [],
    tron: []
  };

  remainingWallets.forEach(wallet => {
    if (wallet.families.includes('evm') && wallet.families.includes('solana')) {
      groupedWallets.multiChain.push(wallet);
    } else if (wallet.families.includes('evm')) {
      groupedWallets.evm.push(wallet);
    } else if (wallet.families.includes('solana')) {
      groupedWallets.solana.push(wallet);
    } else if (wallet.families.includes('tron')) {
      groupedWallets.tron.push(wallet);
    }
  });

  return {
    topWallets,
    groupedWallets,
    totalCount: allWallets.length
  };
}
```

**Step 2: Verify the change**

Run: `yarn dev`
Open browser console:
```javascript
window.WALLET_DEBUG = true;
// Should see debug logs
```

**Step 3: Commit**

```bash
git add src/wallet_manager.js
git commit -m "feat: add getDetectedWallets method to WalletManager"
```

---

## Task 9: Simplify wallets.js to Pure Rendering

**Files:**
- Modify: `src/wallets.js:1-329` (major refactor)

**Step 1: Replace entire renderWallets function**

Replace the entire `renderWallets` function in `src/wallets.js`:

```javascript
import { WALLET_ICONS } from './config.js';

export function renderWallets(walletData, controller) {
  const walletButtonsContainer = controller.walletButtonsTarget;
  walletButtonsContainer.innerHTML = '';

  const { topWallets, groupedWallets, totalCount } = walletData;

  if (totalCount === 0) {
    // If no wallets are detected at all, show the "No wallets detected" message
    walletButtonsContainer.innerHTML = '<p class="no-wallets-message">No wallets detected</p>';
    return;
  }

  // Create container for top wallet buttons
  const walletGrid = document.createElement('div');
  walletGrid.className = 'top-wallets-grid';

  // Add top wallets as individual buttons
  topWallets.forEach(wallet => {
    const button = createWalletButton(wallet.info.name, wallet.info.icon, wallet.info.rdns);

    // Add data attribute for chain features if available
    if (wallet.families && Array.isArray(wallet.families) && wallet.families.length > 0) {
      button.setAttribute('data-chain-features', wallet.families.join(','));
    }

    walletGrid.appendChild(button);
  });

  walletButtonsContainer.appendChild(walletGrid);

  // Check if there are remaining wallets
  const hasRemainingWallets = Object.values(groupedWallets).some(group => group.length > 0);

  // Add "View all wallets" button if there are additional wallets
  if (hasRemainingWallets) {
    const viewAllButton = document.createElement('button');
    viewAllButton.className = 'view-all-wallets-btn';
    viewAllButton.innerHTML = `View all wallets (<span class="wallet-count">${totalCount}</span>) <span class="dropdown-arrow">▼</span>`;
    viewAllButton.setAttribute('data-action', 'click->wallet#toggleAllWallets');
    viewAllButton.setAttribute('aria-expanded', 'false');

    walletButtonsContainer.appendChild(viewAllButton);

    // Create container for remaining wallets (initially hidden)
    const allWalletsContainer = document.createElement('div');
    allWalletsContainer.className = 'all-wallets-container';
    allWalletsContainer.setAttribute('hidden', '');

    // Create sections for each blockchain family
    Object.entries(groupedWallets).forEach(([family, wallets]) => {
      if (wallets.length > 0) {
        const sectionTitle =
          family === 'multiChain' ? 'Multi-chain' :
          family === 'evm' ? 'Ethereum & EVM' :
          family === 'solana' ? 'Solana' :
          'Tron';

        const section = createSectionElement(sectionTitle, family);
        const walletGroup = section.querySelector('.wallet-group');

        wallets.forEach(wallet => {
          const button = createWalletButton(wallet.info.name, wallet.info.icon, wallet.info.rdns);

          // Add data attribute for chain features if available
          if (wallet.families && Array.isArray(wallet.families) && wallet.families.length > 0) {
            button.setAttribute('data-chain-features', wallet.families.join(','));
          }

          walletGroup.appendChild(button);
        });

        allWalletsContainer.appendChild(section);
      }
    });

    walletButtonsContainer.appendChild(allWalletsContainer);
  }
}

function createSectionElement(title, family) {
  const section = document.createElement('div');
  section.className = 'wallet-section';
  section.setAttribute('data-family', family);

  const header = document.createElement('h3');
  header.className = 'wallet-group-header';
  header.textContent = title;

  const group = document.createElement('div');
  group.className = 'wallet-group';

  section.appendChild(header);
  section.appendChild(group);

  return section;
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
```

**Step 2: Verify the change**

Count lines:
```bash
wc -l src/wallets.js
```
Expected: ~140-150 lines (down from 328)

**Step 3: Commit**

```bash
git add src/wallets.js
git commit -m "refactor: simplify wallets.js to pure rendering function"
```

---

## Task 10: Update ConnectorController to Use New API

**Files:**
- Modify: `src/controllers/connector_controller.js:55` (line that calls renderWallets)
- Modify: `src/controllers/connector_controller.js:61` (line in subscribe callback)

**Step 1: Update initial render call**

In `src/controllers/connector_controller.js`, find line 55:

```javascript
// Old:
renderWallets(this.mipdStore, this);

// New:
renderWallets(this.walletManager.getDetectedWallets(), this);
```

**Step 2: Update subscribe callback**

In `src/controllers/connector_controller.js`, find line 61 in the subscribe callback:

```javascript
this.mipdStore.subscribe(() => {
  // Old:
  renderWallets(this.mipdStore, this);

  // New:
  renderWallets(this.walletManager.getDetectedWallets(), this);

  // Turn off loading state after wallet detection completes
  if (!walletDetectionCompleted) {
    walletDetectionCompleted = true;
    this.walletDetectionValue = false;
  }
});
```

**Step 3: Verify the change**

Run: `yarn dev`
Expected: App loads, wallets render correctly

**Step 4: Test functionality**

1. Open browser with wallet extensions
2. Open modal - should see wallets
3. Click wallet - should connect
4. Check console for debug logs (if `window.WALLET_DEBUG = true`)

**Step 5: Commit**

```bash
git add src/controllers/connector_controller.js
git commit -m "refactor: update controller to use WalletManager.getDetectedWallets()"
```

---

## Task 11: Manual Testing & Verification

**Files:**
- All modified files

**Step 1: Run the dev server**

```bash
yarn dev
```

**Step 2: Test wallet detection**

1. Open browser console
2. Enable debug mode: `window.WALLET_DEBUG = true`
3. Refresh page
4. Verify debug logs appear showing wallet detection

**Step 3: Test wallet rendering**

1. Open wallet modal
2. Verify top 4 wallets appear
3. Verify "View all wallets" button shows correct count
4. Click "View all wallets" - verify dropdown works
5. Verify wallets grouped by chain family

**Step 4: Test wallet connection**

1. Click a wallet button
2. Verify connection flow works
3. Verify wallet info displays correctly
4. Verify disconnect works

**Step 5: Test with no wallets**

1. Open in incognito/private mode (no wallet extensions)
2. Verify "No wallets detected" message appears

**Step 6: Check line counts**

```bash
wc -l src/wallets.js src/wallet_manager.js src/controllers/wallet_controller.js
```

Expected:
- `wallets.js`: ~140-150 lines (was 328)
- `wallet_manager.js`: ~280 lines (was 171)
- `connector_controller.js`: ~309 lines (unchanged)
- `wallets_controller.js`: ~160 lines (controller for wallet list management and selection)

---

## Task 12: Run Tests (if they exist)

**Files:**
- Test files in `src/__tests__/`

**Step 1: Check if tests exist**

```bash
ls src/__tests__/
```

**Step 2: Run tests if they exist**

```bash
yarn test
```

Expected: Tests pass (or update tests if needed)

**Step 3: If tests fail, fix them**

Update test files to use new API:
- Mock `walletManager.getDetectedWallets()` instead of MIPD store
- Update expected data structures

---

## Task 13: Final Commit & Summary

**Step 1: Verify git status**

```bash
git status
```

Expected: Working tree clean (all changes committed)

**Step 2: View commit history**

```bash
git log --oneline -13
```

Expected: See all commits from this refactoring

**Step 3: Create summary**

Document the changes:
- wallets.js: 328 → ~150 lines (54% reduction)
- wallet_manager.js: 171 → ~280 lines (fat model)
- Separation of concerns: Model handles logic, View handles rendering
- Debug logging via `window.WALLET_DEBUG` flag

---

## Summary

**What was built:**
- Fat model, thin view architecture following Stimulus conventions
- WalletManager now handles all wallet detection, categorization, sorting
- wallets.js reduced to pure rendering function
- Debug logging controlled by `window.WALLET_DEBUG` flag

**Key architectural improvements:**
- Clear separation of concerns
- Easier to test (business logic in model)
- Easier to maintain (each file has single responsibility)
- Following Rails/Hotwire conventions

**Testing:**
- Manual testing in browser with/without wallet extensions
- Debug mode verification
- Connection flow verification
