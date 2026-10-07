import { clubColours, plateOn } from "@epl/core";

// The title bar of a dialog about one subject, in that subject's colours; it holds the name and nothing else.
// `minHeight: 0` is inline because unlayered `desk.css` beats `@layer utilities`: `lg:min-h-0` loses silently
// and `.cm-titlebar` grows to 96px above `lg`.

export default function DialogHead({
  title,
  club,
}: {
  /** The subject's name. */
  title: string;
  /** His club's short name, for the plate; null keeps the desk's chrome blue. */
  club: string | null;
}) {
  const plate = club === null ? undefined : plateOn(clubColours(club));

  return (
    <div
      className="cm-titlebar flex items-center px-3 py-2"
      style={{ minHeight: 0, ...(plate ? { background: plate.background } : {}) }}
    >
      <h2
        className="cm-title min-w-0 flex-1 truncate text-xl font-bold tracking-tight"
        style={plate ? { color: plate.ink } : undefined}
      >
        {title}
      </h2>
    </div>
  );
}
