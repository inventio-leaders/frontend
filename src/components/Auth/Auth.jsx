import React from "react";
import styles from "./Auth.module.scss";

export default function Auth({ onSwitch }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: login action
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.label}>
        <span className={styles.caption}>E-mail</span>
        <input className={styles.input} type="email" placeholder="you@example.com" required />
      </label>

      <label className={styles.label}>
        <span className={styles.caption}>Пароль</span>
        <input className={styles.input} type="password" placeholder="••••••••" required />
      </label>

      <button className={styles.primaryBtn} type="submit">Войти</button>
    </form>
  );
}
