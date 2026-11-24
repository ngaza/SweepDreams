import BookingHistory from "../components/BookingHistory.jsx";
import { prepareProofPhoto } from "../utils/proofPhoto.js";
import React, { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { pesos, clock } from "../utils/format.js";
export default function CleanerView({ config }) {
  const [rows, setRows] = useState([]),
    [area, setArea] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const refresh = async () => setRows(await api("/cleaner/bookings"));
  const saved = (b) => {
    setRows((rows) => rows.map((row) => (row.id === b.id ? b : row)));
  };
  const progress = (b, c, checked) =>
    run(async () => {
      const items = checked
        ? [...(b.completedChecklist || []), c]
        : (b.completedChecklist || []).filter((x) => x !== c);
      saved(
        await api("/cleaner/bookings/" + b.id + "/progress", {
          method: "PATCH",
          body: JSON.stringify({ completedChecklist: items }),
        }),
      );
    });
  const upload = (b, task, file) =>
    run(async () => {
      if (!file) return;
      const image = await prepareProofPhoto(file);
      saved(
        await api("/cleaner/bookings/" + b.id + "/proof", {
          method: "POST",
          body: JSON.stringify({ image, task }),
        }),
      );
      setMessage("Task proof photo uploaded.");
    });
  const run = async (task) => {
    setBusy(true);
    setError("");
    try {
      await task();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    let active = true;
    api("/cleaner/bookings")
      .then((data) => {
        if (active) setRows(data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  const available = rows.filter(
    (b) =>
      b.status === "pending" &&
      b.room.toLowerCase().includes(area.trim().toLowerCase()),
  );
  const assigned = rows.filter((b) => b.status === "confirmed");
  const history = rows.filter((b) =>
    ["completed", "cancelled"].includes(b.status),
  );
  const act = (b, action) =>
    run(async () => {
      try {
        await api("/cleaner/bookings/" + b.id + "/" + action, {
          method: "POST",
          body: JSON.stringify({}),
        });
        setMessage(
          action === "accept"
            ? "Booking accepted successfully."
            : "Cleaning marked complete.",
        );
      } finally {
        await refresh();
      }
    });
  const card = (b, open) => (
    <article className="admin-booking" key={b.id}>
      <div className="booking-heading">
        <h3>{b.service}</h3>
        <span className={"status " + b.status}>{b.status}</span>
      </div>
      <p>
        <strong>{b.room}</strong>
      </p>
      <p>
        {b.date} · {clock(b.time)} (PH) · {pesos(b.price)}
      </p>
      {open ? (
        <button
          className="primary"
          disabled={busy}
          onClick={() => act(b, "accept")}
        >
          Accept booking
        </button>
      ) : (
        <>
          <p>
            Customer: {b.name} · {b.contact}
          </p>
          {b.notes && <p>Instructions: {b.notes}</p>}
          {b.addons?.length > 0 && (
            <p>Add-ons: {b.addons.map((a) => a.name).join(", ")}</p>
          )}
          {["confirmed", "completed"].includes(b.status) && (
            <>
              <fieldset>
                <legend>Cleaning checklist</legend>
                {config.checklist.map((c, i) => (
                  <div className="checklist-task" key={c}>
                    <label className="check">
                      <input
                        type="checkbox"
                        disabled={busy || b.status !== "confirmed"}
                        checked={(b.completedChecklist || []).includes(c)}
                        onChange={(e) => progress(b, c, e.target.checked)}
                      />
                      {c}
                    </label>
                    {b.status === "confirmed" && (
                      <label>
                        Upload proof photo for this task
                        <input
                          type="file"
                          accept="image/jpeg,image/png"
                          disabled={busy}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            upload(b, i, file);
                          }}
                        />
                      </label>
                    )}
                    {b.taskProofs?.[i]?.image && (
                      <figure className="proof-photo">
                        <img src={b.taskProofs[i].image} alt={"Proof: " + c} />
                        <figcaption>Task proof photo</figcaption>
                      </figure>
                    )}
                  </div>
                ))}
              </fieldset>
              {b.status === "confirmed" && (
                <>
                  <p className="fine">
                    JPEG or PNG, up to 15 MB before resizing. Photos are
                    optimized to 1 MB each. Every task requires a photo.
                  </p>
                  <button
                    className="primary"
                    disabled={
                      busy ||
                      config.checklist.some(
                        (c, i) =>
                          !(b.completedChecklist || []).includes(c) ||
                          !b.taskProofs?.[i]?.image,
                      )
                    }
                    onClick={() => act(b, "complete")}
                  >
                    Mark completed
                  </button>
                </>
              )}
            </>
          )}
          {b.proofImage && (
            <figure className="proof-photo">
              <img src={b.proofImage} alt="Previously uploaded booking proof" />
              <figcaption>Previous booking proof photo</figcaption>
            </figure>
          )}
        </>
      )}
    </article>
  );
  return (
    <section className="card">
      <div className="eyebrow">CLEANER WORKSPACE</div>
      <h1 className="small-title">Cleaning jobs</h1>
      <p>
        Review available cleaning requests and accept bookings that suit your
        location and schedule.
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
      <button
        className="secondary"
        disabled={busy}
        onClick={() => run(refresh)}
      >
        Refresh jobs
      </button>
      <h2>Available requests</h2>
      <label>
        Search by address
        <input
          type="search"
          maxLength={100}
          placeholder="Enter a dorm, street, or city"
          value={area}
          onChange={(e) => setArea(e.target.value)}
        />
      </label>
      {available.length ? (
        available.map((b) => card(b, true))
      ) : (
        <p className="muted">
          {area.trim()
            ? "No cleaning requests match this address."
            : "No cleaning requests are currently available."}
        </p>
      )}
      <h2>Active bookings</h2>
      {assigned.length ? (
        assigned.map((b) => card(b, false))
      ) : (
        <p className="muted">
          No active bookings. Accepted requests will appear here.
        </p>
      )}
      <BookingHistory
        bookings={history}
        renderBooking={(b) => card(b, false)}
      />
    </section>
  );
}
