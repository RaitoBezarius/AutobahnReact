import Connection from './Connection.js';
import {Auth} from './Auth.js';
import * as Decorators from './Decorators.js';

var Autobahn = {
	Auth,
  Connection,
  Decorators,
	initialize(url, realm) {
		if (Connection.currentConnection) {
			throw new Error("Autobahn is already initialized!");
		}

    Connection.initialize(url, realm);
    return Connection.reconnectAnonymously();
	},
  browserInitialize(port, path, realm) {
    return this.initialize("ws://" + document.location.hostname + ":" + port + "/" + path, realm);
  },
  isConnectionReady() {
    return Connection.currentConnection && Connection.currentConnection.isOpen;
  },
  publish() {
    return Connection.currentConnection.session.publish(...arguments);
  },
  subscribe() {
    return Connection.currentConnection.session.subscribe(...arguments);
  },
  unsubscribe() {
    return Connection.currentConnection.session.unsubscribe(...arguments);
  },
  call() {
    return Connection.currentConnection.session.call(...arguments);
  },
  register() {
    return Connection.currentConnection.session.register(...arguments);
  }
};

export default Autobahn;
