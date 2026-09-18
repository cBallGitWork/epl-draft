import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { LEAGUE_TIMEZONE, pressers, type Club, type IntelPressers, type PresserLine } from "@epl/core";
import type { ResolvedPlayer, RosteredPlayer, RosteredTeam } from "@epl/core";

// The Team Sheet's facts, read off the intel export the sister repo writes.
//
// **Absent is the ordinary state and files nothing.** `intel/pressers/26-27.json`
// is specified in `docs/providers/intel-export.md` §5 and does not exist yet, so
// every function here returns empty rather than throwing — the column simply is
// not commissioned until the file lands.

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const FILE = join(ROOT, "data", "intel", "pressers", "26-27.json");

/** A day key in London, which is the league's clock — `bylines.ts` stamps the
 *  edition from the same zone, and a UTC key would put a 23:30 Thursday presser
 *  under Friday's column. */
const DAY = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: LEAGUE_TIMEZONE,
});

function read(): IntelPressers | null {
  if (!existsSync(FILE)) return null;
  return JSON.parse(readFileSync(FILE, "utf8")) as IntelPressers;
}

/** Every code somebody in the league holds, and who holds him. */
// A slot the bridge could not resolve carries no footballer, so it carries no
// code to match a signal against.
function resolved(player: RosteredPlayer): player is ResolvedPlayer {
  return "player" in player;
}

function owners(teams: readonly RosteredTeam[]): Map<number, string> {
  const out = new Map<number, string>();
  for (const team of teams) {
    for (const player of team.players.filter(resolved)) {
      out.set(player.player.code, team.teamName);
    }
  }
  return out;
}

/** The signals for this week's pressers, as the brief wants them. */
export function presserLines(
  teams: readonly RosteredTeam[],
  since: string,
  /** The round's clubs, keyed by FPL code — the crest and the row's heading. */
  clubs: ReadonlyMap<number, Club>,
  /** EVERY footballer, not only the rostered ones. Names came off the rosters
   *  until 18 Sep 2026, which was fine while the column only covered men
   *  somebody held — the moment it covered everyone, an unowned player printed
   *  as his own code.
   *
   *  `clubId` is why this is the whole snapshot rather than a name lookup: the
   *  CLUB a signal belongs to is read off the PLAYER here, never off the
   *  export's own `club` field. */
  squad: readonly { code: number; name: string; clubId: number }[],
): PresserLine[] {
  const intel = read();
  if (intel === null) return [];
  const held = owners(teams);
  const byPlayer = new Map(squad.map((player) => [player.code, player]));
  // Clubs keyed by the snapshot's per-season id, which is what a player carries.
  const byId = new Map([...clubs.values()].map((club) => [club.id, club]));
  return pressers(intel, since).flatMap((signal) => {
    // A man we cannot name is a man the column cannot write about. Printing his
    // FPL code in an article is worse than omitting him, and a code the snapshot
    // does not carry is a stale export rather than a new signing.
    const player = byPlayer.get(signal.code);
    if (player === undefined) return [];

    // **The club is the PLAYER's, never the export's.** Taking the export's
    // `club` on faith printed "Spurs — Glasner did not rule out rotating
    // Yeremy" on 18 Sep: the manager was Palace's, the player was Palace's, and
    // only the label said Spurs. A row whose two sources disagree is a bad
    // export, and a wrong crest beside a real quote is worse than no row.
    const club = byId.get(player.clubId);
    if (club === undefined || club.code !== signal.club) return [];

    return [{
      ...signal,
      playerName: player.name,
      clubName: club.name,
      // Null when nobody in the league holds him, which is no longer a reason
      // to drop him — it is the difference between "start him" and "claim him".
      ownerName: held.get(signal.code) ?? null,
    }];
  });
}

/** One assignment per press-conference DAY. Craig's week runs pressers Thursday
 *  and Friday, so a single key for the week would suppress the second column. */
export function presserDays(lines: readonly PresserLine[], gameweek: number): { key: string; slug: string }[] {
  const days = new Set<string>();
  for (const line of lines) {
    const at = new Date(line.said);
    if (!Number.isNaN(at.getTime())) days.add(DAY.format(at));
  }
  return [...days]
    .sort()
    .map((day) => ({ key: `presser:gw${gameweek}:${day}`, slug: `gw${gameweek}-presser-${day}` }));
}
