interface Props {
  sport: string;
}

export default function SportBadge({ sport }: Props) {
  const colors: Record<string, { bg: string; color: string }> = {
    AFL: { bg: "rgba(59,130,246,0.15)", color: "#3b82f6" },
    NRL: { bg: "rgba(139,92,246,0.15)", color: "#8b5cf6" },
  };
  const cfg = colors[sport] ?? { bg: "rgba(136,146,164,0.15)", color: "#8892a4" };
  return (
    <span
      style={{
        background: cfg.bg,
        color: cfg.color,
        padding: "3px 8px",
        borderRadius: "5px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.04em",
      }}
    >
      {sport}
    </span>
  );
}
