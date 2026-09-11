import Link from "next/link";
import { goalGroups } from "@epl/core";
import type { FootballPlayer, PlGoal, PlGoalGroup, PlayerOwner, SheetRow } from "@epl/core";
import { PLAYER } from "../../routes";
import EventIcon from "../../../components/football/EventIcon";
import { SMALL_CAPS } from "@/app/desk";

// Who scored, when, and who made it.
//
// **A list of GOALS, not of men, folded to one line per SCORER.** A man-list
// gives a scorer and an assister the same white name and the same yellow minute
// and nothing but prior knowledge tells them apart (Craig, 10 Sep 2026: *"so
// now, goals and assists look the same"*); a goal-list repeats a man's own name
// over his second goal, which says nothing the minute beside it had not (Craig,
// 11 Sep 2026: *"isak can have one row only for both goals"*). So: the scorer on
// the line with all his minutes, the men who made them under him, quieter and
// smaller. `goalGroups` in core does the folding and is tested there.
//
// **The owner rides in brackets after the name**, scorer and assister alike
// (*"owner name can go after ISAK (put in brackets), saves a row"*). A league
// team name is a gloss on the name it follows, not a fact with a row of its own,
// and this is the screen with the fewest facts in the app.
//
// **An assister carries a minute unless it would only repeat the line above
// him**, which is exactly when he made EVERY one of that scorer's goals —
// position has already said it, because he sits under the man whose goals they
// were. He is in the opposite case two ways, and both are real rows:
//
//   - two assisters on a brace, where `A Semenyo 17'` over `A Foden 84'` is the
//     only thing pairing each man with his goal; and
//   - one assister on a hat-trick — Bruno Fernandes scored 40', 61' and 68'
//     against Ipswich with Cunha on the 40' alone, and a bare `A Cunha` under
//     `40', 61', 68'` reads as though he made all three.
//
// Hence `his.length !== group.minutes.length`, and not a count of assisters.
// *Three attempts at this rule shipped in one afternoon — no minute, a minute
// always, a minute only on a second assister — and the two failures are worth a
// line because each looked right against the fixture in front of it.*
//
// What tells a goal from an assist never rested on the minute: the ball, the
// `A`, the indent, the ink and the size are five marks without it.
//
// **The ball marks the goal line.** `EventIcon`'s own rule is that a glyph
// stands beside a word and never instead of one; here the word is the name and
// the minute, which is what CM's sheet is. `aria-hidden`, sized in `em`, so it
// takes the size of whatever box holds it — see `Man` for why that box states
// one.
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
/** The assister's minutes: the scorer's ink and column, at the assister's size. */
const ASSIST_FIGURE = "numeric shrink-0 font-bold text-accent text-sm lg:text-xl";

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
        figure={minutes(group.minutes)}
        note={group.own ? "og" : null}
        glyph
      />
      {group.assisters.map(({ code, minutes: his }) => {
        const assister = byCode.get(code);
        if (assister === undefined) return null;
        const owner = owners.get(code);
        // See the head of this file: his clock is drawn unless it would only
        // repeat the line above him — which is exactly when he made EVERY one of
        // this scorer's goals.
        const paired = his.length !== group.minutes.length;
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
            <span className="min-w-0 flex-1 truncate font-chrome text-sm font-bold text-muted lg:text-xl">
              {assister.name}
              {owner === undefined ? null : (
                <span className={`${OWNER} ml-1`}>({owner.teamName})</span>
              )}
            </span>
            {/* **His own minutes, in the scorer's figure column and his own
                size.** The accent, because it is the same column and the same
                kind of fact; a step down, because his name is — the figure and
                the name it belongs to stay in proportion at both widths. */}
            {paired ? <span className={ASSIST_FIGURE}>{minutes(his)}</span> : null}
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
  glyph = false,
}: {
  code: number | null;
  name: string;
  owners: Map<number, PlayerOwner>;
  figure: string;
  note?: string | null;
  /** Whether this line is a GOAL, and so takes the ball. A sending off and a
   *  penalty missed share this shape and take their word instead — `EventIcon`
   *  has a card and no glyph for a miss, and a ball on either would be the
   *  wrong statement rather than a missing one. */
  glyph?: boolean;
}) {
  const owner = code === null ? undefined : owners.get(code);
  return (
    <Link
      href={code === null ? "#" : `${PLAYER}/${code}`}
      className="group flex min-h-11 items-baseline gap-1.5 lg:min-h-11 lg:gap-3"
    >
      {glyph ? (
        // **Its own type size, which is what makes it big.** `EventIcon` draws at
        // `1.1em`, so the glyph is only ever as large as the type of the box it
        // sits in — and this box inherited the LIST's size, not the name's, which
        // is why it shipped at about 15px beside a 30px name and read as a bullet
        // (Craig: *"make goal icon bigger"*). Stating the size here fixes that.
        //
        // **A step above the name on the DESK, level with it on the phone**, and
        // the phone half is not timidity. A scoresheet column is half a 390px
        // screen, so every pixel the glyph takes comes off the name beside it:
        // at a step above, Palace 1-4 City read `Donnarum…`, `Haalan…` and
        // `Cherki (…` with two of the three owner brackets truncated away
        // entirely. The desk has the room and takes the full step.
        <span className="shrink-0 self-center text-lg text-accent lg:text-4xl">
          <EventIcon glyph="ball" />
        </span>
      ) : null}
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

/** A run of minutes as a scoresheet prints them. */
function minutes(said: readonly number[]): string {
  return said.map((minute) => `${minute}'`).join(", ");
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
