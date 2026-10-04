"use client";

import { useEffect, useState } from "react";
import RoleGuard from "../../../components/RoleGuard";
import { api } from "../../../lib/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function AvailabilityContent() {
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({ day_of_week: 0, start_time: "09:00", end_time: "13:00", slot_duration_minutes: 30 });
  const [error, setError] = useState("");

  function load() {
    api.get("/doctors/me/availability").then(setSlots);
  }

  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/doctors/me/availability", form);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    await api.del(`/doctors/me/availability/${id}`);
    load();
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold text-slate-800">My Weekly Availability</h1>
      <p className="mt-1 text-sm text-slate-500">
        Patients can only book slots inside the windows you define here.
      </p>

      <form onSubmit={handleAdd} className="card mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-slate-500">Day</label>
          <select className="input" value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: Number(e.target.value) })}>
            {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Start</label>
          <input type="time" className="input" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">End</label>
          <input type="time" className="input" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Slot length (min)</label>
          <input type="number" className="input w-24" value={form.slot_duration_minutes} onChange={(e) => setForm({ ...form, slot_duration_minutes: Number(e.target.value) })} />
        </div>
        <button className="btn-primary">Add window</button>
      </form>
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}

      <div className="mt-5 flex flex-col gap-2">
        {slots.map((s) => (
          <div key={s.id} className="card flex items-center justify-between">
            <p className="text-sm text-slate-700">{DAYS[s.day_of_week]}: {s.start_time}–{s.end_time} ({s.slot_duration_minutes} min slots)</p>
            <button className="text-sm text-rose-500 hover:underline" onClick={() => handleDelete(s.id)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AvailabilityPage() {
  return (
    <RoleGuard allowedRoles={["doctor"]}>
      <AvailabilityContent />
    </RoleGuard>
  );
}
