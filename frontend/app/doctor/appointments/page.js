"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RoleGuard from "../../../components/RoleGuard";
import StatusBadge from "../../../components/StatusBadge";
import { api } from "../../../lib/api";

function DoctorAppointmentsContent() {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const q = filter ? `?status=${filter}` : "";
    const data = await api.get(`/appointments${q}`);
    setAppointments(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateStatus(id, status) {
    await api.patch(`/appointments/${id}/status`, { status });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Appointments</h1>
        <select className="input max-w-xs" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {loading ? (
          <p className="text-slate-400">Loading...</p>
        ) : appointments.length === 0 ? (
          <p className="text-slate-400">No appointments found.</p>
        ) : (
          appointments.map((a) => (
            <div key={a.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-slate-800">{a.patient.name}</p>
                <p className="text-sm text-slate-500">
                  {a.appointment_date} at {a.start_time} — {a.reason || "No reason given"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={a.status} />
                {a.status === "pending" && (
                  <button className="btn-secondary" onClick={() => updateStatus(a.id, "confirmed")}>
                    Confirm
                  </button>
                )}
                {a.status === "confirmed" && (
                  <button className="btn-primary" onClick={() => router.push(`/doctor/prescriptions/${a.id}`)}>
                    Start consultation
                  </button>
                )}
                {a.status === "completed" && a.has_prescription && (
                  <button className="btn-secondary" onClick={() => router.push(`/doctor/prescriptions/${a.id}`)}>
                    View prescription
                  </button>
                )}
                {["pending", "confirmed"].includes(a.status) && (
                  <button
                    className="text-sm text-rose-500 hover:underline"
                    onClick={() => updateStatus(a.id, "cancelled")}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function DoctorAppointmentsPage() {
  return (
    <RoleGuard allowedRoles={["doctor"]}>
      <DoctorAppointmentsContent />
    </RoleGuard>
  );
}
