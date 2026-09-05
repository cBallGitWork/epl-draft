import type {
  Club,
  FootballPlayer,
  FootballSnapshot,
  MatchEvent,
  MatchEventKind,
  PlayerOwner,
} from "@epl/core";
import { playerByCode } from "@epl/core";

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
  /** FPL's fixture id, for the link. **Not `fixtureCode`** — the code is the
   *  season-stable join key, and `/prem/match/[id]` takes the per-season id. */
  fixtureId: number | null;
  club: string | null;
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
  /** Men an event named that the bridge could not place.
   *
   *  Counted and printed rather than hidden: a dash means "nobody holds him",
   *  which is a fact about the league, and using the same mark for our own
   *  failure to resolve him would be this app telling itself a wrong number.
   *  `npm run pl-bridge` is what takes it back to nought. */
  unresolved: number;
}

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

export function wireLines(
  events: readonly MatchEvent[],
  snapshot: FootballSnapshot,
  owners: Map<number, PlayerOwner> | undefined,
  mine: string | null,
): Wire {
  const players = playerByCode(snapshot);
  const clubs = new Map<number, Club>(snapshot.clubs.map((c) => [c.id, c]));
  const fixtureIds = new Map(snapshot.fixtures.map((f) => [f.code, f.id]));

  const lines: WireLine[] = [];
  let unresolved = 0;

  /** One slot of an event, joined to the man and to whoever holds him.
   *
   *  Three answers, and the middle one is the one that has to stay separate:
   *  `undefined` is a slot the feed left empty — an unassisted goal, which is a
   *  fact and not a gap; `null` is a man the feed named and the bridge could not
   *  place, which is OUR failure and is counted. Only the third is a man. */
  const manAt = (event: MatchEvent, slot: number): WireMan | null => {
    const code = event.players[slot];
    if (code === undefined) return null;
    if (code === null) {
      unresolved++;
      return null;
    }
    const player = players.get(code) ?? null;
    if (player === null) {
      unresolved++;
      return null;
    }
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
      fixtureId: fixtureIds.get(event.fixtureCode) ?? null,
      club: man === null ? null : (clubs.get(man.player.clubId)?.shortName ?? null),
      man,
      second,
    });
  }

  return { lines, unresolved };
}
