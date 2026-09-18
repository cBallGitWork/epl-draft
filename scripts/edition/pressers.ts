import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { LEAGUE_TIMEZONE, fetchFixtures, fullClubName, normalizeName, pressers, type Club, type IntelPressers, type PresserLine, type PresserQuote } from "@epl/core";
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

/** First name and surname, which is how a person is named in print. FPL's web
 *  name is a squad disambiguator — "N.Gonzalez", "Caicedo", "Van den Berg" — and
 *  its full name is a birth certificate. This takes one of each.
 *
 *  Exported for its test: every rule below is a real player FPL shapes awkwardly,
 *  and the one-name men are the reason it is not simply the first two tokens. */
export function display(player: { name: string; fullName?: string }): string {
  const web = player.name.split(/\s+/).filter((word) => word !== "");
  const full = (player.fullName ?? "").split(/\s+/).filter((word) => word !== "");
  if (full.length === 0 || web.length === 0) return player.name;

  const w = web.map(key);
  const f = full.map(key);

  // "Dan Burn", "Sepp van den Berg" — the web name is already the tail of his
  // full name, so his first name is the only thing missing.
  if (w.every((token, i) => token === f[f.length - w.length + i])) {
    return f.length === w.length ? full.join(" ") : [full[0], ...full.slice(-w.length)].join(" ");
  }

  // "Joelinton", "Murillo", "Jair Cunha" — men FPL names from the FRONT. Adding
  // a first name here produces "Joelinton Cássio", which is not what he is called.
  if (w[0] === f[0]) return player.name;

  // "Caicedo" of "Moisés Caicedo Corozo", "N.Gonzalez" of "Nico González
  // Iglesias" — find his surname in the full name and pair it with his first.
  const surname = key(web[web.length - 1].replace(/^[A-Za-zÀ-Ÿ]\./, ""));
  const at = f.indexOf(surname);
  if (at > 0) return `${full[0]} ${full[at]}`;
  // "O.Dango" of "Dango Ouattara" — the match IS his first name, so the surname
  // is the token after it.
  if (at === 0 && full.length > 1) return full.slice(0, 2).join(" ");

  return player.name;
}

/** One token, comparable — the bridge's normaliser with its spaces closed up,
 *  because a hyphen must NOT split here: "Kesler-Hayden" is one name, and
 *  splitting it loses the token count the tail match above depends on. */
function key(token: string): string {
  return normalizeName(token).replace(/ /g, "");
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
  squad: readonly { code: number; name: string; fullName: string; clubId: number }[],
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
      playerName: display(player),
      clubName: fullClubName(club.name),
      // Null when nobody in the league holds him, which is no longer a reason
      // to drop him — it is the difference between "start him" and "claim him".
      ownerName: held.get(signal.code) ?? null,
    }];
  });
}

/** Who each club plays in the round the pressers are about, by FPL club code.
 *
 *  **Not `snapshot.fixtures`, and that is the whole point of this function.**
 *  `map.ts` records that FPL keeps `is_current` on a round until the next
 *  DEADLINE, so between rounds the snapshot is focused on football already
 *  played — and a Thursday column would print last weekend's opponents beside
 *  this weekend's team news. Craig, 18 Sep 2026: "we arent in a gameweek, we
 *  are inbetween gameweeks".
 *
 *  A round with no fixtures published yet returns an empty map, and every club
 *  header then prints without an opponent rather than with the wrong one. */
export async function presserFixtures(
  gameweek: number,
  clubs: ReadonlyMap<number, Club>,
): Promise<Map<number, { opponent: string; home: boolean; kickoff: string }>> {
  const out = new Map<number, { opponent: string; home: boolean; kickoff: string }>();
  const byId = new Map([...clubs.values()].map((club) => [club.id, club]));
  const fixtures = await fetchFixtures(gameweek).catch(() => []);
  for (const fixture of fixtures) {
    // `team_h`/`team_a` are FPL's per-season club ids, which is what `Club.id`
    // carries — never the season-stable code the crest keys off.
    const home = byId.get(fixture.team_h);
    const away = byId.get(fixture.team_a);
    const kickoff = fixture.kickoff_time;
    if (home === undefined || away === undefined || kickoff === null) continue;
    out.set(home.code, { opponent: fullClubName(away.name), home: true, kickoff });
    out.set(away.code, { opponent: fullClubName(home.name), home: false, kickoff });
  }
  return out;
}

/** What each manager actually said, for the clubs in this round.
 *
 *  A quote whose club we cannot name is dropped: it would print under no crest
 *  and beside no row, which is a stray sentence rather than team news. */
export function presserQuotes(clubs: ReadonlyMap<number, Club>): (PresserQuote & { clubName: string })[] {
  const intel = read();
  if (intel === null) return [];
  return (intel.quotes ?? []).flatMap((quote) => {
    const club = clubs.get(quote.club);
    return club === undefined ? [] : [{ ...quote, clubName: club.name }];
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
