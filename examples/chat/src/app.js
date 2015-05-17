import React from 'react';
import Router from 'react-router';
import Autobahn from '../../../modules/index.js';

import {Nav, Navbar} from 'react-bootstrap';
import {NavItemLink} from 'react-router-bootstrap';

const {Route, DefaultRoute, RouteHandler, Link} = Router;

class Message extends React.Component {
  render() {
    return (
        <p className="message">{this.props.msg}</p>
      );
  }
}

class TextArea extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      messages: []
    };
  }

  render() {
    var messages = this.props.messages ? this.props.messages.map(function (messageObject) {
      return (<Message key={messageObject.details.publication} msg={messageObject.args[0]} />);
    }) : null;
    return (
        <div className="textarea">
          {messages}
        </div>
      );
  }
}

class SendMessageBar extends React.Component {
  constructor(props) {
    super(props);

    this.onPressedKey = this.onPressedKey.bind(this);
  }

  onPressedKey(e) {
    if (e.charCode == 13) { // Enter key
      e.preventDefault();
      var node = React.findDOMNode(this.refs.msg_input);
      this.props.onSent(node.value);
      node.value = "";
    }
  }

  render() {
    return (
        <input ref="msg_input" onKeyPress={this.onPressedKey} type="text" />
      );
  }
}

const ChatRoom = Autobahn.Decorators.requireSubscriptions(class extends React.Component {

  static observeSubscriptions() {
    return {
      messages: {route: 'com.example.chat.events.new_message', store: true}
    };
  }

  componentDidMount() {
    this.onMessageSent = this.onMessageSent.bind(this);
  }

  onMessageSent(message) {
    Autobahn.publish('com.example.chat.user.new_message', [message], {}, { acknowledge: true, disclose_me: true })
    .then(publication => {
      /** Optimistic update? **/
    })
    .catch(error => {
      /** Signal error to user? **/
    });
  }

  render() {
    return (
        <div className="chatroom">
          <TextArea messages={this.props.data.messages} />
          <SendMessageBar onSent={this.onMessageSent} />
        </div>
      );
  }
}, {
  willTransitionTo(transition) {
    if (!Autobahn.isConnectionReady()) {
      transition.redirect('/index');
    }
  }
});

class Home extends React.Component {
  render() {
    return (<h1>Hello ! </h1>);
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      connectionWorking: false,
      connectionReason: null
    };
  }

  componentWillMount() {
    Autobahn.Connection.onUnreachable((details) => {
      this.setState({connectionWorking: false, connectionReason: "Oh it seems, the server is dead!"});
    });
    Autobahn.Connection.onLost((details) => {
      this.setState({connectionWorking: false, connectionReason: "Oh, connection lost :/ !"});
    });
    Autobahn.Connection.onReady((details) => {
      this.setState({connectionWorking: true});
    });
    Autobahn.browserInitialize(8000, "ws", "example");
  }

  render() {
    var route = this.state.connectionWorking ? (<RouteHandler />) : (<h1 className="error">{this.state.connectionReason}</h1>); 
    return (
        <div className="application container-fluid">
          <Navbar brand='Example chat'>
            <Nav>
              <NavItemLink to="home">Home</NavItemLink>
              <NavItemLink to="chatroom">Main chat room</NavItemLink>
            </Nav>
          </Navbar>
          {route}
        </div>
      );
  }
}

var Routes = (
    <Route handler={App} path="/">
      <DefaultRoute handler={Home} />
      <route name="home" path="/index" handler={Home} />
      <Route name="chatroom" path="/chat" handler={ChatRoom} />
    </Route>
  );

Router.run(Routes, function (Handler) {
  React.render(<Handler />, document.getElementById('example'));
});
