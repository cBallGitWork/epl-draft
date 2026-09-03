import type { IntelClubXi, IntelPlayer, IntelSquads, IntelXi, IntelStarter } from "./types";

// Reading the sister repo's export, and refusing the parts of it that are wrong.
//
// **Pure, and it parses rather than asserts.** The file is committed rather than
// fetched, which changes nothing about who wrote it: a different repo on a
// different schedule, so it is provider data and CODE_RULES §5 applies. Every
// function here takes already-parsed JSON — `packages/core` reads no files, and
// its tsconfig includes only `src/**/*.ts` so it physically cannot.
//
// The one rule worth restating because a breach would be invisible: a position
// the exporter marked as coming from FPL's `element_type` arrives as null and
// **must stay null**. Filling it from anywhere would put FPL's fantasy
// classification on a football screen, which is the thing the layer split
// exists to prevent.

const STARTING_XI = 11;

/** Every player the export carries, by FPL code.
 *
 *  Rows without a usable code are dropped rather than kept under a nonsense key:
 *  a squad list keyed on `NaN` collapses several men into one row, which is
 *  worse than the men being absent. */
export function squadIntel(squads: IntelSquads | null): Map<number, IntelPlayer> {
  const byCode = new Map<number, IntelPlayer>();
  if (squads === null) return byCode;
  for (const player of squads.players ?? []) {
    if (!Number.isInteger(player?.code)) continue;
    byCode.set(player.code, player);
  }
  return byCode;
}

/** What is wrong with a club's predicted eleven, or null when nothing is.
 *
 *  Reported rather than repaired. The sister asserts its formation table sums to
 *  eleven at import; we take the answer over a wire, and a board that quietly
 *  drew ten men would be the failure nobody notices. */
export function xiFault(club: IntelClubXi | undefined): string | null {
  if (club === undefined) return "no predicted eleven";
  const starters = club.starters ?? [];
  if (starters.length !== STARTING_XI) return `${starters.length} starters, not ${STARTING_XI}`;
  if (!club.formation) return "no formation";
  if (club.slots === null) return `unknown formation ${club.formation}`;
  const slots = Object.values(club.slots).reduce((total, n) => total + n, 0);
  if (slots !== STARTING_XI) return `${club.formation} fills ${slots} places, not ${STARTING_XI}`;
  return null;
}

/** One club's predicted eleven, arranged into the lines its formation plays.
 *
 *  Ordered back to front — keeper, defence, midfield, attack — which is the
 *  order every football list uses and the order the pitch draws from its own
 *  goal line outwards.
 *
 *  **A man is placed by his line and not by his probability.** The formation
 *  says how many go in each; the men are filled in most-likely-first so that
 *  where the two disagree the surest starter keeps his place. A line the
 *  formation does not name — a man whose position the export could not settle —
 *  goes last under `null`, visible rather than dropped. */
export function predictedEleven(
  club: IntelClubXi | undefined,
  lineOf: (code: number) => string | null,
): { line: string; players: IntelStarter[] }[] {
  if (club === undefined) return [];
  const wanted = club.slots ?? {};

  const byLine = new Map<string, IntelStarter[]>();
  for (const line of ORDER) {
    if (wanted[line] !== undefined) byLine.set(line, []);
  }

  const spare: IntelStarter[] = [];
  for (const starter of [...(club.starters ?? [])].sort((a, b) => b.prob - a.prob)) {
    const line = lineOf(starter.code);
    const row = line === null ? undefined : byLine.get(line);
    if (row === undefined) spare.push(starter);
    else row.push(starter);
  }

  const rows = [...byLine].map(([line, players]) => ({ line, players }));
  // Whoever the formation had no room for. Not dropped: eleven men were
  // predicted and eleven must be drawable, even when one of them cannot be
  // placed.
  if (spare.length > 0) rows.push({ line: "", players: spare });
  return rows.filter((row) => row.players.length > 0);
}

/** The lines a pitch draws, from the goal outwards. The sister repo's own
 *  vocabulary (`positional_rank.position_to_group`), written down here only as
 *  an ORDER — the bucketing itself stays there. */
const ORDER = ["GK", "CB", "FB", "DM", "CM", "AM", "WF", "CF"] as const;

/** How old the prediction is, in whole hours, or null when it will not say.
 *
 *  Off `fetchedAt` and never the manifest's `exportedAt`: a prediction is stale
 *  when its SOURCE is stale, and re-running the export does not make FFScout's
 *  last look at a team sheet any newer. */
export function predictionAge(xi: IntelXi | null, now: Date): number | null {
  if (xi?.fetchedAt == null) return null;
  const at = new Date(xi.fetchedAt).getTime();
  if (Number.isNaN(at)) return null;
  return Math.floor((now.getTime() - at) / 3_600_000);
}
