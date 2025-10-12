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
    const controller = application.getControllerForElementAndIdentifier(element, 'wallet');

    expect(controller.isConnectedValue).toBe(false);
    expect(controller.addressValue).toBe('');
  });

  it('should create WalletManager on connect', () => {
    const controller = application.getControllerForElementAndIdentifier(element, 'wallet');

    expect(controller.walletManager).toBeDefined();
    expect(controller.mipdStore).toBeDefined();
  });

  it('should open modal when open() is called', () => {
    const controller = application.getControllerForElementAndIdentifier(element, 'wallet');

    controller.open();

    const modal = document.querySelector('.modal-backdrop');
    expect(modal).toBeTruthy();
  });

  it('should close modal when close() is called', () => {
    const controller = application.getControllerForElementAndIdentifier(element, 'wallet');

    controller.open();
    controller.close();

    const modal = document.querySelector('.modal-backdrop');
    expect(modal).toBeFalsy();
  });

  it('should emit wallet:connected event when wallet connects', async () => {
    const controller = application.getControllerForElementAndIdentifier(element, 'wallet');
    const eventSpy = vi.fn();
    element.addEventListener('wallet:connected', eventSpy);

    // Mock detected wallets
    const mockWallets = [
      {
        rdns: 'io.metamask',
        name: 'MetaMask',
        icon: 'data:image/svg+xml;base64,PHN2Zy...',
        chains: ['eip155']
      }
    ];
    vi.spyOn(controller.walletManager, 'getDetectedWallets').mockReturnValue(mockWallets);

    // Mock wallet manager connect to trigger connected event
    const mockConnection = {
      address: '0x123',
      chainId: '1',
      name: 'MetaMask',
      rdns: 'io.metamask',
      family: 'evm',
      provider: {}
    };

    const connectSpy = vi.spyOn(controller.walletManager, 'connect').mockImplementation(async (rdns) => {
      // Simulate the WalletManager emitting the connected event
      const event = new CustomEvent('connected', {
        detail: { connection: mockConnection }
      });
      controller.walletManager.dispatchEvent(event);
      return mockConnection;
    });

    controller.open();
    const button = document.querySelector('[data-wallet-rdns="io.metamask"]');
    await button.click();

    expect(connectSpy).toHaveBeenCalledWith('io.metamask');
    expect(eventSpy).toHaveBeenCalled();
    expect(controller.isConnectedValue).toBe(true);
  });
});
