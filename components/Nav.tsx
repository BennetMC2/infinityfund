"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, List, BarChart2, TrendingUp } from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bets", label: "Bet Log", icon: List },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/strategy", label: "Strategy", icon: TrendingUp },
];

const NAV_STYLES = `
  @media (max-width: 768px) {
    nav {
      display: none !important;
    }
  }
`;

export default function Nav() {
  const pathname = usePathname();
  return (
    <>
      <style>{NAV_STYLES}</style>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: "240px",
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          padding: "0",
          zIndex: 50,
        }}
      >
      {/* Logo */}
      <div style={{ padding: "28px 24px 24px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: "bold",
              color: "#000",
              flexShrink: 0,
            }}
          >
            ∞
          </div>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
              Infinity Fund
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "1px" }}>
              AFL & NRL · 2026
            </div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <div style={{ padding: "16px 12px", flex: 1 }}>
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "8px",
                marginBottom: "4px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: active ? 600 : 400,
                color: active ? "var(--accent)" : "var(--text-secondary)",
                background: active ? "rgba(245,158,11,0.1)" : "transparent",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                }
              }}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
          Updated weekly · Mondays
        </div>
      </div>
    </nav>
    </>
  );
}
