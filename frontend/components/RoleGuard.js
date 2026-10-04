"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function RoleGuard({ allowedRoles, children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace("/");
    }
  }, [user, loading, allowedRoles, router]);

  if (loading || !user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  return children;
}
