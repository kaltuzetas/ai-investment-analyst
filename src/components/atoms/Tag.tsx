import { ReactNode } from "react";

interface TagProps {
  children: ReactNode;
  color?: string;
}

export function Tag({ children, color = "#c9a84c" }: TagProps) {
  return (
    <span
      style={{
        background: `${color}15`,
        border: `1px solid ${color}40`,
        color,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        padding: "3px 9px",
        borderRadius: 20,
        textTransform: "uppercase",
        fontFamily: "monospace",
      }}
    >
      {children}
    </span>
  );
}
