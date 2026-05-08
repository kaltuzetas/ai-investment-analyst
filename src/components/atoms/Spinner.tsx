interface SpinnerProps {
  size?: number;
  color?: string;
}

export function Spinner({ size = 32, color = "#c9a84c" }: SpinnerProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `2px solid ${color}22`,
        borderTop: `2px solid ${color}`,
        animation: "spin 0.9s linear infinite",
      }}
    />
  );
}
