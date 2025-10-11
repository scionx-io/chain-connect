
// Import the application instance
import { application } from "./application"

// Import all controllers
import WalletController from "./wallet_controller.js"
import ModalController from "./modal_controller.js"

// Register controllers with the application
application.register("wallet", WalletController)
application.register("modal", ModalController)

export { application }
