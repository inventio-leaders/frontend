import React from "react";
import styles from "./Register.module.scss";

export default function Register({ onSwitch }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: register action
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.label}>
        <span className={styles.caption}>E-mail</span>
        <input className={styles.input} type="email" placeholder="you@example.com" required />
      </label>

      <label className={styles.label}>
        <span className={styles.caption}>Пароль</span>
        <input className={styles.input} type="password" placeholder="Минимум 8 символов" required />
      </label>

      <label className={styles.label}>
        <span className={styles.caption}>Подтвердите пароль</span>
        <input className={styles.input} type="password" placeholder="Повторите пароль" required />
      </label>

      <button className={styles.primaryBtn} type="submit">Регистрация</button>

    </form>
  );
}
