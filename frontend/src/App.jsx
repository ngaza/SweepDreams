import WelcomePage from "./pages/WelcomePage.jsx";
import BookingPage from "./pages/BookingPage.jsx";
import TrackingPage from "./pages/TrackingPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import CleanerView from "./pages/CleanerView.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AuthView from "./pages/AuthView.jsx";
import ServiceView from "./pages/ServiceView.jsx";
import HomeView from "./pages/HomeView.jsx";
import React from "react";
import "./styles/style.css";
import "./styles/mobile.css";
import Navigation from "./components/Navigation.jsx";
import { useAppState } from "./hooks/useAppState.js";
import "./styles/responsive.css";
import "./styles/quality.css";

function LoadingScreen() {
  return (
    <section className="loading-state" role="status">
      <p>Loading…</p>
    </section>
  );
}

export default function App() {
  const {
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
  } = useAppState();

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
        adminLogout={logoutAdmin}
        user={user}
        logout={logout}
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
            <button className="secondary" onClick={retryConfig}>
              Try again
            </button>
          </section>
        ) : tab === "admin-login" || (tab === "admin" && !adminKey) ? (
          <AdminLogin busy={busy} go={go} onLogin={loginAdmin} />
        ) : ["login", "signup"].includes(tab) ? (
          <AuthView
            key={tab}
            mode={tab}
            initialRole={authRole}
            onRoleChange={setAuthRole}
            go={go}
            onSuccess={handleAuthSuccess}
          />
        ) : tab === "cleaner" ? (
          authChecked && user?.role === "cleaner" ? (
            <CleanerView config={config} />
          ) : (
            <LoadingScreen />
          )
        ) : tab === "start" ? (
          <WelcomePage go={go} />
        ) : tab === "home" ? (
          <HomeView
            config={config}
            choose={chooseService}
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
            <LoadingScreen />
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
            <LoadingScreen />
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
