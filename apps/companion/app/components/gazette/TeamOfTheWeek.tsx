import { NOTABLE_SAVES, type Pick, type TeamOfTheWeek as Eleven } from "@epl/core";
import Column from "./Column";

// The best eleven anyone owned this week, printed as a standing column.
//
// It has been both things now. Eleven rows on hairlines read as a table, so it
// became a pitch — and a pitch is the largest object a page can carry: at a
// phone's width the grass ran most of a screen on its own, and the front page
// turned into a picture of a team with a newspaper wrapped round it. The shape
// was worth having and the size was not.
//
// So the lines stay and the grass goes. A reader still sees 1-4-4-2 — it is in
// the heading, and the men are grouped under it line by line — but as a sidebar
// column beside the lead rather than as the widest thing on the sheet. The
// reference paper does exactly this with its own best-of list, and it is the
// block a manager scans rather than reads.
//
// The lines come from core, not from a second sort here: `shape` is counted off
// the same lines, so what the heading says and what the column groups cannot
// come apart.

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
  captions,
}: {
  eleven: Eleven;
  mine: string | null;
  /** The selector's line on each man, keyed by his name as the column wrote
   *  it. Empty until that column files — the eleven is picked from facts and
   *  reads perfectly without a word of opinion on it. */
  captions?: Map<string, string>;
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
                caption={captions?.get(pick.playerName)}
              />
            ))}
          </ul>
        </div>
      ))}
    </Column>
  );
}

/** One of the eleven, on one line.
 *
 *  Name and owner left, what he did right — the two things this section is
 *  about, now that the round is over: what he did, and whose he was. The
 *  benching is the best story on the page and keeps its place beside the owner
 *  who did it, said only of a lineup we know he was left out of.
 */
function Man({
  pick,
  mine,
  fielded,
  caption,
}: {
  pick: Pick;
  mine: boolean;
  fielded: boolean;
  caption?: string;
}) {
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
        <span className="numeric shrink-0 text-2xs text-muted">{did(pick)}</span>
      </span>
      {/* The selector's line, when he has filed one. Italic and a size down:
          it is opinion under a row of fact, and a reader should be able to
          tell which is which without being told. */}
      {caption === undefined ? null : (
        <span className="block pt-0.5 text-2xs italic leading-snug text-muted">{caption}</span>
      )}
    </li>
  );
}
