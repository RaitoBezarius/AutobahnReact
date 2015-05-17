import autobahn from 'autobahn';
import _ from 'lodash';
import {EventEmitter} from 'events';

export class Connection extends EventEmitter {
  constructor(url, realm, options = {}) {
    super();

    // Build the required options and merge them with the provided options.
    const requiredOptions = {
      url,
      realm
    };

    // Initialize the internal state
    this._init(_.assign(requiredOptions, options));
  }

  _init(options) {
    // Prepare the connection instantiation
    this._connection = null;
    this._authdata = null;
    this._openDetails = null;
    this._prefixes = [];

    // Prepare the authentication thing
    this._onChallenge = (session, method, extra) => {
      return this._dispatchChallenge(method, session, extra);
    };

    // Store options into _options for future connection instantiation.
    this._options = _.assign(options, {
      retry_if_unreachable: false,
      onchallenge: this._onChallenge
    });
  }

  _instanciateConnection(options) {
    if (this.opened()) {
      this._connection.close();
    }

    // Instantiate the real thing
    this._connection = new autobahn.Connection(options);

    // Setup callbacks
    this._connection.onopen = this._onopened.bind(this);
    this._connection.onclose = this._onclosed.bind(this);
  }

  _dispatchChallenge(method, session, extra) {
    if (!this._authdata.hasOwnProperty(method)) {
      throw new Error('Unknown authentication method (' + method + ')');
    }

    var secret = _.isFunction(this._authdata[method].secret) ?
      this._authdata[method].secret() : this._authdata[method].secret;

    if (method === 'wampcra') {
      if (extra.hasOwnProperty('salt')) {
        secret = autobahn.auth_cra.derive_key(secret, extra.salt);
      }

      return autobahn.auth_cra.sign(secret, extra.challenge);
    } else if (method === 'ticket') {
      return secret;
    } else {
      return this._authdata[method].onChallenge(session, extra);
    }
  }

  registerPrefixes(prefixes) {
    this._prefixes = _.union(prefixes, this._prefixes);

    if (this.opened()) {
      this._prefixSession(prefixes);
    }

    return this;
  }

  registerPrefix(prefix) {
    this._prefixes.push(prefix);

    if (this.opened()) {
      this._prefixSession([prefix]);
    }

    return this;
  }

  authenticate(authdata) {
    if (this.opened()) {
      throw new Error('You need to close the connection first.')
    }

    // Store the new authdata.
    this._authdata = authdata;

    // All others keys are authmethods, take them and stuff them into the options object.
    this._authmethods = _.keys(_.omit(authdata, 'authid'))

    // Merge them into the _options object.
    this._options = _.assign(this._options, {
      authid: this._authdata.authid,
      authmethods: this._authmethods
    });

    return this;
  }

  open() {
    if (this.opened()) {
      throw new Error('The connection is already opened.');
    }

    this._instanciateConnection(this._options);
    this._connection.open();

    return this;
  }

  close(reason, message) {
    if (!this._connection) {
      throw new Error('Connection is not opened!');
    }

    this._connection.close(reason, message);
    this._connection = null;

    return this;
  }

  opened() {
    return this._connection && this._connection.isOpen;
  }

  session() {
    return this._session;
  }

  _prefixSession(prefixes) {
    prefixes.forEach(function (_prefix) {
      this._session.prefix(_prefix.curie, _prefix.url);
    });
  }

  _onopened(session, details) {
    this._session = session;
    this._prefixSession(this._prefixes);

    this._openDetails = details;
    this.emit('opened', session, details);
  }

  _onclosed(reason, details) {
    this.emit('closed', details);

    if (reason === 'lost') {
      this.emit('lost');
    } else if (reason === 'unreachable') {
      this.emit('unreachable');
    } else {
      this.emit('aborted', reason, details);
    }
  }
}

export class BrowserConnection extends Connection {
  constructor(realm, path = 'ws', wss = false, port = 8000) {
    const hostname = document.location.hostname;
    const pathname = document.location.pathname;

    const protocol = wss ? 'wss://' : 'ws://';
    const uri = protocol + hostname + ':' + port + pathname + path;

    super(uri, realm);
  }
}
