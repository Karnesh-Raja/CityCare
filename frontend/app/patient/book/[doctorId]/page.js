"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RoleGuard from "../../../../components/RoleGuard";
import PaymentMethodSelector from "../../../../components/PaymentMethodSelector";
import { api } from "../../../../lib/api";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function BookContent() {
  const { doctorId } = useParams();
  const router = useRouter();
  const [doctor, setDoctor] = useState(null);
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState([]);
  const [reason, setReason] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api.get(`/doctors/${doctorId}`).then(setDoctor);
  }, [doctorId]);

  useEffect(() => {
    if (!date) return;
    setLoadingSlots(true);
    setError("");
    setSelectedSlot(null);
    api
      .get(`/doctors/${doctorId}/slots?date=${date}`)
      .then(setSlots)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingSlots(false));
  }, [doctorId, date]);

  async function confirmBooking() {
    if (!selectedSlot) return;
    setBooking(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/appointments", {
        doctor_id: Number(doctorId),
        appointment_date: date,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        reason,
        payment_method: paymentMethod,
      });
      setSuccess("Appointment booked and payment recorded! Redirecting...");
      setTimeout(() => router.push("/patient/appointments"), 1200);
    } catch (e) {
      setError(e.message);
    } finally {
      setBooking(false);
    }
  }

  if (!doctor) return <p className="text-slate-400">Loading doctor...</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card">
        <p className="font-semibold text-lg text-slate-800">Dr. {doctor.name}</p>
        <p className="text-brand-600 text-sm">{doctor.specialization}</p>
        <p className="text-xs text-slate-500 mt-1">{doctor.qualification} · {doctor.experience_years} yrs · Fee ₹{doctor.consultation_fee}</p>
        {doctor.hospital && <p className="mt-1 text-xs text-orange-600">{doctor.hospital.name}</p>}
      </div>

      <div className="card mt-4">
        <label className="mb-1 block text-sm font-medium text-slate-600">Date</label>
        <input
          type="date"
          className="input max-w-xs"
          min={todayISO()}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <label className="mb-1 mt-4 block text-sm font-medium text-slate-600">Reason for visit (optional)</label>
        <input
          className="input"
          placeholder="e.g. Follow-up, fever, routine check-up"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <h3 className="mt-5 mb-2 text-sm font-semibold text-slate-700">Available slots</h3>
        {error && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
        {success && <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600">{success}</p>}

        {loadingSlots ? (
          <p className="text-slate-400 text-sm">Loading slots...</p>
        ) : slots.length === 0 ? (
          <p className="text-slate-400 text-sm">No open slots on this date. Try another date.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((s) => (
              <button
                key={s.start_time}
                disabled={booking}
                onClick={() => setSelectedSlot(s)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
                  selectedSlot?.start_time === s.start_time
                    ? "border-orange-500 bg-orange-500 text-white"
                    : "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                }`}
              >
                {s.start_time}
              </button>
            ))}
          </div>
        )}

        {selectedSlot && (
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Choose payment method</h3>
            <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} allow={["upi", "card", "netbanking", "wallet", "cod"]} />
            <button disabled={booking} onClick={confirmBooking} className="btn-primary mt-4 w-full !bg-orange-600 hover:!bg-orange-700">
              {booking ? "Booking..." : `Confirm booking at ${selectedSlot.start_time} · Pay ₹${doctor.consultation_fee}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <RoleGuard allowedRoles={["patient"]}>
      <BookContent />
    </RoleGuard>
  );
}
