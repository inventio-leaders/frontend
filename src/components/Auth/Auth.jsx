import React, { useState } from "react";
import styles from "./Auth.module.scss";
import { setSession } from "../../utils/session";
import { useLoginMutation } from "../../api/authApi";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading, error }] = useLoginMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await login({ username: email, password }).unwrap();
      setSession({ accessToken: res.access_token, tokenType: res.token_type });
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
          type="password"
          placeholder="••••••••"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      <button className={styles.primaryBtn} type="submit" disabled={isLoading}>
        {isLoading ? "Входим..." : "Войти"}
      </button>

      {error && (
        <div className={styles.error}>
          Ошибка входа. Проверьте email/пароль.
        </div>
      )}
    </form>
  );
}
