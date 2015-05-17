import React from 'react';
import Router from 'react-router';
import Autobahn from '../../../modules/index.js';

const {Route, DefaultRoute, RouteHandler} = Router;

class Login extends React.Component { 
  constructor(props) {
    super(props);

    this.onLogin = this.onLogin.bind(this);
    this.state = {
      error: false
    };
  }

  onLogin(e) {
    e.preventDefault();

    var { router } = this.context;

    Autobahn.Auth.logIn({
      username: React.findDOMNode(this.refs.username).value,
      password: React.findDOMNode(this.refs.password).value,
    }).then(() => {
      router.replaceWith('/dashboard');
    }).catch(() => {
      this.setState({error: true});
    });
  }

  render() {
    return (
        <form onSubmit={this.onLogin}>
          <label><p>Username: </p><input ref="username" /></label> <br />
          <label><p>Password: </p><input ref="password" type="password" /></label> <br />
          <button type="submit">Login</button>
          {this.state.error && (<p>Bad login information</p>)}
        </form>
      );
  }
}

Login.contextTypes = {
  router: React.PropTypes.func
};

class Register extends React.Component {
  constructor(props) {
    super(props);
    this.onRegister = this.onRegister.bind(this);
    this.state = {
      error: false
    };
  }

  onRegister(e) {
    e.preventDefault();

    var { router } = this.context;

    Autobahn.Auth.signUp({
      username: React.findDOMNode(this.refs.username).value,
      password: React.findDOMNode(this.refs.password).value,
      mail: React.findDOMNode(this.refs.mail).value,
    }).then(() => {
      router.replaceWith('/login');
    }).catch(() => {
      this.setState({error: true});
    });
  }

  render() {
    return (
        <form onSubmit={this.onRegister}>
          <label>Username: <input ref="username" /></label> <br />
          <label>Email: <input ref="mail" type="email" /></label> <br />
          <label>Password: <input ref="password" type="password" /></label> <br />
          <button type="submit">Register</button>
        </form>
      );
  }
}

Register.contextTypes = {
  router: React.PropTypes.func
};

const requireAuth = (Component) => {
  return class Authenticated extends React.Component {
    static willTransitionTo(transition) {
      if (!Autobahn.Auth.isLogged()) {
        transition.redirect('/login', {}, {'nextPath': transition.path});
      }
    }

    render() {
      return (<Component {...this.props} />);
    }
  }
};

const Dashboard = requireAuth(class extends React.Component {
  render() {
    var sessionId = Autobahn.Auth.currentUser.id;

    return (
        <p>Success! {sessionId}</p>
        );
  }
});

class App extends React.Component {
  componentDidMount() {
    Autobahn.browserInitialize(8000, "ws", "example");
  }

  render() {
    return (
        <RouteHandler />
      );
  }
}

var Routes = (
    <Route handler={App} path="/">
      <DefaultRoute handler={Register} />
      <Route name="register" handler={Register} />
      <Route name="login" handler={Login} />
      <Route name="dashboard" handler={Dashboard} />
    </Route>
  );

Router.run(Routes, function (Handler) {
  React.render(<Handler />, document.getElementById('example'));
});
