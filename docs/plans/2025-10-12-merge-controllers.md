# Merge Controllers into Single WalletController Implementation Plan

> **For Claude:** Use `${SUPERPOWERS_SKILLS_ROOT}/skills/collaboration/executing-plans/SKILL.md` to implement this plan task-by-task.

**Goal:** Simplify the API by merging ConnectorController, ModalController, and WalletsController into a single WalletController, requiring only `<div data-controller="wallet">` for users.

**Architecture:** Extract modal rendering to `src/utils/modal_renderer.js` utility. WalletController manages WalletManager lifecycle, dynamically creates/destroys modal DOM using uhtml, handles all user interactions internally. No outlets required.

**Tech Stack:** Stimulus, uhtml, WalletManager (unchanged), MIPD

---

## Task 1: Create Modal Renderer Utility

**Files:**

- Create: `src/utils/modal_renderer.js`
- Test: `src/__tests__/modal_renderer.test.js`

**Step 1: Write the failing test**

Create test file:

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderWalletModal } from '../utils/modal_renderer.js';

describe('renderWalletModal', () => {
  const mockWallets = [
    {
      rdns: 'io.metamask',
      name: 'MetaMask',
      icon: 'data:image/svg+xml;base64,PHN2Zy...',
      chains: ['eip155'],
    },
    {
      rdns: 'app.phantom',
      name: 'Phantom',
      icon: 'data:image/svg+xml;base64,PHN2Zy...',
      chains: ['solana'],
    },
  ];

  it('should return a DOM element', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    const element = renderWalletModal(mockWallets, onSelect, onClose);

    expect(element).toBeInstanceOf(HTMLElement);
  });

  it('should render wallet buttons with correct attributes', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    const element = renderWalletModal(mockWallets, onSelect, onClose);

    const buttons = element.querySelectorAll('[data-wallet-rdns]');
    expect(buttons).toHaveLength(2);
    expect(buttons[0].dataset.walletRdns).toBe('io.metamask');
    expect(buttons[1].dataset.walletRdns).toBe('app.phantom');
  });

  it('should attach click handlers to wallet buttons', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    const element = renderWalletModal(mockWallets, onSelect, onClose);

    const button = element.querySelector('[data-wallet-rdns="io.metamask"]');
    button.click();

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        currentTarget: button,
      })
    );
  });

  it('should attach click handler to close button', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    const element = renderWalletModal(mockWallets, onSelect, onClose);

    const closeButton = element.querySelector('[data-action="close"]');
    closeButton.click();

    expect(onClose).toHaveBeenCalled();
  });

  it('should attach click handler to backdrop', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    const element = renderWalletModal(mockWallets, onSelect, onClose);

    const backdrop = element.querySelector('.modal-backdrop');
    backdrop.click();

    expect(onClose).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `yarn test modal_renderer.test.js`
Expected: FAIL with "Cannot find module '../utils/modal_renderer.js'"

**Step 3: Write minimal implementation**

Read existing modal rendering code from `src/controllers/modal_controller.js` for reference, then create:

```javascript
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
  render(
    container,
    html`
      <div class="modal-backdrop" onclick=${onClose}>
        <div class="modal-content" onclick=${(e) => e.stopPropagation()}>
          <div class="modal-header">
            <h2>Connect Wallet</h2>
            <button class="modal-close" data-action="close" onclick=${onClose}>
              ×
            </button>
          </div>
          <div class="modal-body">
            <div class="wallet-grid">
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
                      class="wallet-icon"
                    />
                    <span class="wallet-name">${wallet.name}</span>
                  </button>
                `
              )}
            </div>
          </div>
        </div>
      </div>
    `
  );

  return container.firstElementChild;
}
```

**Step 4: Run test to verify it passes**

Run: `yarn test modal_renderer.test.js`
Expected: PASS (all 5 tests)

**Step 5: Commit**

```bash
git add src/utils/modal_renderer.js src/__tests__/modal_renderer.test.js
git commit -m "feat: add modal renderer utility

