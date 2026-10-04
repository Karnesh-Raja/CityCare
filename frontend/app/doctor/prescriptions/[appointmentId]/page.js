"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RoleGuard from "../../../../components/RoleGuard";
import { api, API_URL } from "../../../../lib/api";

function PrescriptionContent() {
  const { appointmentId } = useParams();
  const router = useRouter();
  const [appt, setAppt] = useState(null);
  const [reports, setReports] = useState([]);
  const [existing, setExisting] = useState(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [medicines, setMedicines] = useState([{ name: "", dosage: "", duration: "" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/appointments/${appointmentId}`).then(setAppt);
    api.get(`/reports/appointments/${appointmentId}`).then(setReports);
    api
      .get(`/prescriptions/appointments/${appointmentId}`)
      .then((p) => {
        setExisting(p);
        setDiagnosis(p.diagnosis || "");
        setNotes(p.notes || "");
        setMedicines(p.medicines.length ? p.medicines : [{ name: "", dosage: "", duration: "" }]);
      })
      .catch(() => {});
  }, [appointmentId]);

  function updateMed(i, field, value) {
    setMedicines((meds) => meds.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));
  }

  function addMed() {
    setMedicines((meds) => [...meds, { name: "", dosage: "", duration: "" }]);
  }

  function removeMed(i) {
    setMedicines((meds) => meds.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post(`/prescriptions/appointments/${appointmentId}`, {
        diagnosis,
        notes,
        medicines: medicines.filter((m) => m.name.trim()),
      });
      router.push("/doctor/appointments");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!appt) return <p className="text-slate-400">Loading...</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card">
        <p className="font-semibold text-slate-800">{appt.patient.name}</p>
        <p className="text-sm text-slate-500">{appt.appointment_date} at {appt.start_time} — {appt.reason || "No reason given"}</p>
      </div>

      <div className="card mt-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Patient reports</h3>
        {reports.length === 0 ? (
          <p className="text-sm text-slate-400">No reports uploaded.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {reports.map((r) => (
              <li key={r.id}>
                <a className="text-sm text-brand-600 hover:underline" href={`${API_URL}/reports/${r.id}/download`} target="_blank" rel="noreferrer">
                  {r.original_filename}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={handleSubmit} className="card mt-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">
          {existing ? "Prescription (already issued)" : "Write prescription"}
        </h3>
        {error && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

        <label className="mb-1 block text-sm text-slate-600">Diagnosis</label>
        <input className="input" disabled={!!existing} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />

        <label className="mb-1 mt-4 block text-sm text-slate-600">Medicines</label>
        <div className="flex flex-col gap-2">
          {medicines.map((m, i) => (
            <div key={i} className="flex gap-2">
              <input className="input" placeholder="Name" disabled={!!existing}
                value={m.name} onChange={(e) => updateMed(i, "name", e.target.value)} />
              <input className="input" placeholder="Dosage" disabled={!!existing}
                value={m.dosage} onChange={(e) => updateMed(i, "dosage", e.target.value)} />
              <input className="input" placeholder="Duration" disabled={!!existing}
                value={m.duration} onChange={(e) => updateMed(i, "duration", e.target.value)} />
              {!existing && medicines.length > 1 && (
                <button type="button" className="text-rose-500" onClick={() => removeMed(i)}>✕</button>
              )}
            </div>
          ))}
        </div>
        {!existing && (
          <button type="button" className="btn-secondary mt-2 self-start" onClick={addMed}>
            + Add medicine
          </button>
        )}

        <label className="mb-1 mt-4 block text-sm text-slate-600">Notes</label>
        <textarea className="input" rows={3} disabled={!!existing} value={notes} onChange={(e) => setNotes(e.target.value)} />

        {!existing && (
          <button className="btn-primary mt-4" disabled={saving}>
            {saving ? "Saving..." : "Issue prescription & complete visit"}
          </button>
        )}
      </form>
    </div>
  );
}

export default function DoctorPrescriptionPage() {
  return (
    <RoleGuard allowedRoles={["doctor"]}>
      <PrescriptionContent />
    </RoleGuard>
  );
}
