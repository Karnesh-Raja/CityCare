"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RoleGuard from "../../../../components/RoleGuard";
import HospitalMap from "../../../../components/HospitalMap";
import { StarDisplay } from "../../../../components/StarRating";
import { useGeolocation } from "../../../../lib/useGeolocation";
import { api } from "../../../../lib/api";

function HospitalDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const { coords } = useGeolocation();
  const [hospital, setHospital] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/hospitals/${id}?lat=${coords.lat}&lng=${coords.lng}`),
      api.get(`/hospitals/${id}/reviews`),
    ])
      .then(([h, r]) => { setHospital(h); setReviews(r); })
      .finally(() => setLoading(false));
  }, [id, coords]);

  if (loading) return <p className="text-slate-400">Loading hospital...</p>;
  if (!hospital) return <p className="text-slate-400">Hospital not found.</p>;

  return (
    <div>
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-3xl">
          {hospital.image_emoji}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">{hospital.name}</h1>
          <div className="mt-1"><StarDisplay value={hospital.rating_avg} count={hospital.rating_count} /></div>
          <p className="mt-1 text-sm text-slate-500">{hospital.address}</p>
          {typeof hospital.distance_km === "number" && (
            <p className="text-xs font-medium text-teal-600">{hospital.distance_km} km from you</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            {hospital.specialties.map((s) => (
              <span key={s} className="badge bg-slate-100 text-slate-600">{s}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">📍 GPS location</h2>
        <HospitalMap latitude={hospital.latitude} longitude={hospital.longitude} />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Doctors ({hospital.doctors.length})</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {hospital.doctors.map((d) => (
            <div key={d.id} className="card flex flex-col gap-2">
              <p className="font-semibold text-slate-800">Dr. {d.name}</p>
              <p className="text-sm text-orange-600">{d.specialization}</p>
              <p className="text-xs text-slate-500">{d.qualification} · {d.experience_years} yrs experience</p>
              <p className="text-sm text-slate-600">Fee: ₹{d.consultation_fee}</p>
              <button className="btn-primary mt-2 !bg-orange-600 hover:!bg-orange-700" onClick={() => router.push(`/patient/book/${d.id}`)}>
                View availability & book
              </button>
            </div>
          ))}
          {hospital.doctors.length === 0 && <p className="text-slate-400">No doctors listed yet.</p>}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Patient reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-slate-400">No reviews yet — be the first to visit and rate this hospital.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map((r) => (
              <div key={r.id} className="card">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-800">{r.patient_name}</p>
                  <StarDisplay value={r.rating} />
                </div>
                {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-slate-400">You can rate a hospital from "My Appointments" once your visit is completed.</p>
      </div>
    </div>
  );
}

export default function HospitalDetailPage() {
  return (
    <RoleGuard allowedRoles={["patient"]}>
      <HospitalDetailContent />
    </RoleGuard>
  );
}
