"use client";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, BarChart, Bar, Cell
} from "recharts";
import { fmtCurrency } from "@/lib/stats";

interface Props {
  rollingROI: { index: number; date: string; roi: number }[];
  unitsOverTime: { index: number; date: string; units: number; event: string }[];
  oddsBrackets: { label: string; bets: number; wins: number; winRate: number; profit: number; roi: number }[];
  cumulativeUnits: { index: number; date: string; cumUnits: number }[];
}

const SECTION_TITLE: React.CSSProperties = {
  fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)",
  textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "16px",
};

const CARD: React.CSSProperties = {
  background: "var(--surface)", border: "1px solid var(--border)",
  borderRadius: "12px", padding: "24px",
};

function DarkTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 14px" }}>
      {label && <div style={{ color: "var(--text-secondary)", fontSize: "11px", marginBottom: "4px" }}>Bet #{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "13px" }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
          {p.name.includes("ROI") || p.name.includes("%") ? "%" : p.name.includes("units") || p.name.includes("Units") ? "u" : ""}
        </div>
      ))}
    </div>
  );
}

export default function StrategyClient({ rollingROI, unitsOverTime, oddsBrackets, cumulativeUnits }: Props) {
  return (
    <div style={{ padding: "32px 36px", maxWidth: "1200px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>Strategy</h1>
        <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
          Trend analysis, odds efficiency, and bet sizing patterns
        </div>
      </div>

      {/* Rolling ROI */}
      <div style={{ ...CARD, marginBottom: "24px" }}>
        <div style={SECTION_TITLE}>Rolling ROI (8-Bet Window)</div>
        {rollingROI.length < 2 ? (
          <div style={{ textAlign: "center", color: "var(--text-secondary)", padding: "40px 0" }}>
            Need at least 8 settled bets for rolling ROI. ({rollingROI.length} so far)
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={rollingROI} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="index" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} tickLine={false} axisLine={false} label={{ value: "Bet #", position: "insideBottom", fill: "var(--text-secondary)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `${v.toFixed(0)}%`} />
              <Tooltip content={<DarkTooltip />} />
              <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1.5} />
              <Line
                type="monotone" dataKey="roi" name="ROI %"
                stroke="#f59e0b" strokeWidth={2.5}
                dot={{ fill: "#f59e0b", r: 3, strokeWidth: 0 }}
                activeDot={{ fill: "#f59e0b", r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Cumulative Units */}
      <div style={{ ...CARD, marginBottom: "24px" }}>
        <div style={SECTION_TITLE}>Cumulative Units P&L</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={cumulativeUnits} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="index" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}u`} />
            <Tooltip content={<DarkTooltip />} />
            <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1.5} />
            <Line
              type="monotone" dataKey="cumUnits" name="Cum. Units"
              stroke="#10b981" strokeWidth={2.5}
              dot={{ fill: "#10b981", r: 3, strokeWidth: 0 }}
              activeDot={{ fill: "#10b981", r: 5, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Two-column: Odds Bracket + Unit Sizing */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Odds Bracket Analysis */}
        <div style={CARD}>
          <div style={SECTION_TITLE}>Odds Bracket Analysis</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {oddsBrackets.filter(b => b.bets > 0).map(b => (
              <div key={b.label} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{b.label}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                      {b.bets} bets · {b.wins}W / {b.bets - b.wins}L · {b.winRate.toFixed(0)}% win rate
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, color: b.profit >= 0 ? "var(--green)" : "var(--red)", fontSize: "14px" }}>
                      {fmtCurrency(b.profit)}
                    </div>
                    <div style={{ fontSize: "11px", color: b.roi >= 0 ? "var(--green)" : "var(--red)" }}>
                      ROI: {b.roi >= 0 ? "+" : ""}{b.roi.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div style={{ background: "var(--surface-2)", borderRadius: "4px", height: "5px", overflow: "hidden" }}>
                  <div style={{
                    width: `${b.winRate}%`, height: "100%",
                    background: b.winRate >= 50 ? "var(--green)" : "var(--accent)",
                    borderRadius: "4px", transition: "width 0.6s ease",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bet Sizing */}
        <div style={CARD}>
          <div style={SECTION_TITLE}>Bet Sizing Over Time (Units)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={unitsOverTime} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="index" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}u`} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 14px" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px", maxWidth: "180px" }}>{d.event}</div>
                      <div style={{ color: "var(--accent)", fontWeight: 700 }}>{payload[0].value}u</div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="units" name="Units" fill="#f59e0b" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <div style={{ marginTop: "20px", padding: "14px", background: "var(--surface-2)", borderRadius: "8px" }}>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>SIZING SUMMARY</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {[
                { label: "0.5u bets", count: unitsOverTime.filter(b => b.units === 0.5).length },
                { label: "1.0u bets", count: unitsOverTime.filter(b => b.units === 1.0).length },
                { label: "1.5u bets", count: unitsOverTime.filter(b => b.units === 1.5).length },
                { label: "2.0u bets", count: unitsOverTime.filter(b => b.units === 2.0).length },
              ].map(item => (
                <div key={item.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)" }}>{item.count}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
