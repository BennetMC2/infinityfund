import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";
import type {
  Sport,
  HistoricalMatch,
  TeamSeasonSummary,
  LeagueSummary,
  SportHistory,
} from "../lib/stats";

const YEARS = [2023, 2024, 2025];
const __scriptDir = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__scriptDir, "..", "data");

// ---------------------------------------------------------------------------
// Team name normalization
// ---------------------------------------------------------------------------

const AFL_TEAM_MAP: Record<string, string> = {
  Adelaide: "Adelaide Crows",
  "Adelaide Crows": "Adelaide Crows",
  "Brisbane Lions": "Brisbane Lions",
  Brisbane: "Brisbane Lions",
  Carlton: "Carlton",
  "Carlton Blues": "Carlton",
  Collingwood: "Collingwood",
  "Collingwood Magpies": "Collingwood",
  Essendon: "Essendon",
  "Essendon Bombers": "Essendon",
  Fremantle: "Fremantle",
  "Fremantle Dockers": "Fremantle",
  Geelong: "Geelong Cats",
  "Geelong Cats": "Geelong Cats",
  "Gold Coast": "Gold Coast Suns",
  "Gold Coast Suns": "Gold Coast Suns",
  "Greater Western Sydney": "GWS Giants",
  GWS: "GWS Giants",
  "GWS Giants": "GWS Giants",
  Hawthorn: "Hawthorn",
  "Hawthorn Hawks": "Hawthorn",
  Melbourne: "Melbourne",
  "Melbourne Demons": "Melbourne",
  "North Melbourne": "North Melbourne",
  "North Melbourne Kangaroos": "North Melbourne",
  "Port Adelaide": "Port Adelaide",
  "Port Adelaide Power": "Port Adelaide",
  Richmond: "Richmond",
  "Richmond Tigers": "Richmond",
  "St Kilda": "St Kilda",
  "St Kilda Saints": "St Kilda",
  Sydney: "Sydney Swans",
  "Sydney Swans": "Sydney Swans",
  "West Coast": "West Coast Eagles",
  "West Coast Eagles": "West Coast Eagles",
  "Western Bulldogs": "Western Bulldogs",
  Footscray: "Western Bulldogs",
};

const NRL_TEAM_MAP: Record<string, string> = {
  Broncos: "Brisbane Broncos",
  "Brisbane Broncos": "Brisbane Broncos",
  Brisbane: "Brisbane Broncos",
  Raiders: "Canberra Raiders",
  "Canberra Raiders": "Canberra Raiders",
  Canberra: "Canberra Raiders",
  Bulldogs: "Canterbury Bulldogs",
  "Canterbury Bulldogs": "Canterbury Bulldogs",
  "Canterbury-Bankstown Bulldogs": "Canterbury Bulldogs",
  Canterbury: "Canterbury Bulldogs",
  Sharks: "Cronulla Sharks",
  "Cronulla Sharks": "Cronulla Sharks",
  "Cronulla-Sutherland Sharks": "Cronulla Sharks",
  Cronulla: "Cronulla Sharks",
  Titans: "Gold Coast Titans",
  "Gold Coast Titans": "Gold Coast Titans",
  "Sea Eagles": "Manly Sea Eagles",
  "Manly Sea Eagles": "Manly Sea Eagles",
  "Manly-Warringah Sea Eagles": "Manly Sea Eagles",
  Manly: "Manly Sea Eagles",
  Storm: "Melbourne Storm",
  "Melbourne Storm": "Melbourne Storm",
  Knights: "Newcastle Knights",
  "Newcastle Knights": "Newcastle Knights",
  Newcastle: "Newcastle Knights",
  Cowboys: "North Queensland Cowboys",
  "North Queensland Cowboys": "North Queensland Cowboys",
  "North Queensland": "North Queensland Cowboys",
  "North QLD Cowboys": "North Queensland Cowboys",
  Eels: "Parramatta Eels",
  "Parramatta Eels": "Parramatta Eels",
  Parramatta: "Parramatta Eels",
  Panthers: "Penrith Panthers",
  "Penrith Panthers": "Penrith Panthers",
  Penrith: "Penrith Panthers",
  Rabbitohs: "South Sydney Rabbitohs",
  "South Sydney Rabbitohs": "South Sydney Rabbitohs",
  "South Sydney": "South Sydney Rabbitohs",
  Dragons: "St George Illawarra Dragons",
  "St George Illawarra Dragons": "St George Illawarra Dragons",
  "St. George Illawarra Dragons": "St George Illawarra Dragons",
  "St George Dragons": "St George Illawarra Dragons",
  "St George Illawarra": "St George Illawarra Dragons",
  Roosters: "Sydney Roosters",
  "Sydney Roosters": "Sydney Roosters",
  Warriors: "NZ Warriors",
  "NZ Warriors": "NZ Warriors",
  "New Zealand Warriors": "NZ Warriors",
  "Wests Tigers": "Wests Tigers",
  Tigers: "Wests Tigers",
  Dolphins: "Dolphins",
  "The Dolphins": "Dolphins",
};

