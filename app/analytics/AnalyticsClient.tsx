"use client";
import { Bet, fmtCurrency, betTypeLabel } from "@/lib/stats";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, PieChart, Pie, Legend
} from "recharts";
import BetBadge from "@/components/BetBadge";

interface Props {
  bets: Bet[];
  pnlByRound: { round: string; profit: number; bets: number }[];
  byBetType: { type: string; wins: number; total: number; profit: number; roi: number }[];
  bySport: { sport: string; wins: number; total: number; profit: number; winRate: number }[];
  bySportsbook: { book: string; profit: number; bets: number; roi: number }[];
  oddsDistribution: { label: string; count: number; wins: number; winRate: number; profit: number }[];
}

const SECTION_TITLE: React.CSSProperties = {
  fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)",
  textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "16px",
};

const CARD: React.CSSProperties = {
  background: "var(--surface)", border: "1px solid var(--border)",
  borderRadius: "12px", padding: "24px",
};

const SPORT_COLORS: Record<string, string> = { AFL: "#3b82f6", NRL: "#8b5cf6" };

function DarkTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 14px" }}>
      {label && <div style={{ color: "var(--text-secondary)", fontSize: "11px", marginBottom: "6px" }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color ?? "var(--text-primary)", fontWeight: 600, fontSize: "13px" }}>
          {p.name}: {typeof p.value === "number" && (p.name.includes("P&L") || p.name.includes("profit")) ? fmtCurrency(p.value) : typeof p.value === "number" && p.name.includes("%") ? `${p.value.toFixed(1)}%` : p.value}
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsClient({ bets, pnlByRound, byBetType, bySport, bySportsbook, oddsDistribution }: Props) {
  // Top 5 wins / losses
  const settled = bets.filter(b => b.result !== "pending");
  const topWins = [...settled].filter(b => b.result === "win").sort((a, b) => b.profit - a.profit).slice(0, 5);
  const topLosses = [...settled].filter(b => b.result === "loss").sort((a, b) => a.profit - b.profit).slice(0, 5);

  return (
    <div style={{ padding: "32px 36px", maxWidth: "1200px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>Analytics</h1>
        <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
          Detailed performance breakdown across rounds, bet types, and books
        </div>
      </div>

      {/* P&L by Round */}
      <div style={{ ...CARD, marginBottom: "24px" }}>
        <div style={SECTION_TITLE}>P&L by Round</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={pnlByRound} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="round" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip content={<DarkTooltip />} />
            <Bar dataKey="profit" name="P&L" radius={[4, 4, 0, 0]}>
              {pnlByRound.map((entry, i) => (
                <Cell key={i} fill={entry.profit >= 0 ? "#10b981" : "#ef4444"} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Two-column: Bet Type + Sport */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        {/* ROI by Bet Type */}
        <div style={CARD}>
          <div style={SECTION_TITLE}>ROI by Bet Type</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {byBetType.sort((a, b) => b.roi - a.roi).map(bt => (
              <div key={bt.type}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>{betTypeLabel(bt.type)}</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: bt.roi >= 0 ? "var(--green)" : "var(--red)" }}>
                    {bt.roi >= 0 ? "+" : ""}{bt.roi.toFixed(1)}%
                  </span>
                </div>
                <div style={{ background: "var(--surface-2)", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                  <div style={{
                    width: `${Math.min(Math.abs(bt.roi) * 2, 100)}%`,
                    height: "100%",
                    background: bt.roi >= 0 ? "var(--green)" : "var(--red)",
                    borderRadius: "4px",
                    transition: "width 0.6s ease",
                  }} />
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  {bt.wins}W / {bt.total - bt.wins}L · {bt.total} bets · {fmtCurrency(bt.profit)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Win Rate by Sport */}
        <div style={CARD}>
          <div style={SECTION_TITLE}>Performance by Sport</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {bySport.map(s => (
              <div key={s.sport}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{
                      background: s.sport === "AFL" ? "rgba(59,130,246,0.15)" : "rgba(139,92,246,0.15)",
                      color: SPORT_COLORS[s.sport] ?? "#8892a4",
                      padding: "3px 8px", borderRadius: "5px", fontSize: "12px", fontWeight: 700,
                    }}>{s.sport}</span>
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{s.wins}W / {s.total - s.wins}L</span>
                  </div>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: s.winRate >= 50 ? "var(--green)" : "var(--red)" }}>
                    {s.winRate.toFixed(0)}%
                  </span>
                </div>
                <div style={{ background: "var(--surface-2)", borderRadius: "4px", height: "8px", overflow: "hidden" }}>
                  <div style={{
                    width: `${s.winRate}%`, height: "100%",
                    background: SPORT_COLORS[s.sport] ?? "#8892a4",
                    borderRadius: "4px", transition: "width 0.6s ease",
                  }} />
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "6px" }}>
                  P&L: <span style={{ color: s.profit >= 0 ? "var(--green)" : "var(--red)", fontWeight: 600 }}>{fmtCurrency(s.profit)}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "24px", borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
            <div style={SECTION_TITLE}>Profit by Sportsbook</div>
            {bySportsbook.map(s => (
              <div key={s.book} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontSize: "13px", color: "var(--text-primary)" }}>{s.book}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{s.bets} bets · ROI: {s.roi >= 0 ? "+" : ""}{s.roi.toFixed(1)}%</div>
                </div>
                <span style={{ fontWeight: 700, color: s.profit >= 0 ? "var(--green)" : "var(--red)", fontSize: "14px" }}>
                  {fmtCurrency(s.profit)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Odds Distribution */}
      <div style={{ ...CARD, marginBottom: "24px" }}>
        <div style={SECTION_TITLE}>Odds Distribution & Win Rate</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={oddsDistribution} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="left" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
            <Tooltip content={<DarkTooltip />} />
            <Bar yAxisId="left" dataKey="count" name="Bets" fill="#3b82f6" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="winRate" name="Win Rate %" fill="#f59e0b" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Best / Worst bets */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <div style={CARD}>
          <div style={SECTION_TITLE}>Top 5 Wins</div>
          {topWins.map(bet => (
            <div key={bet.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ flex: 1, minWidth: 0, marginRight: "12px" }}>
                <div style={{ fontSize: "13px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bet.selection}</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{bet.event} · @{bet.odds.toFixed(2)}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ color: "var(--green)", fontWeight: 700 }}>{fmtCurrency(bet.profit)}</div>
                <BetBadge result="win" size="sm" />
              </div>
            </div>
          ))}
        </div>
        <div style={CARD}>
          <div style={SECTION_TITLE}>Top 5 Losses</div>
          {topLosses.map(bet => (
            <div key={bet.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ flex: 1, minWidth: 0, marginRight: "12px" }}>
                <div style={{ fontSize: "13px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bet.selection}</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{bet.event} · @{bet.odds.toFixed(2)}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ color: "var(--red)", fontWeight: 700 }}>{fmtCurrency(bet.profit)}</div>
                <BetBadge result="loss" size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
