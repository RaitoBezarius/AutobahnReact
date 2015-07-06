import Autobahn from 'autobahn';

let Connection = {
  _url: null,
  _realm: null,
  _unreachableHandlers: [],
  _lostHandlers: [],
  _errorHandlers: [],
  _readyHandlers: [],
  _currentConnection: null,

  connect() {
    var promise = new Promise((resolve, reject) => {
      this._currentConnection.onopen = function () {
        for (var i = 0 ; i < this._readyHandlers.length ; i++) {
          this._readyHandlers[i](...arguments);
        }
        resolve(...arguments);
      }.bind(this);

      this._currentConnection.onclose = (reason, details) => {
        if (reason === "unreachable") {
          console.log("Server unreachable", details);
          reject(details);
          for (var i = 0 ; i < this._unreachableHandlers.length ; i++) {
            this._unreachableHandlers[i](details);
          }
        } else if (reason === "lost") {
          console.log("Connection lost", details);
          for (var i = 0 ;  i < this._lostHandlers.length ; i++) {
            this._lostHandlers[i](details);
          }
        } else {
          console.log("Connection closed", reason, details);
          for (var i = 0 ; i < this._errorHandlers.length ; i++) {
            this._errorHandlers[i](reason, details);
          }
        }
      };

      this._currentConnection.open();
    });
    return promise;
  },

  onUnreachable(callback) {
    this._unreachableHandlers.push(callback);
    return this;
  },

  onLost(callback) {
    this._lostHandlers.push(callback);
    return this;
  },

  onReady(callback) {
    this._readyHandlers.push(callback);
    return this;
  },

  onError(callback) {
    this._errorHandlers.push(callback);
    return this;
  },

  makeConnection(params) {
    if (this._currentConnection && this._currentConnection.isOpen) {
      this._currentConnection.close();
    }

    this._currentConnection = new Autobahn.Connection(params);
  },

  initialize(url, realm) {
    this._url = url;
    this._realm = realm;
    this.makeConnection({url, realm});
  },

  reconnectAnonymously() {
    this.makeConnection({url: this._url, realm: this._realm});
    return this.connect();
  },

  reconnectWithToken(authid, token) {
    function onchallenge (session, method, extra) {
      if (method !== "ticket") {
        throw new Error("Unknown authentication method: " + method + " ?!");
      }

      return token;
    }

    this.makeConnection({url: this._url, realm: this._realm, authmethods: ['ticket'], authid, onchallenge});
    return this.connect();
  },

  reconnectWithAuth(authid, secret) {
    function onchallenge (session, method, extra) {
      if (method !== "wampcra") {
        throw new Error("Unknown authentication method: " + method + " ?!");
      }
      
      if ('salt' in extra) {
        Autobahn.auth_cra.derive_key(secret, extra.salt);
      }

      return Autobahn.auth_cra.sign(secret, extra.challenge);
    }

    this.makeConnection({url: this._url, realm: this._realm, authmethods: ['wampcra'], authid, onchallenge});
    return this.connect();
  }
};

Object.defineProperty(Connection, 'currentConnection', {
  enumerable: true,
  writeable: false,
  get: function () {
    if (Connection._currentConnection && Connection._currentConnection.isOpen) {
      return Connection._currentConnection;
    } else {
      throw new Error("Autobahn isn't initialized yet!");
    }
  }
});

export default Connection;
