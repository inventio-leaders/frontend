import React, { useState } from "react";
import styles from "./Register.module.scss";
import { setSession } from "../../utils/session";
import { useLoginMutation, useRegisterMutation } from "../../api/authApi";

export default function Register() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [registerUser, { isLoading, error }] = useRegisterMutation();
  const [login] = useLoginMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== password2) {
      alert("Пароли не совпадают");
      return;
    }

    try {
      await registerUser({ email, password, username, role_id: 1 }).unwrap();

      const resLogin = await login({ username: email, password }).unwrap();
      setSession({ accessToken: resLogin.access_token, tokenType: resLogin.token_type });
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.label}>
        <input
          className={styles.input}
          type="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <label className={styles.label}>
        <input
          className={styles.input}
          type="text"
          placeholder="Имя пользователя"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </label>

      <label className={styles.label}>
        <input
          className={styles.input}
          type="password"
          placeholder="Минимум 8 символов"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      <label className={styles.label}>
        <input
          className={styles.input}
          type="password"
          placeholder="Повторите пароль"
          required
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
        />
      </label>

      <button className={styles.primaryBtn} type="submit" disabled={isLoading}>
        {isLoading ? "Регистрируем..." : "Регистрация"}
      </button>

      {error && (
        <div className={styles.error}>
          Не удалось зарегистрироваться. Возможно, email уже занят.
        </div>
      )}
    </form>
  );
}
