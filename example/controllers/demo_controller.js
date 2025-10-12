import { Controller } from '@hotwired/stimulus';
import { html, render } from 'uhtml';

export default class DemoController extends Controller {
  static targets = ['status', 'events'];
  static outlets = ['wallet'];

  connect() {
    console.log('DemoController connected');
    this.eventLog = [];
    this.updateStatus();
  }

  handleEvent({ type, detail }) {
    const actions = {
      connected: () => this.logEvent('connected', `Wallet ${detail.name} connected`, detail, true),
      disconnected: () => this.logEvent('disconnected', 'Wallet disconnected', {}, true),
      connecting: () => this.logEvent('connecting', 'Connecting to wallet', { rdns: detail.rdns }),
      chainChanged: () => this.logEvent('chainChanged', 'Chain changed', { chainId: detail.chainId }, true),
      accountChanged: () => this.logEvent('accountChanged', 'Account changed', { address: detail.address }, true),
      error: () => {
        this.logEvent('error', `Error: ${detail.message}`, { error: detail.error?.message || detail.error });
        alert(`Error: ${detail.message}`);
      }
    };
    actions[type]?.();
  }

  logEvent(eventName, description, details = {}, update = false) {
    const entry = { timestamp: new Date().toLocaleTimeString(), eventName, description, details };
    this.eventLog.unshift(entry);
    if (this.eventLog.length > 10) this.eventLog.pop(); // Reduced from 20 to 10 entries
    console.log(`[Wallet Event] ${eventName}:`, details);
    this.updateEventLogDisplay();
    if (update) this.updateStatus();
  }

  updateEventLogDisplay() {
    if (!this.hasEventsTarget) return;
    render(this.eventsTarget, html`
      <h3>Recent Events</h3>
      ${this.eventLog.map(e => html`
        <div class="event-log-entry">
          <div class="event-header">
            <span class="event-timestamp">${e.timestamp}</span>
            <span class="event-name">${e.eventName}</span>
          </div>
          <div class="event-description">${e.description}</div>
          ${Object.keys(e.details).length ? html`
            <div class="event-details"><pre>${JSON.stringify(e.details, null, 2)}</pre></div>
          ` : ''}
        </div>
      `)}
    `);
  }

  updateStatus() {
    if (!this.hasWalletOutlet) return;
    const w = this.walletOutlet;
    render(this.statusTarget, w.isConnectedValue ? html`
      <h3>Connected!</h3>
      <p><strong>Wallet:</strong> ${w.walletNameValue}</p>
      <p><strong>Address:</strong> <code>${w.addressValue}</code></p>
      <p><strong>Chain:</strong> ${w.chainIdValue}</p>
      <p><strong>Family:</strong> ${w.familyValue}</p>
    ` : html`
      <h3>Not Connected</h3>
      <p>Connect a wallet to get started</p>
    `);
  }
}
