import { MS_PER_DAY, availabilityOf, type FootballPlayer, fullClubName, instantOf, normalizeName, owners, pressers, type Club, type Fixture, type IntelPressers, type PresserLine, type PresserQuote } from "@epl/core";
import type { RosteredTeam, StoryFixture } from "@epl/core";
import { roundTies } from "./round";
import { readIntel } from "../intel";

// The Team Sheet's facts, read off the intel export the sister repo writes.
//
// Absent is the ordinary state and files nothing.

function read(): IntelPressers | null {
  return readIntel<IntelPressers>("pressers");
}

/** The same clubs re-keyed by the PER-SEASON id, which is what a player carries.
 *  They arrive keyed by the season-stable code, which is what a crest uses. */
function byClubId(clubs: ReadonlyMap<number, Club>): Map<number, Club> {
  return new Map([...clubs.values()].map((club) => [club.id, club]));
}

/** What the Team Sheet needs of a footballer: to name him, to place him at a
 *  club, and to know when his availability last moved. */
export interface PresserSquadMan extends Pick<FootballPlayer, "status" | "news" | "chanceOfPlaying"> {
  code: number;
  name: string;
  fullName: string;
  clubId: number;
  newsAdded: string | null;
}

/** First name and surname, as print names a person. FPL's web name is a squad
 *  disambiguator ("N.Gonzalez") and its full name is a birth certificate. */
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
  // "N.Gonzalez" and "Kroupi.Jr": an initial or a suffix beside the dot is never his surname.
  const last = web[web.length - 1];
  const surname = key(last.split(".").filter((part) => part.length > 2).pop() ?? last);
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
  /** EVERY footballer, not only the rostered ones — an unowned man printed as
   *  his own code otherwise. The whole snapshot rather than a name lookup
   *  because `clubId` is how the club is read off the PLAYER. */
  squad: readonly PresserSquadMan[],
): PresserLine[] {
  const intel = read();
  if (intel === null) return [];
  const held = owners(teams);
  const byPlayer = new Map(squad.map((player) => [player.code, player]));
  const byId = byClubId(clubs);
  return pressers(intel, since).flatMap((signal) => {
    // A man we cannot name is a man the column cannot write about. Printing his
    // FPL code in an article is worse than omitting him, and a code the snapshot
    // does not carry is a stale export rather than a new signing.
    const player = byPlayer.get(signal.code);
    if (player === undefined) return [];

    // The club is the PLAYER's, never the export's. A row whose two sources
    // disagree is a bad export, and a wrong crest is worse than no row.
    const club = byId.get(player.clubId);
    if (club === undefined || club.code !== signal.club) return [];

    return [{
      ...signal,
      tag: tagOf(signal.tag, player),
      playerName: display(player),
      clubName: fullClubName(club.name),
      // Null when nobody in the league holds him, which is no longer a reason
      // to drop him — it is the difference between "start him" and "claim him".
      ownerName: held.get(signal.code)?.teamName ?? null,
      fresh: isNews(signal.tag, player.newsAdded, signal.said),
    }];
  });
}

/** The round the EXPORT says it covers, from the article's own title. Null when
 *  the file is absent or says nothing, which reads as "do not use it". */
export function presserGameweek(): number | null {
  const intel = read();
  const gw = intel?.manifest?.gameweek;
  return typeof gw === "number" ? gw : null;
}

/** Every club that held a press conference in the window, so the column can say
 *  "no fresh news" for one rather than omit it. */
export function presserSpoke(
  since: string,
  clubs: ReadonlyMap<number, Club>,
): { clubName: string; manager: string | null; at: string }[] {
  const intel = read();
  if (intel === null) return [];
  const floor = instantOf(since);
  return (intel.spoke ?? []).flatMap((each) => {
    const at = instantOf(each.at);
    if (at !== null && floor !== null && at < floor) return [];
    const club = clubs.get(each.club);
    return club === undefined ? [] : [{ clubName: fullClubName(club.name), manager: each.manager, at: each.at }];
  });
}

/** Who each club plays in the round the pressers preview, by FPL club code. Not `snapshot.fixtures`: FPL keeps
 *  `is_current` on a round until the next deadline, so between rounds that is football already played. */
export function presserFixtures(
  gameweek: number,
  clubs: ReadonlyMap<number, Club>,
  season: readonly Fixture[],
): Map<number, StoryFixture> {
  const out = new Map<number, StoryFixture>();
  for (const { home, away, kickoff } of roundTies(gameweek, clubs, season)) {
    out.set(home.code, { opponent: fullClubName(away.name), home: true, kickoff });
    out.set(away.code, { opponent: fullClubName(home.name), home: false, kickoff });
  }
  return out;
}

/** What each manager actually said, for the clubs in this round. A quote whose
 *  club we cannot name is dropped — it would print under no crest. */
export function presserQuotes(clubs: ReadonlyMap<number, Club>): (PresserQuote & { clubName: string })[] {
  const intel = read();
  if (intel === null) return [];
  return (intel.quotes ?? []).flatMap((quote) => {
    const club = clubs.get(quote.club);
    // The same spelling the LINES use, or the brief groups one club under two
    // headings and then tells the writer to echo "the club name exactly as given".
    return club === undefined ? [] : [{ ...quote, clubName: fullClubName(club.name) }];
  });
}

/** How recently FPL attached his availability note, against the conference. Two
 *  days: a note from the day before is the same story, one from last week is the
 *  standing condition a reader already knows. */
const FRESH_DAYS = 2;

/** The article's doubt, unless FPL already has him out: "Daniel James will miss the Arsenal game" was a quote the
 *  import does not read, and FPL had him injured until 18 Oct. */
export function tagOf(tag: string, player: PresserSquadMan): string {
  return tag === "injury_scare" && availabilityOf(player).out ? "ruled_out" : tag;
}

/** Whether a man is news at this conference: declared fit, which no standing absence can be, or his note moved. */
export function isNews(tag: string, newsAdded: string | null, said: string): boolean {
  return tag === "available" || changed(newsAdded, said);
}

/** Whether his availability CHANGED around this conference. A man with no note
 *  at all counts as fresh — he is being discussed and FPL has not caught up. */
function changed(newsAdded: string | null, said: string): boolean {
  if (newsAdded === null) return true;
  const added = instantOf(newsAdded);
  const at = instantOf(said);
  if (added === null || at === null) return true;
  return (at - added) / MS_PER_DAY <= FRESH_DAYS;
}
