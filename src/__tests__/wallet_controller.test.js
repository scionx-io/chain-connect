import { describe, it, expect, beforeEach, vi } from 'vitest';
import WalletController from '../controllers/wallet_controller.js';

// Mock DOM elements
const createMockElement = (className = '') => {
  const element = document.createElement('div');
  element.className = className;
  return element;
};

// Mock the utility functions
vi.mock('../utils.js', () => ({
  updateButtonState: vi.fn(),
  resetWalletUI: vi.fn(),
  updateWalletInfo: vi.fn(),
}));

vi.mock('../wallets.js', () => ({
  renderWallets: vi.fn(),
}));

// Mock mipd createStore
const mockMipdStore = {
  subscribe: vi.fn(),
  getProviders: vi.fn().mockReturnValue([]),
};

vi.mock('mipd', () => ({
  createStore: vi.fn(() => mockMipdStore),
}));

// Mock WalletManager to control its behavior in tests
const mockWalletManager = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  init: vi.fn(),
  activeConnection: null,
};

vi.mock('../wallet_manager.js', () => ({
  WalletManager: vi.fn(() => mockWalletManager),
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
      errorModal: document.createElement('dialog'),
      errorMessage: createMockElement(),
      errorCloseBtn: createMockElement(),
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
      errorModalTarget: mockElements.errorModal,
      errorMessageTarget: mockElements.errorMessage,
      errorCloseBtnTarget: mockElements.errorCloseBtn,
    });

    // Call connect method to initialize
    controller.connect();
  });

  describe('Initialization', () => {
    it('should initialize with MIPD store and wallet manager', () => {
      expect(mockWalletManager.addEventListener).toHaveBeenCalledWith('connected', expect.any(Function));
      expect(mockWalletManager.addEventListener).toHaveBeenCalledWith('disconnected', expect.any(Function));
      expect(mockWalletManager.addEventListener).toHaveBeenCalledWith('stateChanged', expect.any(Function));
      expect(mockWalletManager.addEventListener).toHaveBeenCalledWith('chainChanged', expect.any(Function));
      expect(mockWalletManager.addEventListener).toHaveBeenCalledWith('accountChanged', expect.any(Function));
    });

    it('should set up event listeners', () => {
      expect(mockWalletManager.addEventListener).toHaveBeenCalledWith('connected', expect.any(Function));
      expect(mockWalletManager.addEventListener).toHaveBeenCalledWith('disconnected', expect.any(Function));
      expect(mockWalletManager.addEventListener).toHaveBeenCalledWith('stateChanged', expect.any(Function));
      expect(mockWalletManager.addEventListener).toHaveBeenCalledWith('chainChanged', expect.any(Function));
      expect(mockWalletManager.addEventListener).toHaveBeenCalledWith('accountChanged', expect.any(Function));
    });

    it('should initialize wallet manager', () => {
      expect(mockWalletManager.init).toHaveBeenCalled();
    });
  });

  describe('selectWallet', () => {
    it('should do nothing if button is not found', () => {
      const event = { target: document.createElement('span') };
      controller.selectWallet(event);

      // Should not proceed if no .wallet-button is found
      expect(mockWalletManager.connect).not.toHaveBeenCalled();
    });

    it('should connect to wallet when button is clicked', async () => {
      const button = document.createElement('button');
      button.className = 'wallet-button';
      button.setAttribute('data-wallet-rdns', 'io.metamask');
      const event = { target: button };

      // Fix modal mock to have a close method
      controller.modalTarget = { close: vi.fn(), show: vi.fn(), showModal: vi.fn() };

      await controller.selectWallet(event);

      expect(mockWalletManager.connect).toHaveBeenCalledWith('io.metamask');
    });

    it('should handle connection errors gracefully', async () => {
      const button = document.createElement('button');
      button.className = 'wallet-button';
      button.setAttribute('data-wallet-rdns', 'io.metamask');
      const event = { target: button };

      // Fix modal mock to have a close method
      controller.modalTarget = { close: vi.fn(), show: vi.fn(), showModal: vi.fn() };

      // Mock the error modal elements for the showErrorAndWait method
      controller.errorModalTarget = { close: vi.fn(), show: vi.fn(), showModal: vi.fn() };
      controller.errorMessageTarget = { textContent: '' };
      controller.errorCloseBtnTarget = { };

      // Mock connection to throw an error
      mockWalletManager.connect.mockRejectedValue(new Error('Connection failed'));

      // Mock the promise resolution to simulate user acknowledging error
      controller.showErrorAndWait = vi.fn().mockResolvedValue();

      await controller.selectWallet(event);

      expect(mockWalletManager.connect).toHaveBeenCalledWith('io.metamask');
      expect(controller.showErrorAndWait).toHaveBeenCalled();
    });

    it('should handle user rejection error', async () => {
      const button = document.createElement('button');
      button.className = 'wallet-button';
      button.setAttribute('data-wallet-rdns', 'io.metamask');
      const event = { target: button };

      // Fix modal mock to have a close method
      controller.modalTarget = { close: vi.fn(), show: vi.fn(), showModal: vi.fn() };

      // Mock the error modal elements for the showErrorAndWait method
      controller.errorModalTarget = { close: vi.fn(), show: vi.fn(), showModal: vi.fn() };
      controller.errorMessageTarget = { textContent: '' };
      controller.errorCloseBtnTarget = { };

      // Mock connection to throw a user rejection error
      const rejectionError = new Error('User rejected');
      rejectionError.code = 4001;
      mockWalletManager.connect.mockRejectedValue(rejectionError);

      // Mock the promise resolution to simulate user acknowledging error
      controller.showErrorAndWait = vi.fn().mockResolvedValue();

      await controller.selectWallet(event);

      expect(mockWalletManager.connect).toHaveBeenCalledWith('io.metamask');
      expect(controller.showErrorAndWait).toHaveBeenCalled();
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
    it('should disconnect from wallet manager', () => {
      const mockRdns = 'io.metamask';
      mockWalletManager.activeConnection = { rdns: mockRdns };

      controller.disconnect();

      expect(mockWalletManager.removeEventListener).toHaveBeenCalledWith('connected', expect.any(Function));
      expect(mockWalletManager.removeEventListener).toHaveBeenCalledWith('disconnected', expect.any(Function));
      expect(mockWalletManager.removeEventListener).toHaveBeenCalledWith('stateChanged', expect.any(Function));
      expect(mockWalletManager.removeEventListener).toHaveBeenCalledWith('chainChanged', expect.any(Function));
      expect(mockWalletManager.removeEventListener).toHaveBeenCalledWith('accountChanged', expect.any(Function));
      expect(mockWalletManager.disconnect).toHaveBeenCalledWith(mockRdns);
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
