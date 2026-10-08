import { rulesCard, scoredSlots } from "@epl/core";
import LeagueShell from "../Shell";
import Nothing from "../../components/shell/Nothing";
import { HeadRow, NameHead, PlateHead } from "../../components/league/TableHeads";
import { leagueScoring } from "../../scoring";
import { backToFront, leaguePositionLabel } from "../../positions";
import { BOARD, FIGURE, ROW_NAME, ROW_RULE } from "@/app/desk";

// What every category pays each roster slot, read from getLeagueInfo: a line once where every slot is paid alike.

export const revalidate = 30;

export default async function ScoringPage() {
  const scoring = await leagueScoring();
  if (scoring === null) {
    return (
      <LeagueShell current="scoring">
        <Nothing title="No scoring to show" code="getLeagueInfo → no scoring">
          Fantrax has not described the league&apos;s scoring.
        </Nothing>
      </LeagueShell>
    );
  }

  const slots = backToFront(scoredSlots(scoring.rules));
  const lines = rulesCard(scoring, slots);

  return (
    <LeagueShell current="scoring">
      <table className={BOARD}>
        <caption className="sr-only">Fantasy points for each category, by the slot a manager plays a man in</caption>
        <thead>
          <HeadRow>
            <NameHead label="Category" />
            {slots.map((slot) => (
              <PlateHead key={slot} at="centre" className="w-16 lg:w-32">
                {leaguePositionLabel(slot)}
              </PlateHead>
            ))}
          </HeadRow>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.name} className={ROW_RULE}>
              <td className="pl-2" title={line.key}>
                <span className={`cm-row flex min-h-11 items-center ${ROW_NAME}`}>{line.name}</span>
              </td>
              {(line.same ? line.prices.slice(0, 1) : line.prices).map((cell, at) => (
                <td key={slots[at]} colSpan={line.same ? slots.length : 1} className={`${FIGURE} text-ink`}>
                  {cell.map((band) => (
                    <span key={band} className="block whitespace-nowrap">
                      {band}
                    </span>
                  ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </LeagueShell>
  );
}
