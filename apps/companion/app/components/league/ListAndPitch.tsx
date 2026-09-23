import type { View } from "./ViewToggle";

/** Two readings of one squad: the list left and the pitch right above `lg`, with air between so
 *  they read as two; below `lg` the toggle's `view` draws one. */
export default function ListAndPitch({
  view,
  list,
  pitch,
}: {
  view: View;
  list: React.ReactNode;
  pitch: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
      <div className={view === "list" ? "" : "hidden lg:block"}>{list}</div>
      <div className={view === "pitch" ? "" : "hidden lg:block"}>{pitch}</div>
    </div>
  );
}
