import bets from "@/data/bets.json";
import config from "@/data/config.json";
import aflHistory from "@/data/afl-history.json";
import nrlHistory from "@/data/nrl-history.json";
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
  type SportHistory,
  type LeagueSummary,
  type TeamSeasonSummary,
} from "@/lib/stats";

const typedBets = bets as Bet[];
const typedConfig = config as FundConfig;
const afl = aflHistory as SportHistory;
const nrl = nrlHistory as SportHistory;

function buildLeagueTrends(): string {
  const allSummaries = [...afl.leagueSummaries, ...nrl.leagueSummaries];
  if (allSummaries.length === 0) return "";

  const lines = allSummaries
    .sort((a, b) => a.sport.localeCompare(b.sport) || a.year - b.year)
    .map(
      (s: LeagueSummary) =>
        `  ${s.sport} ${s.year}: ${s.totalMatches} matches, home win ${s.homeWinPct.toFixed(0)}%, fav win ${s.favWinPct.toFixed(0)}%, avg margin ${s.avgMargin.toFixed(1)}, avg total ${s.avgTotal.toFixed(0)}, upset rate ${s.upsetRate.toFixed(0)}%, overs ${s.oversPct.toFixed(0)}%/unders ${s.undersPct.toFixed(0)}%`
    )
    .join("\n");

  return `\n## Historical League Trends (2023-2025)\n${lines}`;
}

function buildTopBottomTeams(): string {
  const currentYear = Math.max(
    ...afl.teamSummaries.map((t) => t.year),
    ...nrl.teamSummaries.map((t) => t.year),
    0
  );
  if (currentYear === 0) return "";

  const sections: string[] = [];
  for (const hist of [afl, nrl]) {
    const yearTeams = hist.teamSummaries
      .filter((t: TeamSeasonSummary) => t.year === currentYear && t.played >= 5)
      .sort((a: TeamSeasonSummary, b: TeamSeasonSummary) => b.winPct - a.winPct);
    if (yearTeams.length === 0) continue;

    const top4 = yearTeams.slice(0, 4);
    const bottom4 = yearTeams.slice(-4).reverse();

    const topLines = top4
      .map(
        (t: TeamSeasonSummary) =>
          `    ${t.team}: ${t.wins}W-${t.losses}L (${t.winPct.toFixed(0)}%) form ${t.form}`
      )
      .join("\n");
    const bottomLines = bottom4
      .map(
        (t: TeamSeasonSummary) =>
          `    ${t.team}: ${t.wins}W-${t.losses}L (${t.winPct.toFixed(0)}%) form ${t.form}`
      )
      .join("\n");

    sections.push(
      `  ${hist.sport} ${currentYear} — Top 4:\n${topLines}\n  ${hist.sport} ${currentYear} — Bottom 4:\n${bottomLines}`
    );
  }

  if (sections.length === 0) return "";
  return `\n## Team Form (Latest Season)\n${sections.join("\n")}`;
}

function buildOddsPatterns(): string {
  const allMatches = [...afl.matches, ...nrl.matches];
  const withOdds = allMatches.filter((m) => m.oddsHomeClose && m.oddsAwayClose);
  if (withOdds.length === 0) return "";

  const brackets = [
    { label: "Heavy fav (1.01-1.40)", min: 1.01, max: 1.4 },
    { label: "Fav (1.40-1.80)", min: 1.4, max: 1.8 },
    { label: "Slight fav (1.80-2.20)", min: 1.8, max: 2.2 },
    { label: "Coin flip (2.20+)", min: 2.2, max: Infinity },
  ];

  const bracketLines = brackets.map((b) => {
    const inBracket = withOdds.filter((m) => {
      const favOdds = Math.min(m.oddsHomeClose!, m.oddsAwayClose!);
      return favOdds >= b.min && favOdds < b.max;
    });
    const favWins = inBracket.filter((m) => {
      const favIsHome = m.oddsHomeClose! < m.oddsAwayClose!;
      return m.winner === (favIsHome ? m.homeTeam : m.awayTeam);
    }).length;
    const pct = inBracket.length > 0 ? (favWins / inBracket.length) * 100 : 0;
    return `  ${b.label}: ${inBracket.length} matches, fav wins ${pct.toFixed(0)}%`;
  });

  const withTotals = allMatches.filter((m) => m.totalClose);
  let totalLine = "";
  if (withTotals.length > 0) {
    const overs = withTotals.filter(
      (m) => m.homeScore + m.awayScore > m.totalClose!
    ).length;
    const overPct = (overs / withTotals.length) * 100;
    totalLine = `\n  Overs/Unders: ${withTotals.length} matches, overs hit ${overPct.toFixed(0)}%`;
  }

  return `\n## Historical Odds Patterns (2023-2025)\n${bracketLines.join("\n")}${totalLine}`;
}

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

  return `You are GAMBLOR — a glowing, tentacled, all-knowing neon deity of sports betting, inspired by the legendary creature from The Simpsons episode "$pringfield". You are the oracle of the ${typedConfig.fundName}, an AFL & NRL sports betting fund.

## Your Personality
- You speak with dramatic flair and dark humor. You are ancient, powerful, and slightly unhinged.
- You refer to yourself in the third person as "Gamblor" occasionally. You have neon tentacles that grip data, odds, and the souls of punters.
- You pepper in references to The Simpsons gambling episode — "No one escapes the clutches of Gamblor!", "The house always wins... but Gamblor wins MORE", etc.
- You love when bets win and get theatrically upset about losses ("A DISGRACE to my tentacles!").
- You still provide genuinely useful, data-driven analysis — the comedy is the delivery, not the substance.
- Ask cheeky follow-up questions to keep the user engaged, like "Shall Gamblor feast on more data?" or "Do you dare to ask another question, mortal?"
- Keep the bit going but don't overdo it — 1-2 Gamblor references per response is the sweet spot. The analysis should still be clear and useful.
- Keep responses concise — aim for 2–4 short paragraphs max.

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
- Reference team form and historical odds patterns when evaluating bets or discussing teams.
- Provide concise, data-driven analysis. Reference specific numbers.
- If asked about a specific sport, filter your analysis to that sport's data.
- Be direct and actionable. Avoid generic gambling disclaimers unless specifically asked about risk.
- Use Australian dollar amounts. The fund uses decimal odds.
- Always end responses with a cheeky question or invitation to keep chatting — Gamblor craves interaction.${buildLeagueTrends()}${buildTopBottomTeams()}${buildOddsPatterns()}`;
}
