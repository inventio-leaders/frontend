import React from "react";
import "./App.scss";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { isAuthenticated, clearSession } from "./utils/session";

import AuthPage from "./pages/AuthPage/AuthPage";
import Dashboard from "./pages/Dashboard/Dashboard";
import Analytics from "./pages/Analytics/Analytics";
import MainLayout from "./components/MainLayout/MainLayout";
import Training from "./pages/Training/Training";

function App() {
  const authed = isAuthenticated();

  return (
    <BrowserRouter>
      {authed ? (
        <Routes>
          <Route
            element={
              <MainLayout
                onLogout={() => {
                  clearSession();
                  window.location.reload();
                }}
              />
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/training" element={<Training />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      ) : (
        <Routes>
          <Route index element={<AuthPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;
