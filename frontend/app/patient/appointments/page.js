"use client";

import { useEffect, useState } from "react";
import RoleGuard from "../../../components/RoleGuard";
import StatusBadge from "../../../components/StatusBadge";
import { StarInput } from "../../../components/StarRating";
import { api, API_URL } from "../../../lib/api";

function AlternateSlots({ appt, onBooked }) {
  const [open, setOpen] = useState(false);
  const [slots, setSlots] = useState(null);
  const [booking, setBooking] = useState(false);

  async function loadSlots() {
    setOpen(true);
    if (slots) return;
    const s = await api.get(`/appointments/${appt.id}/alternate-slots`);
    setSlots(s);
  }

  async function rebook(slot) {
    setBooking(true);
    try {
      await api.post("/appointments", {
        doctor_id: appt.doctor.id,
        appointment_date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        reason: appt.reason,
      });
      onBooked();
    } finally {
      setBooking(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg bg-amber-50 p-3">
      <p className="text-sm text-amber-700">This appointment was cancelled by the hospital. {appt.cancel_reason && `Reason: ${appt.cancel_reason}.`}</p>
      {!open ? (
        <button onClick={loadSlots} className="btn-secondary mt-2 !bg-amber-100 !text-amber-800 hover:!bg-amber-200">
          See alternate slots
        </button>
      ) : slots === null ? (
        <p className="mt-2 text-sm text-amber-600">Loading alternate slots...</p>
      ) : slots.length === 0 ? (
        <p className="mt-2 text-sm text-amber-600">No alternate slots found in the next week — please try booking manually.</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {slots.map((s, i) => (
            <button key={i} disabled={booking} onClick={() => rebook(s)} className="rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100">
              {s.date} · {s.start_time}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewModal({ appt, onClose, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setSaving(true);
    setError("");
    try {
      await api.post(`/hospitals/${appt.doctor.hospital.id}/reviews`, {
        appointment_id: appt.id,
        rating,
        comment,
      });
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-slate-800">Rate {appt.doctor.hospital?.name}</h3>
        <div className="mt-4"><StarInput value={rating} onChange={setRating} /></div>
        <textarea className="input mt-4" rows={3} placeholder="Tell others about your visit (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button disabled={saving} onClick={submit} className="btn-primary flex-1 !bg-orange-600 hover:!bg-orange-700">{saving ? "Submitting..." : "Submit review"}</button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function AppointmentRow({ appt, onChanged }) {
  const [expanded, setExpanded] = useState(false);
  const [reports, setReports] = useState([]);
  const [prescription, setPrescription] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showReview, setShowReview] = useState(false);

  async function loadDetails() {
    const r = await api.get(`/reports/appointments/${appt.id}`);
    setReports(r);
    try {
      const p = await api.get(`/prescriptions/appointments/${appt.id}`);
      setPrescription(p);
    } catch {
      setPrescription(null);
    }
  }

  function toggle() {
    setExpanded((v) => !v);
    if (!expanded) loadDetails();
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      await api.post(`/reports/appointments/${appt.id}`, formData, { isForm: true });
      await loadDetails();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between cursor-pointer" onClick={toggle}>
        <div>
          <p className="font-medium text-slate-800">Dr. {appt.doctor.name} — {appt.doctor.specialization}</p>
          <p className="text-sm text-slate-500">{appt.appointment_date} at {appt.start_time}</p>
          {appt.doctor.hospital && <p className="text-xs text-orange-600">{appt.doctor.hospital.name}</p>}
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={appt.status} />
          <span className="text-slate-400">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {appt.status === "cancelled" && appt.cancelled_by === "hospital" && (
        <AlternateSlots appt={appt} onBooked={onChanged} />
      )}

      {appt.status === "completed" && !appt.reviewed && appt.doctor.hospital && (
        <div className="mt-3">
          <button onClick={() => setShowReview(true)} className="btn-secondary !bg-orange-50 !text-orange-700 hover:!bg-orange-100">
            ⭐ Rate this visit
          </button>
        </div>
      )}
      {showReview && <ReviewModal appt={appt} onClose={() => setShowReview(false)} onDone={() => { setShowReview(false); onChanged(); }} />}

      {expanded && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          {appt.reason && <p className="text-sm text-slate-600 mb-3">Reason: {appt.reason}</p>}

          <h4 className="text-sm font-semibold text-slate-700 mb-2">Reports / Documents</h4>
          {error && <p className="mb-2 text-sm text-rose-600">{error}</p>}
          <ul className="mb-2 flex flex-col gap-1">
            {reports.length === 0 && <li className="text-sm text-slate-400">No reports uploaded yet.</li>}
            {reports.map((r) => (
              <li key={r.id} className="text-sm">
                <a
                  className="text-brand-600 hover:underline"
                  href={`${API_URL}/reports/${r.id}/download`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {r.original_filename}
                </a>
              </li>
            ))}
          </ul>
          <label className="btn-secondary cursor-pointer inline-block">
            {uploading ? "Uploading..." : "Upload report"}
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>

          <h4 className="text-sm font-semibold text-slate-700 mt-5 mb-2">Prescription</h4>
          {prescription ? (
            <div className="rounded-lg bg-emerald-50 p-3 text-sm text-slate-700">
              <p><span className="font-medium">Diagnosis:</span> {prescription.diagnosis || "—"}</p>
              {prescription.medicines?.length > 0 && (
                <ul className="mt-2 list-disc pl-5">
                  {prescription.medicines.map((m, i) => (
                    <li key={i}>{m.name} — {m.dosage} {m.duration && `(${m.duration})`}</li>
                  ))}
                </ul>
              )}
              {prescription.notes && <p className="mt-2 italic text-slate-500">{prescription.notes}</p>}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Not issued yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

function AppointmentsContent() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    api.get("/appointments").then(setAppointments).finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">My Appointments</h1>
      <div className="mt-5 flex flex-col gap-3">
        {loading ? (
          <p className="text-slate-400">Loading...</p>
        ) : appointments.length === 0 ? (
          <p className="text-slate-400">You have no appointments yet.</p>
        ) : (
          appointments.map((a) => <AppointmentRow key={a.id} appt={a} onChanged={reload} />)
        )}
      </div>
    </div>
  );
}

export default function PatientAppointmentsPage() {
  return (
    <RoleGuard allowedRoles={["patient"]}>
      <AppointmentsContent />
    </RoleGuard>
  );
}
