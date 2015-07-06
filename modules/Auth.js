"use strict"
import Autobahn from 'autobahn';
import Connection from './Connection.js';

export const Auth = {
  currentUser: null,
  _signupRoute: 'com.auth.signup',
  _createTokenRoute: 'com.auth.create_token',

  setSignupRoute(newRoute) {
    this._signupRoute = newRoute;
  },

  setTokenCreationRoute(newRoute) {
    this._createTokenRoute = newRoute;
  },

  _onOpened(args) {
    var session = args[0];
    var details = args[1];

    this.currentUser = {
      session_id: session.id,
      id: details.authid,
      role: details.authrole,
      provider: details.authprovider,
      method: details.authmethod
    };

    return Promise.resolve(session, this.currentUser);
  },

  _onClosed() {
    this.currentUser = null;
    return Promise.reject(arguments);
  },


  signUp(userPayload) {
    let session = Connection.currentConnection.session;
    return session.call(this._signupRoute, [userPayload]);
  },
  
  logIn(credentials) {
    if (!credentials.username || !credentials.password) {
      throw new Error("One of credentials can't be null!");
    }

    return Connection.reconnectWithAuth(credentials.username, credentials.password)
      .then(this._onOpened.bind(this))
      .catch(this._onClosed.bind(this));
  },

  isLogged() {
    return this.currentUser !== null;
  },

  createToken() {
    let session = Connection.currentConnection.session;
    return session.call(this._createTokenRoute, Array.prototype.slice.call(arguments), {disclose_me: true});
  },

  become(token) {
    return Connection.reconnectWithToken(token)
      .then(this._onOpened.bind(this))
      .catch(this._onClosed.bind(this));
  },

  canAccess(route) {
    let session = Connection.currentConnection.session;
    return session.call(route, []).then(function () {
      return Promise.resolve(true);
    }).catch(function () {
      return Promise.resolve(false);
    });
  }
};
