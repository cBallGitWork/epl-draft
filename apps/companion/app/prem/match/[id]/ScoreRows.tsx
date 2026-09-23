import { DASH } from "@epl/core";
import type { FootballPlayer, PlGoalGroup, PlayerOwner, SquadPlayerDetail } from "@epl/core";
import { MaybeCard } from "./PlayerCardButton";
import EventIcon from "../../../components/football/EventIcon";
import type { EventGlyph } from "../../../components/football/EventIcon";
import { SMALL_CAPS } from "@/app/desk";

// One scorer's line and one other man's line on the scoresheet, set at CM's size (see `Scoresheet`).

const NAME = "font-chrome text-lg font-bold lg:text-3xl";
const FIGURE = "numeric shrink-0 font-bold text-accent text-lg lg:text-3xl";
/** The league team that owns him, in brackets after his name — a gloss, so quieter and a step under it. */
const OWNER = "text-2xs font-normal text-faint lg:text-base";
/** The assister's minutes: the scorer's ink and column, at the assister's size. */
const ASSIST_FIGURE = "numeric shrink-0 font-bold text-accent text-sm lg:text-xl";

/** One scorer with all his minutes, and under him the men who made them, in the order the goals came. */
export function Goal({
  group,
  owners,
  byCode,
  cards,
}: {
  group: PlGoalGroup;
  owners: Map<number, PlayerOwner>;
  byCode: Map<number, FootballPlayer>;
  cards: ReadonlyMap<number, SquadPlayerDetail>;
}) {
  const scorer = group.scorer === null ? undefined : byCode.get(group.scorer);

  return (
    <li>
      <Man
        code={group.scorer}
        card={group.scorer === null ? undefined : cards.get(group.scorer)}
        name={scorer?.name ?? DASH}
        owners={owners}
        figure={minutes(group.minutes)}
        note={group.own ? "og" : null}
        glyph="ball"
      />
      {group.assisters.map(({ code, minutes: his }) => {
        const assister = byCode.get(code);
        if (assister === undefined) return null;
        const owner = owners.get(code);
        // His minutes, unless he made every one of this scorer's goals and they would only repeat the line above.
        const paired = his.length !== group.minutes.length;
        return (
          <MaybeCard
            key={code}
            player={cards.get(code)}
            className="flex min-h-9 w-full items-center gap-1.5 pl-3 text-left hover:underline lg:pl-4"
          >
            <span className={`${SMALL_CAPS} shrink-0 text-faint`}>A</span>
            <span className="min-w-0 flex-1 truncate font-chrome text-sm font-bold text-muted lg:text-xl">
              {assister.name}
              {owner === undefined ? null : (
                <span className={`${OWNER} ml-1`}>({owner.teamName})</span>
              )}
            </span>
            {paired ? <span className={ASSIST_FIGURE}>{minutes(his)}</span> : null}
          </MaybeCard>
        );
      })}
    </li>
  );
}

/** A name and the figure beside it, the shape both a goal and a leftover mark take. */
export function Man({
  code,
  card,
  name,
  owners,
  figure,
  note = null,
  glyph = null,
  glyphTone = "text-accent",
}: {
  code: number | null;
  /** His card; a man with none reads as a plain line. */
  card: SquadPlayerDetail | undefined;
  name: string;
  owners: Map<number, PlayerOwner>;
  figure: string;
  note?: string | null;
  /** A goal takes the ball, a sending off the card, an injury the cross; a missed penalty none, its word says it. */
  glyph?: EventGlyph | null;
  /** Its ink. A card is red because it IS a red card; the ball is the accent. */
  glyphTone?: string;
}) {
  const owner = code === null ? undefined : owners.get(code);
  return (
    <MaybeCard
      player={card}
      // One centre line for the glyph and the name; a baseline row set the ball four pixels low.
      className="group flex min-h-9 w-full items-center gap-1.5 text-left lg:min-h-11 lg:gap-3"
    >
      {glyph === null ? null : (
        // `EventIcon` is 1.1em, so it states its own size: level with the name on a phone, a step up on the desk.
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
    </MaybeCard>
  );
}

/** A run of minutes as a scoresheet prints them. */
function minutes(said: readonly number[]): string {
  return said.map((minute) => `${minute}'`).join(", ");
}
