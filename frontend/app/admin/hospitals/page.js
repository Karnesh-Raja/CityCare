"use client";

import { useEffect, useState } from "react";
import RoleGuard from "../../../components/RoleGuard";
import { api } from "../../../lib/api";

const EMPTY = { display_name: "", city: "Chennai", address: "", latitude: "", longitude: "", phone: "", specialties: "" };

function AdminHospitalsContent() {
  const [hospitals, setHospitals] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    api.get("/admin/hospitals").then(setHospitals);
  }
  useEffect(load, []);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/admin/hospitals", {
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
      });
      setForm(EMPTY);
      load();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(h) {
    await api.put(`/admin/hospitals/${h.id}`, { is_active: !h.is_active });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Manage Hospitals</h1>
      <p className="mt-1 text-sm text-slate-500">Leave "Display name" blank to auto-generate a random, non-identifying name shown to patients on the map.</p>

      <form onSubmit={submit} className="card mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input className="input" placeholder="Display name (optional — auto-generated)" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
        <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="input sm:col-span-2" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <input className="input" placeholder="Latitude" required value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
        <input className="input" placeholder="Longitude" required value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
        <input className="input sm:col-span-2" placeholder="Specialties (comma separated)" value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} />
        {error && <p className="text-sm text-rose-600 sm:col-span-2">{error}</p>}
        <button disabled={saving} className="btn-primary sm:col-span-2">{saving ? "Adding..." : "+ Add hospital"}</button>
      </form>

      <div className="mt-6 flex flex-col gap-3">
        {hospitals.map((h) => (
          <div key={h.id} className="card flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800">{h.name} {!h.is_active && <span className="badge bg-slate-200 text-slate-500 ml-2">inactive</span>}</p>
              <p className="text-xs text-slate-500">{h.address} · {h.doctor_count} doctors · ⭐ {h.rating_avg} ({h.rating_count})</p>
            </div>
            <button onClick={() => toggleActive(h)} className="btn-secondary">
              {h.is_active ? "Deactivate" : "Activate"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminHospitalsPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminHospitalsContent />
    </RoleGuard>
  );
}
