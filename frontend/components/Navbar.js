"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";

const LINKS = {
  patient: [
    { href: "/patient/dashboard", label: "Dashboard" },
    { href: "/patient/hospitals", label: "Find a Hospital" },
    { href: "/patient/pharmacy", label: "Pharmacy" },
    { href: "/patient/appointments", label: "My Appointments" },
    { href: "/patient/profile", label: "Profile" },
  ],
  doctor: [
    { href: "/doctor/dashboard", label: "Dashboard" },
    { href: "/doctor/appointments", label: "Appointments" },
    { href: "/doctor/availability", label: "Availability" },
  ],
  receptionist: [
    { href: "/receptionist/dashboard", label: "Dashboard" },
    { href: "/receptionist/book", label: "Book Appointment" },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/doctors", label: "Manage Staff" },
    { href: "/admin/hospitals", label: "Hospitals" },
    { href: "/admin/ambulance", label: "Ambulance Fleet" },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-1.5 text-lg font-extrabold text-orange-600">
          <span>🏥</span> CityCare
        </Link>

        <div className="flex items-center gap-4">
          {user && (
            <nav className="hidden items-center gap-5 text-sm font-medium text-slate-600 md:flex">
              {(LINKS[user.role] || []).map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-orange-600">
                  {l.label}
                </Link>
              ))}
            </nav>
          )}
          <LanguageSwitcher />
          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs capitalize text-slate-500 sm:inline">
                {user.role}
              </span>
              <span className="hidden text-slate-700 sm:inline">{user.name}</span>
              <button onClick={logout} className="btn-secondary">
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn-secondary">Login</Link>
              <Link href="/register" className="btn-primary !bg-orange-600 hover:!bg-orange-700">Sign up</Link>
            </div>
          )}
        </div>
      </div>
      {user && (
        <nav className="flex gap-4 overflow-x-auto border-t border-slate-100 px-4 py-2 text-xs font-medium text-slate-600 md:hidden">
          {(LINKS[user.role] || []).map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap hover:text-orange-600">
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
