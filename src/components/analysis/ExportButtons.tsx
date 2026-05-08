import { useState, useRef, useEffect } from "react";
import { AnalysisData, Lang } from "@/types";
import { TR } from "@/constants/translations";
import { buildMarkdown } from "@/utils/exportAnalysis";

interface Props {
  data: AnalysisData;
  lang: Lang;
}

export function ExportButtons({ data, lang }: Props) {
  const t = (key: string) => (TR[lang] as unknown as Record<string, string>)[key] ?? key;
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (resetTimer.current) clearTimeout(resetTimer.current); }, []);

  const flashCopied = () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setCopied(true);
    resetTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  const handleCopy = async () => {
    const md = buildMarkdown(data, lang);
    try {
      await navigator.clipboard.writeText(md);
      flashCopied();
    } catch {
      // Fallback for browsers without clipboard API
      const ta = document.createElement("textarea");
      ta.value = md;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      flashCopied();
    }
  };

  const handlePrint = () => window.print();

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        onClick={handleCopy}
        style={{ background: copied ? "rgba(0,208,132,0.1)" : "var(--border2)", border: `1px solid ${copied ? "rgba(0,208,132,0.3)" : "rgba(255,255,255,0.1)"}`, color: copied ? "#00d084" : "var(--text3)", borderRadius: 7, padding: "6px 12px", cursor: "pointer", fontSize: 11, fontFamily: "monospace", transition: "all 0.2s" }}
      >
        {copied ? t("expCopied") : t("expCopy")}
      </button>
      <button
        onClick={handlePrint}
        style={{ background: "var(--border2)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text3)", borderRadius: 7, padding: "6px 12px", cursor: "pointer", fontSize: 11, fontFamily: "monospace" }}
      >
        {t("expPrint")}
      </button>
    </div>
  );
}
