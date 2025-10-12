import { Application } from '@hotwired/stimulus';
import { WalletController } from '@scionx/chain-connect';
import '@scionx/chain-connect/style';
import DemoStatusController from './controllers/demo_status_controller.js';

const application = Application.start();
application.register('wallet', WalletController);
application.register('demo-status', DemoStatusController);