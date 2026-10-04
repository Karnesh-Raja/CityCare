"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../lib/i18n";

const CATEGORIES = [
  { href: "/patient/hospitals", emoji: "🏥", title: "Find a Hospital", desc: "GPS-nearest, sorted by rating" },
  { href: "/patient/pharmacy", emoji: "💊", title: "Order Medicines", desc: "Nearest pharmacy in stock" },
  { href: "/patient/appointments", emoji: "🗓️", title: "My Appointments", desc: "Track & manage bookings" },
  { href: "/patient/profile", emoji: "🪪", title: "My QR Profile", desc: "Instant hospital check-in" },
];

export default function Home() {
  const { user } = useAuth();
  const { t } = useLang();

  return (
    <div>
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-400 to-teal-500 px-6 py-14 text-center text-white sm:px-10">
        <h1 className="text-3xl font-extrabold sm:text-5xl">{t("appName")}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-orange-50 sm:text-base">{t("tagline")}</p>
        <p className="mx-auto mt-1 max-w-xl text-xs text-orange-50/80">
          Hospitals & pharmacies near you — booked, delivered, and tracked in one app.
        </p>

        <div className="mx-auto mt-6 flex max-w-lg items-center gap-2 rounded-full bg-white p-1.5 shadow-lg">
          <span className="pl-3 text-slate-400">🔍</span>
          <input
            readOnly
            placeholder={t("searchPlaceholder")}
            className="flex-1 bg-transparent px-2 py-2 text-sm text-slate-700 outline-none"
          />
          <Link
            href={user ? "/patient/hospitals" : "/login"}
            className="rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          >
            Search
          </Link>
        </div>

        {!user && (
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/login" className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50">
              Login
            </Link>
            <Link href="/register" className="rounded-lg border border-white/60 px-5 py-2 text-sm font-semibold text-white hover:bg-white/10">
              Register as Patient
            </Link>
          </div>
        )}
      </section>

      {/* Category tiles */}
      <section className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {CATEGORIES.map((c) => (
          <Link
            key={c.href}
            href={user ? c.href : "/login"}
            className="card flex flex-col items-center gap-2 py-6 text-center transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
          >
            <span className="text-3xl">{c.emoji}</span>
            <p className="font-semibold text-slate-800">{c.title}</p>
            <p className="text-xs text-slate-500">{c.desc}</p>
          </Link>
        ))}
      </section>

      {/* Emergency strip */}
      <section className="mt-6 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-6 py-4">
        <div>
          <p className="font-bold text-red-700">🚑 Medical Emergency?</p>
          <p className="text-sm text-red-600">Tap the SOS button in the corner any time to alert the nearest ambulance driver with your live location.</p>
        </div>
      </section>

      {/* How it works */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-slate-800">How CityCare works</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[
            { step: "1", title: "Search nearby", desc: "GPS-sorted hospitals & pharmacies, ranked by rating." },
            { step: "2", title: "Book or order", desc: "Pick a doctor slot or search a tablet name." },
            { step: "3", title: "Pay your way", desc: "UPI, card, net banking, wallet, or cash." },
            { step: "4", title: "Get cared for", desc: "Check in via QR, rate your visit afterwards." },
          ].map((s) => (
            <div key={s.step} className="card">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">{s.step}</span>
              <h3 className="mt-3 font-semibold text-slate-800">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
