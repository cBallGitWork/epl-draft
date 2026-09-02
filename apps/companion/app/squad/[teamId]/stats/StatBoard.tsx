import { PLAYER_CATEGORIES, type PlayerStatLine } from "@epl/core";

// One squad's season as a table of Fantrax's own scoring categories.
//
// The table idiom is `SeasonGrid`'s, deliberately and to the class: a real
// `<table>` inside `overflow-x-auto` inside a `cm-panel`, a `cm-index` cell down
// the left, the bevel on a block INSIDE each `<th>` rather than on the cell —
// because these tables collapse their borders and a strip of bevelled cells
// loses its inner edges (`desk.css`). Two tables that look alike and are built
// differently is how the next change breaks one of them.
//
// It is not `SeasonGrid` itself. That component takes `TeamStats` — Fantrax's
// pre-grouped per-team payload, arranged in named groups with their own column
// sets — and this takes the flat pool line, which is a different shape from a
// different endpoint. Two callers of one component would mean a component that
// takes either shape, which is the abstraction the rule of 2/3 exists to stop.

/** Every column, in the order `playerCategories.ts` declares them: what he did
 *  going forward, then at the back, then wrong.
 *
 *  Keeper-only categories stay in the header for a squad that has a keeper,
 *  which every squad does. A column no one on the squad has a figure for prints
 *  a dash all the way down, which is the honest reading — the alternative is a
 *  table whose columns move about depending on who you are looking at. */
const COLUMNS = PLAYER_CATEGORIES;

/** Fantrax spells the same defensive fact `GA` for a keeper and `GAO` for an
 *  outfielder, so a category may name a second column to try. Read as a
 *  fallback, never summed: a man is in exactly one half of the read, so at most
 *  one of the two is ever on his row. */
function figure(line: PlayerStatLine, key: string, also: string | undefined) {
  return line.stats[key] ?? (also === undefined ? null : line.stats[also] ?? null);
}

export default function StatBoard({ lines }: { lines: readonly PlayerStatLine[] }) {
  return (
    <section className="cm-panel flex flex-col">
      <div className="cm-titlebar px-2 py-1">
        <h2 className="truncate text-2xs font-bold uppercase text-ink">Season to date</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse whitespace-nowrap">
          <thead>
            <tr className="text-3xs uppercase">
              <th scope="col" className="p-0 font-bold">
                <span className="cm-bevel flex h-6 items-center justify-end px-1.5">#</span>
              </th>
              <th scope="col" className="p-0 text-left font-bold">
                <span className="cm-bevel flex h-6 items-center px-1.5">Player</span>
              </th>
              <th scope="col" className="p-0 text-left font-bold">
                <span className="cm-bevel flex h-6 items-center px-1.5">Club</span>
              </th>
              {COLUMNS.map((category) => (
                <th
                  key={category.key}
                  scope="col"
                  // The category's full name, since the header is an
                  // abbreviation Fantrax chose and not one a reader knows.
                  title={category.label}
                  className="p-0 font-bold"
                >
                  <span className="cm-bevel flex h-6 items-center justify-end px-1.5">
                    {category.key}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {lines.map((line, index) => (
              <tr key={line.fantraxId} className="border-b border-bg">
                <td className="cm-index numeric px-1.5 py-1 text-right text-3xs font-bold">
                  {index + 1}
                </td>
                {/* Cyan, because the palette spends it on a person and this is
                    the only column here that is one. */}
                <td className="px-1.5 py-1 text-2xs text-info">{line.name}</td>
                <td className="px-1.5 py-1 text-2xs text-muted">{line.clubShort ?? "—"}</td>
                {COLUMNS.map((category) => {
                  const value = figure(line, category.key, category.also);
                  return (
                    <td
                      key={category.key}
                      // Amber is "a figure", faint is a dash. **A nought
                      // prints as a dash too**, and the first cut of this board
                      // printed fifteen rows of noughts — which is what the
                      // rule is actually for. DESIGN §7's "absence is —, never
                      // 0" is about a table you can read: a column of noughts
                      // is a wall a reader has to scan for the one figure in
                      // it, and Championship Manager's own stat screens leave
                      // the cell empty rather than paying that price. The
                      // figures that ARE there then carry the amber alone.
                      className={`numeric px-1.5 py-1 text-right text-2xs ${
                        value ? "text-mid" : "text-faint"
                      }`}
                    >
                      {value ? value : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
