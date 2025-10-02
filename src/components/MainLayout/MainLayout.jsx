import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import styles from "./MainLayout.module.scss";

export default function MainLayout({ onLogout }) {
  return (
    <div className={styles.shell}>
      <Sidebar onLogout={onLogout} />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
