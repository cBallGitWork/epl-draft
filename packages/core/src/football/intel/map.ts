import type {
  IntelClubPieces,
  IntelClubXi,
  IntelPlayer,
  IntelSquads,
  IntelStarter,
  IntelTaker,
  IntelXi,
} from "./types";

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

/** Shirt numbers by FPL code, with every number that COLLIDES inside its club
 *  dropped — for one club's players, not the league's.
 *
 *  **`IntelPlayer.squadNumber`'s own docblock says the exporter already does
 *  this, and against the export in the tree on 10 Sep 2026 that is false.**
 *  Counted that day: **20 of 20 clubs** carry a duplicate number somewhere in
 *  their squad, and **13 of 20 predicted elevens** carry one among the starters —
 *  Villa field two number 2s and two number 4s, Liverpool two 10s (Mac Allister
 *  and Wirtz), City two 18s (Cherki and Semenyo).
 *
 *  It matters now in a way it did not before, because the number stopped being a
 *  column and became the thing that tells eleven IDENTICAL kits apart. Two men in
 *  the same shirt with the same number on it is precisely the failure the rule
 *  this repo keeps for portraits and crests describes: a wrong one is worse than
 *  none, because only one of the two looks like an answer.
 *
 *  **Both men lose it, and that is the decision.** We cannot know which has the
 *  better claim — the export does not say, and giving it to whoever the file
 *  happens to list first would print a confident wrong number on somebody. A
 *  plain kit says "we do not know" and is honest at a glance.
 *
 *  Repaired here rather than reported like `xiFault`, because there is a correct
 *  answer available — draw no number — where a formation that does not sum to
 *  eleven has none. Delete this the day the exporter's own clearing works, and
 *  count it before you do.
 */
export function squadNumbers(players: readonly IntelPlayer[]): Map<number, number> {
  const seen = new Map<number, number>();
  for (const player of players) {
    const number = player?.squadNumber;
    if (number === null || number === undefined) continue;
    seen.set(number, (seen.get(number) ?? 0) + 1);
  }

  const byCode = new Map<number, number>();
  for (const player of players) {
    const number = player?.squadNumber;
    if (number === null || number === undefined) continue;
    if ((seen.get(number) ?? 0) > 1) continue;
    if (!Number.isInteger(player.code)) continue;
    byCode.set(player.code, number);
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

/** Whether a predicted eleven is for the round it is about to be drawn under,
 *  or a sentence saying which two rounds disagree.
 *
 *  **The round is in the export's FILENAME and therefore in a static import**,
 *  so it is chosen when the app is built and the heading above it is chosen when
 *  the page is requested. Those are different moments and nothing made them
 *  agree: with `gw3.json` still on disk, a build after the round turned served
 *  last week's eleven under a heading naming this week's opponent — eleven real
 *  names, a real formation, and the wrong match. `xiFault` cannot see it, because
 *  the file is a perfectly good eleven; it is only the wrong one.
 *
 *  A sentence rather than a boolean, on `xiFault`'s precedent: a board that
 *  refuses to draw has to be able to say why, and "we hold GW3 and this is GW4"
 *  is the whole diagnosis.
 *
 *  **Silence is not a fault.** A fixture with no round — an undated TV pick — is
 *  a question this cannot answer rather than a disagreement, and refusing there
 *  would blank a board over a missing field. The check is for the case where
 *  both numbers are known and differ, which is the case that has actually
 *  happened. */
export function xiRoundFault(xi: IntelXi | null, gameweek: number | null): string | null {
  const held = xi?.manifest?.gameweek;
  if (!Number.isInteger(held) || !Number.isInteger(gameweek)) return null;
  return held === gameweek ? null : `predicted for GW${held}, not GW${gameweek}`;
}

/** One club's predicted eleven, in the rows its formation draws.
 *
 *  **The source's own order IS the line-up, so it is chunked and never
 *  regrouped.** FFScout lists Arsenal's 4-2-3-1 as keeper, right-back across to
 *  left-back, the two, the three, the one — and Chelsea's 3-4-3 the same way. So
 *  the rows are the formation's numbers taken off that order in sequence. An
 *  earlier version grouped the men by their real positions instead, which drew a
 *  4-2-3-1 as seven rows of one or two, split a 3-4-3's wing-backs out of the
 *  four a reader counts them in, and needed a position for every man to do it.
 *  Mirroring the source needs none and is what the source meant.
 *
 *  **The keeper is not in the formation.** `4-2-3-1` is ten outfield players;
 *  the eleventh keeps goal and is drawn as his own row. A shape whose numbers do
 *  not add to ten is refused rather than guessed at.
 *
 *  Rows come back goal-first, which is the order a pitch is drawn in. */
export function predictedEleven(
  club: IntelClubXi | undefined,
): { line: string; players: IntelStarter[] }[] {
  if (club === undefined) return [];

  const shape = outfieldShape(club.formation);
  const starters = club.starters ?? [];
  if (shape === null || starters.length !== STARTING_XI) return [];

  const [keeper, ...outfield] = starters;
  const rows = [{ line: "GK", players: [keeper] }];

  let at = 0;
  for (const count of shape) {
    // **Reversed, because the source lists a line RIGHT to left.** FFScout gives
    // Arsenal's back four as White (RB), Konsa, Gabriel, Calafiori (LB); drawn
    // in that order across a pitch the right-back stands on the reader's left,
    // which is the wrong side of the field. A pitch is drawn from the viewer's
    // seat, so the row is turned round on the way out.
    rows.push({ line: String(count), players: outfield.slice(at, at + count).reverse() });
    at += count;
  }
  return rows.filter((row) => row.players.length > 0);
}

/** A formation as its outfield row sizes, or null when it cannot be read.
 *
 *  Ten and not eleven: the keeper is nobody's `4` and no formation counts him.
 *  A string that does not add up is refused — a shape we cannot read is one we
 *  must not guess at, and drawing ten men in a row called `4` would be the
 *  screen disagreeing with the label above it. */
function outfieldShape(formation: string | null | undefined): number[] | null {
  if (!formation) return null;
  const parts = formation.split("-").map((part) => Number(part.trim()));
  if (parts.length < 2 || parts.some((n) => !Number.isInteger(n) || n < 1)) return null;
  return parts.reduce((total, n) => total + n, 0) === STARTING_XI - 1 ? parts : null;
}

/** One club's set-piece order, biggest share first.
 *
 *  Pieces come back in the order asked for, and one nobody takes comes back
 *  empty rather than missing — a caller that wants to say "nobody takes these"
 *  needs to be told, and a caller that does not can filter. */
export function setPieceOrder(
  club: IntelClubPieces | undefined,
  pieces: readonly { key: keyof IntelClubPieces; label: string }[],
): { piece: string; label: string; takers: IntelTaker[] }[] {
  return pieces.map(({ key, label }) => ({
    piece: key,
    label,
    takers: [...(club?.[key] ?? [])].sort((a, b) => b.share - a.share),
  }));
}

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
