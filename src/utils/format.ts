export const n = (v: unknown): string =>
  (v || "").toString().toLowerCase().trim();

export const fmt = (v: number | null | undefined, d = 2): string =>
  v == null
    ? "—"
    : Number(v).toLocaleString("ru-RU", { maximumFractionDigits: d });

export const clamp = (v: number | undefined, lo = 0, hi = 100): number =>
  Math.min(hi, Math.max(lo, v || 0));

export const fgColor = (v: number): string =>
  v < 20 ? "#ff4d4d" : v < 40 ? "#ff8c42" : v < 60 ? "#f5a623" : "#00d084";

export const fmtMaybe = (v: unknown): string | null => {
  if (v == null) return null;
  const s = String(v).trim();
  return ["n/a", "na", "-", "null", "none", "—", "undefined"].includes(
    s.toLowerCase()
  )
    ? null
    : s;
};
