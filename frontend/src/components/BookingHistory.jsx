import React, { useState } from "react";

import { clock, pesos } from "../utils/format.js";
function HistoryItem({ booking: b, renderBooking }) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className="history-item"
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>
        <span className="history-summary">
          <strong>{b.service}</strong>
          <span>
            {b.date} · {clock(b.time)} · {pesos(b.price)}
          </span>
          <span>{b.room}</span>
          <small>
            #{b.id}
            {b.cleaner ? " · " + b.cleaner : ""}
          </small>
        </span>
        <span className={"status " + b.status}>{b.status}</span>
        <span className="history-hint">
          {open ? "Hide details" : "View details"}
        </span>
      </summary>
      {open && renderBooking(b)}
    </details>
  );
}
export default function BookingHistory({ bookings, renderBooking }) {
  const [open, setOpen] = useState(false);
  const sorted = [...bookings].sort((a, b) =>
    (b.completedAt || b.createdAt || "").localeCompare(
      a.completedAt || a.createdAt || "",
    ),
  );
  return (
    <details
      className="booking-history"
      onToggle={(e) => {
        if (e.target === e.currentTarget) setOpen(e.currentTarget.open);
      }}
    >
      <summary>
        Booking history <span className="pill">{bookings.length}</span>
      </summary>
      {open &&
        (sorted.length ? (
          sorted.map((b) => (
            <HistoryItem key={b.id} booking={b} renderBooking={renderBooking} />
          ))
        ) : (
          <p className="muted">
            Completed and cancelled bookings will appear here.
          </p>
        ))}
    </details>
  );
}
