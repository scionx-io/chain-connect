
import { Application } from "@hotwired/stimulus"
import WalletController from "./wallet_controller.js"
import ChainConnectedController from "./chain_connected_controller.js"

window.Stimulus = Application.start()
Stimulus.register("wallet", WalletController)
Stimulus.register("chain-connect", ChainConnectedController)
