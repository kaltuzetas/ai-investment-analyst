interface DateBadgeProps {
  date?: string;
}

export function DateBadge({ date }: DateBadgeProps) {
  if (!date) return null;
  return (
    <span
      style={{
        color: "var(--text3)",
        fontSize: 10,
        fontFamily: "monospace",
        marginLeft: 8,
      }}
    >
      · {date}
    </span>
  );
}
