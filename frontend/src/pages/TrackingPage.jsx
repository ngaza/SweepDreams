import React from "react";
import { api } from "../api/client.js";
import { pesos, clock } from "../utils/format.js";
export default function TrackingPage({
  accountBookings,
  booking,
  busy,
  load,
  run,
  setBooking,
  setAccountBookings,
  rating,
  setRating,
  comment,
  setComment,
  setMessage,
}) {
  return (
    <section className="card track">
      <div className="eyebrow">YOUR CLEAN, AT A GLANCE</div>
      <h1 className="small-title">My booking</h1>
      <section className="account-bookings">
        <h2>Your saved bookings</h2>
        {accountBookings.length ? (
          accountBookings.map((b) => (
            <button
              className="account-booking secondary"
              key={b.id}
              disabled={busy}
              onClick={() => load(b.id)}
            >
              <strong>
                {b.date} · {clock(b.time)}
              </strong>
              <span>
                {b.room} · {pesos(b.price)} · {b.status}
              </span>
            </button>
          ))
        ) : (
          <p className="muted">
            No bookings yet. Your next booking will appear here.
          </p>
        )}
      </section>
      {booking && (
        <>
          <div className="confirmation-mark" aria-hidden="true">
            {booking.status === "completed"
              ? "✓"
              : booking.status === "confirmed"
                ? "✓"
                : booking.status === "cancelled"
                  ? "×"
                  : "◷"}
          </div>
          <h2 className="confirmation-title">
            {booking.status === "confirmed"
              ? "Booking confirmed"
              : booking.status === "completed"
                ? "Your room, refreshed"
                : booking.status === "cancelled"
                  ? "Booking cancelled"
                  : "Request received"}
          </h2>
          <div className="booking-heading">
            <h2>Booking #{booking.id}</h2>
            <span className={"status " + booking.status}>{booking.status}</span>
          </div>
          <div className="summary">
            <div>
              <small>SCHEDULE</small>
              <strong>
                {booking.date} · {clock(booking.time)} (PH)
              </strong>
            </div>
            <div>
              <small>ADDRESS</small>
              <strong>{booking.room}</strong>
            </div>
            <div>
              <small>SERVICE / PRICE</small>
              <strong>
                {booking.service} · {pesos(booking.price)}
              </strong>
            </div>
            {booking.addons?.length > 0 && (
              <div>
                <small>ADD-ONS</small>
                <strong>{booking.addons.map((a) => a.name).join(", ")}</strong>
              </div>
            )}
            <div>
              <small>PAYMENT</small>
              <strong>
                {{ cash: "Cash on service", gcash: "GCash", card: "Card" }[
                  booking.paymentMethod
                ] || "Cash on service"}
              </strong>
            </div>
            <div>
              <small>ASSIGNED CLEANER</small>
              <strong>
                {booking.cleaner || "Waiting for a cleaner to accept"}
              </strong>
            </div>
          </div>
          <div className="booking-timeline" aria-label="Booking progress">
            {[
              ["pending", "Request received"],
              ["confirmed", "Confirmed & cleaner assigned"],
              ["completed", "Cleaning completed"],
            ].map(([state, label], i) => {
              const index = ["pending", "confirmed", "completed"].indexOf(
                booking.status,
              );
              return (
                <div key={state} className={index >= i ? "reached" : ""}>
                  <span aria-hidden="true">{index >= i ? "✓" : "○"}</span>
                  <div>
                    <strong>{label}</strong>
                    {state === booking.status && <small>Current status</small>}
                  </div>
                </div>
              );
            })}
          </div>
          {booking.cleaner && (
            <div className="cleaner-card">
              <span aria-hidden="true">♙</span>
              <div>
                <strong>{booking.cleaner}</strong>
                <small>Your assigned cleaner</small>
              </div>
            </div>
          )}
          <p className="muted">
            {booking.status === "pending"
              ? "Your request is saved. A cleaner can review your address and accept your request."
              : booking.status === "confirmed"
                ? "Your cleaner and requested schedule have been confirmed."
                : booking.status === "completed"
                  ? "Cleaning marked complete. Tell us how it went."
                  : "This booking is cancelled."}
          </p>
          <div className="actions">
            <button
              className="secondary"
              disabled={busy}
              onClick={() => load(booking.id)}
            >
              Refresh status
            </button>
            {["pending", "confirmed"].includes(booking.status) && (
              <button
                className="secondary"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    setBooking(
                      await api("/bookings/" + booking.id + "/cancel", {
                        method: "POST",
                      }),
                    );
                    setAccountBookings(await api("/account/bookings"));
                  })
                }
              >
                Cancel booking
              </button>
            )}
          </div>
          {booking.status === "completed" &&
            (booking.feedback ? (
              <div className="callout">
                Thank you! Your {booking.feedback.rating}/5 feedback has been
                saved.
              </div>
            ) : (
              <form
                className="feedback"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(async () => {
                    setBooking(
                      await api("/bookings/" + booking.id + "/feedback", {
                        method: "POST",
                        body: JSON.stringify({ rating, comment }),
                      }),
                    );
                    setMessage("Thank you for helping us improve.");
                  });
                }}
              >
                <h3>How was your experience?</h3>
                <div
                  className="star-rating"
                  role="group"
                  aria-label="Choose a rating"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      aria-label={n + " star" + (n > 1 ? "s" : "")}
                      aria-pressed={rating === n}
                      onClick={() => setRating(n)}
                    >
                      {n <= rating ? "★" : "☆"}
                    </button>
                  ))}
                </div>
                <label className="rating-select">
                  Rating
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} / 5
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Your feedback
                  <textarea
                    maxLength={500}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </label>
                <button className="primary" disabled={busy}>
                  Submit feedback
                </button>
              </form>
            ))}
        </>
      )}
    </section>
  );
}
