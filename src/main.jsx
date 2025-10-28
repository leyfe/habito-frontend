import React from "react";
import ReactDOM from "react-dom/client";
import { NextUIProvider } from "@nextui-org/react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.jsx";
import SettingsPage from "./SettingsPage.jsx";
import StatsPage from "./StatsPage.jsx";
import { ThemeProvider } from "next-themes";

import "./index.css";

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/settings", element: <SettingsPage /> },
  { path: "/stats", element: <StatsPage /> },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system">
      <NextUIProvider>
        <RouterProvider router={router} />
      </NextUIProvider>
    </ThemeProvider>
  </React.StrictMode>
);

