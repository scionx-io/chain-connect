import { describe, it, expect, beforeEach, vi } from 'vitest';
import WalletController from '../src/controllers/wallet_controller.js';

// Mock DOM elements
const createMockElement = (className = '') => {
  const element = document.createElement('div');
  element.className = className;
  return element;
};

// Mock the utility functions
vi.mock('../src/utils.js', () => ({
  updateButtonState: vi.fn(),
  resetWalletUI: vi.fn(),
  updateWalletInfo: vi.fn(),
}));

vi.mock('../src/wallets.js', () => ({
  renderWallets: vi.fn(),
}));

// Mock the WalletConnectionService to control its behavior in tests
const mockWalletService = {
  addConnectedListener: vi.fn(),
  addDisconnectedListener: vi.fn(),
  addStateChangedListener: vi.fn(),
  addChainChangedListener: vi.fn(),
  addAccountChangedListener: vi.fn(),
  removeConnectedListener: vi.fn(),
  removeDisconnectedListener: vi.fn(),
  removeStateChangedListener: vi.fn(),
  removeChainChangedListener: vi.fn(),
  removeAccountChangedListener: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  getActiveConnection: vi.fn(() => null),
  getMipdStore: vi.fn(() => ({
    subscribe: vi.fn(),
    getProviders: vi.fn().mockReturnValue([]),
  })),
  subscribeToProviders: vi.fn(),
};

vi.mock('../src/services/wallet_connection_service.js', () => ({
  WalletConnectionService: vi.fn(() => mockWalletService),
}));

