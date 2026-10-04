"use client";

import { useEffect, useState } from "react";
import RoleGuard from "../../../components/RoleGuard";
import StatusBadge from "../../../components/StatusBadge";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function DashboardContent() {
  const { user } = useAuth();
  const [todayAppts, setTodayAppts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/appointments?date=${todayISO()}`).then(setTodayAppts).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Welcome, Dr. {user?.name}</h1>
      <p className="mt-1 text-slate-500">Here's today's schedule.</p>

      <div className="mt-6">
        {loading ? (
          <p className="text-slate-400">Loading...</p>
        ) : todayAppts.length === 0 ? (
          <p className="text-slate-400">No appointments scheduled for today.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {todayAppts.map((a) => (
              <div key={a.id} className="card flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">{a.patient.name}</p>
                  <p className="text-sm text-slate-500">{a.start_time} — {a.reason || "No reason given"}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DoctorDashboardPage() {
  return (
    <RoleGuard allowedRoles={["doctor"]}>
      <DashboardContent />
    </RoleGuard>
  );
}
