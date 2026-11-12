import React from "react";
import WorkerAccounts from "../components/WorkerAccounts.jsx";
import BookingHistory from "../components/BookingHistory.jsx";
import { pesos, clock } from "../utils/format.js";
export default function AdminPage({
  config,
  rows,
  adminKey,
  busy,
  run,
  refreshAdmin,
  setAdminKey,
  setRows,
  go,
  update,
}) {
  const adminBooking = (b) => (
    <article className="admin-booking" key={b.id}>
      <div className="booking-heading">
        <h3>
          #{b.id} · {b.name}
        </h3>
        <span className={"status " + b.status}>{b.status}</span>
      </div>
      <p>
        {b.date} · {clock(b.time)} · {b.room} · {pesos(b.price)} · {b.service}
        {b.addons?.length > 0 &&
          " + " + b.addons.map((a) => a.name).join(", ")}{" "}
        · {b.paymentMethod || "cash"}
      </p>
      <p className="muted">
        Contact: {b.contact}
        {b.notes && " · Notes: " + b.notes}
      </p>
      {b.cleaner && <p>Cleaner: {b.cleaner}</p>}
      {["confirmed", "completed"].includes(b.status) && (
        <fieldset>
          <legend>Worker progress</legend>
          {config.checklist.map((c, i) => (
            <div className="checklist-task" key={c}>
              <label className="check">
                <input
                  type="checkbox"
                  disabled
                  checked={(b.completedChecklist || []).includes(c)}
                />
                {c}
              </label>
              {b.taskProofs?.[i]?.image && (
                <figure className="proof-photo">
                  <img src={b.taskProofs[i].image} alt={"Worker proof: " + c} />
                  <figcaption>Task proof photo</figcaption>
                </figure>
              )}
            </div>
          ))}
          <p>
            {(b.completedChecklist || []).length} / {config.checklist.length}{" "}
            tasks completed
          </p>
        </fieldset>
      )}
      {b.proofImage && (
        <figure className="proof-photo">
          <img
            src={b.proofImage}
            alt="Cleaning completion proof uploaded by the worker"
          />
          <figcaption>Worker proof photo</figcaption>
        </figure>
      )}
      <div className="actions">
        {["pending", "confirmed"].includes(b.status) && (
          <button
            className="secondary"
            disabled={busy}
            onClick={() => update(b, "cancelled")}
          >
            Cancel
          </button>
        )}
      </div>
      {b.feedback && (
        <div className="callout">
          Customer feedback: {b.feedback.rating}/5 ·{" "}
          {b.feedback.comment || "No comment"}
        </div>
      )}
    </article>
  );
  return (
    <section className="card">
      <div className="eyebrow">PILOT OPERATIONS</div>
      <h1 className="small-title">Booking desk</h1>
      <WorkerAccounts adminKey={adminKey} />
      <div className="actions">
        <button
          className="secondary"
          disabled={busy}
          onClick={() => run(() => refreshAdmin(adminKey))}
        >
          Refresh bookings
        </button>
        <button
          className="secondary"
          onClick={() => {
            setAdminKey("");
            setRows([]);
            go("admin-login");
          }}
        >
          Sign out
        </button>
      </div>
      <div className="stats">
        {["pending", "confirmed", "completed", "cancelled"].map((s) => (
          <div key={s}>
            <strong>{rows.filter((b) => b.status === s).length}</strong>
            <small>{s}</small>
          </div>
        ))}
      </div>
      <h2>Active bookings</h2>
      {rows.some((b) => ["pending", "confirmed"].includes(b.status)) ? (
        rows
          .filter((b) => ["pending", "confirmed"].includes(b.status))
          .map((b) => adminBooking(b))
      ) : (
        <p className="muted">No active bookings.</p>
      )}
      <BookingHistory
        bookings={rows.filter((b) =>
          ["completed", "cancelled"].includes(b.status),
        )}
        renderBooking={adminBooking}
      />
    </section>
  );
}
