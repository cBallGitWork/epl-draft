// A block standing in for a value not yet arrived, in `currentColor` so it suits the paper and the desk alike.
// Reduced motion is answered by globals.css, which stops the pulse and leaves the shape.

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
      className={`block shrink-0 animate-pulse bg-current/15 ${circle ?"rounded-full":""}`}
      style={{ width, height }}
    />
  );
}
