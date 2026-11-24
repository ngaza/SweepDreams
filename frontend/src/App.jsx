import WelcomePage from "./pages/WelcomePage.jsx";
import BookingPage from "./pages/BookingPage.jsx";
import TrackingPage from "./pages/TrackingPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import CleanerView from "./pages/CleanerView.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AuthView from "./pages/AuthView.jsx";
import ServiceView from "./pages/ServiceView.jsx";
import HomeView from "./pages/HomeView.jsx";
import React, { useState, useEffect } from "react";
import "./styles/style.css";
import "./styles/mobile.css";
import Navigation from "./components/Navigation.jsx";
import { api } from "./api/client.js";
import "./styles/responsive.css";
import "./styles/quality.css";

const route = () => {
  const id = location.hash.slice(1);
  return [
    "start",
    "home",
    "detail",
    "book",
    "track",
    "admin",
    "admin-login",
    "login",
    "signup",
    "cleaner",
  ].includes(id)
    ? id
    : "home";
};
const PROTECTED = ["book", "track", "cleaner"];
export default function App() {
  const [tab, setTab] = useState(route),
    [config, setConfig] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [authRole, setAuthRole] = useState("customer");
  const [user, setUser] = useState(null),
    [authChecked, setAuthChecked] = useState(false),
    [accountBookings, setAccountBookings] = useState([]);
  useEffect(() => {
    api("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);
  const [availability, setAvailability] = useState(null);
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState("All");
  const [step, setStep] = useState(1),
    [form, setForm] = useState({
      serviceId: "basic",
      addons: [],
      paymentMethod: "cash",
      size: "small",
      date: "",
      time: "09:00",
      name: "",
      contact: "",
      room: "",
      notes: "",
    });
  const [booking, setBooking] = useState(null);
  const [adminKey, setAdminKey] = useState(""),
    [rows, setRows] = useState([]),
    [rating, setRating] = useState(5),
    [comment, setComment] = useState("");
  useEffect(() => {
    api("/config")
      .then(setConfig)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab, step]);
  const run = async (fn) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const svc = config?.services.find((s) => s.id === form.serviceId);
  const total = svc
    ? (svc.sized ? config.prices[form.size] : svc.price) +
      form.addons.reduce(
        (n, id) => n + (config.addons.find((a) => a.id === id)?.price || 0),
        0,
      )
    : 0;
  const toggleAddon = (id) =>
    setForm({
      ...form,
      addons: form.addons.includes(id)
        ? form.addons.filter((x) => x !== id)
        : [...form.addons, id],
    });
  const load = (id) =>
    run(async () => {
      setBooking(null);
      setBooking(await api("/bookings/" + id));
    });
  const refreshAdmin = async (k) =>
    setRows(
      await api("/admin/bookings", {
        headers: { Authorization: "Bearer " + k },
      }),
    );
  const update = (b, status) =>
    run(async () => {
      await api("/admin/bookings/" + b.id, {
        method: "PATCH",
        headers: { Authorization: "Bearer " + adminKey },
        body: JSON.stringify({ status }),
      });
      await refreshAdmin(adminKey);
      setMessage("Booking updated.");
    });
  const go = (id, role) => {
    if (role) setAuthRole(role);
    if (!["admin", "admin-login"].includes(id)) {
      setAdminKey("");
      setRows([]);
    }
    location.hash = id;
    setTab(id);
    setError("");
    setMessage("");
    window.scrollTo(0, 0);
  };
  useEffect(() => {
    if (tab === "admin" && !adminKey) {
      location.hash = "admin-login";
      setTab("admin-login");
    }
    if (!["admin", "admin-login"].includes(tab)) {
      setAdminKey("");
      setRows([]);
    }
  }, [tab, adminKey]);
  useEffect(() => {
    const sync = () => {
      if (location.hash === "#main-content") return;
      setTab(route());
      setError("");
    };
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  // Login is required to book or view bookings.
  useEffect(() => {
    if (authChecked && !user && PROTECTED.includes(tab)) {
      try {
        sessionStorage.setItem("after-login", tab);
      } catch {}
      location.hash = "login";
      setTab("login");
      setMessage("Please log in or sign up to book a clean.");
    }
  }, [authChecked, user, tab]);
  useEffect(() => {
    if (authChecked && user) {
      if (user.role === "cleaner" && ["book", "track"].includes(tab))
        go("cleaner");
      else if (user.role !== "cleaner" && tab === "cleaner") go("track");
    }
  }, [authChecked, user, tab]);
  useEffect(() => {
    if (tab === "track" && user)
      api("/account/bookings")
        .then(setAccountBookings)
        .catch((e) => setError(e.message));
  }, [tab, user]);
  useEffect(() => {
    if (!form.date) {
      setAvailability(null);
      return;
    }
    let current = true;
    setAvailability(null);
    api("/availability?date=" + form.date)
      .then((data) => {
        if (current) setAvailability(data);
      })
      .catch((e) => {
        if (current) setError(e.message);
      });
    return () => {
      current = false;
    };
  }, [form.date, tab]);

  useEffect(() => {
    if (tab !== "admin" || !adminKey) return;
    let active = true;
    const poll = async () => {
      try {
        const data = await api("/admin/bookings", {
          headers: { Authorization: "Bearer " + adminKey },
        });
        if (active) setRows(data);
      } catch (e) {
        if (active) setError(e.message);
      }
    };
    const timer = setInterval(poll, 2000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [tab, adminKey]);

  const loadingScreen = (
    <section className="loading-state" role="status">
      <p>Loading…</p>
    </section>
  );

  return (
    <div className={"app-shell screen-" + tab}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Navigation
        tab={tab}
        authRole={authRole}
        go={go}
        adminKey={adminKey}
        adminLogout={() => {
          setAdminKey("");
          setRows([]);
          go("admin-login");
        }}
        user={user}
        logout={() =>
          run(async () => {
            await api("/auth/logout", { method: "POST" });
            setUser(null);
            setAccountBookings([]);
            setBooking(null);
            go("home");
          })
        }
      />
      <main id="main-content" tabIndex={-1}>
        {error && (
          <div className="notice error" role="alert">
            {error}
          </div>
        )}
        {message && (
          <div className="notice" role="status">
            {message}
          </div>
        )}
        {!config ? (
          <section className="loading-state" role="status">
            <h1>Getting your space ready…</h1>
            <p>Loading Sweep Dreams</p>
            <button
              className="secondary"
              onClick={() => run(async () => setConfig(await api("/config")))}
            >
              Try again
            </button>
          </section>
        ) : tab === "admin-login" || (tab === "admin" && !adminKey) ? (
          <AdminLogin
            busy={busy}
            go={go}
            onLogin={(k) =>
              run(async () => {
                await refreshAdmin(k);
                setAdminKey(k);
                go("admin");
              })
            }
          />
        ) : ["login", "signup"].includes(tab) ? (
          <AuthView
            key={tab}
            mode={tab}
            initialRole={authRole}
            onRoleChange={setAuthRole}
            go={go}
            onSuccess={(u) => {
              setUser(u);
              setForm({ ...form, name: u.name, contact: u.email });
              setBooking(null);
              let next = "track";
              try {
                next = sessionStorage.getItem("after-login") || "track";
                sessionStorage.removeItem("after-login");
              } catch {}
              go(
                u.role === "cleaner"
                  ? "cleaner"
                  : next === "cleaner"
                    ? "track"
                    : next,
              );
            }}
          />
        ) : tab === "cleaner" ? (
          authChecked && user?.role === "cleaner" ? (
            <CleanerView config={config} />
          ) : (
            loadingScreen
          )
        ) : tab === "start" ? (
          <WelcomePage go={go} />
        ) : tab === "home" ? (
          <HomeView
            config={config}
            choose={(id) => {
              setForm({ ...form, serviceId: id, addons: [] });
              go("detail");
            }}
            booking={booking}
            search={search}
            setSearch={setSearch}
            category={category}
            setCategory={setCategory}
            go={go}
          />
        ) : tab === "detail" ? (
          <ServiceView
            config={config}
            serviceId={form.serviceId}
            go={go}
            setStep={setStep}
          />
        ) : tab === "book" ? (
          !authChecked || !user || !svc ? (
            loadingScreen
          ) : (
            <BookingPage
              config={config}
              svc={svc}
              form={form}
              setForm={setForm}
              total={total}
              step={step}
              setStep={setStep}
              change={change}
              toggleAddon={toggleAddon}
              availability={availability}
              setError={setError}
              run={run}
              setBooking={setBooking}
              setTab={setTab}
              setMessage={setMessage}
              busy={busy}
            />
          )
        ) : tab === "track" ? (
          !authChecked || !user ? (
            loadingScreen
          ) : (
            <TrackingPage
              accountBookings={accountBookings}
              booking={booking}
              busy={busy}
              load={load}
              run={run}
              setBooking={setBooking}
              setAccountBookings={setAccountBookings}
              rating={rating}
              setRating={setRating}
              comment={comment}
              setComment={setComment}
              setMessage={setMessage}
            />
          )
        ) : (
          <AdminPage
            config={config}
            rows={rows}
            adminKey={adminKey}
            busy={busy}
            run={run}
            refreshAdmin={refreshAdmin}
            setAdminKey={setAdminKey}
            setRows={setRows}
            go={go}
            update={update}
          />
        )}
      </main>
      <footer>
        <span>Sweep Dreams · We clean. You relax.</span>
      </footer>
    </div>
  );
}
