"use client";

const METHODS = [
  { id: "upi", label: "UPI", icon: "📱" },
  { id: "card", label: "Card", icon: "💳" },
  { id: "netbanking", label: "Net Banking", icon: "🏦" },
  { id: "wallet", label: "Wallet", icon: "👛" },
  { id: "cod", label: "Cash", icon: "💵" },
];

export default function PaymentMethodSelector({ value, onChange, allow = ["upi", "card", "netbanking", "wallet", "cod"] }) {
  const options = METHODS.filter((m) => allow.includes(m.id));
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {options.map((m) => (
        <button
          type="button"
          key={m.id}
          onClick={() => onChange(m.id)}
          className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-xs font-medium transition ${
            value === m.id
              ? "border-orange-500 bg-orange-50 text-orange-700"
              : "border-slate-200 bg-white text-slate-600 hover:border-orange-300"
          }`}
        >
          <span className="text-xl">{m.icon}</span>
          {m.label}
        </button>
      ))}
    </div>
  );
}
