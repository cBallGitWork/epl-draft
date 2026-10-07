// Names on the average-position map, kept apart when men bunch (Craig, 11 Sep 2026).
// The disc is a measurement and never moves; only the label does.

/** One man, already turned to face the way he is drawn. */
export interface Placed {
  /** FPL's season-stable code, the React key: two men can share a short name. */
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

/** A label's height, as a percentage of the pitch's height; set for 9px type at 390. */
const ROW = 5;

/** One character's width, as a percentage of the pitch's width; too low and names overlap. */
const CHAR = 1.4;

/** The gap between a disc's centre and its own name's: half the disc plus the space under it. */
const CLEAR = 4.5;

/** Rows a label may travel either way before it gives up and sits under its man. */
const REACH = 3;

/** Every man's name placed clear of the others where room allows; top down, then left to right. */
export function placeLabels(men: readonly Placed[]): Labelled[] {
  const placed: Labelled[] = [];

  for (const man of [...men].sort((a, b) => a.y - b.y || a.x - b.x || a.code - b.code)) {
    const half = width(man.name) / 2;
    // Kept inside the touchlines: the pitch clips what runs past its edge.
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

/** The slots a name tries in order: under its man, over him, then a row further out each way. */
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
