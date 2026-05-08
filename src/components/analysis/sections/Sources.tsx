import { AnalysisData, Lang } from "@/types";
import { TR } from "@/constants/translations";

interface Props { data: AnalysisData; lang: Lang; }

/** [FIX] XSS: validate URLs from Claude — only allow http/https schemes */
function safeUrl(u: unknown): string {
  if (typeof u !== "string" || !u) return "#";
  try {
    const parsed = new URL(u);
    return ["https:", "http:"].includes(parsed.protocol) ? u : "#";
  } catch {
    return "#";
  }
}

export function Sources({ data, lang }: Props) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  if (!data.sources?.length) return null;

  return (
    <div>
      <div style={{ color: "var(--text3)", fontSize: 10, fontFamily: "monospace", marginBottom: 8 }}>{t("src")}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {data.sources.map((s, i) => (
          <a key={i} href={safeUrl(s.url)} target="_blank" rel="noopener noreferrer nofollow" style={{ background: "rgba(201,168,76,0.05)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", textDecoration: "none" }}>
            <div style={{ color: "#c9a84c", fontSize: 11, fontWeight: 700, fontFamily: "monospace" }}>{s.name}</div>
            {s.data && <div style={{ color: "#4a4a5e", fontSize: 10 }}>{s.data}</div>}
            {s.date && <div style={{ color: "var(--text3)", fontSize: 9, fontFamily: "monospace" }}>{s.date}</div>}
          </a>
        ))}
      </div>
    </div>
  );
}
