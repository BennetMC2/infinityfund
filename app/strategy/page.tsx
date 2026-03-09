import betsData from "@/data/bets.json";
import { Bet, calcRollingROI } from "@/lib/stats";
import StrategyClient from "./StrategyClient";

export default function StrategyPage() {
  const bets = betsData as Bet[];
  const settled = bets.filter(b => b.result !== "pending");
  const rollingROI = calcRollingROI(bets, 8);

  // Units per bet over time
  const unitsOverTime = [...settled]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((b, i) => ({ index: i + 1, date: b.date, units: b.units, event: b.event }));

  // Odds bracket analysis
  const brackets = [
    { label: "< 1.50", min: 0, max: 1.5 },
    { label: "1.50–1.80", min: 1.5, max: 1.8 },
    { label: "1.80–2.10", min: 1.8, max: 2.1 },
    { label: "2.10–2.50", min: 2.1, max: 2.5 },
    { label: "2.50+", min: 2.5, max: Infinity },
  ];
  const oddsBrackets = brackets.map(b => {
    const inBracket = settled.filter(bet => bet.odds >= b.min && bet.odds < b.max);
    const wins = inBracket.filter(bet => bet.result === "win");
    const staked = inBracket.reduce((s, bet) => s + bet.stake, 0);
    const profit = inBracket.reduce((s, bet) => s + bet.profit, 0);
    return {
      label: b.label,
      bets: inBracket.length,
      wins: wins.length,
      winRate: inBracket.length > 0 ? (wins.length / inBracket.length) * 100 : 0,
      profit,
      roi: staked > 0 ? (profit / staked) * 100 : 0,
    };
  });

  // Running units cumulative
  let cumUnits = 0;
  const cumulativeUnits = [...settled]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((b, i) => {
      cumUnits += b.profit / 100;
      return { index: i + 1, date: b.date, cumUnits: parseFloat(cumUnits.toFixed(2)) };
    });

  return (
    <StrategyClient
      rollingROI={rollingROI}
      unitsOverTime={unitsOverTime}
      oddsBrackets={oddsBrackets}
      cumulativeUnits={cumulativeUnits}
    />
  );
}
