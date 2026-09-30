import { leagueTable } from "../../football/table";
import type { Club, Fixture } from "../../football/types";
import { londonDayOf } from "../../time";
import { numeral, ordinal } from "./minutes";

// Where a day's football leaves each club: its place before and after, the run it is on, and a season first.
// Reads only fixtures played on or before the report's day, so a report filed later still says what was true then.

export interface ClubStanding {
  code: number;
  before: { place: number; points: number; played: number } | null;
  after: { place: number; points: number; played: number };
  /** Plain facts the writer may state, e.g. "18th, in the bottom three", "without a win in five". */
  lines: string[];
  /** Entered or left the bottom three or the top, or won or lost for the first time: a lead's reason. */
  moved: boolean;
}

type Result = "W" | "D" | "L";

const playedBy = (season: readonly Fixture[], day: string, inclusive: boolean) =>
  season.filter((fixture) => {
    const on = fixture.kickoff === null ? null : londonDayOf(fixture.kickoff);
    return fixture.status === "finished" && on !== null && (inclusive ? on <= day : on < day);
  });

function results(fixtures: readonly Fixture[], clubId: number): { result: Result; home: boolean; conceded: number }[] {
  return fixtures
    .filter((f) => f.homeClubId === clubId || f.awayClubId === clubId)
    .sort((a, b) => (a.kickoff ?? "").localeCompare(b.kickoff ?? ""))
    .map((f) => {
      const home = f.homeClubId === clubId;
      const [us, them] = home ? [f.homeScore ?? 0, f.awayScore ?? 0] : [f.awayScore ?? 0, f.homeScore ?? 0];
      return { result: us > them ? "W" : us < them ? "L" : "D", home, conceded: them };
    });
}

/** The run a club is on after its latest result, in words; null when it is not a run worth a line. */
function run(record: readonly { result: Result }[]): string | null {
  const streak = (keep: (r: Result) => boolean) => {
    let n = 0;
    for (let i = record.length - 1; i >= 0 && keep(record[i].result); i--) n++;
    return n;
  };
  const winless = streak((r) => r !== "W");
  if (winless >= 3 && winless === record.length) return "still without a win this season";
  if (winless >= 4) return `without a win in ${numeral(winless)}`;
  const won = streak((r) => r === "W");
  if (won >= 3) return `${numeral(won)} wins in a row`;
  const unbeaten = streak((r) => r !== "L");
  if (unbeaten >= 4) return `unbeaten in ${numeral(unbeaten)}`;
  const lost = streak((r) => r === "L");
  if (lost >= 3) return `${numeral(lost)} defeats in a row`;
  return null;
}

/** Firsts of the season this match brought, or nothing. */
function firsts(record: readonly { result: Result; home: boolean; conceded: number }[]): string[] {
  const last = record.at(-1);
  if (last === undefined) return [];
  const earlier = record.slice(0, -1);
  const lines: string[] = [];
  if (last.result === "W" && earlier.every((r) => r.result !== "W")) lines.push("first win of the season");
  else if (last.result === "W" && earlier.every((r) => !(r.result === "W" && r.home === last.home))) lines.push(`first ${last.home ? "home" : "away"} win of the season`);
  if (last.result === "L" && earlier.every((r) => r.result !== "L") && earlier.length > 0) lines.push("first defeat of the season");
  if (last.conceded === 0 && earlier.every((r) => r.conceded > 0) && earlier.length > 0) lines.push("first clean sheet of the season");
  return lines;
}

const zone = (place: number, size: number) => (place === 1 ? "top" : place > size - 3 ? "bottom three" : null);

/** Each club's standing after the London day `day`, for the clubs asked about. */
export function clubStandings(season: readonly Fixture[], clubs: readonly Club[], day: string, codes: readonly number[]): Map<number, ClubStanding> {
  const before = leagueTable(playedBy(season, day, false), clubs);
  const played = playedBy(season, day, true);
  const after = leagueTable(played, clubs);
  const out = new Map<number, ClubStanding>();
  for (const code of codes) {
    const was = before.findIndex((row) => row.code === code);
    const now = after.findIndex((row) => row.code === code);
    const club = clubs.find((c) => c.code === code);
    if (now < 0 || club === undefined) continue;
    const row = after[now];
    const record = results(played, club.id);
    const place = now + 1;
    const wasZone = was < 0 ? null : zone(was + 1, before.length);
    const nowZone = zone(place, after.length);
    const lines = [`${ordinal(place)} with ${row.points} point${row.points === 1 ? "" : "s"} from ${row.played}`];
    if (nowZone !== null) lines.push(wasZone === nowZone ? `still ${nowZone === "top" ? "top" : "in the bottom three"}` : `now ${nowZone === "top" ? "top" : "in the bottom three"}`);
    if (wasZone !== null && nowZone !== wasZone) lines.push(`out of ${wasZone === "top" ? "top place" : "the bottom three"}`);
    const f = firsts(record);
    lines.push(...f);
    const r = run(record);
    if (r !== null) lines.push(r);
    out.set(code, {
      code,
      before: was < 0 ? null : { place: was + 1, points: before[was].points, played: before[was].played },
      after: { place, points: row.points, played: row.played },
      lines,
      moved: nowZone !== wasZone || f.some((line) => line.startsWith("first win") || line.startsWith("first defeat")),
    });
  }
  return out;
}
