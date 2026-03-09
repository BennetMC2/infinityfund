import betsData from "@/data/bets.json";
import configData from "@/data/config.json";
import snapshotsData from "@/data/weekly-snapshots.json";
import { calcStats, calcEquityCurve } from "@/lib/stats";
import { Bet, WeeklySnapshot, FundConfig } from "@/lib/stats";
import DashboardClient from "./DashboardClient";

export default function DashboardPage() {
  const bets = betsData as Bet[];
  const config = configData as FundConfig;
  const snapshots = snapshotsData as WeeklySnapshot[];
  const stats = calcStats(bets, config.startingBankroll);
  const equityCurve = calcEquityCurve(bets, config.startingBankroll, snapshots);
  const recentBets = [...bets]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <DashboardClient
      stats={stats}
      equityCurve={equityCurve}
      recentBets={recentBets}
      config={config}
    />
  );
}
