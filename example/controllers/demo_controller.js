import { WalletController } from '@scionx/chain-connect';
import { html, render } from 'uhtml';

export default class DemoController extends WalletController {
  static targets = [
    'status', 
    'events', 
    'connectButton', 
    'disconnectButton',
    'addressDisplay',
    'chainIdDisplay', 
    'walletNameDisplay',
    'rdnsDisplay',
    'familyDisplay'
  ];
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
      this.clearStatusDisplay();
    }
  }

  addressValueChanged() {
    this.addressDisplayTarget.textContent = this.addressValue;
  }

  chainIdValueChanged() {
    this.chainIdDisplayTarget.textContent = this.chainIdValue;
  }

  walletNameValueChanged() {
    this.walletNameDisplayTarget.textContent = this.walletNameValue;
  }

  rdnsValueChanged() {
    this.rdnsDisplayTarget.textContent = this.rdnsValue;
  }

  familyValueChanged() {
    this.familyDisplayTarget.textContent = this.familyValue;
  }

  clearStatusDisplay() {
    this.addressDisplayTarget.textContent = '';
    this.chainIdDisplayTarget.textContent = '';
    this.walletNameDisplayTarget.textContent = '';
    this.rdnsDisplayTarget.textContent = '';
    this.familyDisplayTarget.textContent = '';
  }
}