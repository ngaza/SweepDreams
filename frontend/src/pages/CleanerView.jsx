import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { clock, pesos } from "../utils/format.js";

export default function CleanerView() {
  const [jobs, setJobs] = useState([]);
  const [acceptedJobs, setAcceptedJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  async function loadJobs() {
    try {
      const [available, accepted] = await Promise.all([
        api("/cleaner/bookings"),
        api("/cleaner/bookings/accepted"),
      ]);
      setJobs(available);
      setAcceptedJobs(accepted);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(() => { loadJobs(); }, []);
  const visibleJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? jobs.filter((job) => job.room.toLowerCase().includes(query)) : jobs;
  }, [jobs, search]);

  async function accept(id) {
    setBusyId(id);
    setError("");
    try {
      await api(`/cleaner/bookings/${id}/accept`, { method: "POST" });
      await loadJobs();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  }

  const JobCard = ({ job, accepted }) => <article className="card cleaner-job">
    <h3>{job.service}</h3>
    <p><strong>Address</strong><br />{job.room}</p>
    <p><strong>Schedule</strong><br />{job.date} · {clock(job.time)}</p>
    <p><strong>Price</strong><br />{pesos(job.price)}</p>
    {accepted ? <span className="status confirmed">Accepted by you</span> : <button className="primary" disabled={busyId === job.id} onClick={() => accept(job.id)}>{busyId === job.id ? "Accepting…" : "Accept job"}</button>}
  </article>;

  return <section className="cleaner-view"><div className="section-top"><div><div className="eyebrow">WORKER PORTAL</div><h1>Cleaning jobs</h1></div><button className="secondary" onClick={loadJobs}>Refresh</button></div>
    {error && <p className="notice error" role="alert">{error}</p>}
    <label className="search-field">Search by address<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Dorm, room, or street" /></label>
    <h2>Available requests</h2><div className="job-list">{visibleJobs.length ? visibleJobs.map((job) => <JobCard key={job.id} job={job} />) : <p className="muted">No available cleaning requests match your search.</p>}</div>
    <h2>My accepted jobs</h2><div className="job-list">{acceptedJobs.length ? acceptedJobs.map((job) => <JobCard key={job.id} job={job} accepted />) : <p className="muted">You have not accepted any jobs yet.</p>}</div>
  </section>;
}
