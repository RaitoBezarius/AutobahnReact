function registerChat(session) {
  var messages = {};

  function broadcast_user_message(sender_id, message) {
    session.publish('com.example.chat.events.new_message', ["User (id: " + sender_id + "): " + message]);
  }

  function send_system_message(message) {
    session.publish('com.example.chat.events.new_message', ["System: " + message]);
  }

  function on_new_message(args, kwargs, details) {
    if (!details.publisher) {
      console.log("Someone tried to hide his publisher ID. Dropping his message.");
      return;
    }

    var user_id = details.publisher;
    var message = args[0];

    if (!(user_id in messages)) {
      console.log("A new chatter has joined the system.");
      send_system_message("A new chatter (id: " + user_id + ") has joined the system.");
      messages[user_id] = [];
    }

    messages[user_id].push(message);
    console.log("User (id: " + user_id + ") said \"" + message + "\".");
    broadcast_user_message(user_id, message);
  }
  
  console.log("Registering chat component...");
  session.subscribe('com.example.chat.user.new_message', on_new_message, { disclose_me: true })
  .then(() => {
    console.log("Chat component registered!");
  })
  .catch(() => {
    console.log("Failed to register chat component!");
  });
}

module.exports = registerChat;
