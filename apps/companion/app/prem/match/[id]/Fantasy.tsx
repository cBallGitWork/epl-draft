import type { PlTeamSheet } from "@epl/core";
import { HEAD_PLATE, PANEL } from "@/app/desk";
import { FANTASY_CATEGORIES } from "./fantasyCategories";
import { joinOf } from "./sheetJoin";
import { sheetName, type Match } from "./match";

// FPL's match details (`Goals scored · Assists · …`), for our league's categories: each one's men, home left, away right.

interface Counted {
  code: number;
  name: string;
  count: number;
}

export default function Fantasy({
  match,
  sheets,
}: {
  match: Match;
  sheets: { home: PlTeamSheet; away: PlTeamSheet };
}) {
  const join = joinOf(match);
  const named = (sheet: PlTeamSheet) =>
    [...sheet.lineup, ...sheet.substitutes].flatMap((man) => {
      const line = join.line(man.code);
      return man.code === null || line === undefined ? [] : [{ code: man.code, name: sheetName(man, match.byCode), line }];
    });
  const home = named(sheets.home);
  const away = named(sheets.away);
  const boxes = FANTASY_CATEGORIES.map((category) => {
    const counted = (side: typeof home): Counted[] =>
      side
        .map(({ code, name, line }) => ({ code, name, count: category.of(line) }))
        .filter((man) => man.count > 0)
        .sort((a, b) => b.count - a.count);
    return { category, home: counted(home), away: counted(away) };
  }).filter((box) => box.home.length + box.away.length > 0);

  if (boxes.length === 0) {
    return (
      <section className={PANEL}>
        <p className="py-2 text-center text-2xs text-faint">Nothing in our league&rsquo;s categories.</p>
      </section>
    );
  }
  return (
    // One category after another at every width (Craig, 23 Sep 2026).
    <section className={PANEL}>
      <div className="flex flex-col gap-2">
        {boxes.map((box) => (
          <div key={box.category.code} className="flex flex-col">
            <h3 className={`${HEAD_PLATE} justify-center text-2xs font-bold uppercase lg:text-xs`}>
              {box.category.label}
            </h3>
            <div className="grid grid-cols-2 divide-x divide-line bg-surface">
              <Names men={box.home} end />
              <Names men={box.away} end={false} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** One side's men in a category, most first; home hugs the centre line from the left, away from the right.
 *  Plain text, set close: a list to read down, not a set of doors (Craig, 23 Sep 2026). */
function Names({ men, end }: { men: Counted[]; end: boolean }) {
  return (
    <ul className="flex flex-col py-1">
      {men.map((man) => (
        <li
          key={man.code}
          className={`flex items-baseline gap-1 px-2 py-0.5 text-sm ${end ? "justify-end text-right" : "justify-start text-left"}`}
        >
          <span className="font-chrome font-bold">{man.name}</span>
          <span className="numeric text-muted">({man.count})</span>
        </li>
      ))}
    </ul>
  );
}
