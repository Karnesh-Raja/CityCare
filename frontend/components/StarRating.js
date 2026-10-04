"use client";

import { useState } from "react";

export function StarDisplay({ value = 0, count, size = "text-sm" }) {
  const rounded = Math.round(value);
  return (
    <span className={`inline-flex items-center gap-1 ${size}`}>
      <span className="text-amber-500">
        {"★".repeat(rounded)}
        <span className="text-slate-300">{"★".repeat(5 - rounded)}</span>
      </span>
      <span className="font-semibold text-slate-700">{value?.toFixed ? value.toFixed(1) : value}</span>
      {typeof count === "number" && (
        <span className="text-slate-400">({count})</span>
      )}
    </span>
  );
}

export function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1 text-2xl">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className={(hover || value) >= n ? "text-amber-500" : "text-slate-300"}
          aria-label={`${n} star`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
