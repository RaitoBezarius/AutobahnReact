var autobahn = require('autobahn');
var registerAuth = require('./auth.js');
var registerChat = require('./chat.js');

var connection = new autobahn.Connection({
  url: 'ws://127.0.0.1:8000/system',
  realm: 'example',
  authid: 'authenticator',
  authmethods: ['ticket'],
  onchallenge: function (session, method, extra) {
    return "SECRET";
  }
});

function entrypoint (session) {
  console.log("Connected.");
  registerAuth(session);
  registerChat(session);
}

connection.onopen = entrypoint;
console.log("Connecting...");
connection.open();
