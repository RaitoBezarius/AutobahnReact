const alt = require('./alt.js');

class ConnectionActions {
  createConnection(options) {
    var connection = null;

    const customOptions = options.custom || {};
    const useBrowserFactory = options.useBrowser || true;
    
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
      options.eventHandlers.foreach((event, handler) => {
        connection.on(event, handler);
      });
    }
    
    const dispatchObject = {
      id: options.id,
      connection
    };
    connection.on('opened', (session, details) => {
      this.dispatch(dispatchObject);
    });

    connection.open();
  }
}

export default alt.createActions(ConnectionActions);
