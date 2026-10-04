"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RoleGuard from "../../../components/RoleGuard";
import { api } from "../../../lib/api";

function FindDoctorContent() {
  const router = useRouter();
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [q, setQ] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (specialization) params.set("specialization", specialization);
    const data = await api.get(`/doctors?${params.toString()}`);
    setDoctors(data);
    setLoading(false);
  }

  useEffect(() => {
    api.get("/doctors/specializations").then(setSpecializations);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Find a Doctor</h1>

      <form
        onSubmit={(e) => { e.preventDefault(); load(); }}
        className="mt-4 flex flex-wrap gap-3"
      >
        <input
          className="input max-w-xs"
          placeholder="Search by name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="input max-w-xs"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
        >
          <option value="">All specializations</option>
          {specializations.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button className="btn-primary">Search</button>
      </form>

      {loading ? (
        <p className="mt-6 text-slate-400">Loading doctors...</p>
      ) : doctors.length === 0 ? (
        <p className="mt-6 text-slate-400">No doctors match your search.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {doctors.map((d) => (
            <div key={d.id} className="card flex flex-col gap-2">
              <p className="font-semibold text-slate-800">Dr. {d.name}</p>
              <p className="text-sm text-brand-600">{d.specialization}</p>
              <p className="text-xs text-slate-500">{d.qualification} · {d.experience_years} yrs experience</p>
              <p className="text-sm text-slate-600">Fee: ₹{d.consultation_fee}</p>
              <button
                className="btn-primary mt-2"
                onClick={() => router.push(`/patient/book/${d.id}`)}
              >
                View availability & book
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FindDoctorPage() {
  return (
    <RoleGuard allowedRoles={["patient"]}>
      <FindDoctorContent />
    </RoleGuard>
  );
}
