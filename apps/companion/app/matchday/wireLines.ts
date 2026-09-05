import type {
  Club,
  FootballPlayer,
  FootballSnapshot,
  MatchEvent,
  MatchEventKind,
  PlayerOwner,
  RoundBreak,
  Fixture,
} from "@epl/core";
import { crestUrl, playerByCode } from "@epl/core";

// The ownership join, and the only sentence in this app that neither Fantrax nor
// FPL can print: *Salah just scored, and he is Dave's.*
//
// It lives at the app edge and not in core because it crosses the two layers —
// the football layer knows the goal, the league layer knows the roster, and
// neither may import the other (CLAUDE.md). A selector here is where they meet.

/** A row of the wire: something that happened to a MAN, or a match reaching an
 *  interval. The two are one list because the wire is chronological and Sky's own
 *  vidiprinter interleaves them — `HALF TIME` between the goals is what tells a
 *  reader the 2-1 he is looking at is not going to move for fifteen minutes.
 *
 *  Discriminated on `kind`, whose two vocabularies are disjoint: `MatchEventKind`
 *  is Opta's and never says "half-time". */
export type WireRow = WireLine | WireBreak;

/** A match at half time or full time, with the score as it stood. */
export interface WireBreak {
  key: string;
  kind: RoundBreak["kind"];
  /** Home first, as a scoreline is read. Absent for a fixture the snapshot does
   *  not carry, in which case the break is dropped rather than drawn nameless. */
  sides: readonly WireSide[];
  at: number | null;
}

export interface WireSide {
  short: string;
  crest: string;
  /** Null is a score the provider did not give, and prints as a dash. */
  score: number | null;
}

/** One event, and the one or two men it paid.
 *
 *  **One row per EVENT, not per man** — Craig, 5 Sep 2026: *"for the wire, maybe
 *  a goal and assist should be on same line (we can use timings to figure its
 *  connected)."* The timings are not needed and never were: the two men come out
 *  of the same Opta event, in the same array, so the connection is structural
 *  rather than inferred.
 *
 *  It was one row each. That put `09' GOAL Isak` directly above `09' ASSIST
 *  Gakpo` — the same goal, said twice, at the same minute, taking two of the
 *  four rows the fold pays for. What a reader wants from a goal is both names
 *  and both owners at once, which is the thing this league has that neither
 *  Fantrax nor FPL prints. */
export interface WireLine {
  /** Stable across polls, so a refresh does not redraw the panel. The event's
   *  own id, which is now the whole of it. */
  key: string;
  minute: string;
  kind: MatchEventKind;
  /** His club, as the row draws it: the crest and the three letters. Null for a
   *  man the chain could not place, who has no club to name either. Craig, 5 Sep
   *  2026: "add team logo too for the row". */
  club: { short: string; crest: string } | null;
  /** The man the event is about: the scorer, the booked man, the substitute
   *  coming on. Null when the chain could not place him, which is a different
   *  answer from "nobody owns him" and is drawn differently. */
  man: WireMan | null;
  /** The second man the event named — the assister, or the one going off. Null
   *  for an unassisted goal and for every event that names one man. */
  second: WireMan | null;
  /** Kick-off plus elapsed, which is the only field that orders ten matches
   *  against each other — a 12:30 match and a 17:30 one both start their own
   *  clock at nought. Null for a match the feed dated and did not time. */
  at: number | null;
}

/** A man on the wire, and who holds him. */
export interface WireMan {
  player: FootballPlayer;
  /** Null when nobody in the league holds him — a real answer, and an em dash. */
  owner: PlayerOwner | null;
  mine: boolean;
}

export interface Wire {
  lines: WireRow[];
}

/** Which of the two a row is. The `kind` vocabularies are disjoint, so this is a
 *  narrowing and not a guess. */
export function isBreak(row: WireRow): row is WireBreak {
  return row.kind === "full-time";
}

