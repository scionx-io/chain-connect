import { Application } from '@hotwired/stimulus';
import { ConnectorController, WalletController } from '@scionx/chain-connect';
import '@scionx/chain-connect/style';
import DemoStatusController from './controllers/demo_status_controller.js';

const application = Application.start();
application.register('wallet', ConnectorController);
application.register('wallet-status', WalletController);
application.register('demo-status', DemoStatusController);