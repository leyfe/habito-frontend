// src/App.jsx
import React, { useContext } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AppProvider } from "./context/AppContext";
import { AuthContext } from "./context/AuthContext";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import StatsPage from "./pages/StatsPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <LoginPage />;
  }

  return (
    <AppProvider>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>

      <Toaster position="bottom-center" />

    </AppProvider>
  );
}