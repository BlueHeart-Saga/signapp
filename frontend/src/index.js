import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { brandAPI } from "./services/brandAPI";
import { setPageTitle } from "./utils/pageTitle";

const root = ReactDOM.createRoot(document.getElementById("root"));

brandAPI.loadBranding().finally(() => {
  // 🔥 DEFAULT title + meta
  setPageTitle(
    "Digital Signature Platform",
    "Secure, fast, AI-powered document signing"
  );

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});



// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals

