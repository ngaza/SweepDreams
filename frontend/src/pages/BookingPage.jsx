import React from "react";
import Calendar from "../components/Calendar.jsx";
import { api } from "../api/client.js";
import { pesos, clock } from "../utils/format.js";
export default function BookingPage({
  config,
  svc,
  form,
  setForm,
  total,
  step,
  setStep,
  change,
  toggleAddon,
  availability,
  setError,
  run,
  setBooking,
  setTab,
  setMessage,
  busy,
}) {
  return (
    <>
      <div className="hero">
        <div>
          <div className="eyebrow">MORE TIME FOR WHAT MATTERS</div>
          <h1>
            Busy schedule.
            <br />
            <span>Fresh start.</span>
          </h1>
          <p>Classes, practice, deadlines. Leave the dorm cleaning to us.</p>
          <div className="hero-foot">
            <span>
              {pesos(svc.sized ? config.prices[form.size] : svc.price)}
            </span>
            <span>{svc.name}</span>
            <span>Cash or GCash</span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="spark s1">✧</div>
          <div className="room">
            <div className="window"></div>
            <div className="desk"></div>
            <div className="plant">❋</div>
            <div className="rug"></div>
            <div className="bed"></div>
          </div>
          <div className="spark s2">✦</div>
          <div className="art-label">We clean. You relax.</div>
        </div>
      </div>
      <div className="columns">
        <section className="card">
          <div className="section-top">
            <div>
              <div className="eyebrow">YOUR NEXT CLEAN</div>
              <h2>Book in three simple steps</h2>
            </div>
            <span className="pill">{step} / 3</span>
          </div>
          <div className="steps">
            {["Choose your space", "Pick a schedule", "Review & request"].map(
              (s, i) => (
                <div className={step === i + 1 ? "current" : ""} key={s}>
                  <span>{i + 1}</span>
                  {s}
                </div>
              ),
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (step < 3) {
                if (
                  step === 2 &&
                  (!form.date || !availability?.slots.includes(form.time))
                ) {
                  setError(
                    "Choose a date and an available time for your clean.",
                  );
                  return;
                }
                setStep(step + 1);
                return;
              }
              run(async () => {
                const b = await api("/bookings", {
                  method: "POST",
                  body: JSON.stringify(form),
                });
                setBooking(b);
                location.hash = "track";
                setTab("track");
                setStep(1);
                setMessage(
                  "Request saved. Your schedule is waiting for a cleaner to accept.",
                );
              });
            }}
          >
            {step === 1 ? (
              <>
                <h3>{svc.name}</h3>
                <p className="muted">
                  {svc.sized
                    ? "Basic room cleaning, approximately 1 hour. Choose the size of your room."
                    : svc.desc}
                </p>
                {svc.sized && (
                  <div className="size-options">
                    {[
                      ["small", "Small dorm", "Up to 15 m²"],
                      ["standard", "Standard dorm", "16–25 m²"],
                    ].map(([id, label, description]) => (
                      <label
                        className={
                          "option " + (form.size === id ? "selected" : "")
                        }
                        key={id}
                      >
                        <input
                          type="radio"
                          name="size"
                          value={id}
                          checked={form.size === id}
                          onChange={change}
                        />
                        <div>
                          <strong>{label}</strong>
                          <small>{description}</small>
                        </div>
                        <b>{pesos(config.prices[id])}</b>
                      </label>
                    ))}
                  </div>
                )}
                <h3>Customize your clean</h3>
                <div className="size-options">
                  {config.addons.map((a) => (
                    <label
                      className={
                        "option " +
                        (form.addons.includes(a.id) ? "selected" : "")
                      }
                      key={a.id}
                    >
                      <input
                        type="checkbox"
                        checked={form.addons.includes(a.id)}
                        onChange={() => toggleAddon(a.id)}
                      />
                      <div>
                        <strong>{a.name}</strong>
                        <small>Optional add-on</small>
                      </div>
                      <b>+{pesos(a.price)}</b>
                    </label>
                  ))}
                </div>
                <p className="fine">
                  Total so far: <strong>{pesos(total)}</strong>. The final price
                  is calculated again by the server.
                </p>
              </>
            ) : step === 2 ? (
              <>
                <h3>When should we visit?</h3>
                <p className="muted">
                  One campus-area dorm pilot. A cleaner can review your location
                  and accept your request.
                </p>
                <div className="field-grid">
                  <Calendar
                    today={config.today}
                    value={form.date}
                    onChange={(date) => setForm({ ...form, date })}
                  />
                  <label>
                    Preferred time (Philippines)
                    <select name="time" value={form.time} onChange={change}>
                      {config.slots.map((s) => (
                        <option
                          key={s}
                          value={s}
                          disabled={!availability?.slots.includes(s)}
                        >
                          {clock(s)}
                          {availability && !availability.slots.includes(s)
                            ? " · Unavailable"
                            : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="availability-note" role="status">
                    {!form.date
                      ? "Choose a date to check times."
                      : !availability
                        ? "Checking availability…"
                        : availability.slots.length
                          ? "Available for requests; a cleaner accepts your visit."
                          : "No times available. Choose another day."}
                  </p>
                  <label>
                    Your name
                    <input
                      required
                      minLength={2}
                      maxLength={100}
                      name="name"
                      value={form.name}
                      onChange={change}
                      placeholder="e.g. Dwight Ramos"
                    />
                  </label>
                  <label>
                    Phone or email
                    <input
                      required
                      minLength={2}
                      maxLength={100}
                      name="contact"
                      value={form.contact}
                      onChange={change}
                      placeholder="How can our team reach you?"
                    />
                  </label>
                </div>
                <label>
                  Address (dorm and room number, or home address)
                  <input
                    required
                    minLength={2}
                    maxLength={100}
                    name="room"
                    value={form.room}
                    onChange={change}
                    placeholder="e.g. Dorm A, Room 204 or 12 Rizal St, Naga City"
                  />
                </label>
                <label>
                  Instructions (optional)
                  <textarea
                    name="notes"
                    maxLength={500}
                    value={form.notes}
                    onChange={change}
                    placeholder="Access instructions or areas to avoid"
                  />
                </label>
              </>
            ) : (
              <>
                <h3>Review your clean</h3>
                <h3>Payment method</h3>
                <div className="size-options">
                  {config.paymentMethods.map((p) => (
                    <label
                      className={
                        "option " +
                        (form.paymentMethod === p.id ? "selected" : "")
                      }
                      key={p.id}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={p.id}
                        checked={form.paymentMethod === p.id}
                        onChange={change}
                      />
                      <div>
                        <strong>{p.name}</strong>
                        <small>{p.note}</small>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="summary">
                  <div>
                    <small>SERVICE</small>
                    <strong>{svc.name}</strong>
                  </div>
                  {svc.sized && (
                    <div>
                      <small>SPACE</small>
                      <strong>
                        {form.size === "small" ? "Small" : "Standard"} dorm
                      </strong>
                    </div>
                  )}
                  {form.addons.length > 0 && (
                    <div>
                      <small>ADD-ONS</small>
                      <strong>
                        {form.addons
                          .map(
                            (id) =>
                              config.addons.find((a) => a.id === id)?.name,
                          )
                          .join(", ")}
                      </strong>
                    </div>
                  )}
                  <div>
                    <small>SCHEDULE REQUEST</small>
                    <strong>
                      {form.date} · {clock(form.time)}
                    </strong>
                  </div>
                  <div>
                    <small>LOCATION</small>
                    <strong>{form.room}</strong>
                  </div>
                  <div>
                    <small>CUSTOMER</small>
                    <strong>
                      {form.name} · {form.contact}
                    </strong>
                  </div>
                  <div>
                    <small>TOTAL</small>
                    <strong>{pesos(total)}</strong>
                  </div>
                </div>
                <p className="fine">
                  Submitting sends a request. A cleaner reviews your location
                  and accepts your booking before it is confirmed. GCash
                  payments are arranged with our team after your booking is
                  confirmed.
                </p>
              </>
            )}
            <div className="actions">
              {step > 1 && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </button>
              )}
              <button
                disabled={
                  busy ||
                  (step === 2 && !availability?.slots.includes(form.time))
                }
                className="primary"
              >
                {busy
                  ? "Saving…"
                  : step === 3
                    ? "Request my clean →"
                    : "Continue →"}
              </button>
            </div>
          </form>
        </section>
        <aside className="card side">
          <div className="eyebrow">THE BASICS, DONE WELL</div>
          <h2>What’s included</h2>
          <ul className="included">
            {(svc.included || config.checklist).map((c) => (
              <li key={c}>
                <span>✓</span>
                {c}
              </li>
            ))}
          </ul>
          <div className="callout">
            <strong>A little clarity, upfront.</strong>
            <p>
              Prices are calculated by our server, so the total you see is the
              total you pay.
            </p>
          </div>
          <div className="trust">
            <h3></h3>
            <p></p>
          </div>
        </aside>
      </div>
    </>
  );
}
