import type { CupStage } from "@epl/core";
import { HEAD_PLATE, LABEL, QUIET_FIGURE, ROW_NAME } from "@/app/desk";

/** One side of a draw as columns of ties, first round on the left; a phone scrolls it sideways. */
export default function Bracket({ title, stages }: { title: string; stages: readonly CupStage[] }) {
  if (stages.length === 0) return null;
  return (
    <section className="flex flex-col gap-1">
      <h3 className={`${HEAD_PLATE} text-3xs font-bold uppercase`}>{title}</h3>
      <div className="cm-scroll overflow-x-auto">
        <ol className="flex min-w-max gap-3 p-1">
          {stages.map((stage) => (
            <li key={`${stage.gameweek}-${stage.name}`} className="flex w-36 flex-col gap-2 lg:w-44">
              <p className={`${LABEL} flex justify-between gap-2`}>
                <span className="truncate">{stage.name}</span>
                <span className="numeric shrink-0">GW{stage.gameweek}</span>
              </p>
              {/* Spread down the column, so a later round's tie sits level with the two it follows. */}
              <ul className="flex flex-1 flex-col justify-around gap-2">
                {stage.fixtures.map((fixture) => (
                  <li key={fixture.code ?? `${fixture.home}-${fixture.away}`} className="cm-panel flex flex-col px-2 py-1">
                    <span className={QUIET_FIGURE}>{fixture.code}</span>
                    <span className={`${ROW_NAME} truncate`}>{fixture.home}</span>
                    <span className={`${ROW_NAME} truncate`}>{fixture.away}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
