"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function RegisterPage() {
  const { loginRedirect } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.post("/auth/register", form);
      localStorage.setItem("token", data.token);
      loginRedirect(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-sm">
      <div className="card">
        <h1 className="mb-4 text-xl font-bold text-slate-800">Create your patient account</h1>
        {error && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input className="input" placeholder="Full name" required
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" type="email" placeholder="Email" required
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input" placeholder="Phone" 
            value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="input" type="password" placeholder="Password" required
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button className="btn-primary" disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-600 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
