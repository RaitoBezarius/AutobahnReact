import connectionActions from './ConnectionActions.js';
import alt from './alt.js'

class ConnectionStore {
  constructor() {
    this.bindListeners({
      onConnectionEstablishement: connectionActions.createConnection
    });

    this.connections = {};
  }

  isOnline(connectionId) {
    const state = this.getState();

    if (connectionId in state.connections) {
      return state.connections[connectionId].opened();
    } else {
      return false;
    }
  }

  getConnection(connectionId) {
    const state = this.getState();

    if (!this.isOnline(connectionId)) {
      throw new Error('Connection ' + connectionId + ' is not available!');
    }

    return state.connections[connectionId];
  }

  onConnectionEstablishement(connectionData) {
    const connection = connectionData.connection;
    if (connection.opened()) {
      this.connections[connectionData.id] = connectionData.connection;
    }
  }
}

export default alt.createStore(ConnectionStore);
