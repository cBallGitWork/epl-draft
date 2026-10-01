import type { ReactNode } from "react";
import type { LeagueScoring, PlTeamSheet } from "@epl/core";
import { GROUP_PLATE, PANEL } from "@/app/desk";
import { FANTRAX_SILENT } from "@/app/config";
import type { LeagueDayLine } from "@/app/scoringDay";
import { fantasyBoxes, type Counted, type FantasyMan } from "./fantasyCategories";
import { joinOf } from "./sheetJoin";
import { sheetName, type Match } from "./match";

// The match in our league's categories, counted by the scoring league itself, then FPL's DefCon: home left, away right.

export default function Fantasy({
  match,
  sheets,
  scoring,
  day,
}: {
  match: Match;
  sheets: { home: PlTeamSheet; away: PlTeamSheet };
  /** The real league's rules; null when Fantrax described none. */
  scoring: LeagueScoring | null;
  /** That league's counts for the match's day, by FPL code; null when Fantrax would not say. */
  day: [number, LeagueDayLine][] | null;
}) {
  const join = joinOf(match);
  const lines = new Map(day ?? []);
  const men = (sheet: PlTeamSheet): FantasyMan[] =>
    [...sheet.lineup, ...sheet.substitutes].flatMap((man) =>
      man.code === null
        ? []
        : [
            {
              code: man.code,
              name: sheetName(man, match.byCode),
              named: man.position,
              league: lines.get(man.code),
              fplDefCon: join.line(man.code)?.defensiveContribution,
            },
          ],
    );
  const unread = scoring === null || day === null;
  const boxes = fantasyBoxes({ home: men(sheets.home), away: men(sheets.away) }, unread ? null : scoring);

  return (
    // One category after another at every width (Craig, 23 Sep 2026).
    <section className={PANEL}>
      <div className="flex flex-col gap-2">
        {unread ? <Note>{FANTRAX_SILENT}</Note> : null}
        {boxes.length === 0 && !unread ? <Note>Nothing in our league&rsquo;s categories.</Note> : null}
        {boxes.map((box) => (
          <div key={box.key} className="flex flex-col">
            <h3 className={`${GROUP_PLATE} lg:text-xs`}>{box.label}</h3>
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

function Note({ children }: { children: ReactNode }) {
  return <p className="py-2 text-center text-2xs text-faint">{children}</p>;
}

/** One side's men in a category, nearest their mark first; home hugs the centre line from the left, away from the right.
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