- Extract modal rendering logic to pure function
- Returns DOM element ready to append to body
- Takes wallets array and callbacks for select/close
- Fully tested with event handler verification"
```

---

## Task 2: Create New WalletController

**Files:**

- Create: `src/controllers/wallet_controller.js`
- Reference: `src/controllers/connector_controller.js` (copy base structure)
- Reference: `src/controllers/modal_controller.js` (copy modal logic)
- Reference: `src/controllers/wallets_controller.js` (copy wallet selection logic)

**Step 1: Write the failing test**

Create test file:

```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';
import WalletController from '../controllers/wallet_controller.js';

describe('WalletController', () => {
  let application;
  let element;

  beforeEach(() => {
    // Setup Stimulus application
    application = Application.start();
    application.register('wallet', WalletController);

    // Create test element
    element = document.createElement('div');
    element.setAttribute('data-controller', 'wallet');
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    application.stop();
  });

  it('should initialize with disconnected state', () => {
    const controller = application.getControllerForElementAndIdentifier(
      element,
      'wallet'
    );

    expect(controller.isConnectedValue).toBe(false);
    expect(controller.addressValue).toBe('');
  });

  it('should create WalletManager on connect', () => {
    const controller = application.getControllerForElementAndIdentifier(
      element,
      'wallet'
    );

    expect(controller.walletManager).toBeDefined();
    expect(controller.mipdStore).toBeDefined();
  });

  it('should open modal when open() is called', () => {
    const controller = application.getControllerForElementAndIdentifier(
      element,
      'wallet'
    );

    controller.open();

    const modal = document.querySelector('.modal-backdrop');
    expect(modal).toBeTruthy();
  });

  it('should close modal when close() is called', () => {
    const controller = application.getControllerForElementAndIdentifier(
      element,
      'wallet'
    );

    controller.open();
    controller.close();

    const modal = document.querySelector('.modal-backdrop');
    expect(modal).toBeFalsy();
  });

  it('should emit wallet:connected event when wallet connects', async () => {
    const controller = application.getControllerForElementAndIdentifier(
      element,
      'wallet'
    );
    const eventSpy = vi.fn();
    element.addEventListener('wallet:connected', eventSpy);

    // Mock wallet manager to immediately emit connected
    const mockConnection = {
      address: '0x123',
      chainId: '1',
      name: 'MetaMask',
      rdns: 'io.metamask',
      family: 'evm',
    };
    vi.spyOn(controller.walletManager, 'connect').mockResolvedValue(
      mockConnection
    );

    controller.open();
    const button = document.querySelector('[data-wallet-rdns="io.metamask"]');
    await button.click();

    expect(eventSpy).toHaveBeenCalled();
    expect(controller.isConnectedValue).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `yarn test wallet_controller.test.js`
Expected: FAIL with "Cannot find module '../controllers/wallet_controller.js'"

**Step 3: Write minimal implementation**

Create the merged controller:

```javascript
import { Controller } from '@hotwired/stimulus';
import { createStore } from 'mipd';
import { WalletManager } from '../core/wallet_manager.js';
import { renderWalletModal } from '../utils/modal_renderer.js';

/**
 * Main wallet controller - handles wallet connection, modal display, and state management
 * Merges functionality from ConnectorController, ModalController, and WalletsController
 */
export default class WalletController extends Controller {
  static values = {
    address: String,
    chainId: String,
    walletName: String,
    rdns: String,
    family: String,
    isConnected: { type: Boolean, default: false },
    connecting: { type: Boolean, default: false },
  };

  // ============================================================================
  // Lifecycle
  // ============================================================================

  connect() {
    // Initialize services
    this.mipdStore = createStore();
    this.walletManager = new WalletManager(this.mipdStore);
    this.modalElement = null;

    // Set up event listeners for WalletManager events
    this.setupEventListeners();

    // Initialize wallet manager for auto-reconnect
    this.walletManager.init();
  }

  disconnect() {
    this.cleanupEventListeners();
    this.close(); // Remove modal if open

    if (this.walletManager.getActiveConnection()) {
      this.walletManager.disconnect();
    }
  }

  // ============================================================================
  // Getters (for backward compatibility and programmatic access)
  // ============================================================================

  get address() {
    return this.addressValue;
  }

  get chainId() {
    return this.chainIdValue;
  }

  get provider() {
    return this.walletManager.getActiveConnection()?.provider;
  }

  get isConnected() {
    return this.isConnectedValue;
  }

  // ============================================================================
  // User Actions (Stimulus Actions)
  // ============================================================================

  open() {
    if (this.modalElement) {
      return; // Already open
    }

    const wallets = this.walletManager.getDetectedWallets();

    // Bind callbacks
    this.boundSelectWallet = this.selectWallet.bind(this);
    this.boundClose = this.close.bind(this);

    // Render modal
    this.modalElement = renderWalletModal(
      wallets,
      this.boundSelectWallet,
      this.boundClose
    );
    document.body.appendChild(this.modalElement);
  }

  close() {
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
  }

  async selectWallet(event) {
    const button = event.currentTarget;
    const rdns = button.dataset.walletRdns;

    if (!rdns) {
      this.dispatch('error', {
        detail: { message: 'Invalid wallet selection' },
      });
      return;
    }

    // Set connecting state
    this.connectingValue = true;

    this.dispatch('connecting', { detail: { rdns } });

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 30000);
      });

      await Promise.race([this.walletManager.connect(rdns), timeoutPromise]);
    } catch (error) {
      console.error('Wallet connection error:', error);
      this.dispatch('error', {
        detail: {
          message: error.message || 'Connection failed',
          error,
        },
      });
    } finally {
      this.connectingValue = false;
    }
  }

  async disconnectWallet() {
    if (this.walletManager.getActiveConnection()) {
      const rdns = this.walletManager.getActiveConnection().rdns;
      await this.walletManager.disconnect(rdns);
    }
  }

  // ============================================================================
  // Event Listener Management (WalletManager EventTarget)
  // ============================================================================

  setupEventListeners() {
    this.boundHandleConnected = this.handleConnected.bind(this);
    this.boundHandleDisconnected = this.handleDisconnected.bind(this);
    this.boundHandleChainChanged = this.handleChainChanged.bind(this);
    this.boundHandleAccountChanged = this.handleAccountChanged.bind(this);

    this.walletManager.addEventListener('connected', this.boundHandleConnected);
    this.walletManager.addEventListener(
      'disconnected',
      this.boundHandleDisconnected
    );
    this.walletManager.addEventListener(
      'chainChanged',
      this.boundHandleChainChanged
    );
    this.walletManager.addEventListener(
      'accountChanged',
      this.boundHandleAccountChanged
    );
  }

  cleanupEventListeners() {
    if (this.walletManager) {
      this.walletManager.removeEventListener(
        'connected',
        this.boundHandleConnected
      );
      this.walletManager.removeEventListener(
        'disconnected',
        this.boundHandleDisconnected
      );
      this.walletManager.removeEventListener(
        'chainChanged',
        this.boundHandleChainChanged
      );
      this.walletManager.removeEventListener(
        'accountChanged',
        this.boundHandleAccountChanged
      );
    }
  }

  // ============================================================================
  // Event Handlers (from WalletManager)
  // ============================================================================

  handleConnected(event) {
    const { connection } = event.detail;

    // Update Stimulus values (triggers reactive callbacks)
    this.addressValue = connection.address;
    this.chainIdValue = connection.chainId;
    this.walletNameValue = connection.name;
    this.rdnsValue = connection.rdns;
    this.familyValue = connection.family;
    this.isConnectedValue = true;

    // Close modal
    this.close();

    // Dispatch Stimulus event
    this.dispatch('connected', {
      detail: {
        address: connection.address,
        chainId: connection.chainId,
        name: connection.name,
        rdns: connection.rdns,
        family: connection.family,
        provider: connection.provider,
      },
    });
  }

  handleDisconnected() {
    // Clear Stimulus values
    this.addressValue = '';
    this.chainIdValue = '';
    this.walletNameValue = '';
    this.rdnsValue = '';
    this.familyValue = '';
    this.isConnectedValue = false;

    // Dispatch Stimulus event
    this.dispatch('disconnected');
  }

  handleChainChanged(event) {
    // Update chain ID value
    this.chainIdValue = event.detail.connection.chainId;

    // Dispatch Stimulus event
    this.dispatch('chainChanged', {
      detail: { chainId: event.detail.connection.chainId },
    });
  }

  handleAccountChanged(event) {
    // Update address value
    this.addressValue = event.detail.connection.address;

    // Dispatch Stimulus event
    this.dispatch('accountChanged', {
      detail: { address: event.detail.connection.address },
    });
  }

  // ============================================================================
  // Reactive Callbacks
  // ============================================================================

  isConnectedValueChanged(isConnected) {
    // Add/remove class to controller element for CSS targeting
    this.element.classList.toggle('wallet-connected', isConnected);
  }
}
```

**Step 4: Run test to verify it passes**

Run: `yarn test wallet_controller.test.js`
Expected: PASS (all 5 tests)

**Step 5: Commit**

```bash
git add src/controllers/wallet_controller.js src/__tests__/wallet_controller.test.js
git commit -m "feat: create unified WalletController

- Merges ConnectorController, ModalController, WalletsController
- Manages WalletManager lifecycle
- Dynamically creates/destroys modal DOM
- Handles wallet selection with timeout
- Exposes Stimulus values and events
- No outlets required"
```

---

## Task 3: Update Exports and Remove Old Controllers

**Files:**

- Modify: `src/index.js`
- Delete: `src/controllers/connector_controller.js`
- Delete: `src/controllers/modal_controller.js`
- Delete: `src/controllers/wallets_controller.js`
- Delete: `src/controllers/index.js`
- Delete: `src/__tests__/connector_controller.test.js`
- Delete: `src/__tests__/modal_controller.test.js`
- Delete: `src/__tests__/wallets_controller.test.js`

**Step 1: Update exports in src/index.js**

```javascript
// Main entry point for the wallet connector library
import { WalletManager } from './core/wallet_manager.js';
import {
  updateButtonState,
  resetWalletUI,
  updateWalletInfo,
} from './utils/utils.js';
import { renderWallets } from './utils/wallets.js';
import { renderWalletModal } from './utils/modal_renderer.js';
import { WALLET_ICONS } from './utils/config.js';
import { getChainName, formatChainDisplay } from './utils/chain_utils.js';
import './css/wallet-connector.css';

// Export core components
export {
  WalletManager,
  updateButtonState,
  resetWalletUI,
  updateWalletInfo,
  renderWallets,
  renderWalletModal,
  WALLET_ICONS,
  getChainName,
  formatChainDisplay,
};

// Export wallet handlers
export { default as EvmHandler } from './core/wallets/evm_handler.js';
export { default as SolanaHandler } from './core/wallets/solana_handler.js';
export { default as TronHandler } from './core/wallets/tron_handler.js';

// Export controller for Stimulus usage
export { default as WalletController } from './controllers/wallet_controller.js';

// Main initialization function for the wallet connector
export function initializeWalletConnector(mipdStore, targetElement) {
  const walletManager = new WalletManager(mipdStore);

  // Initialize wallet manager for auto-reconnect
  walletManager.init();

  return walletManager;
}

// Simple initialization function if user doesn't want to manage store themselves
export async function createWalletConnector() {
  const { createStore } = await import('mipd');
  const mipdStore = createStore();

  return initializeWalletConnector(mipdStore);
}
```

**Step 2: Delete old controller files**

```bash
rm src/controllers/connector_controller.js
rm src/controllers/modal_controller.js
rm src/controllers/wallets_controller.js
rm src/controllers/index.js
rm src/__tests__/connector_controller.test.js
rm src/__tests__/modal_controller.test.js
rm src/__tests__/wallets_controller.test.js
```

**Step 3: Build to verify no import errors**

Run: `yarn build`
Expected: Build succeeds with no errors

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove old controllers and update exports

BREAKING CHANGE: ConnectorController, ModalController, and
WalletsController removed in favor of unified WalletController

- Update index.js to export WalletController only
- Remove old controller files and tests
- Export modal_renderer utility for advanced use cases"
```

---

## Task 4: Update Example Application

**Files:**

- Modify: `example/index.html`
- Modify: `example/main.js`
- Delete: `example/controllers/demo_status_controller.js`

**Step 1: Simplify HTML**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@scionx/chain-connect Example</title>
    <link rel="stylesheet" href="./style.css" />
  </head>
  <body>
    <div
      data-controller="wallet"
      data-action="wallet:connected->demo#handleConnected
                    wallet:disconnected->demo#handleDisconnected
                    wallet:error->demo#handleError"
    >
      <div class="container">
        <h1>@scionx/chain-connect Example</h1>
        <p>Simple wallet connector - just one controller!</p>

        <button data-action="click->wallet#open">Connect Wallet</button>
        <button data-action="click->wallet#disconnectWallet">Disconnect</button>

        <div data-controller="demo" data-demo-wallet-outlet="wallet">
          <h2>Connection Status</h2>
          <div data-demo-target="status"></div>
        </div>
      </div>
    </div>

    <script type="module" src="./main.js"></script>
  </body>
</html>
```

**Step 2: Update main.js**

```javascript
import { Application } from '@hotwired/stimulus';
import { WalletController } from '@scionx/chain-connect';
import '@scionx/chain-connect/style';
import DemoController from './controllers/demo_controller.js';

const application = Application.start();
application.register('wallet', WalletController);
application.register('demo', DemoController);
```

**Step 3: Create simple demo controller**

Create `example/controllers/demo_controller.js`:

```javascript
import { Controller } from '@hotwired/stimulus';

export default class DemoController extends Controller {
  static targets = ['status'];
  static outlets = ['wallet'];

  connect() {
    this.updateStatus();
  }

  handleConnected(event) {
    this.updateStatus();
  }

  handleDisconnected(event) {
    this.updateStatus();
  }

  handleError(event) {
    alert(`Error: ${event.detail.message}`);
  }

  updateStatus() {
    if (!this.hasWalletOutlet) return;

    const wallet = this.walletOutlet;

    if (wallet.isConnectedValue) {
      this.statusTarget.innerHTML = `
        <p><strong>Connected!</strong></p>
        <p>Wallet: ${wallet.walletNameValue}</p>
        <p>Address: <code>${wallet.addressValue}</code></p>
        <p>Chain: ${wallet.chainIdValue}</p>
        <p>Family: ${wallet.familyValue}</p>
      `;
    } else {
      this.statusTarget.innerHTML = '<p><strong>Not connected</strong></p>';
    }
  }
}
```

**Step 4: Delete old demo controller**

```bash
rm example/controllers/demo_status_controller.js
```

**Step 5: Rebuild package and test example**

```bash
yarn build
cd example
yarn dev
```

Open browser, verify:

- Connect button opens modal
- Wallet selection works
- Status updates correctly
- Disconnect works

**Step 6: Commit**

```bash
git add example/
git commit -m "docs: update example to use WalletController

- Simplify HTML to single data-controller
- Remove outlet wiring complexity
- Create simple demo controller
- Shows connection status using Stimulus values"
```

---

## Task 5: Update Documentation

**Files:**

- Modify: `README.md`
- Create: `docs/MIGRATION.md`

**Step 1: Update README.md**

Find the usage section and replace with:

````markdown
## Quick Start

### Installation

```bash
npm install @scionx/chain-connect
# or
yarn add @scionx/chain-connect
```
````

### Basic Usage

```html
<div data-controller="wallet">
  <button data-action="click->wallet#open">Connect Wallet</button>
  <button data-action="click->wallet#disconnectWallet">Disconnect</button>
</div>
```

```javascript
import { Application } from '@hotwired/stimulus';
import { WalletController } from '@scionx/chain-connect';
import '@scionx/chain-connect/style';

const application = Application.start();
application.register('wallet', WalletController);
```

That's it! The controller handles everything:

- EIP-6963 wallet detection
- Modal rendering
- Connection management
- State persistence

### Listening to Events

```html
<div
  data-controller="wallet"
  data-action="wallet:connected->mycontroller#handleConnected
                  wallet:disconnected->mycontroller#handleDisconnected"
>
  <button data-action="click->wallet#open">Connect Wallet</button>
</div>
```

### Accessing Wallet State

```javascript
// Via Stimulus values
const address = walletController.addressValue;
const chainId = walletController.chainIdValue;
const isConnected = walletController.isConnectedValue;

// Via outlets
static outlets = ['wallet'];

if (this.walletOutlet.isConnectedValue) {
  console.log('Connected to:', this.walletOutlet.addressValue);
}
```

### Supported Wallets

- **Ethereum**: MetaMask, Coinbase Wallet, Rainbow, any EIP-6963 wallet
- **Solana**: Phantom, Solflare, any wallet with `window.solana`
- **Tron**: TronLink, any wallet with `window.tronWeb`

````

**Step 2: Create migration guide**

Create `docs/MIGRATION.md`:

```markdown
# Migration Guide: v1.x to v2.0

## Breaking Changes

### Single Controller

**v1.x:**
```html
<div data-controller="connector modal wallets"
     data-connector-modal-outlet="modal"
     data-connector-wallets-outlet="wallets"
     data-wallets-connector-outlet="connector"
     data-wallets-modal-outlet="modal">
  <button data-action="click->connector#open">Connect</button>
</div>
````

**v2.0:**

```html
<div data-controller="wallet">
  <button data-action="click->wallet#open">Connect</button>
</div>
```

### Import Changes

**v1.x:**

```javascript
import {
  ConnectorController,
  ModalController,
  WalletsController,
} from '@scionx/chain-connect';

application.register('connector', ConnectorController);
application.register('modal', ModalController);
application.register('wallets', WalletsController);
```

**v2.0:**

```javascript
import { WalletController } from '@scionx/chain-connect';

application.register('wallet', WalletController);
```

### Event Name Changes

| v1.x                       | v2.0                    |
| -------------------------- | ----------------------- |
| `connector:connected`      | `wallet:connected`      |
| `connector:disconnected`   | `wallet:disconnected`   |
| `connector:chainChanged`   | `wallet:chainChanged`   |
| `connector:accountChanged` | `wallet:accountChanged` |
| `connector:error`          | `wallet:error`          |

### Stimulus Value Access

**v1.x:**

```javascript
// Had to access via connectorOutlet
this.connectorOutlet.addressValue;
this.connectorOutlet.isConnectedValue;
```

**v2.0:**

```javascript
// Direct access via walletOutlet
this.walletOutlet.addressValue;
this.walletOutlet.isConnectedValue;
```

## What Stayed the Same

- WalletManager API (unchanged)
- Wallet handlers (unchanged)
- Storage format (reconnection works across versions)
- All utility functions
- CSS classes and styling
- Supported wallet types

## Migration Steps

1. **Update imports:**
   - Remove ConnectorController, ModalController, WalletsController
   - Import only WalletController

2. **Update HTML:**
   - Change `data-controller="connector"` to `data-controller="wallet"`
   - Remove all outlet declarations
   - Change `connector#open` to `wallet#open`

3. **Update event listeners:**
   - Change `connector:*` events to `wallet:*`

4. **Update outlet references:**
   - Change `connectorOutlet` to `walletOutlet` in your controllers

5. **Test thoroughly:**
   - Connection flow
   - Disconnection
   - Event handling
   - Auto-reconnect

## Why This Change?

- **Simpler API**: One controller instead of three
- **Less configuration**: No manual outlet wiring
- **Easier to learn**: Obvious what `data-controller="wallet"` does
- **Maintainable**: Less code, clearer responsibilities
- **Same power**: All features preserved, just better organized

````

**Step 3: Commit**

```bash
git add README.md docs/MIGRATION.md
git commit -m "docs: update documentation for v2.0

- Simplify README with new single-controller API
- Add comprehensive migration guide from v1.x
- Document breaking changes and event name updates
- Include side-by-side comparison examples"
````

---

## Task 6: Update Package Version

**Files:**

- Modify: `package.json`

**Step 1: Update version to 2.0.0**

```json
{
  "name": "@scionx/chain-connect",
  "version": "2.0.0",
  ...
}
```

**Step 2: Build and verify**

```bash
yarn build
yarn test
```

Expected: All tests pass

**Step 3: Commit**

```bash
git add package.json
git commit -m "chore: bump version to 2.0.0

Major version bump due to breaking API changes:
- Merged controllers into WalletController
- Changed event names (connector:* → wallet:*)
- Simplified HTML API (no outlets required)"
```

---

## Verification Checklist

After completing all tasks:

- [ ] All unit tests pass (`yarn test`)
- [ ] Build succeeds (`yarn build`)
- [ ] Example app works in browser
- [ ] Modal opens and closes correctly
- [ ] Wallet connection works
- [ ] Disconnection works
- [ ] Auto-reconnect works (refresh page)
- [ ] Events emit correctly
- [ ] Stimulus values update reactively
- [ ] No console errors
- [ ] Documentation is clear

## Notes

- Keep WalletManager and handlers completely unchanged - they're already tested and working
- The modal_renderer utility should be a pure function - easy to test in isolation
- WalletController orchestrates but delegates rendering to modal_renderer
- All existing CSS should work without changes
- Storage format stays the same, so reconnection works across versions
