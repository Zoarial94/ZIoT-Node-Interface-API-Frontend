import React, { Component, useState } from 'react';
import "./ActionList.css"
import "./common.css"
import { withFetching, withEither, withMaybe, failedFetchCond, loadingCond, branch, withPosting } from "../HOCs"
import { compose, withProps, withState } from "recompose"
import OutsideClickHandler from 'react-outside-click-handler';
import { KeyValueDisplay } from "./CommonComponents";


const withFetchingAction = (uuid) => (Component) =>
  class WithFetchingAction extends React.Component {

    render() {
      const RenderedFetching = withFetching("http://localhost:8080/api/action/" + uuid)(Component);
      return <RenderedFetching {...this.props} />;
    }
  }

class ActionList extends Component {
  constructor(props) {
    super(props);
    var actions = [];

    // Create individual action components
    props.data.actions.forEach(action => {
      const renderActionInfo = compose(
        withFetchingAction(action.uuid),
        fetchingWithConditionalRenderings
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


const fetchingWithConditionalRenderings = compose(
  withEither(loadingCond, LoadingIndictor),
  withEither(failedFetchCond, FailedFetchIndicator),
)

/*
 *  Name Value Display
*/
const emptyValueCond = (props) => !props.value || !props.value.trim().length;
const NameValueDisplay = (props) => {
  return <p>{props.name}: {props.value}</p>;
}
const enhanceNameValueDisplay = compose(
  branch(emptyValueCond, withProps({ value: "No provided value" }))
)
const EnhancedNameValueDisplay = enhanceNameValueDisplay(NameValueDisplay);


/*
 *  ZIoTResponse
*/
const ActionResponse = (props) => {
  return <p>{props.data}</p>
}
const withFetchingRunAction = (Component) => (props) => {
  const RenderedFetching = withPosting(props.postUrl)(Component);
  return <RenderedFetching {...props} />;
}
const withFetchDataAsString = (Component) => (props) => {
  const {data, passThoughProps} = props;
  var output;
  if(typeof data === "object") {
    output = JSON.stringify(data);
  } else {
    output = data;
  }

  return <Component data={output} {...passThoughProps}/>
}
const noUrlCondition = (props) => !props.postUrl
const enhanceZioTResponse = compose(
  withMaybe(noUrlCondition),
  withFetchingRunAction,
  fetchingWithConditionalRenderings,
  withFetchDataAsString
)
const EnhancedZIoTResponse = enhanceZioTResponse(ActionResponse)

class Action extends Component {
  constructor(props) {
    super(props);

    this.state = { optionsOpen: false, renderInfo: false };
    this.handleClick = this.handleClick.bind(this);
    this.outsideClickHandler = this.outsideClickHandler.bind(this);
    this.toggleActionInfo = this.toggleActionInfo.bind(this);

  }

  toggleActionInfo(e) {
    e.stopPropagation();
    this.setState({ renderInfo: !this.state.renderInfo });
  }

  outsideClickHandler() {
    if (this.state.optionsOpen) {
      this.setState({ optionsOpen: false, postUrl:null})
    }
  }

  handleClick() {
    if (!this.state.optionsOpen) {
      this.setState({ optionsOpen: true });
    }
  }

  render() {
    const action = this.props.data;
    const renderOptions = this.state.optionsOpen;
    const renderInfo = this.state.renderInfo;
    const getRunFields = () => {
      let content = [];
      if (renderOptions) {
        for (var i = 0; i < action.arguments; i++) {
          const id = `arg${i}`;
          content.push(<input type="text" key={action.name + id} id={id} name={id}></input>)
        }
      }
      return content;
    }
    const runAction = (e) => {
      e.preventDefault();
      const formParams = new URLSearchParams(new FormData(e.target).entries()).toString();
      this.setState({postUrl:"http://localhost:8080/api/action/" + action.uuid + "/run?" + formParams})
    }

    return (

      <OutsideClickHandler onOutsideClick={this.outsideClickHandler} >
        <div key={action.uuid} className="Action Object" onClick={this.handleClick} >
          <h3>{action.name}</h3>
          <h3>{action.uuid}</h3>
          <div className="ObjectInfoList">
            <h3>Action Info</h3>
            <button onClick={this.toggleActionInfo}>Toggle Info</button>
            {renderInfo && <div>
              <p>Node UUID: {action.nodeUuid}</p>
              <p>Security Level: {action.securityLevel}</p>
              <p>Arguments: {action.arguments}</p>
              <p>Local: {action.local.toString()}</p>
              <p>Encryped: {action.encrypted.toString()}</p>
              <EnhancedNameValueDisplay name="Description" value={action.description} />
            </div>
            }
          </div>
          {renderOptions &&
            <div className="ObjectActions" >
              <h3>Here are {action.name}'s actions</h3>
              <form onSubmit={runAction}>
                {getRunFields()}
                <input type="submit" value="Run" />
              </form>
              <EnhancedZIoTResponse postUrl={this.state.postUrl}/>
            </div>
          }
        </div>
      </OutsideClickHandler>
    );
  }
}

export default ActionList