function normalizeAFL(name: string): string {
  return AFL_TEAM_MAP[name.trim()] ?? name.trim();
}

function normalizeNRL(name: string): string {
  return NRL_TEAM_MAP[name.trim()] ?? name.trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Squiggle API — AFL results
// ---------------------------------------------------------------------------

interface SquiggleGame {
  year: number;
  round: number;
  roundname: string;
  date: string;
  hteam: string;
  ateam: string;
  hscore: number;
  ascore: number;
  venue: string;
  complete: number;
  winner: string;
}

async function fetchAFLResults(): Promise<HistoricalMatch[]> {
  const matches: HistoricalMatch[] = [];

  for (const year of YEARS) {
    console.log(`  Fetching AFL ${year} from Squiggle...`);
    const url = `https://api.squiggle.com.au/?q=games;year=${year}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "InfinityFund/1.0 (sports-betting-dashboard)" },
    });
    if (!res.ok) {
      console.warn(`  ⚠ Squiggle ${year} returned ${res.status}, skipping`);
      continue;
    }
    const json = (await res.json()) as { games: SquiggleGame[] };

    for (const g of json.games) {
      if (g.complete !== 100) continue;
      const margin = Math.abs(g.hscore - g.ascore);
      const winner =
        g.hscore > g.ascore
          ? normalizeAFL(g.hteam)
          : g.ascore > g.hscore
            ? normalizeAFL(g.ateam)
            : null;

      matches.push({
        date: g.date.slice(0, 10),
        year: g.year,
        round: g.roundname ?? `Round ${g.round}`,
        homeTeam: normalizeAFL(g.hteam),
        awayTeam: normalizeAFL(g.ateam),
        homeScore: g.hscore,
        awayScore: g.ascore,
        venue: g.venue,
        margin,
        winner,
        sport: "AFL",
      });
    }
    console.log(`  ✓ AFL ${year}: ${json.games.filter((g) => g.complete === 100).length} matches`);
  }

  return matches;
}

// ---------------------------------------------------------------------------
// NRL.com Draw API — NRL results
// ---------------------------------------------------------------------------

interface NRLFixture {
  homeTeam: { nickName: string; score?: number };
  awayTeam: { nickName: string; score?: number };
  matchState: string;
  venue: string;
  clock: { kickOffTimeLong: string };
}

async function fetchNRLResults(): Promise<HistoricalMatch[]> {
  const matches: HistoricalMatch[] = [];

  for (const year of YEARS) {
    let yearCount = 0;
    for (let round = 1; round <= 31; round++) {
      const url = `https://www.nrl.com/draw/data?competition=111&season=${year}&round=${round}`;
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "InfinityFund/1.0 (sports-betting-dashboard)" },
        });
        if (!res.ok) continue;
        const json = (await res.json()) as { fixtures?: NRLFixture[] };
        const fixtures = json.fixtures ?? [];

        for (const m of fixtures) {
          if (m.matchState !== "FullTime") continue;
          const hScore = m.homeTeam.score ?? 0;
          const aScore = m.awayTeam.score ?? 0;
          const margin = Math.abs(hScore - aScore);
          const hName = normalizeNRL(m.homeTeam.nickName);
          const aName = normalizeNRL(m.awayTeam.nickName);
          const winner = hScore > aScore ? hName : aScore > hScore ? aName : null;

          const dateStr = parseNRLDate(m.clock.kickOffTimeLong, year);

          matches.push({
            date: dateStr,
            year,
            round: `Round ${round}`,
            homeTeam: hName,
            awayTeam: aName,
            homeScore: hScore,
            awayScore: aScore,
            venue: m.venue,
            margin,
            winner,
            sport: "NRL",
          });
          yearCount++;
        }
      } catch {
        // Round may not exist, continue
      }
      await sleep(100);
    }
    console.log(`  ✓ NRL ${year}: ${yearCount} matches`);
  }

  return matches;
}

