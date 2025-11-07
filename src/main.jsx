// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import App from "./App.jsx";
import "./index.css";

console.log("React loaded", React.version);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
       <BrowserRouter basename={import.meta.env.MODE === "production" ? "/habits" : "/"}>
        <AuthProvider>
            <App />
          </AuthProvider>
      </BrowserRouter>
  </React.StrictMode>
);