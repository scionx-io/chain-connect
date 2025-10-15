import { describe, it, expect, vi } from 'vitest';
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

    expect(onSelect).toHaveBeenCalled();
    expect(onSelect.mock.calls[0][0]).toBeInstanceOf(Event);
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

    // The element itself is the backdrop
    expect(element.classList.contains('modal-backdrop')).toBe(true);
    element.click();

    expect(onClose).toHaveBeenCalled();
  });
});
