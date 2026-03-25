export type BetResult = 'win' | 'loss' | 'push' | 'pending';
export type BetType = 'h2h' | 'line' | 'total' | 'multi' | 'sgm' | 'prop' | 'outright';
export type Sport = 'AFL' | 'NRL' | 'Soccer';

export interface HistoricalMatch {
  date: string;
  year: number;
  round: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  venue: string;
  margin: number;
  winner: string | null;
  sport: Sport;
  oddsHomeClose?: number;
  oddsAwayClose?: number;
  lineHomeClose?: number;
  totalClose?: number;
}

export interface TeamSeasonSummary {
  team: string;
  year: number;
  sport: Sport;
  wins: number;
  losses: number;
  draws: number;
  played: number;
  winPct: number;
  homeRecord: string;
  awayRecord: string;
  pointsFor: number;
  pointsAgainst: number;
  avgMargin: number;
  form: string;
  coverRate: number;
}

export interface LeagueSummary {
  year: number;
  sport: Sport;
  totalMatches: number;
  homeWinPct: number;
  favWinPct: number;
  avgMargin: number;
  avgTotal: number;
  upsetRate: number;
  oversPct: number;
  undersPct: number;
}

export interface SportHistory {
  sport: Sport;
  matches: HistoricalMatch[];
  teamSummaries: TeamSeasonSummary[];
  leagueSummaries: LeagueSummary[];
}

export interface Bet {
  id: string;
  date: string;
  sport: Sport;
  round: string;
  event: string;
  betType: BetType;
  selection: string;
  odds: number;
  units: number;
  stake: number;
  toWin: number;
  result: BetResult;
  profit: number;
  sportsbook: string;
  notes: string;
}

export interface WeeklySnapshot {
  week: string;
  date: string;
  bankroll: number;
}

export interface FundConfig {
  fundName: string;
  startingBankroll: number;
  unitSize: number;
  currency: string;
  startDate: string;
  season: string;
}

export interface FundStats {
  totalBets: number;
  settledBets: number;
  wins: number;
  losses: number;
  pushes: number;
  pending: number;
  winRate: number;
  totalStaked: number;
  totalProfit: number;
  roi: number;
  totalUnitsProfit: number;
  currentBankroll: number;
  currentStreak: number;
  streakType: 'win' | 'loss' | null;
  bestBet: Bet | null;
  worstBet: Bet | null;
  avgOdds: number;
  avgOddsWins: number;
  bankrollGrowth: number;
  profitFactor: number;
  maxDrawdown: number;
  avgStake: number;
  breakEvenWinRate: number;
}

