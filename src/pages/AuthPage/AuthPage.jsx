import React, { useState } from "react";
import styles from "./AuthPage.module.scss";
import Auth from "../../components/Auth/Auth";
import Register from "../../components/Register/Register";

export default function AuthPage() {
  const [tab, setTab] = useState("login");

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "login" ? styles.active : ""}`}
            onClick={() => setTab("login")}
            type="button"
          >
            ВХОД
          </button>
          <button
            className={`${styles.tab} ${tab === "register" ? styles.active : ""}`}
            onClick={() => setTab("register")}
            type="button"
          >
            РЕГИСТРАЦИЯ
          </button>
        </div>

        {tab === "login" ? (
          <Auth onSwitch={() => setTab("register")} />
        ) : (
          <Register onSwitch={() => setTab("login")} />
        )}
      </div>
    </div>
  );
}
