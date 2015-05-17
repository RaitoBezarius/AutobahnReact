function registerAuth(session)
{
  var tokens = {};
  var users = {};
  var users_id = {};

  function signup (args) {
    var payload = args[0];

    payload.id = 1;
    users[payload.username] = payload;
    console.log("A new user (username: " + payload.username + ") has been created.");
  }

  function create_token (args, kwargs, details) {
    console.log("Caller id: " + details.caller + " is issuing a token.");
    if (!details.caller) {
      throw new Error("Caller id is not provided.");
    }

    var token = Math.floor(Math.random() * 99999);
    tokens[users_id[details.caller]] = token;

    return token;
  }

  function standard_authenticate (args) {
    var realm = args[0];
    var authid = args[1];
    var details = args[2];

    if (!(authid in users)) {
      console.log('User (id: ' + authid + ' is not found, stopping authentication.');
      throw new Error("User not found!"); /** Better error ? **/
    }
    
    try
    {
      users[authid].session_id = details.session;
      users_id[details.session] = authid;

      var result = {};

      result.role = "user";
      result.secret = users[authid].password;
      result.authid = users[authid].id.toString();
    }
    catch (ex) {
      console.log(ex);
    }

    console.log(result);

    return result;
  }

  function token_authenticate (args) {
    var realm = args[0];
    var authid = args[1];
    var ticket = args[2];

    if (!(authid in users)) {
      console.log("User not found");
      throw new Error("Not found");
    }
    
    var result = {};
    result.role = "user";
    result.ticket = tokens[authid].toString();
    result.authid = users[authid].id.toString();

    return result;
  }

  function authorize_actions(args) {
    var session = args[0];
    var uri = args[1];
    var action = args[2];
    
    return Authorizations.to(uri).authorize(action, session);
  }
  
  console.log("Registering auth components...");
  session.register('com.auth.signup', signup)
  .then(() => {
    console.log("Auth signup component registered.");
    return session.register('com.auth.create_token', create_token, {disclose_me: true});
  })
  .then(() => {
    console.log("Auth token creation component registered.");
    return session.register('com.auth.standard_authenticate', standard_authenticate);
  })
  .then(() => {
    console.log("Auth standard authentication component registered.");
    return session.register('com.auth.token_authenticate', token_authenticate);
  })
  .then(() => {
    console.log("Auth token authentication component registered.");
  })
  .catch(() => {
    console.log("One or more auth components have failed to be registered! The system may not work correctly!");
  });
}

module.exports = registerAuth;