function parseNRLDate(kickOff: string, fallbackYear: number): string {
  // kickOffTimeLong is ISO like "2024-03-03T02:30:00Z"
  // Convert to Australian local date (handles DST correctly)
  try {
    const d = new Date(kickOff);
    if (!isNaN(d.getTime())) {
      const parts = new Intl.DateTimeFormat("en-AU", {
        timeZone: "Australia/Sydney",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(d);
      const y = parts.find((p) => p.type === "year")!.value;
      const m = parts.find((p) => p.type === "month")!.value;
      const dd = parts.find((p) => p.type === "day")!.value;
      return `${y}-${m}-${dd}`;
    }
  } catch {
    // fall through
  }
  return `${fallbackYear}-01-01`;
}

// ---------------------------------------------------------------------------
// Excel odds data from aussportsbetting.com
// ---------------------------------------------------------------------------

interface OddsRow {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeOddsClose: number;
  awayOddsClose: number;
  homeLineClose: number;
  totalClose: number;
}

async function fetchExcelOdds(
  url: string,
  sport: Sport,
  normalize: (n: string) => string
): Promise<Map<string, OddsRow>> {
  console.log(`  Downloading ${sport} odds Excel...`);
  const map = new Map<string, OddsRow>();

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "InfinityFund/1.0 (sports-betting-dashboard)" },
    });
    if (!res.ok) {
      console.warn(`  ⚠ ${sport} odds download returned ${res.status}, skipping`);
      return map;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { range: 1 });

    for (const row of rows) {
      const dateRaw = row["Date"] as string | number | undefined;
      const homeTeam = normalize(String(row["Home Team"] ?? ""));
      const awayTeam = normalize(String(row["Away Team"] ?? ""));

      if (!homeTeam || !awayTeam || !dateRaw) continue;

      const date = parseExcelDate(dateRaw);
      const year = parseInt(date.slice(0, 4), 10);
      if (!YEARS.includes(year)) continue;

      const oddsRow: OddsRow = {
        date,
        homeTeam,
        awayTeam,
        homeOddsClose: parseFloat(String(row["Home Odds Close"] ?? 0)),
        awayOddsClose: parseFloat(String(row["Away Odds Close"] ?? 0)),
        homeLineClose: parseFloat(String(row["Home Line Close"] ?? 0)),
        totalClose: parseFloat(String(row["Total Score Close"] ?? 0)),
      };

      const key = `${date}|${homeTeam}|${awayTeam}`;
      map.set(key, oddsRow);
    }

    console.log(`  ✓ ${sport} odds: ${map.size} rows matched to ${YEARS.join("/")}`);
  } catch (err) {
    console.warn(`  ⚠ ${sport} odds parsing failed:`, err);
  }

  return map;
}

