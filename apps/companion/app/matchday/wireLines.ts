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

/** One man, one event, one owner. */
export interface WireLine {
  /** Stable across polls, so a refresh does not redraw the panel: the event's
   *  own id and the man's part in it. */
  key: string;
  minute: string;
  kind: MatchEventKind;
  /** What this man did in it — the difference between a goal and the assist for
   *  it, and between the two halves of a substitution. */
  role: "scored" | "assist";
  /** FPL's fixture id, for the link. **Not `fixtureCode`** — the code is the
   *  season-stable join key, and `/prem/match/[id]` takes the per-season id. */
  fixtureId: number | null;
  /** Null when the chain could not place him, which is a different answer from
   *  "nobody owns him" and is drawn differently. */
  player: FootballPlayer | null;
  club: string | null;
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

/** Which slot of an event's `players` array a line is drawn from.
 *
 *  Positional, and the position IS the meaning — checked across every such event
 *  in gameweeks 1-3. A goal pays two men in this league and often two different
 *  managers, which is why the assister gets a row of his own rather than a
 *  second name on the scorer's.
 *
 *  A card and a disallowed goal name one man; nothing is drawn from slot 1. */
const ROLES: Record<MatchEventKind, readonly ("scored" | "assist")[]> = {
  goal: ["scored", "assist"],
  "penalty-goal": ["scored", "assist"],
  "own-goal": ["scored"],
  "disallowed-goal": ["scored"],
  "yellow-card": ["scored"],
  "red-card": ["scored"],
  substitution: ["scored", "assist"],
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

  for (const event of events) {
    const roles = ROLES[event.kind];
    for (const [slot, role] of roles.entries()) {
      const code = event.players[slot];
      // An absent slot is an unassisted goal, not a miss. Only a slot the feed
      // filled and we could not place counts against us.
      if (code === undefined) continue;
      if (code === null) {
        unresolved++;
        continue;
      }

      const player = players.get(code) ?? null;
      if (player === null) {
        unresolved++;
        continue;
      }

      const owner = owners?.get(code) ?? null;
      lines.push({
        key: `${event.id}:${role}`,
        minute: event.minute,
        kind: event.kind,
        role,
        fixtureId: fixtureIds.get(event.fixtureCode) ?? null,
        player,
        club: clubs.get(player.clubId)?.shortName ?? null,
        owner,
        mine: owner !== null && owner.teamId === mine,
      });
    }
  }

  return { lines, unresolved };
}
