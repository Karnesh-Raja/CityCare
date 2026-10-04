"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RoleGuard from "../../../components/RoleGuard";
import StatusBadge from "../../../components/StatusBadge";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";

function DashboardContent() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/appointments").then(setAppointments).finally(() => setLoading(false));
  }, []);

  const upcoming = appointments.filter((a) => ["pending", "confirmed"].includes(a.status));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Welcome, {user?.name}</h1>
      <p className="mt-1 text-slate-500">Here's what's coming up.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-slate-500">Upcoming appointments</p>
          <p className="text-3xl font-bold text-brand-700">{upcoming.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Total appointments</p>
          <p className="text-3xl font-bold text-slate-800">{appointments.length}</p>
        </div>
        <Link href="/patient/find-doctor" className="card flex flex-col justify-center hover:border-brand-400">
          <p className="font-semibold text-brand-600">+ Book a new appointment</p>
          <p className="text-sm text-slate-500">Search doctors by specialization</p>
        </Link>
      </div>

      <h2 className="mt-8 mb-3 text-lg font-semibold text-slate-800">Upcoming</h2>
      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : upcoming.length === 0 ? (
        <p className="text-slate-400">No upcoming appointments yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {upcoming.map((a) => (
            <div key={a.id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">Dr. {a.doctor.name} — {a.doctor.specialization}</p>
                <p className="text-sm text-slate-500">{a.appointment_date} at {a.start_time}</p>
              </div>
              <StatusBadge status={a.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PatientDashboardPage() {
  return (
    <RoleGuard allowedRoles={["patient"]}>
      <DashboardContent />
    </RoleGuard>
  );
}
