// Mock wallet providers for testing

export const createMockEvmProvider = (options = {}) => {
  const {
    accounts = ['0x1234567890123456789012345678901234567890'],
    chainId = '0x1',
    shouldReject = false,
    shouldError = false
  } = options;

  const listeners = {
    'accountsChanged': [],
    'chainChanged': []
  };

  return {
    // Provider methods
    request: async ({ method, params }) => {
      if (shouldError) {
        throw new Error('Mock provider error');
      }
      
      if (shouldReject && (method === 'eth_requestAccounts' || method === 'eth_accounts')) {
        const error = new Error('User rejected request');
        error.code = 4001;
        throw error;
      }

      switch (method) {
        case 'eth_requestAccounts':
        case 'eth_accounts':
          return accounts;
        case 'eth_chainId':
          return chainId;
        default:
          return null;
      }
    },
    
    // For ethers.js BrowserProvider compatibility
    send: async (method, params) => {
      if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
        if (shouldReject) {
          const error = new Error('User rejected request');
          error.code = 4001;
          throw error;
        }
        return accounts;
      }
      return null;
    },

    // Event listener methods that are compatible with ethers v6
    on: (event, callback) => {
      if (listeners[event]) {
        listeners[event].push(callback);
      }
    },

    off: (event, callback) => {
      if (listeners[event]) {
        const index = listeners[event].indexOf(callback);
        if (index > -1) {
          listeners[event].splice(index, 1);
        }
      }
    },

    removeListener: (event, callback) => {
      if (listeners[event]) {
        const index = listeners[event].indexOf(callback);
        if (index > -1) {
          listeners[event].splice(index, 1);
        }
      }
    },

    // Simulate events for testing
    emit: (event, data) => {
      if (listeners[event]) {
        listeners[event].forEach(callback => callback(data));
      }
    },
    
    // Additional properties for compatibility
    isMetaMask: true,
    selectedAddress: accounts[0],
    networkVersion: parseInt(chainId, 16).toString(),
  };
};

export const createMockSolanaProvider = (options = {}) => {
  const {
    publicKey = 'ExamplePublicKey12345678901234567890123456789',
    shouldReject = false,
    shouldError = false
  } = options;

  const listeners = {
    accountChanged: []
  };

  return {
    connect: async ({ onlyIfTrusted } = {}) => {
      if (shouldError) {
        throw new Error('Mock Solana provider error');
      }
      
      if (shouldReject) {
        throw new Error('User rejected request');
      }

      return {
        publicKey: {
          toString: () => publicKey
        }
      };
    },

    disconnect: async () => {
      // Disconnect logic
    },

    on: (event, callback) => {
      if (listeners[event]) {
        listeners[event].push(callback);
      }
    },

    off: (event, callback) => {
      if (listeners[event]) {
        const index = listeners[event].indexOf(callback);
        if (index > -1) {
          listeners[event].splice(index, 1);
        }
      }
    },

    removeListener: (event, callback) => {
      if (listeners[event]) {
        const index = listeners[event].indexOf(callback);
        if (index > -1) {
          listeners[event].splice(index, 1);
        }
      }
    },

    // Simulate events for testing
    emit: (event, data) => {
      if (listeners[event]) {
        listeners[event].forEach(callback => callback(data));
      }
    },

    isPhantom: true
  };
};

export const createMockTronProvider = (options = {}) => {
  const {
    address = 'TExampleAddress12345678901234567890123',
    shouldReject = false,
    shouldError = false
  } = options;

  return {
    ready: true,
    defaultAddress: {
      base58: address
    },
    request: async ({ method }) => {
      if (shouldError) {
        throw new Error('Mock Tron provider error');
      }
      
      if (shouldReject && method === 'tron_requestAccounts') {
        throw new Error('User rejected request');
      }

      if (method === 'tron_requestAccounts') {
        return [address];
      }

      return null;
    },
    // For compatibility
    solidityNode: {
      host: 'https://api.trongrid.io'
    }
  };
};