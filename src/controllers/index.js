
// Import the application instance
import { application } from "./application"

// Import all controllers
import WalletController from "./wallet_controller.js"
import ChainConnectController from "./chain_connect_controller.js"

// Register controllers with the application
application.register("wallet", WalletController)
application.register("chain-connect", ChainConnectController)

export { application }
