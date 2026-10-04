"use client";

import { useEffect, useState } from "react";
import RoleGuard from "../../../components/RoleGuard";
import { api } from "../../../lib/api";

function DashboardContent() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/admin/stats").then(setStats);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Admin Overview</h1>
      {stats && (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="card"><p className="text-sm text-slate-500">Patients</p><p className="text-3xl font-bold">{stats.total_patients}</p></div>
          <div className="card"><p className="text-sm text-slate-500">Doctors</p><p className="text-3xl font-bold">{stats.total_doctors}</p></div>
          <div className="card"><p className="text-sm text-slate-500">Receptionists</p><p className="text-3xl font-bold">{stats.total_receptionists}</p></div>
          <div className="card"><p className="text-sm text-slate-500">Total appointments</p><p className="text-3xl font-bold">{stats.total_appointments}</p></div>
          <div className="card"><p className="text-sm text-slate-500">Pending</p><p className="text-3xl font-bold text-amber-600">{stats.pending_appointments}</p></div>
          <div className="card"><p className="text-sm text-slate-500">Completed</p><p className="text-3xl font-bold text-emerald-600">{stats.completed_appointments}</p></div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <DashboardContent />
    </RoleGuard>
  );
}
