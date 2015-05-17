'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x5, _x6, _x7) { var _again = true; _function: while (_again) { var object = _x5, property = _x6, receiver = _x7; desc = parent = getter = undefined; _again = false; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x5 = parent; _x6 = property; _x7 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _autobahn = require('autobahn');

var _autobahn2 = _interopRequireDefault(_autobahn);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _events = require('events');

var Connection = (function (_EventEmitter) {
  function Connection(url, realm) {
    var options = arguments[2] === undefined ? {} : arguments[2];

    _classCallCheck(this, Connection);

    _get(Object.getPrototypeOf(Connection.prototype), 'constructor', this).call(this);

    // Build the required options and merge them with the provided options.
    var requiredOptions = {
      url: url,
      realm: realm
    };

    // Initialize the internal state
    this._init(_lodash2['default'].assign(requiredOptions, options));
  }

  _inherits(Connection, _EventEmitter);

  _createClass(Connection, [{
    key: '_init',
    value: function _init(options) {
      var _this = this;

      // Prepare the connection instantiation
      this._connection = null;
      this._authdata = null;
      this._openDetails = null;
      this._prefixes = [];

      // Prepare the authentication thing
      this._onChallenge = function (session, method, extra) {
        return _this._dispatchChallenge(method, session, extra);
      };

      // Store options into _options for future connection instantiation.
      this._options = _lodash2['default'].assign(options, {
        retry_if_unreachable: false,
        onchallenge: this._onChallenge
      });
    }
  }, {
    key: '_instanciateConnection',
    value: function _instanciateConnection(options) {
      if (this.opened()) {
        this._connection.close();
      }

      // Instantiate the real thing
      this._connection = new _autobahn2['default'].Connection(options);

      // Setup callbacks
      this._connection.onopen = this._onopened.bind(this);
      this._connection.onclose = this._onclosed.bind(this);
    }
  }, {
    key: '_dispatchChallenge',
    value: function _dispatchChallenge(method, session, extra) {
      if (!this._authdata.hasOwnProperty(method)) {
        throw new Error('Unknown authentication method (' + method + ')');
      }

      var secret = _lodash2['default'].isFunction(this._authdata[method].secret) ? this._authdata[method].secret() : this._authdata[method].secret;

      if (method === 'wampcra') {
        if (extra.hasOwnProperty('salt')) {
          secret = _autobahn2['default'].auth_cra.derive_key(secret, extra.salt);
        }

        return _autobahn2['default'].auth_cra.sign(secret, extra.challenge);
      } else if (method === 'ticket') {
        return secret;
      } else {
        return this._authdata[method].onChallenge(session, extra);
      }
    }
  }, {
    key: 'registerPrefixes',
    value: function registerPrefixes(prefixes) {
      this._prefixes = _lodash2['default'].union(prefixes, this._prefixes);

      if (this.opened()) {
        this._prefixSession(prefixes);
      }

      return this;
    }
  }, {
    key: 'registerPrefix',
    value: function registerPrefix(prefix) {
      this._prefixes.push(prefix);

      if (this.opened()) {
        this._prefixSession([prefix]);
      }

      return this;
    }
  }, {
    key: 'authenticate',
    value: function authenticate(authdata) {
      if (this.opened()) {
        throw new Error('You need to close the connection first.');
      }

      // Store the new authdata.
      this._authdata = authdata;

      // All others keys are authmethods, take them and stuff them into the options object.
      this._authmethods = _lodash2['default'].keys(_lodash2['default'].omit(authdata, 'authid'));

      // Merge them into the _options object.
      this._options = _lodash2['default'].assign(this._options, {
        authid: this._authdata.authid,
        authmethods: this._authmethods
      });

      return this;
    }
  }, {
    key: 'open',
    value: function open() {
      if (this.opened()) {
        throw new Error('The connection is already opened.');
      }

      this._instanciateConnection(this._options);
      this._connection.open();

      return this;
    }
  }, {
    key: 'close',
    value: function close(reason, message) {
      if (!this._connection) {
        throw new Error('Connection is not opened!');
      }

      this._connection.close(reason, message);
      this._connection = null;

      return this;
    }
  }, {
    key: 'opened',
    value: function opened() {
      return this._connection && this._connection.isOpen;
    }
  }, {
    key: 'session',
    value: function session() {
      return this._session;
    }
  }, {
    key: '_prefixSession',
    value: function _prefixSession(prefixes) {
      prefixes.forEach(function (_prefix) {
        this._session.prefix(_prefix.curie, _prefix.url);
      });
    }
  }, {
    key: '_onopened',
    value: function _onopened(session, details) {
      this._session = session;
      this._prefixSession(this._prefixes);

      this._openDetails = details;
      this.emit('opened', session, details);
    }
  }, {
    key: '_onclosed',
    value: function _onclosed(reason, details) {
      this.emit('closed', details);

      if (reason === 'lost') {
        this.emit('lost');
      } else if (reason === 'unreachable') {
        this.emit('unreachable');
      } else {
        this.emit('aborted', reason, details);
      }
    }
  }]);

  return Connection;
})(_events.EventEmitter);

