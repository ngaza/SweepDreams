import React from 'react';
import {pesos} from './api.js';

export default function ServiceView({config, serviceId, go, setStep}) {
  const service = config.services.find(item => item.id === serviceId) ?? config.services[0];
  const included = service.included ?? config.checklist;
  const rating = config.serviceRatings?.[service.id];

  return (
    <section className="detail-screen">
      <button className="back-button" onClick={() => go('home')} aria-label="Back to home">←</button>
      <div className="service-illustration" aria-hidden="true">🧹<span>✧</span></div>
      <div className="detail-copy">
        <h1>{service.name}</h1>
        <p className="detail-subtitle">
          {service.id === 'basic'
            ? 'A one-time dorm room clean that includes sweeping, mopping, wiping accessible surfaces, and emptying trash.'
            : service.desc}
        </p>
        <div className="service-price">
          {pesos(service.sized ? config.prices.small : service.price)}
          <span>{service.sized ? ' from · ' : ' · '}{service.hours}</span>
        </div>
        <p className="muted">
          {rating
            ? rating.average.toFixed(1) + ' / 5 (' + rating.count + (rating.count === 1 ? ' rating)' : ' ratings)')
            : 'No customer ratings yet'}
        </p>
        <h3>What's included</h3>
        <ul className="included">
          {included.map(item => <li key={item}><span aria-hidden="true">✓</span>{item}</li>)}
        </ul>
        {service.sized && (
          <div className="callout">
            <strong>Room-size pricing</strong>
            <p>Small dorm up to 15 m²: {pesos(config.prices.small)}.<br />
              Standard dorm 16–25 m²: {pesos(config.prices.standard)}.</p>
          </div>
        )}
        <button className="primary wide" onClick={() => {setStep(1); go('book');}}>Book Now</button>
      </div>
    </section>
  );
}
