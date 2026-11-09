import React from "react";
import { pesos } from "../utils/format.js";

export default function ServiceView({ config, serviceId, onBack, onBookNow }) {
  const service = config.services.find((item) => item.id === serviceId) ?? config.services[0];
  const price = service.sized ? config.prices.small : service.price;
  const inclusions = service.included ?? config.checklist;

  return (
    <section className="detail-screen">
      <button className="back-button" onClick={onBack} aria-label="Back to services">←</button>
      <div className="detail-copy">
        <h1>{service.name}</h1>
        <p className="detail-subtitle">{service.description ?? service.desc}</p>
        <div className="service-price">
          {pesos(price)} <span>{service.sized ? "from · " : ""}{service.duration ?? service.hours}</span>
        </div>
        <h2>What’s included</h2>
        <ul className="included">
          {inclusions.map((item) => <li key={item}><span aria-hidden="true">✓</span>{item}</li>)}
        </ul>
        {service.sized && <div className="callout"><strong>Room-size pricing</strong><p>Small dorm up to 15 m²: {pesos(config.prices.small)}.<br />Standard dorm 16–25 m²: {pesos(config.prices.standard)}.</p></div>}
        <button className="primary wide" onClick={onBookNow}>Book Now</button>
      </div>
    </section>
  );
}
