interface Props {
  result: string;
  size?: "sm" | "md";
}

export default function BetBadge({ result, size = "md" }: Props) {
  const configs: Record<string, { bg: string; color: string; label: string }> = {
    win: { bg: "rgba(16,185,129,0.15)", color: "#10b981", label: "WIN" },
    loss: { bg: "rgba(239,68,68,0.15)", color: "#ef4444", label: "LOSS" },
    push: { bg: "rgba(139,92,246,0.15)", color: "#8b5cf6", label: "PUSH" },
    pending: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", label: "PENDING" },
  };
  const cfg = configs[result] ?? configs.pending;
  return (
    <span
      style={{
        background: cfg.bg,
        color: cfg.color,
        padding: size === "sm" ? "2px 7px" : "4px 10px",
        borderRadius: "6px",
        fontSize: size === "sm" ? "10px" : "11px",
        fontWeight: 700,
        letterSpacing: "0.06em",
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}
