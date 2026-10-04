"use client";

import { useEffect, useState } from "react";
import RoleGuard from "../../../components/RoleGuard";
import { api } from "../../../lib/api";

function AdminAmbulanceContent() {
  const [hospitals, setHospitals] = useState([]);
  const [hospitalId, setHospitalId] = useState("");
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", vehicle_number: "", latitude: "", longitude: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/admin/hospitals").then((hs) => {
      setHospitals(hs);
      if (hs.length) setHospitalId(String(hs[0].id));
    });
  }, []);

  function loadDrivers(id) {
    if (!id) return;
    api.get(`/admin/hospitals/${id}/ambulance-drivers`).then(setDrivers);
  }
  useEffect(() => loadDrivers(hospitalId), [hospitalId]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...form };
      if (payload.latitude) payload.latitude = parseFloat(payload.latitude);
      else delete payload.latitude;
      if (payload.longitude) payload.longitude = parseFloat(payload.longitude);
      else delete payload.longitude;
      await api.post(`/admin/hospitals/${hospitalId}/ambulance-drivers`, payload);
      setForm({ name: "", phone: "", vehicle_number: "", latitude: "", longitude: "" });
      loadDrivers(hospitalId);
    } catch (e2) {
      setError(e2.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailable(d) {
    await api.put(`/admin/ambulance-drivers/${d.id}`, { is_available: !d.is_available });
    loadDrivers(hospitalId);
  }

  async function remove(d) {
    if (!confirm(`Remove driver ${d.name}?`)) return;
    await api.del(`/admin/ambulance-drivers/${d.id}`);
    loadDrivers(hospitalId);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Ambulance Fleet</h1>
      <p className="mt-1 text-sm text-slate-500">Drivers added here are the ones dispatched instantly when a patient presses the SOS button.</p>

      <div className="mt-4 max-w-xs">
        <label className="mb-1 block text-sm font-medium text-slate-600">Hospital</label>
        <select className="input" value={hospitalId} onChange={(e) => setHospitalId(e.target.value)}>
          {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      </div>

      <form onSubmit={submit} className="card mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input className="input" placeholder="Driver name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" placeholder="Phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="input" placeholder="Vehicle number (e.g. TN-09-AZ-1234)" value={form.vehicle_number} onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input className="input" placeholder="Latitude (optional)" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
          <input className="input" placeholder="Longitude (optional)" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
        </div>
        {error && <p className="text-sm text-rose-600 sm:col-span-2">{error}</p>}
        <button disabled={saving || !hospitalId} className="btn-primary sm:col-span-2">{saving ? "Adding..." : "+ Add ambulance driver"}</button>
      </form>

      <div className="mt-6 flex flex-col gap-3">
        {drivers.length === 0 && <p className="text-slate-400">No drivers added for this hospital yet.</p>}
        {drivers.map((d) => (
          <div key={d.id} className="card flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800">{d.name} <span className="badge bg-slate-100 text-slate-600 ml-1">{d.vehicle_number}</span></p>
              <p className="text-xs text-slate-500">{d.phone}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`badge ${d.is_available ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                {d.is_available ? "Available" : "On call"}
              </span>
              <button onClick={() => toggleAvailable(d)} className="btn-secondary">Toggle</button>
              <button onClick={() => remove(d)} className="btn-secondary !text-rose-600">Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminAmbulancePage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminAmbulanceContent />
    </RoleGuard>
  );
}
