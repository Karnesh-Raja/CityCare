"use client";

import { useEffect, useState } from "react";
import RoleGuard from "../../../components/RoleGuard";
import { api } from "../../../lib/api";

const EMPTY_FORM = {
  name: "", email: "", password: "", phone: "", role: "doctor",
  specialization: "", qualification: "", experience_years: 0, consultation_fee: 0, hospital_id: "",
};

function ManageStaffContent() {
  const [users, setUsers] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [roleFilter, setRoleFilter] = useState("doctor");
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const data = await api.get(`/admin/users?role=${roleFilter}`);
    setUsers(data);
  }

  useEffect(() => { load(); }, [roleFilter]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { api.get("/admin/hospitals").then(setHospitals); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = { ...form };
      if (payload.hospital_id) payload.hospital_id = Number(payload.hospital_id);
      else delete payload.hospital_id;
      await api.post("/admin/users", payload);
      setSuccess(`${form.role} account created.`);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u) {
    await api.patch(`/admin/users/${u.id}/${u.is_active ? "deactivate" : "activate"}`, {});
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Manage Staff</h1>

      <div className="card mt-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Create staff account</h3>
        {error && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
        {success && <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600">{success}</p>}
        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="doctor">Doctor</option>
            <option value="receptionist">Receptionist</option>
            <option value="admin">Admin</option>
          </select>
          <input className="input" placeholder="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input" type="password" placeholder="Temporary password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />

          {form.role === "doctor" && (
            <>
              <input className="input" placeholder="Specialization" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
              <input className="input" placeholder="Qualification" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} />
              <input className="input" type="number" placeholder="Experience (years)" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: Number(e.target.value) })} />
              <input className="input" type="number" placeholder="Consultation fee" value={form.consultation_fee} onChange={(e) => setForm({ ...form, consultation_fee: Number(e.target.value) })} />
              <select className="input sm:col-span-2" value={form.hospital_id} onChange={(e) => setForm({ ...form, hospital_id: e.target.value })}>
                <option value="">Assign to hospital (optional)</option>
                {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </>
          )}
          <button className="btn-primary sm:col-span-2" disabled={saving}>
            {saving ? "Creating..." : "Create account"}
          </button>
        </form>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Existing accounts</h2>
        <select className="input max-w-xs" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="doctor">Doctors</option>
          <option value="receptionist">Receptionists</option>
          <option value="admin">Admins</option>
          <option value="patient">Patients</option>
        </select>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {users.map((u) => (
          <div key={u.id} className="card flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800">{u.name}</p>
              <p className="text-sm text-slate-500">{u.email}</p>
            </div>
            <button className={`btn-secondary ${!u.is_active && "text-rose-500"}`} onClick={() => toggleActive(u)}>
              {u.is_active ? "Deactivate" : "Activate"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ManageStaffPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <ManageStaffContent />
    </RoleGuard>
  );
}
