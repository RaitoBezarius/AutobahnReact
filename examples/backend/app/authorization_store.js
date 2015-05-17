
/** Authorizations.to('com.example.chat.new_message').subscribe(onNewMessageSubscription);
Authorizations.to('com.example.chat.create_room').call(onCallToCreateRoom);
Authorizations.to('com.example.chat.something').authorize(this); **/

var AuthorizationRule = {
  constructor: function (route) {
    this.route = route;
    this.authorizers = {};
  },

  authorize(type) {
    if (!this.authorizers[type]) {
      throw new Error("Authorizer does not exists for this action.");
    }
    this.authorizers[type](Array.prototype.slice(arguments, 1));
  },

  subscribe(authorizer) {
    this.authorizers[SUBSCRIBE_ACTION] = authorizer;
  },

  call(authorizer) {
    this.authorizers[CALL_ACTION] = authorizer;
  },

  publish(authorizer) {
    this.authorizers[PUBLISH_ACTION] = authorizer;
  },

  register(authorizer) {
    this.authorizers[REGISTER_ACTION] = authorizer;
  }
}


var Authorizations = {
  store: {},

  to: function (route) {
    if (!this.store[route]) {
      this.store[route] = new AuthorizationRule(route);
    }
    return this.store[route];
  }
};
