import Image from "next/image";
import Link from "@/app/components/shell/Link";
import type { ReactNode } from "react";
import { INDEX_WIDTH, ROW_NAME } from "@/app/desk";
import { yoursMark } from "@/app/mine";

// Championship Manager's results row: an index block at each end holding the side's league position, and the
// names and score in fixed columns so every name and colon lines up down a panel. `matchday/desk/Rows` stays
// its own: its rows are 26px with no tap floor.

/** One side of a scoreline. */
export interface ScoreSide {
  /** The full name, which is what the desk prints. */
  name: string;
  /** The three or four letters a phone prints; without one (every Fantrax manager) the full name stands. */
  short?: string;
  /** A club's crest, beside the name. Undefined draws nothing: a Fantrax team has none. */
  crest?: string;
  /** His place in his own competition as CM's blue block prints it (`3rd`, `=1st`); absent for a cup placeholder or a
   *  club before a game. */
  place?: string | null;
  /** The reader's own team — the accent, and the only thing it means here. */
  mine?: boolean;
  /** Settled and behind: both scores print in one cyan, so the dimmed name says who lost. */
  lost?: boolean;
}

/** The crest beside the name, 20px under a thumb and 26 on the desk; fetched at the larger so it is never soft. */
const CREST_PX = 26;

export default function ScoreRow({
  home,
  away,
  score,
  pending,
  clock,
  href,
}: {
  home: ScoreSide;
  away: ScoreSide;
  /** Both figures; null before a ball is kicked, since Fantrax answers 0 for every unplayed period. */
  score: { home: ReactNode; away: ReactNode } | null;
  /** What stands in the score's column when there is no score: a kickoff time, or a fixture list's `v`. */
  pending?: ReactNode;
  /** The state of the match, drawn inside the score cell just after the figures. */
  clock?: ReactNode;
  /** Where the whole row leads; a row without one is not a control and takes no tap floor. */
  href?: string;
}) {
  const yours = home.mine === true || away.mine === true;
  const row = (
    <div
      className={`grid min-h-11 items-stretch lg:min-h-7 ${GRID} ${yoursMark(yours)}`}
    >
      <Block side={home} />
      <Name side={home} at="home" />
      {/* The score: CM's colon, in the derived-reading cyan, a step above the names; the column's fixed
          width keeps a `12:0` on the same vertical as a `4:2`. */}
      <span className="numeric flex w-[5.5rem] shrink-0 items-center justify-center gap-1 text-lg font-bold text-info lg:w-36 lg:text-2xl">
        {score === null ? (
          // A kickoff time stands where a score would, a step under the score's size.
          <span className="text-sm font-normal text-faint lg:text-base">{pending}</span>
        ) : (
          <>
            {score.home}
            <span aria-hidden className="px-px text-muted">
              :
            </span>
            {score.away}
          </>
        )}
        {clock}
      </span>
      <Name side={away} at="away" />
      <Block side={away} />
    </div>
  );

  // `.cm-row` rides on the link when there is one, or `tapfit` measures it against the control floor and fails.
  return href === undefined ? (
    row
  ) : (
    <Link href={href} className="cm-row block hover:brightness-110">
      {row}
    </Link>
  );
}

/** Block, name, score, name, block: the two `1fr`s hold every name in the panel at one x. */
const GRID = "grid-cols-[auto_1fr_auto_1fr_auto] gap-x-0.5 lg:gap-x-2";

/** Which way a side reads: the away half mirrors the home, so both crests sit against their own block. */
const READS = { home: "", away: "flex-row-reverse" } as const;

/** CM's blue block at each end of the row, stretched to the row's full height. */
function Block({ side }: { side: ScoreSide }) {
  return (
    // The negative margin gives back `.cm-row`'s padding on the desk, so a column of blocks meets as one spine.
    <span
      className={`cm-index numeric ${INDEX_WIDTH} flex shrink-0 items-center justify-center lg:-my-0.5`}
    >
      {/* An ordinal, as CM prints; empty, not a dash, for a side with no place, as a dash would read as a figure. */}
      {side.place ?? ""}
    </span>
  );
}

/** A name in white, yellow when it is yours: the short form under a thumb and the full one from `lg`,
 *  both rendered for a media query to pick, since a server component cannot know the width. */
function Name({ side, at }: { side: ScoreSide; at: "home" | "away" }) {
  return (
    <span
      className={`flex min-w-0 items-center gap-1 lg:gap-1.5 ${ROW_NAME} ${READS[at]} ${
        side.mine === true ? "text-accent" : side.lost === true ? "text-muted" : "text-ink"
      }`}
    >
      {side.crest === undefined ? null : (
        <Image
          src={side.crest}
          alt=""
          width={CREST_PX}
          height={CREST_PX}
          className="h-5 w-5 shrink-0 object-contain lg:h-[1.625rem] lg:w-[1.625rem]"
        />
      )}
      <span className="truncate lg:hidden">{side.short ?? side.name}</span>
      <span className="hidden truncate lg:inline">{side.name}</span>
    </span>
  );
}
