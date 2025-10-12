
// Import the application instance
import { application } from "./application"

// Import all controllers
import ConnectorController from "./connector_controller.js"
import ModalController from "./modal_controller.js"
import WalletsController from "./wallets_controller.js"

// Register controllers with the application
application.register("connector", ConnectorController)
application.register("modal", ModalController)
application.register("wallets", WalletsController)

export { application }
