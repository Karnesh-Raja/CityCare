"use client";

import { useEffect, useState } from "react";
import RoleGuard from "../../../components/RoleGuard";
import QRCodeImage from "../../../components/QRCodeImage";
import { useAuth } from "../../../context/AuthContext";
import { useLang, LANGUAGES } from "../../../lib/i18n";
import { api } from "../../../lib/api";

function ProfileContent() {
  const { user } = useAuth();
  const { lang, changeLang } = useLang();
  const [appointments, setAppointments] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get("/appointments").then(setAppointments).catch(() => {});
    api.get("/pharmacy/orders").then(setOrders).catch(() => {});
  }, []);

  const completed = appointments.filter((a) => a.status === "completed").length;
  const qrPayload = JSON.stringify({ citycare_patient_id: user.id, name: user.name, email: user.email });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="card md:col-span-2">
          <h2 className="mb-3 font-semibold text-slate-800">Personal details</h2>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-400">Name</dt><dd className="font-medium text-slate-700">{user.name}</dd></div>
            <div><dt className="text-slate-400">Email</dt><dd className="font-medium text-slate-700">{user.email}</dd></div>
            <div><dt className="text-slate-400">Phone</dt><dd className="font-medium text-slate-700">{user.phone || "—"}</dd></div>
            <div><dt className="text-slate-400">Patient ID</dt><dd className="font-medium text-slate-700">#{user.id}</dd></div>
          </dl>

          <h2 className="mt-6 mb-2 font-semibold text-slate-800">Preferred language</h2>
          <div className="flex gap-2">
            {LANGUAGES.map((l) => (
              <button key={l.code} onClick={() => changeLang(l.code)} className={lang === l.code ? "chip-active" : "chip"}>
                {l.label}
              </button>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-orange-50 py-3">
              <p className="text-xl font-bold text-orange-600">{appointments.length}</p>
              <p className="text-xs text-slate-500">Appointments</p>
            </div>
            <div className="rounded-xl bg-teal-50 py-3">
              <p className="text-xl font-bold text-teal-600">{completed}</p>
              <p className="text-xs text-slate-500">Completed visits</p>
            </div>
            <div className="rounded-xl bg-slate-100 py-3">
              <p className="text-xl font-bold text-slate-700">{orders.length}</p>
              <p className="text-xs text-slate-500">Pharmacy orders</p>
            </div>
          </div>
        </div>

        <div className="card flex flex-col items-center justify-center gap-3 text-center">
          <h2 className="font-semibold text-slate-800">Patient QR profile</h2>
          <QRCodeImage data={qrPayload} label="Scan at hospital reception for instant check-in" />
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RoleGuard allowedRoles={["patient"]}>
      <ProfileContent />
    </RoleGuard>
  );
}
