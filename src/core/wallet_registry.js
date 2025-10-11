class WalletRegistry {
  constructor() {
    this.handlers = new Map();
  }

  register(family, handler) {
    this.handlers.set(family, handler);
  }

  get(family) {
    return this.handlers.get(family);
  }
}

const walletRegistry = new WalletRegistry();

export default walletRegistry;
