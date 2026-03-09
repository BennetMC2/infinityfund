import betsData from "@/data/bets.json";
import { Bet } from "@/lib/stats";
import {
  calcPnLByRound, calcByBetType, calcBySport,
  calcBySportsbook, calcOddsDistribution
} from "@/lib/stats";
import AnalyticsClient from "./AnalyticsClient";

export default function AnalyticsPage() {
  const bets = betsData as Bet[];
  return (
    <AnalyticsClient
      bets={bets}
      pnlByRound={calcPnLByRound(bets)}
      byBetType={calcByBetType(bets)}
      bySport={calcBySport(bets)}
      bySportsbook={calcBySportsbook(bets)}
      oddsDistribution={calcOddsDistribution(bets)}
    />
  );
}
