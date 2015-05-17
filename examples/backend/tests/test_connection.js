var autobahn = require('autobahn');

var anon = new autobahn.Connection({
  url: 'ws://127.0.0.1:8000/ws',
  realm: 'example'
});

anon.onopen = function (session) {
  session.call('com.auth.signup', [{username: 'Raito', password: 'Something'}]).then(function () {
    console.log('User signed up.');

    var authenticated = new autobahn.Connection({
      url: 'ws://127.0.0.1:8000/ws',
      realm: 'example',
      authmethods: ['wampcra'],
      authid: 'Raito',
      onchallenge: function (session, method, extra) {
        console.log('Authenticating with ' + method + ' method.');
        return autobahn.auth_cra.sign('Something', extra.challenge);
      }
    });

    authenticated.onopen = function (session_auth, details) {
      console.log("Authenticated.");
      console.log(details);
      
      session_auth.call('com.auth.create_token', [], {}, {disclose_me: true}).then(function (token) {
        console.log('Got a token: ' + token);
        
        var token_authenticated = new autobahn.Connection({
          url: 'ws://127.0.0.1:8000/ws',
          realm: 'example',
          authmethods: ['ticket'],
          authid: 'Raito',
          onchallenge: function (session, method, extra) {
            console.log('Authenticating with ' + method + ' method.');
            return token.toString();
          }
        });

        token_authenticated.onopen = function (session_token, details) {
          console.log("Authenticated with token.");
          console.log(details);
        };

        token_authenticated.open();
      }).catch(function (e) {
        console.log('Failed to get a token.', e);
      });
    };

    authenticated.open();
  }).catch(function (e) {
    console.log("Failed to signed up.");
    console.log(e);
  });
};

anon.open();
