
import { Application } from "@hotwired/stimulus"
import WalletController from "./wallet_controller.js"
import ChainConnectController from "./chain_connect_controller.js"

window.Stimulus = Application.start()
Stimulus.register("wallet", WalletController)
Stimulus.register("chain-connect", ChainConnectController)
