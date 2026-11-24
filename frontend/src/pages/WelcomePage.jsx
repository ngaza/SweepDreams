import React from "react";

export default function WelcomePage({ go }) {
  return (
    <section className="welcome-screen">
      <div className="welcome-brand">
        <div className="broom-logo" aria-hidden="true">
          🧹<span>✧</span>
          <i>✦</i>
        </div>
        <h1>Sweep Dreams</h1>
        <p>Sleep easy. We'll handle the mess.</p>
      </div>
      <div className="welcome-action">
        <h2>
          A clean room.
          <br />
          On your schedule.
        </h2>
        <p className="welcome-description">
          Book a cleaning in a few simple steps. More time for classes,
          practice, and everything in between.
        </p>
        <button className="primary" onClick={() => go("home")}>
          Get Started
        </button>
        <p>We clean. You relax.</p>
      </div>
    </section>
  );
}
