
// Import the application instance
import { application } from "./application"

// Import all controllers
import ConnectorController from "./connector_controller.js"
import ModalController from "./modal_controller.js"

// Register controllers with the application
application.register("wallet", ConnectorController)
application.register("modal", ModalController)

export { application }
