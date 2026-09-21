// Where a name goes when two men stood in the same yard.
//
// Craig, 11 Sep 2026, on the first average-position map: *"needs to handle
// players bunched together"*. Two centre-halves splitting a back four average
// four units apart, and their names are set on the same line and on top of each
// other — which is the one thing that makes the picture unreadable, because the
// discs are still perfectly legible underneath.
//
// **The MARK never moves and the LABEL does.** A disc is a measurement — the
// centre of a man's own touches — and nudging it to make room for a word draws a
// picture that lies about where he played. A name has no such claim on its
// position: it only has to be nearer its own disc than anyone else's.
//
// **Pure, and tested, because it is arithmetic a screenshot cannot check.** Two
// names that clear each other by a pixel at 390 and collide at 1440 look
// identical in a review of the diff.

/** One man, already turned to face the way he is drawn. */
export interface Placed {
  /** FPL's season-stable code, which is the key — two men on one side can share
   *  a short name and a React key collision loses one of them off the pitch. */
  code: number;
  name: string;
  /** 0–100 along the pitch, 0 the goal line he defends. */
  x: number;
  /** 0–100 across it, 0 the top touchline as drawn. */
  y: number;
}

/** A man and where his name landed. */
export interface Labelled extends Placed {
  /** The label's own centre, in the same units as the disc's. */
  labelX: number;
  labelY: number;
}

/** A label's height, as a percentage of the PITCH's height. The type is 9px at
 *  390 and 11px on a desk, over a pitch 229px and 339px tall — 4.8% and 3.8% —
 *  so the phone is what this is set for and the desk gets the slack. */
const ROW = 5;

/** One character's width, as a percentage of the pitch's WIDTH. Archivo Narrow
 *  at 9px over 358px is about 1.3%, and at 11px over 530px about 1.2%; 1.4 is
 *  the phone's figure with a margin, because an over-estimate costs a label one
 *  needless row and an under-estimate costs a reader the name. */
const CHAR = 1.4;

/** The gap between a disc's centre and its own name's, which is half the disc
 *  plus the space under it. */
const CLEAR = 4.5;

/** How far a label may travel from its man before the picture stops saying whose
 *  name it is — three rows either way, and then it sits where it first wanted
 *  to. A name nearer somebody else's disc than its own is worse than an overlap
 *  a reader can pick apart. */
const REACH = 3;

/** Every man's name placed so that no two of them overlap, where the pitch has
 *  room for that.
 *
 *  **Top down and left to right**, which is what makes it deterministic: the
 *  same eleven produce the same picture on the server and in a test, and a
 *  re-render never shuffles the names. The man nearest the top keeps the slot
 *  under his own disc; the one below him takes the next free one. */
export function placeLabels(men: readonly Placed[]): Labelled[] {
  const placed: Labelled[] = [];

  for (const man of [...men].sort((a, b) => a.y - b.y || a.x - b.x || a.code - b.code)) {
    const half = width(man.name) / 2;
    // Kept off the touchlines rather than centred under the man at any cost: the
    // pitch clips what runs past its edge, and a name 2% off its disc is a
    // smaller lie than a name with its last three letters missing.
    const labelX = Math.min(Math.max(man.x, half + 1), 99 - half);

    const free = offsets().find(
      (dy) => !placed.some((other) => collides(other, labelX, man.y + dy, half)),
    );

    placed.push({
      ...man,
      labelX,
      labelY: Math.min(Math.max(man.y + (free ?? CLEAR), ROW / 2), 100 - ROW / 2),
    });
  }

  return placed;
}

/** The slots a name will take, in the order it wants them: under its man first,
 *  then over him, then a row further out each way. */
function offsets(): number[] {
  const out = [CLEAR, -CLEAR];
  for (let row = 1; row <= REACH; row += 1) out.push(CLEAR + row * ROW, -(CLEAR + row * ROW));
  return out;
}

/** Whether a label at this centre would touch one already placed. */
function collides(other: Labelled, x: number, y: number, half: number): boolean {
  return (
    Math.abs(other.labelY - y) < ROW && Math.abs(other.labelX - x) < half + width(other.name) / 2
  );
}

function width(name: string): number {
  return name.length * CHAR;
}
