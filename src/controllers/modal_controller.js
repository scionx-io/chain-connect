import { Controller } from "@hotwired/stimulus"
import { render } from 'uhtml';
import { modalTemplate } from '../templates/modal_template.js';

export default class extends Controller {
  static targets = ["modal"]

  static values = {
    isOpen: { type: Boolean, default: false }
  }

  connect() {
    // Add event listener for closing modal on outside click
    if (this.hasModalTarget) {
      this.modalTarget.addEventListener('click', this.handleOutsideClick.bind(this));
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

      // Get the dialog element
      const modal = this.modalTarget.querySelector('dialog');

      // Close on backdrop click
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            this.close();
          }
        });
      }
    }
  }

  handleOutsideClick(event) {
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