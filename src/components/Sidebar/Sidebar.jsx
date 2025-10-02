import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import styles from "./Sidebar.module.scss";
import { clearSession } from "../../utils/session";
import { useGetMeQuery, useLogoutMutation } from "../../api/authApi";

export default function Sidebar() {
  const navigate = useNavigate();

  const { data: me, isLoading: meLoading } = useGetMeQuery();
  const [doLogout, { isLoading: logoutLoading }] = useLogoutMutation();

  const onLogout = async () => {
    try {
      await doLogout().unwrap();
    } catch {}
    clearSession();
    navigate("/");
    window.location.reload();
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div style={{ textAlign: "left" }}>
          <div className={styles.title}>Профиль</div>
          <div className={styles.email}>
            {meLoading ? "..." : me?.email || "you@example.com"}
          </div>
        </div>
        <button className={styles.close} onClick={onLogout} aria-label="Выйти">
          ✕
        </button>
      </div>

      <nav className={styles.nav}>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => (isActive ? styles.active : undefined)}
        >
          <span className={styles.icon}>
            <svg
              width="15"
              height="15"
              viewBox="0 0 32 33"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15.7498 32.1821C24.363 32.1821 31.4723 25.0728 31.4723 16.4749C31.4723 7.87691 24.3478 0.767639 15.7346 0.767639C7.13668 0.767639 0.0426025 7.87691 0.0426025 16.4749C0.0426025 25.0728 7.15187 32.1821 15.7498 32.1821ZM15.7498 29.0528C8.77728 29.0528 3.20228 23.4474 3.20228 16.4749C3.20228 9.50232 8.77728 3.91212 15.7346 3.91212C22.7072 3.91212 28.3126 9.50232 28.3278 16.4749C28.343 23.4474 22.7224 29.0528 15.7498 29.0528ZM2.71538 18.3889H15.7346C16.4334 18.3889 16.9651 17.8572 16.9651 17.1736V3.71022C16.9651 3.02664 16.4334 2.49496 15.7346 2.49496C15.0662 2.49496 14.5346 3.02664 14.5346 3.71022V15.9584H2.71538C2.0318 15.9584 1.50012 16.4901 1.50012 17.1736C1.50012 17.8572 2.0318 18.3889 2.71538 18.3889Z"
                fill="white"
                fill-opacity="0.8"
              />
            </svg>
          </span>{" "}
          Дашборд
        </NavLink>
        <NavLink
          to="/analytics"
          className={({ isActive }) => (isActive ? styles.active : undefined)}
        >
          <span className={styles.icon}>
            <svg
              width="15"
              height="15"
              viewBox="0 0 25 34"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.00804 33.4949C10.2503 33.4949 10.5 32.575 10.5 31.3615V16.9949V2.62839C10.5 1.41486 10.2503 0.494934 9.00804 0.494934C7.76575 0.494934 7.5 1.22717 7.5 2.4407V16.8072V31.1738C7.5 32.3873 7.76575 33.4949 9.00804 33.4949ZM22.7915 33.4949C24.0338 33.4949 24.5 32.575 24.5 31.3615V18.4949V5.62839C24.5 4.41486 24.0338 3.49493 22.7915 3.49493C21.5492 3.49493 21.5 4.41486 21.5 5.62839V18.4949V31.3615C21.5 32.575 21.5492 33.4949 22.7915 33.4949Z"
                fill="white"
                fill-opacity="0.8"
              />
              <path
                d="M2.2085 33.4949C3.45079 33.4949 3.57442 32.441 3.57442 31.2275V25.861V20.4944C3.57442 19.2809 3.45079 18.4949 2.2085 18.4949C0.96622 18.4949 0.5 19.2809 0.5 20.4944L0.5 25.861L0.5 31.2275C0.5 32.441 0.96622 33.4949 2.2085 33.4949ZM15.9919 33.4949C17.2342 33.4949 17.5 32.575 17.5 31.3615V22.2449V13.1284C17.5 11.9149 17.2342 10.9949 15.9919 10.9949C14.7497 10.9949 14.5 11.9149 14.5 13.1284V22.2449V31.3615C14.5 32.575 14.7497 33.4949 15.9919 33.4949Z"
                fill="white"
                fill-opacity="0.8"
              />
            </svg>
          </span>{" "}
          Аналитика
        </NavLink>
        <NavLink
          to="/milestones"
          className={({ isActive }) => (isActive ? styles.active : undefined)}
        >
          <span className={styles.icon}>
            <svg
              width="15"
              height="15"
              viewBox="0 0 32 30"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13.3661 3.15765C14.4165 1.28433 17.1125 1.28433 18.163 3.15765L29.8348 23.978C30.8625 25.8111 29.5379 28.0727 27.4364 28.0727H4.09265C1.99113 28.0727 0.666559 25.8111 1.69421 23.978L13.3661 3.15765Z"
                stroke="white"
                stroke-opacity="0.8"
                stroke-width="2.5"
                stroke-linecap="round"
              />
            </svg>
          </span>{" "}
          Вехи отклонений
        </NavLink>
      </nav>
    </aside>
  );
}
