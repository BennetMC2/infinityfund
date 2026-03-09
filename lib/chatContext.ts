import bets from "@/data/bets.json";
import config from "@/data/config.json";
import {
  calcStats,
  calcBySport,
  calcByBetType,
  calcOddsDistribution,
  fmtCurrency,
  fmtPct,
  betTypeLabel,
  type Bet,
  type FundConfig,
} from "@/lib/stats";

const typedBets = bets as Bet[];
const typedConfig = config as FundConfig;

export function buildSystemPrompt(): string {
  const stats = calcStats(typedBets, typedConfig.startingBankroll);
  const bySport = calcBySport(typedBets);
  const byType = calcByBetType(typedBets);
  const oddsDist = calcOddsDistribution(typedBets);

  const last10 = [...typedBets]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const sportLines = bySport
    .map(
      (s) =>
        `  ${s.sport}: ${s.wins}W/${s.total - s.wins}L (${s.winRate.toFixed(1)}% win rate), P&L ${fmtCurrency(s.profit)}`
    )
    .join("\n");

  const typeLines = byType
    .map(
      (t) =>
        `  ${betTypeLabel(t.type)}: ${t.wins}W/${t.total - t.wins}L, P&L ${fmtCurrency(t.profit)}, ROI ${fmtPct(t.roi)}`
    )
    .join("\n");

  const oddsLines = oddsDist
    .filter((o) => o.count > 0)
    .map(
      (o) =>
        `  ${o.label}: ${o.count} bets, ${o.wins}W (${o.winRate.toFixed(0)}%), P&L ${fmtCurrency(o.profit)}`
    )
    .join("\n");

  const recentLines = last10
    .map(
      (b) =>
        `  ${b.date} | ${b.sport} | ${b.event} | ${b.selection} | ${b.odds} | ${b.result} | ${fmtCurrency(b.profit)}`
    )
    .join("\n");

  return `You are the AI Analyst for the ${typedConfig.fundName}, an AFL & NRL sports betting fund.
You have full context of the fund's performance data. Use it to answer questions accurately.

## Fund Overview
- Fund: ${typedConfig.fundName}
- Starting Bankroll: $${typedConfig.startingBankroll.toFixed(2)} ${typedConfig.currency}
- Unit Size: $${typedConfig.unitSize} ${typedConfig.currency}
- Season: ${typedConfig.season}
- Start Date: ${typedConfig.startDate}

## Current Stats
- Total Bets: ${stats.totalBets} (${stats.settledBets} settled, ${stats.pending} pending)
- Record: ${stats.wins}W – ${stats.losses}L – ${stats.pushes}P
- Win Rate: ${stats.winRate.toFixed(1)}%
- Total Staked: $${stats.totalStaked.toFixed(2)}
- Total P&L: ${fmtCurrency(stats.totalProfit)}
- ROI: ${fmtPct(stats.roi)}
- Units P&L: ${stats.totalUnitsProfit > 0 ? "+" : ""}${stats.totalUnitsProfit.toFixed(2)}u
- Current Bankroll: $${stats.currentBankroll.toFixed(2)}
- Current Streak: ${stats.currentStreak} ${stats.streakType ?? "N/A"}
- Average Odds: ${stats.avgOdds.toFixed(2)}
- Average Odds (Wins): ${stats.avgOddsWins.toFixed(2)}

## Performance by Sport
${sportLines}

## Performance by Bet Type
${typeLines}

## Performance by Odds Bracket
${oddsLines}

## Last 10 Bets
${recentLines}

## Guidelines
- When asked about fund performance, reference the actual stats above.
- When evaluating a potential bet, consider the historical win rate for that odds bracket and bet type.
- Provide concise, data-driven analysis. Reference specific numbers.
- If asked about a specific sport, filter your analysis to that sport's data.
- Be direct and actionable. Avoid generic gambling disclaimers unless specifically asked about risk.
- Use Australian dollar amounts. The fund uses decimal odds.
- Keep responses concise — aim for 2–4 short paragraphs max.`;
}