/* **The `unresolved` count is gone**, and it is a deleted PIPELINE rather than a
   hidden number. It existed so our own failure to place a man wore a different
   mark from "nobody in the league holds him", and it was printed as a foot line
   under the panel; Craig took that line off on 5 Sep 2026 ("remove 1 man not
   matched to a player"), which left a counter incremented, carried across a
   boundary and read by nobody — CODE_RULES §2's dead pipeline behind removed UI.

   The distinction it guarded is still drawn: a man the bridge could not place
   comes through as `man: null` and prints the dash, exactly as a man nobody owns
   does. What is lost is the ability to notice the bridge going stale FROM THE
   SCREEN, and that check has a better home anyway — `npm run pl-bridge`
   reharvests and reports, which is where an operational number belongs. */

/** How many men each kind of event names, and what the second one did.
 *
 *  Positional, and the position IS the meaning — checked across every such event
 *  in gameweeks 1-3. A goal pays two men in this league and often two different
 *  managers, which is why the assister is on the goal's own row rather than
 *  nowhere.
 *
 *  A card and a disallowed goal name one man; slot 1 is not read for them. */
const SECOND: Partial<Record<MatchEventKind, true>> = {
  goal: true,
  "penalty-goal": true,
  substitution: true,
};

/** A club as the wire draws it, or null when we cannot name one. */
function clubOf(club: Club | undefined) {
  return club === undefined ? null : { short: club.shortName, crest: crestUrl(club) };
}

export function wireLines(
  events: readonly MatchEvent[],
  breaks: readonly RoundBreak[],
  snapshot: FootballSnapshot,
  owners: Map<number, PlayerOwner> | undefined,
  mine: string | null,
): Wire {
  const players = playerByCode(snapshot);
  const clubs = new Map<number, Club>(snapshot.clubs.map((c) => [c.id, c]));
  const fixtures = new Map<number, Fixture>(snapshot.fixtures.map((f) => [f.code, f]));

  /** One slot of an event, joined to the man and to whoever holds him.
   *
   *  Two answers now that nothing counts them: a slot the feed left empty — an
   *  unassisted goal, which is a fact and not a gap — and a man it named that the
   *  bridge could not place both come through as null and both print the dash.
   *  The comment above `Wire` records what that cost. */
  const manAt = (event: MatchEvent, slot: number): WireMan | null => {
    const code = event.players[slot];
    if (code === undefined || code === null) return null;
    const player = players.get(code) ?? null;
    if (player === null) return null;
    const owner = owners?.get(code) ?? null;
    return { player, owner, mine: owner !== null && owner.teamId === mine };
  };

  const lines: WireRow[] = events.map((event) => {
    const man = manAt(event, 0);
    return {
      key: String(event.id),
      minute: event.minute,
      kind: event.kind,
      club: man === null ? clubOf(undefined) : clubOf(clubs.get(man.player.clubId)),
      man,
      second: SECOND[event.kind] === true ? manAt(event, 1) : null,
      at: event.absolute,
    };
  });

  for (const brk of breaks) {
    const fixture = fixtures.get(brk.fixtureCode);
    // A fixture the snapshot does not carry is one we cannot name either side
    // of, and `FULL TIME — v —` is furniture rather than news.
    if (fixture === undefined) continue;
    const home = clubs.get(fixture.homeClubId);
    const away = clubs.get(fixture.awayClubId);
    if (home === undefined || away === undefined) continue;

    const score = { home: fixture.homeScore, away: fixture.awayScore };

    lines.push({
      key: `${brk.kind}:${brk.fixtureCode}`,
      kind: brk.kind,
      sides: [
        { short: home.shortName, crest: crestUrl(home), score: score.home },
        { short: away.shortName, crest: crestUrl(away), score: score.away },
      ],
      at: brk.absolute,
    });
  }

  // Newest first, which is what the panel is for. A row whose match the feed
  // dated and did not time has no place in that order and sorts last rather than
  // into 1970 — `roundGoals` makes the same choice for the same reason.
  return { lines: lines.sort((a, b) => (b.at ?? 0) - (a.at ?? 0)) };
}
