// src/App.jsx
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AppProvider } from "./context/AppContext";

import HomePage from "./pages/HomePage";
import StatsPage from "./pages/StatsPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <AppProvider>
      <Toaster position="bottom-center" />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AppProvider>
  );
}