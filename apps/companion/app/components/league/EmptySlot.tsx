// A roster slot with no footballer behind it: a dashed box the size a resolved player fills.
// A `<span>`, not a `<div>`: the live card's parent is a `<span>`.

export default function EmptySlot({
  /** His position, or `?` where even that is unknown; the caller resolves it. */
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
