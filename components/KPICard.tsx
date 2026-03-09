"use client";
import { useEffect, useState } from "react";
import { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean | null;
  icon: LucideIcon;
  delay?: number;
  accent?: boolean;
}

export default function KPICard({ label, value, sub, positive, icon: Icon, delay = 0, accent }: Props) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const borderColor = accent
    ? "var(--accent)"
    : positive === true
    ? "var(--green)"
    : positive === false
    ? "var(--red)"
    : "var(--border)";

  const valueColor = accent
    ? "var(--accent)"
    : positive === true
    ? "var(--green)"
    : positive === false
    ? "var(--red)"
    : "var(--text-primary)";

  return (
    <div
      style={{
        background: "var(--surface)",
        border: `1px solid ${borderColor}`,
        borderRadius: "12px",
        padding: "20px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      {(positive === true || accent) && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "80px",
            height: "80px",
            background: accent ? "rgba(245,158,11,0.06)" : "rgba(16,185,129,0.06)",
            borderRadius: "50%",
            transform: "translate(20px, -20px)",
          }}
        />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {label}
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: valueColor, marginTop: "8px", lineHeight: 1 }}>
            {value}
          </div>
          {sub && (
            <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "6px" }}>
              {sub}
            </div>
          )}
        </div>
        <div
          style={{
            width: "40px",
            height: "40px",
            background: accent ? "rgba(245,158,11,0.15)" : "var(--surface-2)",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: accent ? "var(--accent)" : "var(--text-secondary)",
            flexShrink: 0,
          }}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
