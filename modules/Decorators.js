import React from 'react';
import Connection from './Connection.js';

export function requireSubscriptions (Component, staticMethods = {}) {
  var highOrderComponent = (class extends React.Component {
    constructor(props) {
      super(props);

      this.state = {
        data: {}
      };
      this.subscriptions = [];
      this.subscriptionsMeta = {};
    }

    onPublished(variable, args, kwargs, details)
    {
      this.setState((previousState, curProps) => {
        if (this.subscriptionsMeta[variable].store) {
          previousState.data[variable].push({args, kwargs, details});
        } else {
          previousState.data[variable] = {args, kwargs, details};
        }
        return previousState;
      });
    }
    
    componentDidMount() {
      var routes = Component.observeSubscriptions();
      for (var variable in routes) {
        Connection.currentConnection.session.subscribe(routes[variable].route, this.onPublished.bind(this, variable))
        .then(subscription => {
          this.subscriptions.push(subscription);

          var isStore = routes[variable].store || false;
          this.subscriptionsMeta[variable] = { store: isStore };
          this.setState((previousState, curProps) => {
            if (isStore) {
              previousState.data[variable] = [];
            } else {
              previousState.data[variable] = {};
            }
          });
        })
        .catch(error => {
          console.error("Failed to auto-subscribe to a topic: " + routes[variable] + " !", error);
        });
      }
    }

    componentDidUnmount() {
      var routes = Component.observeSubscriptions();
      this.subscriptions.foreach(subscription => {
        Connection.currentConnection.session.subscribe(subscription);
      });
    }

    render() {
      return (
          <Component data={this.state.data} {...this.props} />
        );
    }
  });

  for (var functionName in staticMethods) {
    highOrderComponent[functionName] = staticMethods[functionName];
  }

  return highOrderComponent;
}