export function calcStats(bets: Bet[], startingBankroll: number): FundStats {
  const settled = bets.filter(b => b.result !== 'pending');
  const wins = settled.filter(b => b.result === 'win');
  const losses = settled.filter(b => b.result === 'loss');
  const pushes = settled.filter(b => b.result === 'push');
  const pending = bets.filter(b => b.result === 'pending');

  const totalStaked = settled.reduce((sum, b) => sum + b.stake, 0);
  const totalProfit = settled.reduce((sum, b) => sum + b.profit, 0);
  const totalUnitsProfit = settled.reduce((sum, b) => sum + (b.profit / 100), 0);
  const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;
  const winRate = settled.length > 0 ? (wins.length / settled.length) * 100 : 0;
  const currentBankroll = startingBankroll + totalProfit;

  // Current streak
  const sortedSettled = [...settled].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let streak = 0;
  let streakType: 'win' | 'loss' | null = null;
  if (sortedSettled.length > 0) {
    streakType = sortedSettled[0].result === 'win' ? 'win' : 'loss';
    for (const bet of sortedSettled) {
      if (bet.result === streakType) streak++;
      else break;
    }
  }

  const bestBet = wins.length > 0 ? wins.reduce((best, b) => b.profit > best.profit ? b : best) : null;
  const worstBet = losses.length > 0 ? losses.reduce((worst, b) => b.profit < worst.profit ? b : worst) : null;

  const avgOdds = settled.length > 0 ? settled.reduce((sum, b) => sum + b.odds, 0) / settled.length : 0;
  const avgOddsWins = wins.length > 0 ? wins.reduce((sum, b) => sum + b.odds, 0) / wins.length : 0;
  const bankrollGrowth = startingBankroll > 0 ? (totalProfit / startingBankroll) * 100 : 0;

  // Calculate profit factor (gross wins / gross losses)
  const totalWinnings = wins.reduce((sum, b) => sum + b.profit, 0);
  const totalLosses = Math.abs(losses.reduce((sum, b) => sum + b.profit, 0));
  const profitFactor = totalLosses > 0 ? totalWinnings / totalLosses : (totalWinnings > 0 ? Infinity : 0);

  // Calculate max drawdown
  const sortedBets = [...settled].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let runningBankroll = startingBankroll;
  let peakBankroll = startingBankroll;
  let maxDrawdown = 0;
  for (const bet of sortedBets) {
    runningBankroll += bet.profit;
    if (runningBankroll > peakBankroll) peakBankroll = runningBankroll;
    const drawdown = peakBankroll - runningBankroll;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  // Calculate average stake
  const avgStake = settled.length > 0 ? totalStaked / settled.length : 0;

  // Calculate break-even win rate at average odds
  const breakEvenWinRate = avgOdds > 0 ? (1 / avgOdds) * 100 : 0;

  return {
    totalBets: bets.length,
    settledBets: settled.length,
    wins: wins.length,
    losses: losses.length,
    pushes: pushes.length,
    pending: pending.length,
    winRate,
    totalStaked,
    totalProfit,
    roi,
    totalUnitsProfit,
    currentBankroll,
    currentStreak: streak,
    streakType,
    bestBet,
    worstBet,
    avgOdds,
    avgOddsWins,
    bankrollGrowth,
    profitFactor,
    maxDrawdown,
    avgStake,
    breakEvenWinRate,
  };
}

export function generateOverview(bets: Bet[], stats: FundStats, config: FundConfig): string {
  // Overall verdict
  const netReturn = stats.totalProfit >= 0 ? `+$${stats.totalProfit.toLocaleString()}` : `-$${Math.abs(stats.totalProfit).toLocaleString()}`;
  const fundStatus = stats.totalProfit >= 0 ? "profit" : "drawdown";
  const healthIcon = stats.totalProfit >= 0 ? "✓" : "⚠";

  // Win rate analysis
  const winDiff = stats.winRate - stats.breakEvenWinRate;
  const winDeviation = Math.abs(winDiff).toFixed(1);
  const winContext = winDiff > 0
    ? `${winDeviation}% above break-even (strong discipline)`
    : `${winDeviation}% below break-even (tightening needed)`;

  // Performance by sport & bet type
  const byBetType = calcByBetType(bets);
  const bySport = calcBySport(bets);

  const bestBetType = byBetType.length > 0 ? byBetType.reduce((best, curr) => curr.profit > best.profit ? curr : best) : null;
  const worstBetType = byBetType.length > 0 ? byBetType.reduce((worst, curr) => curr.profit < worst.profit ? curr : worst) : null;

  const bestSport = bySport.length > 0 ? bySport.reduce((best, curr) => curr.profit > best.profit ? curr : best) : null;
  const worstSport = bySport.length > 0 ? bySport.reduce((worst, curr) => curr.profit < worst.profit ? curr : worst) : null;

  // Build narrative
  const lines: string[] = [];

  // Opening summary
  lines.push(
    `${healthIcon} **Fund Status:** The Infinity Fund is currently in ${fundStatus}, having returned ${netReturn} across ${stats.settledBets} settled bets with an ROI of ${fmtPct(stats.roi)}.`
  );
  lines.push("");

  // Performance details
  lines.push(
    `**Performance Analysis:** Win rate is sitting at ${stats.winRate.toFixed(1)}%, which is ${winContext} — your average odds are ${stats.avgOdds.toFixed(2)}. This suggests your bet selection is ${winDiff > -5 ? "reasonably disciplined" : "needs refinement"}. The profit factor of ${stats.profitFactor === Infinity ? "infinite (all wins)" : stats.profitFactor.toFixed(2)}x indicates your winning bets are ${stats.profitFactor > 1.5 ? "substantially outpacing" : stats.profitFactor > 1.0 ? "modestly outpacing" : "underperforming relative to"} your losses.`
  );
  lines.push("");

  // Sport breakdown
  if (bestSport) {
    lines.push(
      `**By Sport:** ${bestSport.sport} is your strongest market (+$${bestSport.profit.toLocaleString()} across ${bestSport.total} bets, ${bestSport.winRate.toFixed(1)}% win rate).${worstSport && worstSport.profit < bestSport.profit ? ` ${worstSport.sport} is lagging behind at ${worstSport.profit >= 0 ? "+" : ""}$${worstSport.profit.toLocaleString()}.` : ""}`
    );
    lines.push("");
  }

  // Bet type breakdown
  if (bestBetType) {
    lines.push(
      `**By Bet Type:** ${betTypeLabel(bestBetType.type)} is your best performer (+$${bestBetType.profit.toLocaleString()} · ${((bestBetType.wins / bestBetType.total) * 100).toFixed(0)}% hits).${worstBetType && worstBetType.profit < 0 ? ` ${betTypeLabel(worstBetType.type).toLowerCase()}s are a concern, down -$${Math.abs(worstBetType.profit).toLocaleString()} — consider reducing exposure here.` : ""}`
    );
    lines.push("");
  }

  // Risk metrics
  lines.push(
    `**Risk Profile:** Max drawdown is $${stats.maxDrawdown.toLocaleString()}, representing ${((stats.maxDrawdown / stats.currentBankroll) * 100).toFixed(1)}% of current bankroll. Current bankroll stands at $${stats.currentBankroll.toLocaleString()} (${fmtPct(stats.bankrollGrowth)} growth from starting capital of $${config.startingBankroll.toLocaleString()}).`
  );
  lines.push("");

  // Momentum
  if (stats.streakType === "win") {
    lines.push(`**Momentum:** You're riding a ${stats.currentStreak}-bet winning streak. Momentum is positive — maintain your current approach and stake sizing.`);
  } else if (stats.streakType === "loss") {
    lines.push(`**Momentum:** Currently in a ${stats.currentStreak}-bet losing streak. This is a critical moment — review your recent selections and ensure you're sticking to your process rather than chasing losses.`);
  } else {
    lines.push(`**Momentum:** No settled bets yet — focus on building a solid foundation with disciplined bet selection.`);
  }

  return lines.join("\n");
}

export function calcEquityCurve(bets: Bet[], startingBankroll: number, snapshots: WeeklySnapshot[]) {
  // Use snapshots if available, otherwise compute from bets
  if (snapshots.length > 0) {
    return [
      { date: 'Start', bankroll: startingBankroll, label: 'Start' },
      ...snapshots.map(s => ({
        date: s.date,
        bankroll: s.bankroll,
        label: s.week,
      })),
    ];
  }

  const sorted = [...bets]
    .filter(b => b.result !== 'pending')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let running = startingBankroll;
  const curve = [{ date: 'Start', bankroll: startingBankroll, label: 'Start' }];
  for (const bet of sorted) {
    running += bet.profit;
    curve.push({ date: bet.date, bankroll: running, label: bet.date });
  }
  return curve;
}

export function calcPnLByRound(bets: Bet[]) {
  const map: Record<string, { round: string; profit: number; bets: number }> = {};
  for (const bet of bets.filter(b => b.result !== 'pending')) {
    if (!map[bet.round]) map[bet.round] = { round: bet.round, profit: 0, bets: 0 };
    map[bet.round].profit += bet.profit;
    map[bet.round].bets += 1;
  }
  return Object.values(map);
}

export function calcByBetType(bets: Bet[]) {
  const map: Record<string, { type: string; wins: number; total: number; profit: number; roi: number }> = {};
  for (const bet of bets.filter(b => b.result !== 'pending')) {
    if (!map[bet.betType]) map[bet.betType] = { type: bet.betType, wins: 0, total: 0, profit: 0, roi: 0 };
    map[bet.betType].total += 1;
    map[bet.betType].profit += bet.profit;
    if (bet.result === 'win') map[bet.betType].wins += 1;
  }
  for (const key of Object.keys(map)) {
    const entry = map[key];
    const staked = bets.filter(b => b.betType === key && b.result !== 'pending').reduce((s, b) => s + b.stake, 0);
    entry.roi = staked > 0 ? (entry.profit / staked) * 100 : 0;
  }
  return Object.values(map);
}

export function calcBySport(bets: Bet[]) {
  const map: Record<string, { sport: string; wins: number; total: number; profit: number; winRate: number }> = {};
  for (const bet of bets.filter(b => b.result !== 'pending')) {
    if (!map[bet.sport]) map[bet.sport] = { sport: bet.sport, wins: 0, total: 0, profit: 0, winRate: 0 };
    map[bet.sport].total += 1;
    map[bet.sport].profit += bet.profit;
    if (bet.result === 'win') map[bet.sport].wins += 1;
  }
  for (const key of Object.keys(map)) {
    map[key].winRate = (map[key].wins / map[key].total) * 100;
  }
  return Object.values(map);
}

export function calcBySportsbook(bets: Bet[]) {
  const map: Record<string, { book: string; profit: number; bets: number; roi: number }> = {};
  for (const bet of bets.filter(b => b.result !== 'pending')) {
    if (!map[bet.sportsbook]) map[bet.sportsbook] = { book: bet.sportsbook, profit: 0, bets: 0, roi: 0 };
    map[bet.sportsbook].profit += bet.profit;
    map[bet.sportsbook].bets += 1;
  }
  for (const key of Object.keys(map)) {
    const staked = bets.filter(b => b.sportsbook === key && b.result !== 'pending').reduce((s, b) => s + b.stake, 0);
    map[key].roi = staked > 0 ? (map[key].profit / staked) * 100 : 0;
  }
  return Object.values(map).sort((a, b) => b.profit - a.profit);
}

export function calcOddsDistribution(bets: Bet[]) {
  const brackets = [
    { label: '1.20–1.50', min: 1.2, max: 1.5 },
    { label: '1.50–1.80', min: 1.5, max: 1.8 },
    { label: '1.80–2.10', min: 1.8, max: 2.1 },
    { label: '2.10–2.50', min: 2.1, max: 2.5 },
    { label: '2.50–3.50', min: 2.5, max: 3.5 },
    { label: '3.50+', min: 3.5, max: Infinity },
  ];
  const settled = bets.filter(b => b.result !== 'pending');
  return brackets.map(b => {
    const inBracket = settled.filter(bet => bet.odds >= b.min && bet.odds < b.max);
    const wins = inBracket.filter(bet => bet.result === 'win').length;
    const profit = inBracket.reduce((sum, bet) => sum + bet.profit, 0);
    return { label: b.label, count: inBracket.length, wins, winRate: inBracket.length > 0 ? (wins / inBracket.length) * 100 : 0, profit };
  });
}

export function calcRollingROI(bets: Bet[], window = 10) {
  const settled = [...bets.filter(b => b.result !== 'pending')]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return settled.slice(window - 1).map((_, i) => {
    const slice = settled.slice(i, i + window);
    const staked = slice.reduce((s, b) => s + b.stake, 0);
    const profit = slice.reduce((s, b) => s + b.profit, 0);
    return {
      index: i + window,
      date: settled[i + window - 1].date,
      roi: staked > 0 ? (profit / staked) * 100 : 0,
    };
  });
}

export function fmtCurrency(val: number) {
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : val > 0 ? '+' : '';
  return `${sign}$${abs.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function fmtPct(val: number) {
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(1)}%`;
}

export function betTypeLabel(type: string) {
  const labels: Record<string, string> = {
    h2h: 'Head-to-Head',
    line: 'Line',
    total: 'Total',
    multi: 'Multi',
    sgm: 'Same Game Multi',
    prop: 'Prop',
    outright: 'Outright',
  };
  return labels[type] ?? type;
}
