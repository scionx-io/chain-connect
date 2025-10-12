import { Application } from '@hotwired/stimulus';
import { ConnectorController, WalletsController } from '@scionx/chain-connect';
import '@scionx/chain-connect/style';
import DemoStatusController from './controllers/demo_status_controller.js';

const application = Application.start();
application.register('connector', ConnectorController);
application.register('wallets', WalletsController);
application.register('demo-status', DemoStatusController);