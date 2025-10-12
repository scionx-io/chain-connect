import { Controller } from "@hotwired/stimulus"
import { render } from 'uhtml';
import { modalTemplate } from '../templates/modal_template.js';

export default class extends Controller {
  static targets = ["modal"]

  static values = {
    isOpen: { type: Boolean, default: false }
  }

  connect() {
    // Bind event handlers for proper cleanup
    this.boundHandleOutsideClick = this.handleOutsideClick.bind(this);
    
    // Add event listener for closing modal on outside click
    if (this.hasModalTarget) {
      this.modalTarget.addEventListener('click', this.boundHandleOutsideClick);
    }
  }

  disconnect() {
    // Clean up event listeners
    if (this.hasModalTarget) {
      this.modalTarget.removeEventListener('click', this.boundHandleOutsideClick);
    }
  }

  open() {
    if (this.hasModalTarget) {
      this.modalTarget.showModal();
      this.isOpenValue = true;
    }
  }

  close() {
    if (this.hasModalTarget) {
      this.modalTarget.close();
      this.isOpenValue = false;
    }
  }

  // Render modal with wallets
  renderModal(wallets) {
    if (this.hasModalTarget) {
      render(this.modalTarget, modalTemplate(wallets));
    }
  }

  handleOutsideClick(event) {
    // Check if the click occurred directly on the modal backdrop (not on child elements)
    if (event.target === this.modalTarget) {
      this.close();
    }
  }

  isOpenValueChanged(isOpen) {
    if (isOpen) {
      this.element.setAttribute('data-modal-open', 'true');
    } else {
      this.element.removeAttribute('data-modal-open');
    }
  }
}