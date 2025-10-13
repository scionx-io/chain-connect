import { WalletController } from '@scionx/chain-connect';
import { html, render } from 'uhtml';

export default class DemoController extends WalletController {
  static targets = ['status', 'events', 'connectButton', 'disconnectButton'];
  static classes = ['connected', 'disconnected'];
  
  connect() {
    super.connect();
  }
 
  isConnectedValueChanged() {
     console.log("isConnectedValueChanged", this.isConnectedValue);
     if (this.isConnectedValue) {
      this.connectButtonTarget.classList.add('hidden');
      this.disconnectButtonTarget.classList.remove('hidden');
    } else {
      this.connectButtonTarget.classList.remove('hidden');
      this.disconnectButtonTarget.classList.add('hidden');
    }
  }
}