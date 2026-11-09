import React from "react";
import Calendar from "../components/Calendar.jsx";
import { clock, pesos } from "../utils/format.js";

export default function BookingPage({ config, form, onChange, onSubmit, onBack }) {
  const service = config.services.find((item) => item.id === form.serviceId) ?? config.services[0];
  const availableSlots = config.availableSlots?.[form.date] ?? config.slots;
  const sizePrice = service.sized ? config.prices[form.size] : service.price;
  const addOns = config.addons.filter((item) => form.addons.includes(item.id));
  const total = sizePrice + addOns.reduce((sum, item) => sum + item.price, 0);
  const update = (field, value) => onChange({ ...form, [field]: value });
  const toggleAddOn = (id) => update("addons", form.addons.includes(id)
    ? form.addons.filter((item) => item !== id)
    : [...form.addons, id]);

  return (
    <form className="booking-page" onSubmit={(event) => { event.preventDefault(); onSubmit({ ...form, total }); }}>
      <h1>Book a clean</h1>
      <label>Cleaning service<select value={service.id} onChange={(event) => update("serviceId", event.target.value)}>{config.services.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      {service.sized && <fieldset><legend>Room size</legend>{[["small", "Small dorm", "Up to 15 m²"], ["standard", "Standard dorm", "16–25 m²"]].map(([id, label, detail]) => <label className="option" key={id}><input type="radio" name="size" value={id} checked={form.size === id} onChange={(event) => update("size", event.target.value)} /><span><strong>{label}</strong><small>{detail}</small></span><b>{pesos(config.prices[id])}</b></label>)}</fieldset>}
      <fieldset><legend>Optional add-ons</legend>{config.addons.map((item) => <label className="option" key={item.id}><input type="checkbox" checked={form.addons.includes(item.id)} onChange={() => toggleAddOn(item.id)} /><span><strong>{item.name}</strong><small>Optional add-on</small></span><b>+{pesos(item.price)}</b></label>)}</fieldset>
      <h2>Preferred schedule</h2>
      <Calendar today={config.today} value={form.date} onChange={(date) => update("date", date)} />
      <label>Preferred time<select required value={form.time} onChange={(event) => update("time", event.target.value)}><option value="">Choose a time</option>{config.slots.map((slot) => <option key={slot} value={slot} disabled={!availableSlots.includes(slot)}>{clock(slot)}{!availableSlots.includes(slot) ? " · Unavailable" : ""}</option>)}</select></label>
      <h2>Your details</h2>
      <label>Name<input required minLength="2" maxLength="100" value={form.name} onChange={(event) => update("name", event.target.value)} /></label>
      <label>Phone or email<input required minLength="2" maxLength="100" value={form.contact} onChange={(event) => update("contact", event.target.value)} /></label>
      <label>Address and room number<input required minLength="2" maxLength="100" value={form.address} onChange={(event) => update("address", event.target.value)} /></label>
      <label>Instructions <span className="muted">(optional)</span><textarea maxLength="500" value={form.instructions} onChange={(event) => update("instructions", event.target.value)} /></label>
      <p className="fine">Total: <strong>{pesos(total)}</strong></p>
      <div className="actions"><button type="button" className="secondary" onClick={onBack}>Back</button><button className="primary">Continue</button></div>
    </form>
  );
}
