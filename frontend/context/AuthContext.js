"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((u) => setUser(u))
      .catch(() => {
        localStorage.removeItem("token");
      })
      .finally(() => setLoading(false));
  }, []);

  function loginRedirect(userObj) {
    setUser(userObj);
    const dest = {
      patient: "/patient/dashboard",
      doctor: "/doctor/dashboard",
      receptionist: "/receptionist/dashboard",
      admin: "/admin/dashboard",
    }[userObj.role] || "/";
    router.push(dest);
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, loginRedirect, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
