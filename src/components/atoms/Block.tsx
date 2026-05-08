import { CSSProperties, ReactNode } from "react";

interface BlockProps {
  children: ReactNode;
  style?: CSSProperties;
}

export function Block({ children, style = {} }: BlockProps) {
  return (
    <div
      style={{
        background: "var(--border2)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: 18,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
