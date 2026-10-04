const COLORS = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`badge ${COLORS[status] || "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}
