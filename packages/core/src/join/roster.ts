import { playerByCode } from "../football/selectors";
import type { FootballPlayer, FootballSnapshot, PlayerMatchStats } from "../football/types";
import { type Bridge, type BridgeEntry, isUnmapped } from "../identity/bridge";
import type { PeriodRosters, RosterSlot } from "../league/types";

// Where the two layers meet, made concrete. The league layer knows whose team a
// player is on; the football layer knows what he actually did. Neither imports
// the other — this file imports both and is the only place the join happens.
//
// Pure, and the bridge arrives as an argument rather than being read from disk:
// `packages/core/tsconfig.json` includes only `src/**/*.ts`, so core physically
// cannot import `data/mappings/fantrax.json`. That compiler boundary is what
// keeps the persisted mapping at the edge where a human audits it.

/** Why a rostered slot has no footballer behind it.
 *
 *  Three states rather than one flag, because three different things are wrong
 *  and only one of them is fine. Collapsing them would mean telling a manager
 *  "we don't know who this is" when the honest answer is "FPL has never listed
 *  him", or the reverse. */
export type Unresolved =
  /** Recorded as having no FPL counterpart: Fantrax carries academy and fringe
   *  players FPL has never listed. A correct outcome, not a failure. The bridge
   *  knows whether a person confirmed it or the script assumed it; nothing on
   *  screen turns on the difference. */
  | "unmapped"
  /** The bridge has never seen this id. Someone joined the pool since the last
   *  `npm run bridge`. */
  | "unbridged"
  /** Bridged to a code no player in this snapshot has — FPL dropped him, or the
   *  snapshot predates his arrival. */
  | "absent";

export interface ResolvedPlayer {
  slot: RosterSlot;
  player: FootballPlayer;
  /** One row per fixture his CLUB is scheduled for this gameweek — not per
   *  fixture he appeared in. Two on a double, and one carrying nothing but
   *  zeroes for a man whose match is three days off or who was never brought on.
   *
   *  Empty only before the round's first whistle, when FPL answers
   *  `{"elements": []}`. From that whistle every player in the league has a row,
   *  so `stats.length` says the round has started and nothing whatever about
   *  him. Reading it as "he played" is the bug fixed on 22 Aug 2026: it made
   *  every squad screen print a score where a fixture belonged. `minutes > 0` is
   *  the appearance test, and `kickedOff` — a question about fixtures, in the
   *  football layer — is the one the views actually want. */
  stats: PlayerMatchStats[];
}

export interface UnresolvedPlayer {
  slot: RosterSlot;
  unresolved: Unresolved;
}

/** One roster slot, resolved as far as the bridge allows.
 *
 *  A union rather than a nullable `player`, so a caller cannot read the
 *  footballer without having decided what to render when there isn't one. An
 *  unresolved slot is still a slot: the manager holds him, and dropping him here
 *  would render a fifteen-man squad as fourteen with no indication why. */
export type RosteredPlayer = ResolvedPlayer | UnresolvedPlayer;

export function isResolved(rostered: RosteredPlayer): rostered is ResolvedPlayer {
  return "player" in rostered;
}

export interface RosteredTeam {
  teamId: string;
  teamName: string;
  players: RosteredPlayer[];
}

export interface RosteredPeriod {
  /** Carried through from the rosters, not inferred from the snapshot's
   *  gameweek: a period and a gameweek are numbered alike but owned by different
   *  systems, and only the league layer knows which period these rosters are. */
  period: number | null;
  teams: RosteredTeam[];
}

/** Whether the arrangement we are holding is the one this round was played with.
 *
 *  Two numbers that are easy to mistake for one. `RosteredPeriod.period` is the
 *  period FANTRAX says these rosters are, and it runs ahead of the calendar —
 *  the label rolls the moment a round's last fixture ends, so for about four
 *  days in seven it names next week. `roundPeriod` is the period the round on
 *  screen is scored in. When they agree, a claim about who STARTED is a claim
 *  about the eleven that played; when they do not, it is a claim about a side
 *  nobody has fielded yet, and every such claim has to be withheld.
 *
 *  Named here because three readers were each answering it inline — the paper,
 *  the columnist, and the head-to-head's provenance line — and the one thing a
 *  two-term equality cannot carry is which two terms it is about. */
export function wasFielded(rostered: RosteredPeriod, roundPeriod: number | null): boolean {
  return rostered.period !== null && rostered.period === roundPeriod;
}

export function resolveRosters(
  snapshot: FootballSnapshot,
  rosters: PeriodRosters,
  bridge: Bridge,
): RosteredPeriod {
  const players = playerByCode(snapshot);
  const stats = statsByPlayer(snapshot);

  return {
    period: rosters.period,
    teams: rosters.teams.map((team) => ({
      teamId: team.teamId,
      teamName: team.teamName,
      players: team.slots.map((slot) => resolveSlot(slot, players, stats, bridge)),
    })),
  };
}

function resolveSlot(
  slot: RosterSlot,
  players: Map<number, FootballPlayer>,
  stats: Map<number, PlayerMatchStats[]>,
  bridge: Bridge,
): RosteredPlayer {
  // Annotated because `Record<string, BridgeEntry>` indexes as always-present
  // without `noUncheckedIndexedAccess`, and a roster routinely names ids the
  // bridge has not seen yet.
  const entry: BridgeEntry | undefined = bridge[slot.fantraxId];
  if (!entry) return { slot, unresolved: "unbridged" };
  if (isUnmapped(entry)) return { slot, unresolved: "unmapped" };

  const player = players.get(entry.fplCode);
  if (!player) return { slot, unresolved: "absent" };

  // Stats are keyed by FPL's per-season id, which is correct here: both sides
  // come from the same snapshot. Only the bridge crosses seasons, and it holds
  // codes.
  return { slot, player, stats: stats.get(player.id) ?? [] };
}

