import Link from "next/link";
import type { PlayerOwner, SheetRow } from "@epl/core";
import { PLAYER } from "../../PremNav";
import { SMALL_CAPS } from "@/app/desk";

// Who scored, when, and who made it.
//
// **CM's own arrangement, with the assist added** (Craig, 4 Sep 2026: *"the
// screen that has the goal scorer timer needs assists too"*). `cm0102/02.jpg`
// prints the home scorers down the left and the away scorers down the right with
// the minute in yellow beside each — `G.Zola og 5`, `Cort 46, 49`, `Gudjohnsen
// 41, 81`. That is this, and the minutes come from the sister repo's match log;
// FPL publishes none on any endpoint it serves.
//
// **Neither column is mirrored.** The reference sets both sides name-first with
// the figure to its right, and the side is carried by WHICH COLUMN a name is in.
// Reversing the away half put its marks before its names and made one of the two
// lists read backwards.
//
// **A man with no minute still appears.** 20 of 380 matches are logged, so most
// scorers here have a name and no clock — FPL's fixture block knows who scored
// and never when — and the right-hand column says what he did instead.

export default function Scoresheet({
  home,
  away,
  minutes,
  owners,
}: {
  home: readonly SheetRow[];
  away: readonly SheetRow[];
  /** Every goal's minute by FPL code, from the match log. Empty for a match the
   *  sister repo has not reached, which is most of them. */
  minutes: Map<number, number[]>;
  /** Who holds each man in our league, by FPL code. Empty for a reader with no
   *  league, and the sheet then reads as plain football. */
  owners: Map<number, PlayerOwner>;
}) {
  if (home.length === 0 && away.length === 0) {
    return (
      <p className="py-2 text-center text-2xs text-faint">Nobody was named on the scoresheet.</p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
      <Column rows={home} minutes={minutes} owners={owners} />
      <Column rows={away} minutes={minutes} owners={owners} />
    </div>
  );
}

function Column({
  rows,
  minutes,
  owners,
}: {
  rows: readonly SheetRow[];
  minutes: Map<number, number[]>;
  owners: Map<number, PlayerOwner>;
}) {
  return (
    // **Capped, so the minute sits beside the name rather than at the panel
    // edge.** `cm0102/02.jpg` sets its two blocks at about a third of the canvas
    // each with the minutes a short way after the names; stretched to half of a
    // 1120px panel, `Cherki` and `54' 59'` ended up 500px apart and stopped
    // reading as one line.
    <ul className="flex max-w-[22rem] flex-col gap-1">
      {rows.map(({ player, line }) => {
        const when = minutes.get(player.code) ?? [];
        const owner = owners.get(player.code);
        return (
          <li key={player.id}>
            <Link
              href={`${PLAYER}/${player.code}`}
              className="group flex min-h-11 items-baseline gap-2 lg:min-h-9"
            >
              <span className="min-w-0 flex-1">
                <span className="truncate text-sm font-bold group-hover:underline">
                  {player.name}
                </span>
                {noted(line) === null ? null : (
                  <span className={`${SMALL_CAPS} ml-1.5 text-bad`}>{noted(line)}</span>
                )}
                {owner === undefined ? null : (
                  <span className="block truncate text-2xs text-faint">{owner.teamName}</span>
                )}
              </span>

              {/* The minute in the accent, which is CM's own ink for it and the
                  one place on this panel a figure is the point. A brace reads
                  `46' 49'`, which is how `cm0102/02.jpg` prints one. */}
              <span className="numeric shrink-0 text-sm font-bold text-accent">
                {when.length > 0 ? when.map((m) => `${m}'`).join(" ") : marks(line)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** What changes the meaning of the name, said in words rather than in a chip.
 *
 *  An own goal against a scorer's name with no mark on it is the confident wrong
 *  statement DESIGN §7 refuses: FPL files it under the scorer's OWN side, so
 *  without this the away column appears to have scored for the home team. */
function noted(line: SheetRow["line"]): string | null {
  const said: string[] = [];
  if (line.ownGoals > 0) said.push(line.ownGoals > 1 ? `${line.ownGoals} og` : "og");
  if (line.penaltiesMissed > 0) said.push("pen missed");
  return said.length === 0 ? null : said.join(" · ");
}

/** The figure when there is no minute to print: what he actually did.
 *
 *  A name with an empty right-hand column reads as a rendering fault rather than
 *  as an unlogged match — and an assister has no minute even where the log has
 *  one, because the feed records who scored and never who set it up. */
function marks(line: SheetRow["line"]): string {
  const said: string[] = [];
  if (line.goals > 0) said.push(line.goals > 1 ? `${line.goals} goals` : "goal");
  if (line.assists > 0) said.push(line.assists > 1 ? `${line.assists} assists` : "assist");
  if (line.penaltiesSaved > 0) said.push("pen saved");
  if (line.redCards > 0) said.push("red");
  else if (line.yellowCards > 0) said.push("booked");
  return said.join(" · ");
}