exports.Connection = Connection;

var BrowserConnection = (function (_Connection) {
  function BrowserConnection(realm) {
    var path = arguments[1] === undefined ? 'ws' : arguments[1];
    var wss = arguments[2] === undefined ? false : arguments[2];
    var port = arguments[3] === undefined ? 8000 : arguments[3];

    _classCallCheck(this, BrowserConnection);

    var hostname = document.location.hostname;
    var pathname = document.location.pathname;

    var protocol = wss ? 'wss://' : 'ws://';
    var uri = protocol + hostname + ':' + port + pathname + path;

    _get(Object.getPrototypeOf(BrowserConnection.prototype), 'constructor', this).call(this, uri, realm);
  }

  _inherits(BrowserConnection, _Connection);

  return BrowserConnection;
})(Connection);

exports.BrowserConnection = BrowserConnection;
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var alt = require('./alt.js');

var ConnectionActions = (function () {
  function ConnectionActions() {
    _classCallCheck(this, ConnectionActions);
  }

  _createClass(ConnectionActions, [{
    key: 'createConnection',
    value: function createConnection(options) {
      var _this = this;

      var connection = null;

      var customOptions = options.custom || {};
      var useBrowserFactory = options.useBrowser || true;

      if (options.id || false) {
        throw new Error('No id provided.\nDid you forget to give an id to your connection?');
      }

      if (useBrowserFactory) {
        connection = new BrowserConnection(customOptions);
      } else {
        if (url in options && realm in options) {
          connection = new Connection(options.url, options.realm, customOptions);
        } else {
          throw new Error('No url / realm provided.\nDid you forget to add URL / Realm to your createConnection call ?');
        }
      }

      if (auth in options) {
        connection.authenticate(options.auth);
      }

      if (prefixes in options) {
        connection.registerPrefixes(options.prefixes);
      }

      if (eventHandlers in options) {
        options.eventHandlers.foreach(function (event, handler) {
          connection.on(event, handler);
        });
      }

      var dispatchObject = {
        id: options.id,
        connection: connection
      };
      connection.on('opened', function (session, details) {
        _this.dispatch(dispatchObject);
      });

      connection.open();
    }
  }]);

  return ConnectionActions;
})();

exports['default'] = alt.createActions(ConnectionActions);
module.exports = exports['default'];
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _ConnectionActionsJs = require('./ConnectionActions.js');

var _ConnectionActionsJs2 = _interopRequireDefault(_ConnectionActionsJs);

var _altJs = require('./alt.js');

var _altJs2 = _interopRequireDefault(_altJs);

var ConnectionStore = (function () {
  function ConnectionStore() {
    _classCallCheck(this, ConnectionStore);

    this.bindListeners({
      onConnectionEstablishement: _ConnectionActionsJs2['default'].createConnection
    });

    this.connections = {};
  }

  _createClass(ConnectionStore, [{
    key: 'isOnline',
    value: function isOnline(connectionId) {
      var state = this.getState();

      if (connectionId in state.connections) {
        return state.connections[connectionId].opened();
      } else {
        return false;
      }
    }
  }, {
    key: 'getConnection',
    value: function getConnection(connectionId) {
      var state = this.getState();

      if (!this.isOnline(connectionId)) {
        throw new Error('Connection ' + connectionId + ' is not available!');
      }

      return state.connections[connectionId];
    }
  }, {
    key: 'onConnectionEstablishement',
    value: function onConnectionEstablishement(connectionData) {
      var connection = connectionData.connection;
      if (connection.opened()) {
        this.connections[connectionData.id] = connectionData.connection;
      }
    }
  }]);

  return ConnectionStore;
})();

exports['default'] = _altJs2['default'].createStore(ConnectionStore);
module.exports = exports['default'];
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _Alt = require('Alt');

var _Alt2 = _interopRequireDefault(_Alt);

exports['default'] = new _Alt2['default']();
module.exports = exports['default'];
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _ConnectionJs = require('./Connection.js');

Object.defineProperty(exports, 'Connection', {
  enumerable: true,
  get: function get() {
    return _ConnectionJs.Connection;
  }
});
Object.defineProperty(exports, 'BrowserConnection', {
  enumerable: true,
  get: function get() {
    return _ConnectionJs.BrowserConnection;
  }
});

// TODO: Export them only if you use the version with alt.

var _ConnectionActionsJs = require('./ConnectionActions.js');

var _ConnectionActionsJs2 = _interopRequireDefault(_ConnectionActionsJs);

exports.connectionActions = _ConnectionActionsJs2['default'];

var _ConnectionStoreJs = require('./ConnectionStore.js');

var _ConnectionStoreJs2 = _interopRequireDefault(_ConnectionStoreJs);

exports.connectionStore = _ConnectionStoreJs2['default'];
