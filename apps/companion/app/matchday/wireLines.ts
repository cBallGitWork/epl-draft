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

// The ownership join: each event's men, and who in the league holds them.
// At the app edge, not in core: the football and league layers may not import each other.

/** An event, or a match reaching full time; the two `kind` vocabularies are disjoint. */
export type WireRow = WireLine | WireBreak;

/** A match at full time, with the score as it stood. */
export interface WireBreak {
  key: string;
  kind: RoundBreak["kind"];
  /** Home first. A fixture the snapshot does not carry is dropped, not drawn nameless. */
  sides: readonly WireSide[];
  at: number | null;
}

interface WireSide {
  /** The club in full, not three letters (Craig, 21 Sep 2026). */
  name: string;
  crest: string;
  /** Null is a score the provider did not give, and prints as a dash. */
  score: number | null;
}

/** One event and the one or two men it names: one row per event, not per man (Craig, 5 Sep 2026). */
export interface WireLine {
  /** The event's own id: stable across polls, so a refresh does not redraw the panel. */
  key: string;
  minute: string;
  kind: MatchEventKind;
  /** His club's crest and three letters; null for a man the bridge could not place. */
  club: { short: string; crest: string } | null;
  /** The scorer, the booked man, the substitute coming on; null when the bridge could not place him. */
  man: WireMan | null;
  /** The assister or the man going off; null for an unassisted goal or a one-man event. */
  second: WireMan | null;
  /** Kick-off plus elapsed, to order ten matches against each other; null when the feed did not time it. */
  at: number | null;
}

/** A man on the wire, and who holds him. */
interface WireMan {
  player: FootballPlayer;
  /** Null when nobody in the league holds him — a real answer, and an em dash. */
  owner: PlayerOwner | null;
  mine: boolean;
}

export interface Wire {
  lines: WireRow[];
}

/** Narrows a row to a break; safe because the `kind` vocabularies are disjoint. */
export function isBreak(row: WireRow): row is WireBreak {
  return row.kind === "full-time";
}

/** Event kinds whose slot 1 names a second man (assister, man going off); every other kind names one. */
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

  /** One slot of an event, joined to the man and his holder; an empty slot and an unplaced man are both null. */
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
    // A fixture the snapshot does not carry cannot name either side, so it is skipped.
    if (fixture === undefined) continue;
    const home = clubs.get(fixture.homeClubId);
    const away = clubs.get(fixture.awayClubId);
    if (home === undefined || away === undefined) continue;

    const score = { home: fixture.homeScore, away: fixture.awayScore };

    lines.push({
      key: `${brk.kind}:${brk.fixtureCode}`,
      kind: brk.kind,
      sides: [
        { name: home.name, crest: crestUrl(home), score: score.home },
        { name: away.name, crest: crestUrl(away), score: score.away },
      ],
      at: brk.absolute,
    });
  }

  // Newest first; an untimed row sorts last rather than into 1970.
  return { lines: lines.sort((a, b) => (b.at ?? 0) - (a.at ?? 0)) };
}
