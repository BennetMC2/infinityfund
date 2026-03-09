"use client";
import { useState, useMemo } from "react";
import { Bet, fmtCurrency, betTypeLabel } from "@/lib/stats";
import BetBadge from "@/components/BetBadge";
import SportBadge from "@/components/SportBadge";
import { ChevronUp, ChevronDown, Download, Search } from "lucide-react";

interface Props { bets: Bet[] }

type SortKey = keyof Bet;
type SortDir = "asc" | "desc";

const SELECT_STYLE: React.CSSProperties = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "var(--text-primary)",
  padding: "8px 12px",
  fontSize: "13px",
  outline: "none",
  cursor: "pointer",
};

const INPUT_STYLE: React.CSSProperties = {
  ...SELECT_STYLE,
  width: "220px",
};

export default function BetsClient({ bets }: Props) {
  const [sport, setSport] = useState("all");
  const [betType, setBetType] = useState("all");
  const [result, setResult] = useState("all");
  const [sportsbook, setSportsbook] = useState("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sports = ["all", ...Array.from(new Set(bets.map(b => b.sport)))];
  const betTypes = ["all", ...Array.from(new Set(bets.map(b => b.betType)))];
  const results = ["all", "win", "loss", "push", "pending"];
  const sportsbooks = ["all", ...Array.from(new Set(bets.map(b => b.sportsbook)))];

  const filtered = useMemo(() => {
    let out = [...bets];
    if (sport !== "all") out = out.filter(b => b.sport === sport);
    if (betType !== "all") out = out.filter(b => b.betType === betType);
    if (result !== "all") out = out.filter(b => b.result === result);
    if (sportsbook !== "all") out = out.filter(b => b.sportsbook === sportsbook);
    if (search) {
      const q = search.toLowerCase();
      out = out.filter(b =>
        b.event.toLowerCase().includes(q) ||
        b.selection.toLowerCase().includes(q) ||
        b.round.toLowerCase().includes(q)
      );
    }
    out.sort((a, b) => {
      const av = a[sortKey] as string | number;
      const bv = b[sortKey] as string | number;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return out;
  }, [bets, sport, betType, result, sportsbook, search, sortKey, sortDir]);

  const totalProfit = filtered
    .filter(b => b.result !== "pending")
    .reduce((s, b) => s + b.profit, 0);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  function exportCSV() {
    const cols = ["date", "sport", "round", "event", "betType", "selection", "odds", "units", "stake", "result", "profit", "sportsbook"];
    const rows = filtered.map(b => cols.map(c => JSON.stringify((b as unknown as Record<string,unknown>)[c] ?? "")).join(","));
    const csv = [cols.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "infinity-fund-bets.csv";
    a.click();
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp size={13} style={{ opacity: 0.25 }} />;
    return sortDir === "asc" ? <ChevronUp size={13} style={{ color: "var(--accent)" }} /> : <ChevronDown size={13} style={{ color: "var(--accent)" }} />;
  }

  const TH: React.CSSProperties = {
    padding: "12px 14px",
    fontSize: "11px",
    fontWeight: 600,
    color: "var(--text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    textAlign: "left",
    borderBottom: "1px solid var(--border)",
    whiteSpace: "nowrap",
    cursor: "pointer",
    userSelect: "none",
  };

  const TD: React.CSSProperties = {
    padding: "13px 14px",
    fontSize: "13px",
    color: "var(--text-primary)",
    borderBottom: "1px solid var(--border)",
  };

  return (
    <div style={{ padding: "32px 36px", maxWidth: "1300px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>Bet Log</h1>
          <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
            {filtered.length} bets · P&L: <span style={{ color: totalProfit >= 0 ? "var(--green)" : "var(--red)", fontWeight: 600 }}>{fmtCurrency(totalProfit)}</span>
          </div>
        </div>
        <button
          onClick={exportCSV}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "var(--surface-2)", border: "1px solid var(--border)",
            borderRadius: "8px", color: "var(--text-primary)", padding: "9px 16px",
            fontSize: "13px", cursor: "pointer", fontWeight: 500,
          }}
        >
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
          <input
            style={{ ...INPUT_STYLE, paddingLeft: "32px" }}
            placeholder="Search events..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select style={SELECT_STYLE} value={sport} onChange={e => setSport(e.target.value)}>
          {sports.map(s => <option key={s} value={s}>{s === "all" ? "All Sports" : s}</option>)}
        </select>
        <select style={SELECT_STYLE} value={betType} onChange={e => setBetType(e.target.value)}>
          {betTypes.map(t => <option key={t} value={t}>{t === "all" ? "All Bet Types" : betTypeLabel(t)}</option>)}
        </select>
        <select style={SELECT_STYLE} value={result} onChange={e => setResult(e.target.value)}>
          {results.map(r => <option key={r} value={r}>{r === "all" ? "All Results" : r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
        <select style={SELECT_STYLE} value={sportsbook} onChange={e => setSportsbook(e.target.value)}>
          {sportsbooks.map(s => <option key={s} value={s}>{s === "all" ? "All Sportsbooks" : s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        overflow: "hidden",
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                <th style={TH} onClick={() => toggleSort("date")}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>Date <SortIcon col="date" /></span>
                </th>
                <th style={TH}>Sport</th>
                <th style={TH} onClick={() => toggleSort("event")}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>Event <SortIcon col="event" /></span>
                </th>
                <th style={TH}>Selection</th>
                <th style={TH}>Type</th>
                <th style={TH} onClick={() => toggleSort("odds")}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>Odds <SortIcon col="odds" /></span>
                </th>
                <th style={TH} onClick={() => toggleSort("stake")}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>Stake <SortIcon col="stake" /></span>
                </th>
                <th style={TH}>Book</th>
                <th style={TH}>Result</th>
                <th style={{ ...TH, textAlign: "right" }} onClick={() => toggleSort("profit")}>
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>P&L <SortIcon col="profit" /></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((bet, i) => (
                <tr
                  key={bet.id}
                  style={{
                    background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)")}
                >
                  <td style={{ ...TD, color: "var(--text-secondary)", fontSize: "12px", whiteSpace: "nowrap" }}>{bet.date}</td>
                  <td style={TD}><SportBadge sport={bet.sport} /></td>
                  <td style={{ ...TD, maxWidth: "220px" }}>
                    <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bet.event}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>{bet.round}</div>
                  </td>
                  <td style={{ ...TD, maxWidth: "180px" }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "13px" }}>{bet.selection}</div>
                  </td>
                  <td style={TD}>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{betTypeLabel(bet.betType)}</span>
                  </td>
                  <td style={{ ...TD, fontWeight: 600 }}>{bet.odds.toFixed(2)}</td>
                  <td style={{ ...TD, color: "var(--text-secondary)" }}>${bet.stake}</td>
                  <td style={{ ...TD, fontSize: "12px", color: "var(--text-secondary)" }}>{bet.sportsbook}</td>
                  <td style={TD}><BetBadge result={bet.result} size="sm" /></td>
                  <td style={{
                    ...TD,
                    textAlign: "right",
                    fontWeight: 700,
                    color: bet.result === "win" ? "var(--green)" : bet.result === "loss" ? "var(--red)" : "var(--text-secondary)",
                    fontSize: "14px",
                  }}>
                    {bet.result === "pending" ? "—" : fmtCurrency(bet.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
            No bets match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
