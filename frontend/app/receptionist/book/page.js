"use client";

import { useEffect, useState } from "react";
import RoleGuard from "../../../components/RoleGuard";
import { api } from "../../../lib/api";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function BookContent() {
  const [patientQuery, setPatientQuery] = useState("");
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState([]);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/doctors").then(setDoctors);
  }, []);

  useEffect(() => {
    if (!selectedDoctor || !date) return;
    api.get(`/doctors/${selectedDoctor.id}/slots?date=${date}`).then(setSlots).catch((e) => setError(e.message));
  }, [selectedDoctor, date]);

  async function searchPatients(e) {
    e.preventDefault();
    const data = await api.get(`/admin/patients/search?q=${encodeURIComponent(patientQuery)}`);
    setPatients(data);
  }

  async function book(slot) {
    setError("");
    setMessage("");
    try {
      await api.post("/appointments", {
        patient_id: selectedPatient.id,
        doctor_id: selectedDoctor.id,
        appointment_date: date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        reason,
      });
      setMessage(`Booked ${selectedPatient.name} with Dr. ${selectedDoctor.name} at ${slot.start_time}.`);
      setSlots((s) => s.filter((x) => x.start_time !== slot.start_time));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800">Book an Appointment</h1>

      <div className="card mt-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">1. Find patient</h3>
        <form onSubmit={searchPatients} className="flex gap-2">
          <input className="input" placeholder="Search by name or email" value={patientQuery} onChange={(e) => setPatientQuery(e.target.value)} />
          <button className="btn-secondary">Search</button>
        </form>
        {patients.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1">
            {patients.map((p) => (
              <li key={p.id}>
                <button
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${selectedPatient?.id === p.id ? "bg-brand-100 text-brand-700" : "hover:bg-slate-50"}`}
                  onClick={() => setSelectedPatient(p)}
                >
                  {p.name} — {p.email}
                </button>
              </li>
            ))}
          </ul>
        )}
        {selectedPatient && <p className="mt-2 text-sm text-emerald-600">Selected: {selectedPatient.name}</p>}
      </div>

      {selectedPatient && (
        <div className="card mt-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">2. Choose doctor & date</h3>
          <select className="input" value={selectedDoctor?.id || ""} onChange={(e) => setSelectedDoctor(doctors.find((d) => d.id === Number(e.target.value)))}>
            <option value="">Select a doctor</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>Dr. {d.name} — {d.specialization}</option>
            ))}
          </select>
          <input type="date" className="input mt-3 max-w-xs" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
          <input className="input mt-3" placeholder="Reason for visit" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      )}

      {selectedPatient && selectedDoctor && (
        <div className="card mt-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">3. Pick a slot</h3>
          {error && <p className="mb-2 text-sm text-rose-600">{error}</p>}
          {message && <p className="mb-2 text-sm text-emerald-600">{message}</p>}
          {slots.length === 0 ? (
            <p className="text-sm text-slate-400">No open slots on this date.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <button key={s.start_time} className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100" onClick={() => book(s)}>
                  {s.start_time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReceptionistBookPage() {
  return (
    <RoleGuard allowedRoles={["receptionist"]}>
      <BookContent />
    </RoleGuard>
  );
}
