import { DASH, type Pick, type TeamOfTheWeek as Eleven } from "@epl/core";
import Column from "./Column";
import { STANDING_CAPS } from "./heads";

// The best eleven anyone owned this week, as a sidebar column grouped by line;
// each man prints his owner and his Fantrax points (Craig, 1 Oct 2026: "just put points").

export default function TeamOfTheWeek({
  eleven,
  mine,
  partial,
  fielded,
}: {
  eleven: Eleven;
  mine: string | null;
  /** The gameweek is still being played, which the heading says: an eleven from four fixtures is not the week's. */
  partial: boolean;
  /** The lineup these picks came from was the one fielded; false withholds who started, never the eleven. */
  fielded: boolean;
}) {
  return (
    <Column title={partial ? "Team of the week so far" : "Team of the week"}>
      {eleven.lines.map((line) => (
        <div key={line.position} className="py-1.5">
          <p className={`${STANDING_CAPS} text-faint`}>
            {line.position}
          </p>
          <ul>
            {line.picks.map((pick) => (
              <Man
                key={pick.playerCode}
                pick={pick}
                mine={pick.ownerTeamId === mine}
                fielded={fielded}
              />
            ))}
          </ul>
        </div>
      ))}
    </Column>
  );
}

/** One of the eleven, on one line: name and owner left, his points right. "Benched" is said
 *  only of a lineup we know was fielded. */
function Man({ pick, mine, fielded }: { pick: Pick; mine: boolean; fielded: boolean }) {
  return (
    <li className="pt-0.5">
      <span className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate">
          <span className={mine ? "font-semibold text-accent" : "font-semibold"}>
            {pick.playerName}
          </span>{" "}
          <span className="text-faint">
            {!fielded || pick.started ? pick.ownerName : `${pick.ownerName} · benched`}
          </span>
        </span>
        <span className="numeric shrink-0 font-semibold text-ink">{pick.points ?? DASH}</span>
      </span>
    </li>
  );
}