function parseExcelDate(val: string | number): string {
  if (typeof val === "number") {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(val);
    return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  // Try parsing as a string date
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return String(val).slice(0, 10);
}

// ---------------------------------------------------------------------------
// Merge odds into matches
// ---------------------------------------------------------------------------

function mergeOdds(matches: HistoricalMatch[], odds: Map<string, OddsRow>): void {
  let merged = 0;
  for (const m of matches) {
    const key = `${m.date}|${m.homeTeam}|${m.awayTeam}`;
    const o = odds.get(key);
    if (o) {
      m.oddsHomeClose = o.homeOddsClose || undefined;
      m.oddsAwayClose = o.awayOddsClose || undefined;
      m.lineHomeClose = o.homeLineClose || undefined;
      m.totalClose = o.totalClose || undefined;
      merged++;
    }
  }
  console.log(`  ✓ Merged odds for ${merged}/${matches.length} matches`);
}

// ---------------------------------------------------------------------------
// Compute team season summaries
// ---------------------------------------------------------------------------

function computeTeamSummaries(
  matches: HistoricalMatch[],
  sport: Sport
): TeamSeasonSummary[] {
  const summaries: TeamSeasonSummary[] = [];

  for (const year of YEARS) {
    const yearMatches = matches
      .filter((m) => m.year === year)
      .sort((a, b) => a.date.localeCompare(b.date));

    // Collect all teams that played this year
    const teams = new Set<string>();
    for (const m of yearMatches) {
      teams.add(m.homeTeam);
      teams.add(m.awayTeam);
    }

    for (const team of teams) {
      const teamMatches = yearMatches.filter(
        (m) => m.homeTeam === team || m.awayTeam === team
      );
      if (teamMatches.length === 0) continue;

      let wins = 0, losses = 0, draws = 0;
      let homeWins = 0, homeLosses = 0, awayWins = 0, awayLosses = 0;
      let pointsFor = 0, pointsAgainst = 0;
      let covers = 0, coverTotal = 0;

      for (const m of teamMatches) {
        const isHome = m.homeTeam === team;
        const teamScore = isHome ? m.homeScore : m.awayScore;
        const oppScore = isHome ? m.awayScore : m.homeScore;
        pointsFor += teamScore;
        pointsAgainst += oppScore;

        if (m.winner === team) {
          wins++;
          if (isHome) homeWins++;
          else awayWins++;
        } else if (m.winner === null) {
          draws++;
        } else {
          losses++;
          if (isHome) homeLosses++;
          else awayLosses++;
        }

        // Cover rate: did the team beat the spread?
        if (m.lineHomeClose != null) {
          coverTotal++;
          const spread = isHome ? m.lineHomeClose : -m.lineHomeClose;
          if (teamScore + spread > oppScore) covers++;
        }
      }

      const played = wins + losses + draws;
      const last5 = teamMatches.slice(-5).map((m) => {
        if (m.winner === team) return "W";
        if (m.winner === null) return "D";
        return "L";
      });

      summaries.push({
        team,
        year,
        sport,
        wins,
        losses,
        draws,
        played,
        winPct: played > 0 ? (wins / played) * 100 : 0,
        homeRecord: `${homeWins}-${homeLosses}`,
        awayRecord: `${awayWins}-${awayLosses}`,
        pointsFor,
        pointsAgainst,
        avgMargin: played > 0 ? (pointsFor - pointsAgainst) / played : 0,
        form: last5.join(""),
        coverRate: coverTotal > 0 ? (covers / coverTotal) * 100 : 0,
      });
    }
  }

  return summaries;
}

// ---------------------------------------------------------------------------
// Compute league summaries
// ---------------------------------------------------------------------------

function computeLeagueSummaries(
  matches: HistoricalMatch[],
  sport: Sport
): LeagueSummary[] {
  const summaries: LeagueSummary[] = [];

  for (const year of YEARS) {
    const yearMatches = matches.filter((m) => m.year === year);
    if (yearMatches.length === 0) continue;

    const total = yearMatches.length;
    const homeWins = yearMatches.filter(
      (m) => m.winner === m.homeTeam
    ).length;

    // Favourite = team with lower (shorter) odds
    let favWins = 0;
    let favTotal = 0;
    let oversHit = 0;
    let undersHit = 0;
    let totalWithTotals = 0;
    let totalSum = 0;
    let marginSum = 0;

    for (const m of yearMatches) {
      marginSum += m.margin;
      totalSum += m.homeScore + m.awayScore;

      if (m.oddsHomeClose && m.oddsAwayClose) {
        favTotal++;
        const favIsHome = m.oddsHomeClose < m.oddsAwayClose;
        const favTeam = favIsHome ? m.homeTeam : m.awayTeam;
        if (m.winner === favTeam) favWins++;
      }

      if (m.totalClose) {
        totalWithTotals++;
        const actual = m.homeScore + m.awayScore;
        if (actual > m.totalClose) oversHit++;
        else if (actual < m.totalClose) undersHit++;
      }
    }

    summaries.push({
      year,
      sport,
      totalMatches: total,
      homeWinPct: total > 0 ? (homeWins / total) * 100 : 0,
      favWinPct: favTotal > 0 ? (favWins / favTotal) * 100 : 0,
      avgMargin: total > 0 ? marginSum / total : 0,
      avgTotal: total > 0 ? totalSum / total : 0,
      upsetRate: favTotal > 0 ? ((favTotal - favWins) / favTotal) * 100 : 0,
      oversPct: totalWithTotals > 0 ? (oversHit / totalWithTotals) * 100 : 0,
      undersPct: totalWithTotals > 0 ? (undersHit / totalWithTotals) * 100 : 0,
    });
  }

  return summaries;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Infinity Fund Historical Data Pipeline ===\n");

  // 1. Fetch results
  console.log("[1/6] Fetching AFL results...");
  const aflMatches = await fetchAFLResults();

  console.log("\n[2/6] Fetching NRL results...");
  const nrlMatches = await fetchNRLResults();

  // 2. Fetch odds
  console.log("\n[3/6] Fetching AFL odds...");
  const aflOdds = await fetchExcelOdds(
    "https://www.aussportsbetting.com/historical_data/afl.xlsx",
    "AFL",
    normalizeAFL
  );

  console.log("\n[4/6] Fetching NRL odds...");
  const nrlOdds = await fetchExcelOdds(
    "https://www.aussportsbetting.com/historical_data/nrl.xlsx",
    "NRL",
    normalizeNRL
  );

  // 3. Merge
  console.log("\n[5/6] Merging odds data...");
  mergeOdds(aflMatches, aflOdds);
  mergeOdds(nrlMatches, nrlOdds);

  // 4. Compute summaries
  console.log("\n[6/6] Computing summaries...");
  const aflTeamSummaries = computeTeamSummaries(aflMatches, "AFL");
  const aflLeagueSummaries = computeLeagueSummaries(aflMatches, "AFL");
  const nrlTeamSummaries = computeTeamSummaries(nrlMatches, "NRL");
  const nrlLeagueSummaries = computeLeagueSummaries(nrlMatches, "NRL");

  // 5. Write output
  const aflHistory: SportHistory = {
    sport: "AFL",
    matches: aflMatches,
    teamSummaries: aflTeamSummaries,
    leagueSummaries: aflLeagueSummaries,
  };

  const nrlHistory: SportHistory = {
    sport: "NRL",
    matches: nrlMatches,
    teamSummaries: nrlTeamSummaries,
    leagueSummaries: nrlLeagueSummaries,
  };

  fs.writeFileSync(
    path.join(DATA_DIR, "afl-history.json"),
    JSON.stringify(aflHistory, null, 2)
  );
  fs.writeFileSync(
    path.join(DATA_DIR, "nrl-history.json"),
    JSON.stringify(nrlHistory, null, 2)
  );

  console.log("\n=== Done ===");
  console.log(`AFL: ${aflMatches.length} matches, ${aflTeamSummaries.length} team summaries, ${aflLeagueSummaries.length} league summaries`);
  console.log(`NRL: ${nrlMatches.length} matches, ${nrlTeamSummaries.length} team summaries, ${nrlLeagueSummaries.length} league summaries`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
