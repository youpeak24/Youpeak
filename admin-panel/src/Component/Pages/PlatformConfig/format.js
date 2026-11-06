export const inr = (v) =>
  `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const fmtDateTime = (v) =>
  v
    ? new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

export function formatValue(v) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "On" : "Off";
  if (Array.isArray(v)) return `${v.length} ${v.length === 1 ? "entry" : "entries"}`;
  if (typeof v === "number") return v.toLocaleString("en-IN");
  return String(v);
}
