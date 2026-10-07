import Image from "next/image";
import type { CategoryBand, CategoryMan, Club } from "@epl/core";
import Nothing from "../shell/Nothing";
import { GROUP_PLATE, PANEL, gainOrLoss } from "@/app/desk";
import { DASH, crestUrl } from "@epl/core";

// Where the scoreline came from, and who put it there, category by category.
// Each side's men are an independent column, never paired by index: a pairing would read as man against man.

/** What to call a man and his club, by the id core holds; built by the caller behind the lineup gate. */
export type Names = ReadonlyMap<string, { name: string; club: Club | undefined }>;

export default function CategoryBands({
  bands,
  names,
  theirNames,
  withheld,
}: {
  bands: readonly CategoryBand[];
  names: Names;
  theirNames: Names;
  /** The panel saying a side's lineup is not public yet, or null; full width, as an empty column reads as no score. */
  withheld: React.ReactNode;
}) {
  return (
    // Each side's total at its end of the plate, the URL's side on the left as on the scoreline.
    <section className={PANEL}>
      <h2 className="sr-only">Where the points came from</h2>
      {withheld}
      {bands.length === 0 ? (
        <Nothing title="Nothing scored yet">
          Fantrax has priced no category for either squad this gameweek.
        </Nothing>
      ) : (
        <div className="flex flex-col gap-2">
          {bands.map((band) => (
            <div key={band.code} className="flex flex-col">
              <h3 className={`${GROUP_PLATE} gap-2 lg:text-xs`}>
                <Figure men={band.mine} />
                <span className="min-w-0 truncate">{band.name}</span>
                <Figure men={band.theirs} />
              </h3>
              <div className="grid grid-cols-2 divide-x divide-line bg-surface">
                <Men men={band.mine} names={names} end />
                <Men men={band.theirs} names={theirNames} end={false} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** One side's men in one band, most first, ties by name (core ties on `fantraxId`). */
function Men({ men, names, end }: { men: readonly CategoryMan[]; names: Names; end: boolean }) {
  const named = [...men]
    .map((man) => ({ ...man, ...(names.get(man.fantraxId) ?? { name: DASH, club: undefined }) }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

  return (
    <ul className="flex min-w-0 flex-col py-1">
      {named.map((man) => (
        <li
          key={man.fantraxId}
          className={`flex min-w-0 items-center gap-1 px-2 py-0.5 text-sm ${end ? "justify-end text-right" : "justify-start text-left"}`}
        >
          {man.club === undefined ? null : (
            <Image src={crestUrl(man.club)} alt="" width={16} height={16} className="size-4 shrink-0 object-contain" />
          )}
          <span className="truncate font-chrome font-bold">{man.name}</span>
          <span className={`numeric shrink-0 ${gainOrLoss(man.points) || "text-muted"}`}>({man.points})</span>
        </li>
      ))}
    </ul>
  );
}

/** One side's total in one category, in the plate's own ink; a dash where he registered none, never a nought. */
function Figure({ men }: { men: readonly CategoryMan[] }) {
  const total = men.length === 0 ? null : men.reduce((sum, man) => sum + man.points, 0);
  return <span className="numeric w-8 shrink-0 text-center text-xs">{total ?? DASH}</span>;
}
