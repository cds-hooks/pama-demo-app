import React, { useState, useEffect } from "react";
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
      resolve(true);
    });
  }
});


const submitOrder = () => {
  targetWindow.postMessage(
    {
      messageId: uuid.v4(),
      messageType: "scratchpad.update",
      payload: {
        resource: fixtureProposal
      }
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

function App() {
  let [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    onAuthorized.then(a => setAuthorized(true));
  });

  return (
    <div className="App">
      Looks like you're trying to place a PAMA order. Let me recommend my
      favorite...
      {(targetWindow && targetOrigin && authorized && (
        <>
          <div>
            <button onClick={submitOrder}>Update order</button>
          </div>
          <pre>{JSON.stringify(fixtureProposal, null, 2)}</pre>
        </>
      )) || " (once things are ready)."}
    </div>
  );
}

export default App;
