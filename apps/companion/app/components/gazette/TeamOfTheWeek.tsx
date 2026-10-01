import { DASH, type Pick, type TeamOfTheWeek as Eleven } from "@epl/core";
import Column from "./Column";

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
    <Column title={partial ? "Team of the week so far" : "Team of the week"}>
      {eleven.lines.map((line) => (
        <div key={line.position} className="py-1.5">
          <p className="font-sans text-3xs font-semibold uppercase tracking-[0.16em] text-faint">
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
