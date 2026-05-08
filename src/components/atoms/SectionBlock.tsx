import { CSSProperties, ReactNode } from "react";
import { Block } from "./Block";

interface Props {
  sectionNum: number;
  title: string;
  collapsed?: boolean;
  onToggle?: () => void;
  children: ReactNode;
  style?: CSSProperties;
  badge?: ReactNode;
  titleColor?: string;
}

export function SectionBlock({ sectionNum, title, collapsed, onToggle, children, style, badge, titleColor = "#c9a84c" }: Props) {
  return (
    <Block style={style}>
      <div
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: collapsed ? 0 : 14,
          cursor: onToggle ? "pointer" : "default",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: titleColor, fontSize: 10, letterSpacing: "0.15em", fontFamily: "monospace" }}>
            {String(sectionNum).padStart(2, "0")} — {title}
          </span>
          {badge}
        </div>
        {onToggle && (
          <span style={{ color: "#c9a84c55", fontSize: 11, fontFamily: "monospace" }}>
            {collapsed ? "▶" : "▼"}
          </span>
        )}
      </div>
      {!collapsed && children}
    </Block>
  );
}
