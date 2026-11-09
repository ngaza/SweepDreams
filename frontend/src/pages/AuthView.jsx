import React, { useState } from "react";
import { api } from "../api.js";

export default function AuthView({ mode, go, onSuccess, initialRole = "customer" }) {
  const isSignup = mode === "signup";
  const [role, setRole] = useState(isSignup ? "customer" : initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({ name, email, password, role }),
      });
      onSuccess(result.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return <section className="auth-layout"><div className="card auth-card">
    <h1>{isSignup ? "Create an account" : "Welcome back"}</h1>
    <p className="muted">{role === "cleaner" ? "Log in to view and accept cleaning jobs." : "Log in to manage your bookings."}</p>
    {error && <p className="notice error" role="alert">{error}</p>}
    <form onSubmit={submit}>
      {!isSignup && <fieldset className="account-type"><legend>Account type</legend><div className="role-buttons">
        {["customer", "cleaner"].map((value) => <button type="button" key={value} disabled={busy} className={role === value ? "primary" : "secondary"} aria-pressed={role === value} onClick={() => { setRole(value); setError(""); }}>{value === "cleaner" ? "Worker" : "Customer"}</button>)}
      </div></fieldset>}
      {isSignup && <label>Full name<input required minLength="2" maxLength="100" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} /></label>}
      <label>Email<input required type="email" maxLength="254" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label>Password<input required type="password" minLength={isSignup ? "8" : "1"} maxLength="128" autoComplete={isSignup ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      <button className="primary wide" disabled={busy}>{busy ? "Please wait…" : isSignup ? "Create account" : "Log in"}</button>
    </form>
    {role === "customer" && <p>{isSignup ? "Already registered?" : "New here?"} <button type="button" className="link-button" onClick={() => go(isSignup ? "login" : "signup")}>{isSignup ? "Log in" : "Sign up"}</button></p>}
    <button type="button" className="secondary wide" onClick={() => go("home")}>Back to home</button>
  </div></section>;
}
