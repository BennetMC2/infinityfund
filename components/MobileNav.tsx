"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, List, BarChart2, TrendingUp } from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bets", label: "Bet Log", icon: List },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/strategy", label: "Strategy", icon: TrendingUp },
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <style>{`
        @media (min-width: 769px) {
          .mobile-nav-button, .mobile-nav-menu {
            display: none !important;
          }
        }
      `}</style>

      {/* Hamburger Button - Mobile Only */}
      <button
        className="mobile-nav-button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          top: "12px",
          left: "12px",
          zIndex: 100,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "8px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="mobile-nav-menu"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              zIndex: 40,
            }}
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div
            className="mobile-nav-menu"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "240px",
              height: "100vh",
              background: "var(--surface)",
              borderRight: "1px solid var(--border)",
              zIndex: 50,
              display: "flex",
              flexDirection: "column",
              padding: "60px 0 0 0",
              boxSizing: "border-box",
            }}
          >
            <nav style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      textDecoration: "none",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: active ? "var(--accent)" : "var(--text-secondary)",
                      background: active ? "rgba(245,158,11,0.1)" : "transparent",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div style={{ padding: "16px", borderTop: "1px solid var(--border)", fontSize: "11px", color: "var(--text-secondary)" }}>
              Updated weekly · Mondays
            </div>
          </div>
        </>
      )}
    </>
  );
}
