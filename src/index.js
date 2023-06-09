import { StrictMode } from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "@google/model-viewer";
import "./themeSwitcher";
import "./slides";


ReactDOM.render(
  <StrictMode>
    {/* Add the Canvas component as the background */}

    <App />
  </StrictMode>,
  document.getElementById("root")
);
