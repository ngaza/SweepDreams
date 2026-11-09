import React, { useState } from "react";

const toDate = (value) => new Date(`${value}T12:00:00`);
const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export default function Calendar({ today, value, onChange }) {
  const initialDate = toDate(value || today);
  const [month, setMonth] = useState(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
  );
  const firstDay = month.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const minimum = toDate(today);
  const atMinimumMonth = month.getFullYear() === minimum.getFullYear()
    && month.getMonth() === minimum.getMonth();

  return (
    <section className="calendar" aria-label="Choose a preferred date">
      <div className="calendar-heading">
        <strong>{month.toLocaleDateString("en-PH", { month: "long", year: "numeric" })}</strong>
        <div>
          <button type="button" aria-label="Previous month" disabled={atMinimumMonth}
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button>
          <button type="button" aria-label="Next month"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button>
        </div>
      </div>
      <div className="calendar-grid">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
        {Array.from({ length: firstDay }, (_, index) => <span key={`blank-${index}`} />)}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const date = new Date(month.getFullYear(), month.getMonth(), index + 1);
          const key = dateKey(date);
          const disabled = date <= minimum;
          return <button type="button" key={key} disabled={disabled} aria-pressed={key === value}
            className={key === value ? "picked" : ""} onClick={() => onChange(key)}>{index + 1}</button>;
        })}
      </div>
    </section>
  );
}
