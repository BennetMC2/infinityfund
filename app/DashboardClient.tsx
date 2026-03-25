"use client";
import { useState } from "react";
import { FundStats, Bet, FundConfig, fmtCurrency, fmtPct, betTypeLabel } from "@/lib/stats";
import KPICard from "@/components/KPICard";
import BetBadge from "@/components/BetBadge";
import SportBadge from "@/components/SportBadge";
import MemeModal from "@/components/MemeModal";
import {
  DollarSign, Percent, Trophy, TrendingUp, Zap, Award
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip
} from "recharts";

interface Props {
  stats: FundStats;
  equityCurve: { date: string; bankroll: number; label: string }[];
  recentBets: Bet[];
  config: FundConfig;
  overview: string;
}

const PAGE_STYLE = { padding: "32px 36px", maxWidth: "1200px" };
const SECTION_TITLE: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: "16px",
};

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--surface-2)", border: "1px solid var(--border)",
      borderRadius: "8px", padding: "10px 14px",
    }}>
      <div style={{ color: "var(--text-secondary)", fontSize: "12px" }}>Bankroll</div>
      <div style={{ color: "var(--accent)", fontWeight: 700, fontSize: "16px" }}>
        ${payload[0].value.toLocaleString("en-AU")}
      </div>
    </div>
  );
}

const PULSE_ANIMATION = `
  @keyframes pulse-dot {
    0%, 100% { opacity: 0.4; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.2); }
  }
  @keyframes wiggle {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(2px); }
    75% { transform: translateX(-2px); }
  }
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 0px rgba(245, 158, 11, 0); }
    50% { box-shadow: 0 0 12px rgba(245, 158, 11, 0.3); }
  }
`;

export default function DashboardClient({ stats, equityCurve, recentBets, config, overview }: Props) {
  const [showMemes, setShowMemes] = useState(false);
  const [hoverHeader, setHoverHeader] = useState(false);
  const pnlPositive = stats.totalProfit >= 0;

  return (
    <div style={PAGE_STYLE}>
      <style>{PULSE_ANIMATION}</style>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
          Dashboard
        </h1>
        <div
          style={{
            fontSize: "14px",
            color: hoverHeader ? "var(--accent)" : "var(--text-secondary)",
            marginTop: "4px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            width: "fit-content",
            padding: "6px 12px",
            borderRadius: "8px",
            transition: "all 0.2s ease",
            background: hoverHeader ? "var(--surface)" : "transparent",
            position: "relative",
            animation: "glow 2.5s ease-in-out infinite",
            border: hoverHeader ? "1px solid var(--accent)" : "1px solid transparent",
          }}
          onMouseEnter={() => setHoverHeader(true)}
          onMouseLeave={() => setHoverHeader(false)}
          onClick={() => setShowMemes(true)}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "6px", animation: hoverHeader ? "wiggle 0.5s ease-in-out infinite" : "none" }}>
            {config.fundName}
            <span style={{ display: "flex", gap: "2px", fontSize: "14px" }}>
              <span style={{ animation: "pulse-dot 1.2s ease-in-out infinite", animationDelay: "0s", color: "var(--accent)" }}>●</span>
              <span style={{ animation: "pulse-dot 1.2s ease-in-out infinite", animationDelay: "0.2s", color: "var(--accent)" }}>●</span>
              <span style={{ animation: "pulse-dot 1.2s ease-in-out infinite", animationDelay: "0.4s", color: "var(--accent)" }}>●</span>
            </span>
          </span>
          <span style={{ fontSize: "18px", animation: "pulse-dot 1.5s ease-in-out infinite" }}>
            🎬
          </span>
          <span>· {config.season} Season · Starting bankroll ${config.startingBankroll.toLocaleString("en-AU")}</span>
        </div>
      </div>

      <MemeModal isOpen={showMemes} onClose={() => setShowMemes(false)} />

      {/* INPUTS Section */}
      <div style={{ marginBottom: "24px" }}>
        <div style={SECTION_TITLE}>Inputs</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          <KPICard
            label="# Bets"
            value={stats.settledBets.toString()}
            sub={`${stats.pending} pending`}
            positive={null}
            icon={DollarSign}
            delay={0}
          />
          <KPICard
            label="Total Staked"
            value={`$${stats.totalStaked.toLocaleString("en-AU")}`}
            sub={`Avg: $${stats.avgStake.toLocaleString("en-AU", { maximumFractionDigits: 0 })}`}
            positive={null}
            icon={DollarSign}
            delay={80}
          />
        </div>
      </div>

      {/* OUTCOMES Section */}
      <div style={{ marginBottom: "24px" }}>
        <div style={SECTION_TITLE}>Outcomes</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          <KPICard
            label="Net Return"
            value={fmtCurrency(stats.totalProfit)}
            sub={`${stats.wins}W · ${stats.losses}L · ${stats.pushes}P`}
            positive={pnlPositive}
            icon={DollarSign}
            delay={0}
          />
          <KPICard
            label="Win %"
            value={`${stats.winRate.toFixed(1)}%`}
            sub={`Need ${stats.breakEvenWinRate.toFixed(1)}% to break even`}
            positive={null}
            icon={Percent}
            delay={80}
          />
          <KPICard
            label="ROI"
            value={fmtPct(stats.roi)}
            sub={`On $${stats.totalStaked.toLocaleString("en-AU")}`}
            positive={stats.roi >= 0}
            icon={TrendingUp}
            delay={160}
          />
        </div>
      </div>

      {/* OTHER Section */}
      <div style={{ marginBottom: "32px" }}>
        <div style={SECTION_TITLE}>Other</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          <KPICard
            label="Bankroll"
            value={`$${stats.currentBankroll.toLocaleString("en-AU")}`}
            sub={`Started at $${config.startingBankroll.toLocaleString("en-AU")}`}
            accent
            icon={Award}
            delay={0}
          />
          <KPICard
            label="Profit Factor"
            value={stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)}
            sub="Gross wins ÷ gross losses"
            positive={null}
            icon={Trophy}
            delay={80}
          />
        </div>
      </div>

      {/* Overview Card */}
      <div style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        borderLeft: "4px solid var(--accent)",
        padding: "24px",
        marginBottom: "32px",
      }}>
        <div style={SECTION_TITLE}>Fund Analysis</div>
        <div style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: "1.8", whiteSpace: "pre-line" }}>
          {overview}
        </div>
      </div>

      {/* Equity Curve */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "12px", padding: "24px", marginBottom: "32px",
      }}>
        <div style={SECTION_TITLE}>Bankroll Equity Curve</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={equityCurve} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="bankrollGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `$${(v / 1000).toFixed(1)}k`}
              domain={["auto", "auto"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="bankroll"
              stroke="#f59e0b"
              strokeWidth={2.5}
              fill="url(#bankrollGradient)"
              dot={{ fill: "#f59e0b", r: 3, strokeWidth: 0 }}
              activeDot={{ fill: "#f59e0b", r: 5, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Bets */}
      <div>
        <div style={SECTION_TITLE}>Recent Bets</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {recentBets.map(bet => (
            <div
              key={bet.id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                  <SportBadge sport={bet.sport} />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {bet.event}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  {bet.selection} · {betTypeLabel(bet.betType)} · @{bet.odds.toFixed(2)} · {bet.round}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: bet.result === "win" ? "var(--green)" : bet.result === "loss" ? "var(--red)" : "var(--text-secondary)",
                  marginBottom: "4px",
                }}>
                  {bet.result === "pending" ? "—" : fmtCurrency(bet.profit)}
                </div>
                <BetBadge result={bet.result} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
