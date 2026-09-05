import type {
  Club,
  FootballPlayer,
  FootballSnapshot,
  MatchEvent,
  MatchEventKind,
  PlayerOwner,
} from "@epl/core";
import { crestUrl, playerByCode } from "@epl/core";

// The ownership join, and the only sentence in this app that neither Fantrax nor
// FPL can print: *Salah just scored, and he is Dave's.*
//
// It lives at the app edge and not in core because it crosses the two layers —
// the football layer knows the goal, the league layer knows the roster, and
// neither may import the other (CLAUDE.md). A selector here is where they meet.

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
}

/** A man on the wire, and who holds him. */
export interface WireMan {
  player: FootballPlayer;
  /** Null when nobody in the league holds him — a real answer, and an em dash. */
  owner: PlayerOwner | null;
  mine: boolean;
}

export interface Wire {
  lines: WireLine[];
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
  snapshot: FootballSnapshot,
  owners: Map<number, PlayerOwner> | undefined,
  mine: string | null,
): Wire {
  const players = playerByCode(snapshot);
  const clubs = new Map<number, Club>(snapshot.clubs.map((c) => [c.id, c]));

  const lines: WireLine[] = [];

  /** One slot of an event, joined to the man and to whoever holds him.
   *
   *  Three answers, and the middle one is the one that has to stay separate:
   *  `undefined` is a slot the feed left empty — an unassisted goal, which is a
   *  fact and not a gap; `null` is a man the feed named and the bridge could not
   *  place, which is OUR failure and is counted. Only the third is a man. */
  const manAt = (event: MatchEvent, slot: number): WireMan | null => {
    const code = event.players[slot];
    // Three answers collapse to two now that nothing counts them: a slot the
    // feed left empty (an unassisted goal, which is a fact) and a man it named
    // that the bridge could not place both come through as null and both print
    // the dash. The comment above `Wire` records what that cost.
    if (code === undefined || code === null) return null;
    const player = players.get(code) ?? null;
    if (player === null) return null;
    const owner = owners?.get(code) ?? null;
    return { player, owner, mine: owner !== null && owner.teamId === mine };
  };

  for (const event of events) {
    const man = manAt(event, 0);
    const second = SECOND[event.kind] === true ? manAt(event, 1) : null;

    lines.push({
      key: String(event.id),
      minute: event.minute,
      kind: event.kind,
      club: man === null ? clubOf(undefined) : clubOf(clubs.get(man.player.clubId)),
      man,
      second,
    });
  }

  return { lines };
}
