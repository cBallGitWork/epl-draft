import { NOTABLE_SAVES, type Pick, type TeamOfTheWeek as Eleven } from "@epl/core";
import Column from "./Column";
import { yoursBorder } from "../../mine";
import { positionLabel } from "../../positions";

// The best eleven anyone owned this week, and who owns them.
//
// The joke the league tells is not "Haaland scored twice" — everyone saw that.
// It is whose Haaland he was, and which manager left him out.
//
// The rows carry no card. `yoursBorder` still marks the reader's own, and marks
// it the same way it does everywhere else — the class it returns sets a border
// COLOUR plus an explicit left width, so on a row with no `border` utility it
// draws the accent bar and nothing else. One treatment, two grounds.

/** What got him picked, in the fewest words that are still true. */
function did(pick: Pick): string {
  const notes = [
    pick.goals > 0 ? `${pick.goals}G` : null,
    pick.assists > 0 ? `${pick.assists}A` : null,
    pick.cleanSheet ? "CS" : null,
    pick.saves >= NOTABLE_SAVES ? `${pick.saves} saves` : null,
  ].filter((note): note is string => note !== null);
  return notes.length > 0 ? notes.join(" · ") : `${pick.minutes}'`;
}

export default function TeamOfTheWeek({
  eleven,
  mine,
  partial,
  fielded,
}: {
  eleven: Eleven;
  mine: string | null;
  /** Whether the round is still being played. Said in the heading rather than
   *  left to the reader: an eleven picked from four fixtures of ten is not the
   *  week's, and on a Saturday tea-time it fills its forward line with men who
   *  have done nothing simply because every good forward is still to kick off. */
  partial: boolean;
  /** Whether the arrangement these picks were read from is the one that was
   *  actually fielded in the round they report on. False between rounds, once
   *  Fantrax has rolled `getTeamRosters` forward to the period managers are now
   *  editing — at which point who was STARTED is a fact about next week's plan
   *  and this section may not print it. What the players did is football and
   *  stands either way, so the eleven itself is unaffected. */
  fielded: boolean;
}) {
  return (
    <Column title={partial ? "Team of the week so far" : "Team of the week"} aside={eleven.shape}>
      <ul>
        {eleven.picks.map((pick) => (
          <li
            key={pick.playerCode}
            className={`py-2 pl-2 ${yoursBorder(pick.ownerTeamId === mine)}`}
          >
            <p className="flex items-baseline gap-2">
              <span className="numeric w-7 shrink-0 text-2xs text-faint">
                {positionLabel(pick.position) ?? pick.position}
              </span>
              <span className="min-w-0 flex-1 truncate font-semibold">{pick.playerName}</span>
              <span className="numeric shrink-0 text-2xs text-muted">{did(pick)}</span>
            </p>
            <p className="pl-9 pt-0.5 text-2xs text-faint">
              {pick.ownerName}
              {/* The best story on the page: his own manager left him out. Said
                  only of a lineup we know he was left out of. */}
              {!fielded || pick.started ? null : (
                <span className="font-semibold text-mid"> · left him on the bench</span>
              )}
            </p>
          </li>
        ))}
      </ul>
    </Column>
  );
}
