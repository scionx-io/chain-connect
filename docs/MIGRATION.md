# Migration Guide: v1.x to v2.0

## Breaking Changes

### Single Controller

**v1.x:**

```html
<div
  data-controller="connector modal wallets"
  data-connector-modal-outlet="modal"
  data-connector-wallets-outlet="wallets"
  data-wallets-connector-outlet="connector"
  data-wallets-modal-outlet="modal"
>
  <button data-action="click->connector#open">Connect</button>
</div>
```

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
