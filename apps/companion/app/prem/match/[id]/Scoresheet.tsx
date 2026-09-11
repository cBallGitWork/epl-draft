import Link from "next/link";
import { goalGroups } from "@epl/core";
import type { FootballPlayer, PlGoal, PlGoalGroup, PlayerOwner, SheetRow } from "@epl/core";
import { PLAYER } from "../../routes";
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
// **And one line per SCORER, carrying all his minutes** (Craig, 11 Sep 2026:
// *"isak can have one row only for both goals… both assists can be one row too
// if its both. if it was 2 players, just show two assists row."*). That is not a
// reversal of the move above: the scorer and the assister still sit on different
// lines in different ink at different sizes, and what folds is only a man's own
// name repeated over his second goal, which said nothing the minute beside it
// had not. `goalGroups` in core does the folding and is tested there; Alex
// Scott's two Bournemouth goals were the case that used to want two rows, and
// he now reads `9', 35'` with his one assister under him once.
//
// **The owner rides in brackets after the name** (same message: *"owner name can
// go after ISAK (put in brackets), saves a row"*). It was a second line under
// every name — two rows of chrome for one man, on the screen with the fewest
// facts in the app — and a league team name is a gloss on the name it follows,
// not a fact of its own. The assister gets his the same way, which he did not
// have at all.
//
// **CM's own arrangement otherwise.** `cm0102/02.jpg` prints the home scorers
// down the left and the away down the right with the minute in yellow beside
// each. Neither column is mirrored: the reference sets both sides name-first
// with the figure to its right, and the side is carried by WHICH COLUMN a name
// is in.
//
// **The type is set at CM's size**, which is the recorded exception DESIGN §6
// carries: this is a screen whose entire content is a few names and a few
// minutes, and the game sets them large enough to read across a room. Craig,
// 11 Sep 2026: *"can make scorer and minute font bigger"* — the desk step went
// with it, where `02.jpg` sets a scorer at about 2.2% of its canvas.

const NAME = "font-chrome text-lg font-bold lg:text-3xl";
const FIGURE = "numeric shrink-0 font-bold text-accent text-lg lg:text-3xl";
/** The league team that owns him, in brackets after his name. Quieter than the
 *  name and a step under it at both widths, because it glosses the name rather
 *  than competing with it. */
const OWNER = "text-2xs font-normal text-faint lg:text-base";

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
      {goalGroups(goals).map((group) => (
        <Goal
          key={`${group.scorer ?? "?"}-${group.own}-${group.minutes[0]}`}
          group={group}
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

/** One scorer: everything he got and when, and under him the men who made them.
 *
 *  **No assister carries a minute of his own**, which is the whole point of the
 *  arrangement — he shares the scorer's, and printing it twice is what made a
 *  goal and an assist look alike in the first place. With two goals folded into
 *  one row there is no single clock left to print beside him anyway, and the
 *  order he appears in is the order the goals came. */
function Goal({
  group,
  owners,
  byCode,
}: {
  group: PlGoalGroup;
  owners: Map<number, PlayerOwner>;
  byCode: Map<number, FootballPlayer>;
}) {
  const scorer = group.scorer === null ? undefined : byCode.get(group.scorer);

  return (
    <li>
      <Man
        code={group.scorer}
        name={scorer?.name ?? "—"}
        owners={owners}
        figure={group.minutes.map((minute) => `${minute}'`).join(", ")}
        note={group.own ? "og" : null}
      />
      {group.assisters.map((code) => {
        const assister = byCode.get(code);
        if (assister === undefined) return null;
        const owner = owners.get(code);
        return (
          <Link
            key={code}
            href={`${PLAYER}/${assister.code}`}
            // **`min-h-11` under a thumb, `lg:min-h-9` on the desk** — the two
            // floors a LINK has, and this shipped with neither. It was
            // `min-h-9 lg:min-h-7`: the desk's control height on a phone, where
            // the floor is 44, and the desk's repeating-ROW height above `lg`,
            // where a control's floor is 36. So it failed at both widths, and
            // fixing only the phone on 10 Sep left the 1440 half standing —
            // `tapfit` walks both and was reporting the desk one while the
            // commit message said it was clean. The scorer link below it has had
            // `min-h-11` at both widths all along.
            className="ml-3 flex min-h-11 items-baseline gap-1.5 hover:underline lg:ml-4 lg:min-h-9"
          >
            <span className={`${SMALL_CAPS} shrink-0 text-faint`}>A</span>
            <span className="min-w-0 truncate font-chrome text-sm font-bold text-muted lg:text-xl">
              {assister.name}
              {owner === undefined ? null : (
                <span className={`${OWNER} ml-1`}>({owner.teamName})</span>
              )}
            </span>
          </Link>
        );
      })}
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
      <span className="min-w-0 flex-1 truncate">
        <span className={`group-hover:underline ${NAME}`}>{name}</span>
        {note === null ? null : <span className={`${SMALL_CAPS} ml-1.5 text-bad`}>{note}</span>}
        {owner === undefined ? null : (
          <span className={`${OWNER} ml-1.5`}>({owner.teamName})</span>
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
