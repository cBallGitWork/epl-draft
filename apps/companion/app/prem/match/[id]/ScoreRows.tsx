import Link from "next/link";
import type {
  FootballPlayer,
  PlGoalGroup,
  PlayerOwner,
} from "@epl/core";
import { PLAYER } from "../../routes";
import EventIcon from "../../../components/football/EventIcon";
import type { EventGlyph } from "../../../components/football/EventIcon";
import { SMALL_CAPS } from "@/app/desk";

// One scorer's line and one other man's line on the scoresheet, set at CM's size (see `Scoresheet`).

const NAME = "font-chrome text-lg font-bold lg:text-3xl";
const FIGURE = "numeric shrink-0 font-bold text-accent text-lg lg:text-3xl";
/** The league team that owns him, in brackets after his name. Quieter than the
 *  name and a step under it at both widths, because it glosses the name rather
 *  than competing with it. */
const OWNER = "text-2xs font-normal text-faint lg:text-base";
/** The assister's minutes: the scorer's ink and column, at the assister's size. */
const ASSIST_FIGURE = "numeric shrink-0 font-bold text-accent text-sm lg:text-xl";

/** One scorer: everything he got and when, and under him the men who made them.
 *
 *  **No assister carries a minute of his own**, which is the whole point of the
 *  arrangement — he shares the scorer's, and printing it twice is what made a
 *  goal and an assist look alike in the first place. With two goals folded into
 *  one row there is no single clock left to print beside him anyway, and the
 *  order he appears in is the order the goals came. */
export function Goal({
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
        glyph="ball"
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
            className="ml-3 flex min-h-11 items-center gap-1.5 hover:underline lg:ml-4 lg:min-h-9"
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
export function Man({
  code,
  name,
  owners,
  figure,
  note = null,
  glyph = null,
  glyphTone = "text-accent",
}: {
  code: number | null;
  name: string;
  owners: Map<number, PlayerOwner>;
  figure: string;
  note?: string | null;
  /** The mark this line carries. A goal takes the ball and a sending off the
   *  card (Craig, 11 Sep 2026: *"need a red card icon"*); a penalty missed or
   *  saved takes none, because `EventIcon` has no glyph that says either and a
   *  ball or a card on one would be a wrong statement rather than a missing
   *  mark — its word still does the work. */
  glyph?: EventGlyph | null;
  /** Its ink. A card is red because it IS a red card; the ball is the accent. */
  glyphTone?: string;
}) {
  const owner = code === null ? undefined : owners.get(code);
  return (
    <Link
      href={code === null ? "#" : `${PLAYER}/${code}`}
      // **`items-center`, not `items-baseline`** (Craig, 11 Sep 2026: *"goals,
      // card icons look off on mobile, they arent aligned"*). A baseline row
      // with a `self-center` glyph in it is two alignment rules arguing: the
      // text sat on its baseline and the icon centred itself in a line box
      // taller than the glyph, which put the ball about four pixels low against
      // the name. Everything on this row is one line, so one centre line is the
      // whole answer — and the glyph no longer needs `self-center` to say so.
      className="group flex min-h-11 items-center gap-1.5 lg:min-h-11 lg:gap-3"
    >
      {glyph === null ? null : (
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
        <span className={`flex shrink-0 items-center text-lg lg:text-4xl ${glyphTone}`}>
          <EventIcon glyph={glyph} />
        </span>
      )}
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