/** Stats grouped by player, built once per call rather than scanned per slot:
 *  sixteen fifteen-man rosters against a full gameweek is 240 lookups, and this
 *  runs on every poll while a match is on. */
function statsByPlayer(snapshot: FootballSnapshot): Map<number, PlayerMatchStats[]> {
  const byPlayer = new Map<number, PlayerMatchStats[]>();
  for (const row of snapshot.stats) {
    const rows = byPlayer.get(row.playerId);
    if (rows) rows.push(row);
    else byPlayer.set(row.playerId, [row]);
  }
  return byPlayer;
}

/** What to call a rostered slot on screen.
 *
 *  The Fantrax id is the last resort and is deliberately shown rather than
 *  hidden: a squad slot we cannot name is still a slot the manager holds, and a
 *  blank there reads as a bug in the squad rather than a gap in our mapping.
 *
 *  Here rather than at each render site because four of them wanted it — the
 *  pitch, the list, the planner and the player card — and the fourth is what
 *  made it a rule instead of a coincidence. */
export function playerName(rostered: RosteredPlayer): string {
  return isResolved(rostered) ? rostered.player.name : rostered.slot.fantraxId;
}

/** His name in full, for a list that has the width for one: `Bruno Fernandes`.
 *
 *  **FPL's `fullName`, not its `web_name`** (Craig, 2 Sep: "player list on left
 *  — use full name, Fantrax has this on their roster page"). `web_name` is what
 *  the game prints on a shirt, which is a surname for most men and a surname
 *  with an initial for the ones who clash — right for a 48px disc and needlessly
 *  terse in a column that can hold "Kiernan Dewsbury-Hall".
 *
 *  An unresolved slot still answers with its id, exactly as `playerName` does:
 *  there is no footballer behind it and so no name of any length. */
/** A name with its accents removed, for comparing FPL's two spellings of one
 *  man. Display never uses this — the accented form is his name and is what is
 *  printed; this only decides whether two strings are the same word. */
function fold(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export function fullPlayerName(rostered: RosteredPlayer): string {
  if (!isResolved(rostered)) return rostered.slot.fantraxId;

  const { fullName, name } = rostered.player;

  // **A forename and the shirt name, not the whole birth certificate** (Craig,
  // 2 Sep: "Fantrax uses a shorter name on their roster list page — Matheus
  // Cunha and not Matheus Santos Carneiro da Cunha").
  //
  // Fantrax does carry that shorter form, and we cannot reach it here: it is on
  // the POOL, and the squad screens read rosters, which carry an id and no name
  // at all. A whole extra provider read for a display string is a bad trade, and
  // FPL already holds both halves — `fullName` is every name he has and
  // `web_name` is the one on his shirt.
  //
  // So the two are recombined: the first word of the full name, then the shirt
  // name. "Matheus Santos Carneiro da Cunha" + "Cunha" gives "Matheus Cunha",
  // which is Fantrax's own answer arrived at from FPL's fields.
  //
  // A shirt name carrying a dot or a space is FPL disambiguating two players who
  // share a surname — "B.Fernandes", "Bruno G.", "Jair Cunha". It is already
  // short and already unambiguous, so it is the answer as it stands: prefixing a
  // forename would give "Bruno B.Fernandes".
  if (name.includes(".") || name.includes(" ")) return name;

  const first = fullName.split(" ")[0];
  // One-word players (Rodri, Ederson), and anyone whose shirt name is the whole
  // of him. Then the shirt name IS the answer.
  //
  // **Compared with the accents folded off.** FPL spells the two fields
  // differently for the same man — "Yéremy Pino Santos" against a shirt name of
  // "Yeremy" — so an exact comparison saw two different words, prefixed one to
  // the other, and the column read "Yéremy Yeremy". One real case in the current
  // pool, found by running this over every element rather than by reading it.
  if (!first || fold(name) === fold(first) || fullName === name) return name;

  return `${first} ${name}`;
}

/** His name at the size a pitch draws one: `Hemmings`, `G.Hemmings` for a clash.
 *
 *  **A surname, because a disc is 64px wide** (Craig, 2 Sep: "'george hemmings'
 *  just needs to be 'Hemmings' or G.Hemmings"). FPL's `web_name` is usually a
 *  surname already — it is what the game prints on a shirt — but not always:
 *  where two players share one it sends the full name instead, and those are the
 *  ones that overflow a disc.
 *
 *  So the initial is kept when there is one to keep, which is exactly the case
 *  `web_name` was disambiguating. `B.Fernandes` is FPL's own spelling of that
 *  and this leaves it alone; `George Hemmings` becomes `G.Hemmings`, which
 *  carries the same disambiguation in half the width. */
export function pitchName(rostered: RosteredPlayer): string {
  const full = playerName(rostered);
  const at = full.lastIndexOf(" ");
  if (at <= 0) return full;

  const surname = full.slice(at + 1);
  const first = full.slice(0, at);
  // A one-word forename becomes an initial; anything longer (a two-part name, a
  // particle like "van der") is left alone rather than mangled.
  return first.includes(" ") ? full : `${first[0]}.${surname}`;
}
