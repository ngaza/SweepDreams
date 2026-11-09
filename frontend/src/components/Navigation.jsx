import React from "react";

export default function Navigation({ tab, go, user, logout }) {
  const isWorker = user?.role === "cleaner";
  const items = isWorker ? [["cleaner", "Cleaning jobs"]] : [["home", "Home"], ["book", "Book a clean"], ["track", "My bookings"]];
  return <header><a className="brand" href="#home" onClick={(event) => { event.preventDefault(); go(isWorker ? "cleaner" : "home"); }}><span aria-hidden="true">🧹</span><span>Sweep Dreams<small>We clean. You relax.</small></span></a>
    <nav aria-label="Main navigation">{items.map(([id, label]) => <a key={id} href={`#${id}`} aria-current={tab === id ? "page" : undefined} className={tab === id ? "nav active" : "nav"} onClick={(event) => { event.preventDefault(); go(id); }}>{label}</a>)}</nav>
    <div className="account-nav">{user ? <><span>{user.name}</span><button className="secondary" onClick={logout}>Log out</button></> : <><button className="secondary" onClick={() => go("login", "customer")}>Customer login</button><button className="primary" onClick={() => go("login", "cleaner")}>Worker login</button></>}</div>
  </header>;
}
