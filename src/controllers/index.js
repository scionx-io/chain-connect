
import { Application } from "@hotwired/stimulus"
import WalletController from "./wallet_controller.js"

window.Stimulus = Application.start()
Stimulus.register("wallet", WalletController)
