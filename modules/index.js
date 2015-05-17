import {Connection} from './Connection.js';
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
    if (!this.isConnectionReady()) {
      throw new Error("Autobahn isn't initialized!");
    }

    return Connection.currentConnection.session.publish(...arguments);
  },
  subscribe() {
    if (!this.isConnectionReady()) {
      throw new Error("Autobahn isn't initialized!");
    }

    return Connection.currentConnection.session.subscribe(...arguments);
  },
  unsubscribe() {
    if (!this.isConnectionReady()) {
      throw new Error("Autobahn isn't initialized!");
    }

    return Connection.currentConnection.session.unsubscribe(...arguments);
  },
  call() {
    if (!this.isConnectionReady()) {
      throw new Error("Autobahn isn't initialized!");
    }

    return Connection.currentConnection.session.call(...arguments);
  },
  register() {
    if (!this.isConnectionReady()) {
      throw new Error("Autobahn isn't initialized!");
    }

    return Connection.currentConnection.session.register(...arguments);
  }
};

export default Autobahn;
