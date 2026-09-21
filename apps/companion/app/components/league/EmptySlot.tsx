// A roster slot with no footballer behind it: the dashed box, at the size a
// resolved player fills.
//
// **Built to the same shape as a man who resolved**, so it stands the same
// height in the line — a hole in a row reads as a formation nobody picked, and
// on a dialog it reads as a card that failed to load.
//
// Three sites drew it: the planner's sticker, the marker on the grass, and the
// live card. Two were byte-identical; the third had hand-written `1.32`, which
// is `.pitch-figure`'s own fallback copied out of `pitch.css` — so the number
// lived in three places and the dialog's empty slot would have stopped matching
// the pitch's the day anyone moved it. That file already names the dialogs as
// legitimate users of the class.
//
// A `<span>` and not a `<div>`: the live card's parent is a `<span>`, and `grid`
// makes a span lay out as a block either way.

export default function EmptySlot({
  /** What to print in the box — his position, or a `?` where even that is
   *  unknown. The caller resolves it, because the pitch holds a line's label and
   *  the cards hold a roster slot. */
  label,
}: {
  label: string;
}) {
  return (
    <span className="pitch-figure grid w-full place-items-center border border-dashed border-white/35 bg-black/25">
      <span className="numeric text-2xs font-bold text-white/70">{label}</span>
    </span>
  );
}
