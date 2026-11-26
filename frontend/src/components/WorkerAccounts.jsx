import React, { useState, useEffect } from "react";
import { api } from "../api/client.js";

export default function WorkerAccounts({ adminKey }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" }),
    [show, setShow] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [workers, setWorkers] = useState([]),
    [loading, setLoading] = useState(true),
    [listError, setListError] = useState("");
  const refresh = async () => {
    setLoading(true);
    setListError("");
    try {
      setWorkers(
        await api("/admin/workers", {
          headers: { Authorization: "Bearer " + adminKey },
        }),
      );
    } catch (e) {
      setListError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    let active = true;
    setLoading(true);
    setListError("");
    api("/admin/workers", { headers: { Authorization: "Bearer " + adminKey } })
      .then((data) => {
        if (active) setWorkers(data);
      })
      .catch((e) => {
        if (active) setListError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [adminKey]);
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  return (
    <section
      className="worker-accounts"
      aria-labelledby="worker-accounts-title"
    >
      <h2 id="worker-accounts-title">Create worker account</h2>
      <p className="muted">
        Provide the worker's name, email address, and password. Share the login
        details directly with the worker.
      </p>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          setError("");
          setMessage("");
          try {
            const data = await api("/admin/workers", {
              method: "POST",
              headers: { Authorization: "Bearer " + adminKey },
              body: JSON.stringify(form),
            });
            setMessage(
              "Worker account created for " +
                data.user.email +
                ". The worker can now log in.",
            );
            setForm({ name: "", email: "", password: "" });
            setShow(false);
            await refresh();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="field-grid">
          <label>
            Full name
            <input
              name="name"
              autoComplete="off"
              required
              minLength={2}
              maxLength={100}
              value={form.name}
              onChange={change}
            />
          </label>
          <label>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="off"
              required
              maxLength={254}
              value={form.email}
              onChange={change}
            />
          </label>
        </div>
        <label>
          Password
          <input
            name="password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            value={form.password}
            onChange={change}
          />
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={show}
            onChange={(e) => setShow(e.target.checked)}
          />
          Show password
        </label>
        <p className="fine">Use 8–128 characters.</p>
        <button className="primary" disabled={busy}>
          {busy ? "Creating account…" : "Create worker account"}
        </button>
      </form>
      <section className="worker-directory" aria-labelledby="worker-list-title">
        <div className="section-top">
          <h2 id="worker-list-title">
            Workers{!loading && !listError ? " (" + workers.length + ")" : ""}
          </h2>
          <button
            type="button"
            className="secondary"
            disabled={loading || busy}
            onClick={refresh}
          >
            Refresh list
          </button>
        </div>
        {listError ? (
          <p className="notice error" role="alert">
            {listError}
          </p>
        ) : loading ? (
          <p role="status">Loading workers…</p>
        ) : workers.length ? (
          <ul className="worker-list">
            {workers.map((worker) => (
              <li key={worker.id}>
                <strong>{worker.name}</strong>
                <span>{worker.email}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">
            No worker accounts yet. Create an account above to add your first
            worker.
          </p>
        )}
      </section>
    </section>
  );
}
