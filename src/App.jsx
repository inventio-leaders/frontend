import React from "react";
import "./App.scss";
import AuthPage from "./pages/AuthPage/AuthPage";
import { isAuthenticated, clearSession } from "./utils/session";

function Dashboard() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Вы залогинены ✅</h1>
      <button
        onClick={() => {
          clearSession();
          window.location.reload();
        }}
      >
        Выйти
      </button>
    </div>
  );
}

function App() {
  const authed = isAuthenticated();
  return authed ? <Dashboard /> : <AuthPage />;
}

export default App;
