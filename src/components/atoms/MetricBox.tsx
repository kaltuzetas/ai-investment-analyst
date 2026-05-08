interface MetricBoxProps {
  label: string;
  value: string | null | undefined;
  sub?: string;
  accent?: string;
}

export function MetricBox({ label, value, sub, accent }: MetricBoxProps) {
  return (
    <div
      style={{
        background: "var(--border2)",
        border: "1px solid rgba(201,168,76,0.12)",
        borderRadius: 8,
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          color: "var(--text2)",
          fontSize: 10,
          textTransform: "uppercase",
          fontFamily: "monospace",
          marginBottom: 5,
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: accent || "var(--text)",
          fontSize: 16,
          fontFamily: "monospace",
          fontWeight: 600,
        }}
      >
        {value || "—"}
      </div>
      {sub && (
        <div style={{ color: "var(--text2)", fontSize: 11, marginTop: 3 }}>{sub}</div>
      )}
    </div>
  );
}
