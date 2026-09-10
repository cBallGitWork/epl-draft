import Link from "next/link";
import type { FootballPlayer, PlGoal, PlayerOwner, SheetRow } from "@epl/core";
import { PLAYER } from "../../PremNav";
import { SMALL_CAPS } from "@/app/desk";

// Who scored, when, and who made it.
//
// **A list of GOALS, not of men** (Craig, 10 Sep 2026, on seeing assists added:
// *"so now, goals and assists look the same"*). He was right and it was the
// arrangement's fault: a man-list gives a scorer and an assister the same white
// name and the same yellow minute, and nothing but prior knowledge tells them
// apart. A scoresheet is a list of goals, so this is one — the scorer on the
// line and the man who made it under him, quieter and without a clock of his own,
// because they share one.
//
// It fixes a second thing on the way. Alex Scott made both Bournemouth goals
// against Newcastle, and as a man-row he appeared once reading `9', 35'`; as
// goals he appears under each, which is what happened.
//
// **CM's own arrangement otherwise.** `cm0102/02.jpg` prints the home scorers
// down the left and the away down the right with the minute in yellow beside
// each. Neither column is mirrored: the reference sets both sides name-first
// with the figure to its right, and the side is carried by WHICH COLUMN a name
// is in.
//
// **The type is set at CM's size**, which is the recorded exception DESIGN §6
// carries: this is a screen whose entire content is a few names and a few
// minutes, and the game sets them large enough to read across a room.

const NAME = "font-chrome text-lg font-bold lg:text-2xl";
const FIGURE = "numeric shrink-0 font-bold text-accent text-lg lg:text-2xl";

export default function Scoresheet({
  home,
  away,
  homeElse,
  awayElse,
  owners,
  byCode,
}: {
  /** One side's goals, oldest first, with assisters already reconciled against
   *  FPL's counts by `creditedGoals`. */
  home: readonly PlGoal[];
  away: readonly PlGoal[];
  /** Men the sheet names for something that is not a goal — a sending off, a
   *  penalty missed. Kept because a scoresheet carries them and a goal list on
   *  its own would drop them. */
  homeElse: readonly SheetRow[];
  awayElse: readonly SheetRow[];
  owners: Map<number, PlayerOwner>;
  byCode: Map<number, FootballPlayer>;
}) {
  const empty =
    home.length === 0 && away.length === 0 && homeElse.length === 0 && awayElse.length === 0;
  if (empty) {
    return (
      <p className="py-2 text-center text-2xs text-faint">Nobody was named on the scoresheet.</p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
      <Column goals={home} rest={homeElse} owners={owners} byCode={byCode} />
      <Column goals={away} rest={awayElse} owners={owners} byCode={byCode} />
    </div>
  );
}

function Column({
  goals,
  rest,
  owners,
  byCode,
}: {
  goals: readonly PlGoal[];
  rest: readonly SheetRow[];
  owners: Map<number, PlayerOwner>;
  byCode: Map<number, FootballPlayer>;
}) {
  return (
    <ul className="flex max-w-[26rem] flex-col gap-1">
      {goals.map((goal) => (
        <Goal
          key={`${goal.minute}-${goal.scorer ?? "?"}`}
          goal={goal}
          owners={owners}
          byCode={byCode}
        />
      ))}
      {rest.map(({ player, line }) => (
        <li key={player.id}>
          <Man code={player.code} name={player.name} owners={owners} figure={marks(line)} />
        </li>
      ))}
    </ul>
  );
}

/** One goal: who scored it and when, and under him the man who made it.
 *
 *  **The assister carries no minute of his own**, which is the whole point of
 *  the arrangement — he shares the scorer's, and printing it twice is what made
 *  a goal and an assist look alike in the first place. */
function Goal({
  goal,
  owners,
  byCode,
}: {
  goal: PlGoal;
  owners: Map<number, PlayerOwner>;
  byCode: Map<number, FootballPlayer>;
}) {
  const scorer = goal.scorer === null ? undefined : byCode.get(goal.scorer);
  const assister = goal.assister === null ? undefined : byCode.get(goal.assister);

  return (
    <li>
      <Man
        code={goal.scorer}
        name={scorer?.name ?? "—"}
        owners={owners}
        figure={`${goal.minute}'`}
        note={goal.own ? "og" : null}
      />
      {assister === undefined ? null : (
        <Link
          href={`${PLAYER}/${assister.code}`}
          className="ml-3 flex min-h-9 items-baseline gap-1.5 hover:underline lg:ml-4 lg:min-h-7"
        >
          <span className={`${SMALL_CAPS} shrink-0 text-faint`}>A</span>
          <span className="min-w-0 truncate font-chrome text-sm font-bold text-muted lg:text-base">
            {assister.name}
          </span>
        </Link>
      )}
    </li>
  );
}

/** A name and the figure beside it, which is the shape both a goal and a leftover
 *  mark take. */
function Man({
  code,
  name,
  owners,
  figure,
  note = null,
}: {
  code: number | null;
  name: string;
  owners: Map<number, PlayerOwner>;
  figure: string;
  note?: string | null;
}) {
  const owner = code === null ? undefined : owners.get(code);
  return (
    <Link
      href={code === null ? "#" : `${PLAYER}/${code}`}
      className="group flex min-h-11 items-baseline gap-3 lg:min-h-11"
    >
      <span className="min-w-0 flex-1">
        <span className={`truncate group-hover:underline ${NAME}`}>{name}</span>
        {note === null ? null : <span className={`${SMALL_CAPS} ml-1.5 text-bad`}>{note}</span>}
        {owner === undefined ? null : (
          <span className="block truncate text-2xs text-faint">{owner.teamName}</span>
        )}
      </span>
      <span className={FIGURE}>{figure}</span>
    </Link>
  );
}

/** What a man is on the sheet for when it is not a goal.
 *
 *  A sending off and a penalty missed are scoresheet entries and a list of goals
 *  would drop them. A booking is not — `named` stopped letting one on this sheet
 *  on 10 Sep 2026. */
function marks(line: SheetRow["line"]): string {
  const said: string[] = [];
  if (line.penaltiesSaved > 0) said.push("pen saved");
  if (line.penaltiesMissed > 0) said.push("pen missed");
  if (line.redCards > 0) said.push("red");
  return said.join(" · ");
}
