"use client";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export default function SOSButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | locating | sent | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  if (!user || user.role !== "patient") return null;

  function sendSOS() {
    setStatus("locating");
    setError("");
    if (!navigator.geolocation) {
      setError("Location services aren't available on this device.");
      setStatus("error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await api.post("/sos", { lat: latitude, lng: longitude, notes: "Emergency raised from CityCare app" });
          setResult(res);
          setStatus("sent");
        } catch (e) {
          setError(e.message || "Could not reach dispatch. Call 108 for immediate help.");
          setStatus("error");
        }
      },
      () => {
        setError("We couldn't access your location. Please enable GPS and try again.");
        setStatus("error");
      }
    );
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setStatus("idle"); setResult(null); }}
        className="fixed bottom-5 right-5 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/40 ring-4 ring-red-100 transition hover:scale-105 hover:bg-red-700 animate-pulse"
        aria-label="Emergency SOS"
      >
        <span className="text-xs font-extrabold leading-tight">SOS</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-red-600">🚑 Emergency SOS</h3>

            {status === "idle" && (
              <>
                <p className="mt-2 text-sm text-slate-600">
                  This shares your live location with the nearest available ambulance driver so they can reach you immediately.
                </p>
                <div className="mt-5 flex gap-2">
                  <button onClick={sendSOS} className="btn-primary flex-1 !bg-red-600 hover:!bg-red-700">
                    Send my location now
                  </button>
                  <button onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
                </div>
              </>
            )}

            {status === "locating" && (
              <p className="mt-4 text-sm text-slate-500">Getting your location and dispatching the nearest ambulance...</p>
            )}

            {status === "sent" && result && (
              <div className="mt-4 space-y-2 text-sm">
                <p className="font-semibold text-emerald-600">Ambulance dispatched!</p>
                <p><span className="text-slate-500">Driver:</span> {result.driver?.name}</p>
                <p><span className="text-slate-500">Vehicle:</span> {result.driver?.vehicle_number}</p>
                <p><span className="text-slate-500">Phone:</span> {result.driver?.phone}</p>
                <p><span className="text-slate-500">Hospital:</span> {result.hospital?.name}</p>
                <p><span className="text-slate-500">Distance:</span> ~{result.driver_distance_km} km away</p>
                <button onClick={() => setOpen(false)} className="btn-primary mt-3 w-full">Close</button>
              </div>
            )}

            {status === "error" && (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-red-600">{error}</p>
                <p className="text-xs text-slate-500">In a life-threatening emergency, please also call 108 (India's national ambulance number) directly.</p>
                <div className="flex gap-2">
                  <button onClick={sendSOS} className="btn-primary flex-1">Try again</button>
                  <button onClick={() => setOpen(false)} className="btn-secondary">Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
