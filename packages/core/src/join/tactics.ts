import type { SquadLine } from "./lineup";

// Which players push forward, drawn as Championship Manager draws them.
//
// **The arrows are the tactic** (Craig, 2 Sep, with `cm0102` Bayern Tactics).
// The game puts a small arrow above a man who is instructed to get forward and
// below one told to sit — and the arrows are what make a 4-4-2 on screen read
// as a shape somebody CHOSE rather than as eleven discs in rows. Ours has no
// instructions to draw from: Fantrax sells a roster slot and no tactical
// intent, so there is nothing per-player to read.
//
// So the arrows come from the SHAPE, which is a real fact about the eleven and
// the only tactical thing our data actually knows. The rule is the one every
// formation diagram uses: in a flat four the wide men push on, in a three at
// the back the wing-backs do, and a lone striker holds while a front two
// splits. Stated as a rule rather than a table so an autodrafted 1-5-2-3 gets a
// sensible answer instead of nothing.
//
// **Never drawn on a line we are guessing about.** A line whose length we have
// no convention for gets no arrows at all, which is the honest reading — an
// arrow is a claim about intent, and inventing one is worse than silence.

/** Which way a man is pointing, if anywhere. */
export type Instruction = "forward" | null;

/** Where a line sits in the shape, back to front. `lines` arrives ordered, so
 *  the index is the answer — but it is named, because "index 0 is the keeper"
 *  is the kind of fact that reads as an accident three files away. */
function role(index: number, total: number): "keeper" | "defence" | "middle" | "attack" {
  if (index === 0) return "keeper";
  if (index === total - 1) return "attack";
  return index === 1 ? "defence" : "middle";
}

/** The men in one line who push forward, by their position in it.
 *
 *  Width is what decides it, because width is what a formation MEANS: four
 *  across is two wide men and two inside, three across is a spine, five is a
 *  back four with a wing-back either side. */
function pushing(count: number, where: ReturnType<typeof role>): Set<number> {
  if (where === "keeper") return new Set();

  // A front line: one striker holds the ball up and is drawn still; two or more
  // split, so the widest of them run. Three across is the classic front three
  // and it is the two wide forwards who go.
  if (where === "attack") {
    if (count <= 1) return new Set();
    return new Set([0, count - 1]);
  }

  // A back or middle line. Four and five put their widest men forward — the
  // full-backs and wing-backs, which is the whole point of the shape. Three at
  // the back is a spine and nobody goes; three in midfield is the same.
  if (count >= 4) return new Set([0, count - 1]);
  return new Set();
}

/** Every player's instruction, keyed by Fantrax id.
 *
 *  A map rather than a mutated line, because the lines are shared with the list
 *  and a view that reordered them would move the arrows with it. */
export function tactics(lines: readonly SquadLine[]): Map<string, Instruction> {
  const out = new Map<string, Instruction>();

  lines.forEach((line, index) => {
    const forward = pushing(line.players.length, role(index, lines.length));
    line.players.forEach((player, at) => {
      out.set(player.slot.fantraxId, forward.has(at) ? "forward" : null);
    });
  });

  return out;
}
