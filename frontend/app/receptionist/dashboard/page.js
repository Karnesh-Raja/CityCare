"use client";

import { useEffect, useState } from "react";
import RoleGuard from "../../../components/RoleGuard";
import StatusBadge from "../../../components/StatusBadge";
import { api } from "../../../lib/api";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function DashboardContent() {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/appointments?date=${todayISO()}`),
      api.get("/admin/stats"),
    ]).then(([appts, s]) => {
      setAppointments(appts);
      setStats(s);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Front Desk</h1>

      {stats && (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="card"><p className="text-sm text-slate-500">Patients</p><p className="text-2xl font-bold">{stats.total_patients}</p></div>
          <div className="card"><p className="text-sm text-slate-500">Doctors</p><p className="text-2xl font-bold">{stats.total_doctors}</p></div>
          <div className="card"><p className="text-sm text-slate-500">Pending</p><p className="text-2xl font-bold text-amber-600">{stats.pending_appointments}</p></div>
          <div className="card"><p className="text-sm text-slate-500">Completed</p><p className="text-2xl font-bold text-emerald-600">{stats.completed_appointments}</p></div>
        </div>
      )}

      <h2 className="mt-8 mb-3 text-lg font-semibold text-slate-800">Today's appointments</h2>
      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : appointments.length === 0 ? (
        <p className="text-slate-400">Nothing scheduled today.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {appointments.map((a) => (
            <div key={a.id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">{a.patient.name} → Dr. {a.doctor.name}</p>
                <p className="text-sm text-slate-500">{a.start_time} — {a.doctor.specialization}</p>
              </div>
              <StatusBadge status={a.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReceptionistDashboardPage() {
  return (
    <RoleGuard allowedRoles={["receptionist"]}>
      <DashboardContent />
    </RoleGuard>
  );
}
