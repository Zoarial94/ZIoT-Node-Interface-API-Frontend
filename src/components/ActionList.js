import React, { Component } from 'react';
import { componentFromStreamWithConfig } from 'recompose';
import "./ActionList.css"
import "./common.css"
import { withFetching, withEither, failedFetchCond, loadingCond } from "../HOCs"
import { compose } from "recompose"

const withFetchingAction = (uuid) => (Component) => 
  class WithFetchingAction extends React.Component {

    render() {
      const RenderedFetching = withFetching("http://localhost:8080/api/action/" + uuid)(Component); 
      return <RenderedFetching/>;
    }
  }

class ActionList extends Component {
  constructor(props) {
    super(props);
    var actions = [];

    // Create individual action components
    props.data.actions.map(action => {
      const renderActionInfo = compose(
        withFetchingAction(action.uuid),
        actionWithConditionalRenderings
      );

      actions.push([action.uuid, renderActionInfo(Action)])
    });
    this.state = { actions };
  }

  render() {
    const actions = this.state.actions;
    return (
      <div className="Actions ObjectsDisplay">
        <h2>Actions(s): {actions.length}</h2>
        <div className="ObjectList">
          {actions.map(dict => {
            const Action = dict[1]
            return < Action key={dict[0]} />;
          })}
        </div>
      </div>
    );
  }
}

const LoadingIndictor = () =>
  <div>
    <p>Loading...</p>
  </div>
const FailedFetchIndicator = () =>
  <div>
    <p>Failed to fetch component</p>
  </div>
const EmptyDescriptionIndicator = () =>
  <div>
    <p>No provided description</p>
  </div>

const emptyDescriptionCond = (props) => !props.data.description || !props.data.description.length

const actionWithConditionalRenderings = compose(
  withEither(loadingCond, LoadingIndictor),
  withEither(failedFetchCond, FailedFetchIndicator),
)

class Action extends Component {
  render() {
    const action = this.props.data;

    return (

      <div key={action.uuid} className="Action Object">
        <h3>{action.name}</h3>
        <h3>{action.uuid}</h3>
        <div className="ObjectInfoList">
          <p>Security Level: {action.securityLevel}</p>
          <p>Arguments: {action.arguments}</p>
          <p>Local: {action.local.toString()}</p>
          <p>Encryped: {action.encrypted.toString()}</p>
          <p>Description: {action.description}</p>
        </div>
      </div>
    );
  }
}

export default ActionList