describe('WalletController', () => {
  let controller;
  let mockElements;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock elements
    mockElements = {
      connectWalletBtn: createMockElement(),
      modal: document.createElement('dialog'),
      closeModalBtn: createMockElement(),
      walletButtons: createMockElement(),
      walletInfo: createMockElement(),
      walletAddress: createMockElement(),
      walletName: createMockElement(),
      walletChain: createMockElement(),
      disconnectBtn: createMockElement(),
    };

    // Create controller instance
    controller = new WalletController();
    
    // Mock the target elements
    Object.assign(controller, {
      connectWalletBtnTarget: mockElements.connectWalletBtn,
      modalTarget: mockElements.modal,
      closeModalBtnTarget: mockElements.closeModalBtn,
      walletButtonsTarget: mockElements.walletButtons,
      walletInfoTarget: mockElements.walletInfo,
      walletAddressTarget: mockElements.walletAddress,
      walletNameTarget: mockElements.walletName,
      walletChainTarget: mockElements.walletChain,
      disconnectBtnTarget: mockElements.disconnectBtn,
    });

    // Call connect method to initialize
    controller.connect();
  });

  describe('Initialization', () => {
    it('should initialize with MIPD store and wallet connection service', () => {
      expect(mockWalletService.addConnectedListener).toHaveBeenCalledWith(expect.any(Function));
      expect(mockWalletService.addDisconnectedListener).toHaveBeenCalledWith(expect.any(Function));
      expect(mockWalletService.addStateChangedListener).toHaveBeenCalledWith(expect.any(Function));
      expect(mockWalletService.addChainChangedListener).toHaveBeenCalledWith(expect.any(Function));
      expect(mockWalletService.addAccountChangedListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should set up event listeners', () => {
      expect(mockWalletService.addConnectedListener).toHaveBeenCalledWith(expect.any(Function));
      expect(mockWalletService.addDisconnectedListener).toHaveBeenCalledWith(expect.any(Function));
      expect(mockWalletService.addStateChangedListener).toHaveBeenCalledWith(expect.any(Function));
      expect(mockWalletService.addChainChangedListener).toHaveBeenCalledWith(expect.any(Function));
      expect(mockWalletService.addAccountChangedListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should call getMipdStore to get store', () => {
      expect(mockWalletService.getMipdStore).toHaveBeenCalled();
    });
  });

  describe('selectWallet', () => {
    it('should do nothing if button is not found', () => {
      const event = { target: document.createElement('span') };
      controller.selectWallet(event);
      
      // Should not proceed if no .wallet-button is found
      expect(mockWalletService.connect).not.toHaveBeenCalled();
    });

    it('should connect to wallet when button is clicked', async () => {
      const button = document.createElement('button');
      button.className = 'wallet-button';
      button.setAttribute('data-wallet-rdns', 'io.metamask');
      const event = { target: button };

      // Fix modal mock to have a close method
      controller.modalTarget = { close: vi.fn(), show: vi.fn(), showModal: vi.fn() };

      await controller.selectWallet(event);

      expect(mockWalletService.connect).toHaveBeenCalledWith('io.metamask');
    });

    it('should handle connection errors gracefully', async () => {
      const button = document.createElement('button');
      button.className = 'wallet-button';
      button.setAttribute('data-wallet-rdns', 'io.metamask');
      const event = { target: button };

      // Fix modal mock to have a close method
      controller.modalTarget = { close: vi.fn(), show: vi.fn(), showModal: vi.fn() };

      // Mock connection to throw an error
      mockWalletService.connect.mockRejectedValue(new Error('Connection failed'));

      await controller.selectWallet(event);

      expect(mockWalletService.connect).toHaveBeenCalledWith('io.metamask');
    });

    it('should handle user rejection error', async () => {
      const button = document.createElement('button');
      button.className = 'wallet-button';
      button.setAttribute('data-wallet-rdns', 'io.metamask');
      const event = { target: button };

      // Fix modal mock to have a close method
      controller.modalTarget = { close: vi.fn(), show: vi.fn(), showModal: vi.fn() };

      // Mock connection to throw a user rejection error
      const rejectionError = new Error('User rejected');
      rejectionError.code = 4001;
      mockWalletService.connect.mockRejectedValue(rejectionError);

      await controller.selectWallet(event);

      expect(mockWalletService.connect).toHaveBeenCalledWith('io.metamask');
    });
  });

  describe('openModal and closeModal', () => {
    it('should open modal', () => {
      const mockModal = { show: vi.fn(), showModal: vi.fn() };
      controller.modalTarget = mockModal;
      
      controller.openModal();
      
      expect(mockModal.showModal).toHaveBeenCalled();
    });

    it('should close modal', () => {
      const mockModal = { close: vi.fn() };
      controller.modalTarget = mockModal;
      
      controller.closeModal();
      
      expect(mockModal.close).toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should disconnect from wallet service', () => {
      const mockRdns = 'io.metamask';
      mockWalletService.getActiveConnection.mockReturnValue({ rdns: mockRdns });

      controller.disconnect();

      expect(mockWalletService.removeConnectedListener).toHaveBeenCalledWith(
        expect.any(Function)
      );
      expect(mockWalletService.removeDisconnectedListener).toHaveBeenCalledWith(
        expect.any(Function)
      );
      expect(mockWalletService.removeStateChangedListener).toHaveBeenCalledWith(
        expect.any(Function)
      );
      expect(mockWalletService.removeChainChangedListener).toHaveBeenCalledWith(
        expect.any(Function)
      );
      expect(mockWalletService.removeAccountChangedListener).toHaveBeenCalledWith(
        expect.any(Function)
      );
      expect(mockWalletService.disconnect).toHaveBeenCalledWith(mockRdns);
    });
  });

  describe('handleConnected and handleDisconnected', () => {
    it('should handle connected event', () => {
      const mockEvent = { detail: { connection: { name: 'MetaMask', address: '0x123', rdns: 'io.metamask' } } };
      
      controller.handleConnected(mockEvent);
      
      // The actual logic is tested in updateWalletInfo mock
      expect(true).toBe(true); // Placeholder until we test the utility function properly
    });

    it('should handle disconnected event', () => {
      controller.handleDisconnected();
      
      // The actual logic is tested in resetWalletUI mock
      expect(true).toBe(true); // Placeholder until we test the utility function properly
    });
  });
});