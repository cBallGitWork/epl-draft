import type { Fixture } from "../types";
import type { IntelManifest } from "./types";

// A club's cup and European ties off the sister repo's team match log, which FPL's fixture list leaves out.

/** Each competition the sister repo files beside the league, by its label, as a British reader says it. */
const CUP_NAMES: Readonly<Record<string, string>> = {
  champions_league: "Champions League",
  europa_league: "Europa League",
  conference_league: "Conference League",
  fa_cup: "FA Cup",
  efl_cup: "League Cup",
  community_shield: "Community Shield",
  super_cup: "Super Cup",
  club_world_cup: "Club World Cup",
};

/** The league's own label: its fixtures are FPL's, never the log's. */
const LEAGUE = "premier_league";

/** The log's statuses a fixture list prints: played, or still to come. */
const PLAYED = "completed";
const TO_COME = "scheduled";

/** One tie from one club's side. */
export interface CupTie {
  /** The sister repo's label, `champions_league`; `cupName` says it. */
  competition: string;
  /** ISO kickoff; null when the tie has no date yet. */
  kickoff: string | null;
  home: boolean;
  neutral: boolean;
  /** The opponent's FPL club code where FPL carries his club; null for anyone else. */
  opponentCode: number | null;
  /** The opponent as FotMob names him; null where nothing does. */
  opponentName: string | null;
  /** The club's goals first; null until it is played. */
  score: { for: number; against: number } | null;
}

export interface IntelCups {
  manifest: IntelManifest;
  /** Each club's ties, oldest first, keyed by FPL club code. */
  clubs: Record<string, CupTie[]>;
}

/** One row of the team match log, as far as the export reads it: one side of one match. */
export interface TmlRow {
  competition: string;
  team_id: string;
  opponent_team_id: string;
  opponent_name: string | null;
  is_home: boolean;
  neutral: boolean;
  status: string;
  kickoff_utc: string | null;
  goals_for: number | null;
  goals_against: number | null;
}

export interface CupSources {
  /** The sister repo's team id → FPL club code, for the season's twenty. */
  clubCodes: ReadonlyMap<string, number>;
  /** The sister repo's team id → FotMob's name for the club. */
  names: ReadonlyMap<string, string>;
}

/** The competition's name, or null for a label this app has not been told about. */
export function cupName(label: string): string | null {
  return CUP_NAMES[label] ?? null;
}

/** Every FPL club's ties outside the league, and what the export should be told about the rows it set aside. */
export function tmlCupTies(
  rows: readonly TmlRow[],
  { clubCodes, names }: CupSources,
): { clubs: Record<string, CupTie[]>; complaints: string[] } {
  const clubs: Record<string, CupTie[]> = {};
  const complaints: string[] = [];
  for (const row of rows) {
    const code = clubCodes.get(row.team_id);
    if (code === undefined || row.competition === LEAGUE) continue;
    if (row.status !== PLAYED && row.status !== TO_COME) {
      complaints.push(`${row.team_id} ${row.competition} ${row.kickoff_utc}: status ${row.status}, left out`);
      continue;
    }
    if (cupName(row.competition) === null) complaints.push(`${row.competition}: no name for this competition`);
    (clubs[String(code)] ??= []).push({
      competition: row.competition,
      kickoff: row.kickoff_utc,
      home: row.is_home,
      neutral: row.neutral,
      opponentCode: clubCodes.get(row.opponent_team_id) ?? null,
      opponentName: names.get(row.opponent_team_id) ?? row.opponent_name,
      score:
        row.status === PLAYED && row.goals_for !== null && row.goals_against !== null
          ? { for: row.goals_for, against: row.goals_against }
          : null,
    });
  }
  for (const ties of Object.values(clubs)) ties.sort((a, b) => byKickoff(a.kickoff, b.kickoff));
  return { clubs, complaints };
}

/** Each club's ties by FPL club code; a tie missing a field the page reads is dropped, never guessed. */
export function cupIntel(file: IntelCups | null): Map<number, CupTie[]> {
  const byCode = new Map<number, CupTie[]>();
  for (const [key, ties] of Object.entries(file?.clubs ?? {})) {
    const code = Number(key);
    if (!Number.isInteger(code) || !Array.isArray(ties)) continue;
    byCode.set(code, ties.filter(readable));
  }
  return byCode;
}

export type RunEntry = { kind: "league"; fixture: Fixture } | { kind: "cup"; tie: CupTie };

/** A club's season in the order it runs: the league's fixtures with its ties among them, undated last. */
export function seasonRun(fixtures: readonly Fixture[], ties: readonly CupTie[]): RunEntry[] {
  const entries: RunEntry[] = [
    ...fixtures.map((fixture): RunEntry => ({ kind: "league", fixture })),
    ...ties.map((tie): RunEntry => ({ kind: "cup", tie })),
  ];
  return entries.sort((a, b) => byKickoff(kickoffOf(a), kickoffOf(b)));
}

function kickoffOf(entry: RunEntry): string | null {
  return entry.kind === "league" ? entry.fixture.kickoff : entry.tie.kickoff;
}

/** Oldest first; an undated match last, which is where one the television has not picked belongs. */
function byKickoff(a: string | null, b: string | null): number {
  if (a === null || b === null) return a === null ? (b === null ? 0 : 1) : -1;
  return a.localeCompare(b);
}

function readable(tie: CupTie): boolean {
  const score = tie?.score;
  return (
    typeof tie?.competition === "string" &&
    (tie.kickoff === null || typeof tie.kickoff === "string") &&
    typeof tie.home === "boolean" &&
    typeof tie.neutral === "boolean" &&
    (tie.opponentCode === null || Number.isInteger(tie.opponentCode)) &&
    (tie.opponentName === null || typeof tie.opponentName === "string") &&
    (score === null || (Number.isInteger(score?.for) && Number.isInteger(score?.against)))
  );
}
