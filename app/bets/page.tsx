import betsData from "@/data/bets.json";
import { Bet } from "@/lib/stats";
import BetsClient from "./BetsClient";

export default function BetsPage() {
  const bets = betsData as Bet[];
  return <BetsClient bets={bets} />;
}
