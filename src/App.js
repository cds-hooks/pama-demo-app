import React, { useEffect, useRef, useState } from "react";
import uuid from "uuid";

import FHIR from "fhirclient";

import "./App.css";
import fixtureProposal from "./fixture-proposal.json";
import queryString from "query-string";

const query = queryString.parse(window.location.search);
const targetWindow = [window.parent, window.opener].filter(w => w !== window.self)[0]
let targetOrigin;

const onAuthorized = new Promise((resolve, reject) => {
  if (query.iss) {
    FHIR.oauth2.authorize({
      client_id: "my_web_app",
      scope: "patient/*.read"
    });
  } else if (query.state) {
    FHIR.oauth2.ready().then(client => {
      targetOrigin = client.state.tokenResponse.smart_messaging_origin;
      resolve(client.state.tokenResponse.appContext);
    });
  }
});


const submitOrder = (doctoredProposal) => {
  const proposal = JSON.parse(doctoredProposal.value);
  targetWindow.postMessage(
    {
      messageId: uuid.v4(),
      messageType: "scratchpad.update",
      payload: { resource: proposal },
    },
    targetOrigin
  );

  targetWindow.postMessage(
    {
      messageId: uuid.v4(),
      messageType: "ui.done"
    },
    targetOrigin
  );
};

function extractServiceRequestId(serviceRequest) {
  return serviceRequest.split('/')[1];
}

function App() {
  let [authorized, setAuthorized] = useState(false);
  let [requestContext, setRequestContext] = useState({selections: []});

  useEffect(() => {
    onAuthorized.then(appContext => {
      setAuthorized(true);
      setRequestContext(JSON.parse(appContext));
    });
  }, []);

  let proposal = {};
  let doctoredProposal = useRef();
  const ready = targetWindow && targetOrigin && authorized && requestContext.selections.length;
  if (ready) {
    const id = extractServiceRequestId(requestContext.selections[0]);
    proposal = Object.assign(fixtureProposal, { id });
  }

  return (
    <div className="App">
      Looks like you're trying to place a PAMA order.  Here is an example for you to edit...
      {(ready && (
        <>
          <div>
            <button onClick={(e) => submitOrder(doctoredProposal.current)}>Update order</button>
          </div>
          <textarea ref={doctoredProposal}>{JSON.stringify(proposal, null, 2)}</textarea>
        </>
      )) || " (once things are ready)."}
    </div>
  );
}

export default App;
