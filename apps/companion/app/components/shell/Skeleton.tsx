// A block standing in for a value that has not arrived yet.
//
// It paints in `currentColor` at a low alpha and names no colour of its own, so
// it takes the register it is dropped into rather than being told which one it
// is in. That is the whole design: one primitive serves the paper's ink on cream
// and the desk's near-white on its own ground, and neither gets a prop about it.
//
// `prefers-reduced-motion` is answered by the blanket rule in globals.css, which
// collapses the pulse and leaves the block at rest. That is a real alternative
// rather than the absence of one: what this carries is the SHAPE of what is
// coming, and the pulse only adds that it is still on its way.

export default function Skeleton({
  width,
  height,
  circle = false,
}: {
  /** Any CSS length. `100%` for a block that fills the row it sits in. */
  width: string;
  height: string;
  /** The round things — a crest, a badge, a face. */
  circle?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={`block shrink-0 animate-pulse bg-current/15 ${circle ? "rounded-full" : "rounded"}`}
      style={{ width, height }}
    />
  );
}
