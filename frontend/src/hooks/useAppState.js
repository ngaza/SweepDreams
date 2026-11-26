import { useState, useEffect } from "react";
import { api } from "../api/client.js";
import {
  ROUTES,
  PROTECTED_ROUTES,
  INITIAL_BOOKING_FORM,
  ADMIN_POLL_INTERVAL_MS,
} from "../const.js";

function readRoute() {
  const id = location.hash.slice(1);
  return ROUTES.includes(id) ? id : "home";
}

export function useAppState() {
  const [tab, setTab] = useState(readRoute),
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
    [form, setForm] = useState(() => ({ ...INITIAL_BOOKING_FORM, addons: [] }));
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
      setTab(readRoute());
      setError("");
    };
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  // Login is required to book or view bookings.
  useEffect(() => {
    if (authChecked && !user && PROTECTED_ROUTES.includes(tab)) {
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
    const timer = setInterval(poll, ADMIN_POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [tab, adminKey]);

  const logoutAdmin = () => {
    setAdminKey("");
    setRows([]);
    go("admin-login");
  };

  const logout = () =>
    run(async () => {
      await api("/auth/logout", { method: "POST" });
      setUser(null);
      setAccountBookings([]);
      setBooking(null);
      go("home");
    });

  const retryConfig = () => run(async () => setConfig(await api("/config")));

  const loginAdmin = (key) =>
    run(async () => {
      await refreshAdmin(key);
      setAdminKey(key);
      go("admin");
    });

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    setForm({
      ...form,
      name: authenticatedUser.name,
      contact: authenticatedUser.email,
    });
    setBooking(null);
    let next = "track";
    try {
      next = sessionStorage.getItem("after-login") || "track";
      sessionStorage.removeItem("after-login");
    } catch {}
    go(
      authenticatedUser.role === "cleaner"
        ? "cleaner"
        : next === "cleaner"
          ? "track"
          : next,
    );
  };

  const chooseService = (id) => {
    setForm({ ...form, serviceId: id, addons: [] });
    go("detail");
  };

  return {
    tab,
    setTab,
    config,
    error,
    setError,
    busy,
    message,
    setMessage,
    authRole,
    setAuthRole,
    user,
    authChecked,
    accountBookings,
    setAccountBookings,
    availability,
    search,
    setSearch,
    category,
    setCategory,
    step,
    setStep,
    form,
    setForm,
    booking,
    setBooking,
    adminKey,
    setAdminKey,
    rows,
    setRows,
    rating,
    setRating,
    comment,
    setComment,
    run,
    change,
    svc,
    total,
    toggleAddon,
    load,
    refreshAdmin,
    update,
    go,
    logoutAdmin,
    logout,
    retryConfig,
    loginAdmin,
    handleAuthSuccess,
    chooseService,
  };
}
