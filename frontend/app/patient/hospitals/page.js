"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import RoleGuard from "../../../components/RoleGuard";
import { StarDisplay } from "../../../components/StarRating";
import { useGeolocation } from "../../../lib/useGeolocation";
import { api } from "../../../lib/api";

const SPECIALTIES = ["All", "Cardiology", "General Medicine", "Orthopedics", "Pediatrics", "Dermatology", "ENT", "Gynecology", "Neurology", "Dentistry"];

function HospitalsContent() {
  const { coords, permission } = useGeolocation();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [specialty, setSpecialty] = useState("All");
  const [sort, setSort] = useState("rating"); // rating | distance

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("lat", coords.lat);
    params.set("lng", coords.lng);
    params.set("sort", sort);
    if (specialty !== "All") params.set("specialty", specialty);
    api
      .get(`/hospitals?${params.toString()}`)
      .then(setHospitals)
      .finally(() => setLoading(false));
  }, [coords, sort, specialty]);

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Hospitals near you</h1>
          <p className="text-sm text-slate-500">
            {permission === "granted" ? "Using your live location" : "Using approximate Chennai location — enable GPS for exact distance"}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSort("rating")} className={sort === "rating" ? "chip-active" : "chip"}>⭐ Top Rated</button>
          <button onClick={() => setSort("distance")} className={sort === "distance" ? "chip-active" : "chip"}>📍 Nearest</button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {SPECIALTIES.map((s) => (
          <button key={s} onClick={() => setSpecialty(s)} className={specialty === s ? "chip-active" : "chip"}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-8 text-slate-400">Finding hospitals near you...</p>
      ) : hospitals.length === 0 ? (
        <p className="mt-8 text-slate-400">No hospitals match that filter.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {hospitals.map((h) => (
            <Link key={h.id} href={`/patient/hospitals/${h.id}`} className="card flex gap-4 transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-3xl">
                {h.image_emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-semibold text-slate-800">{h.name}</p>
                  {typeof h.distance_km === "number" && (
                    <span className="shrink-0 text-xs font-medium text-teal-600">{h.distance_km} km</span>
                  )}
                </div>
                <div className="mt-1"><StarDisplay value={h.rating_avg} count={h.rating_count} /></div>
                <p className="mt-1 truncate text-xs text-slate-500">{h.address}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {h.specialties.slice(0, 3).map((s) => (
                    <span key={s} className="badge bg-slate-100 text-slate-600">{s}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HospitalsPage() {
  return (
    <RoleGuard allowedRoles={["patient"]}>
      <HospitalsContent />
    </RoleGuard>
  );
}
