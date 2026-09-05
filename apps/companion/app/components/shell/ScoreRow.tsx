import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

// Championship Manager's results row, and the app now has one spelling of it.
//
// Craig sent `craig/01-evening-results.jpg` on 5 Sep 2026 — the game's Evening Results screen —
// with the grammar written out: *"blue box for position, scores in cyan, teams
// in white, full desktop - full team name."* Measured off those pixels rather
// than judged by eye:
//
//   index block   `#02068d`, 50px of a 920px shot, one at EACH end of the row,
//                 butted with no gap so six of them read as a spine
//   name          `#f3f8fc` white, mixed case, left in its own column
//   score         `#befafc` cyan, a COLON between the halves, one fixed column
//   yours         `#ffff03` yellow on the NAME — Man City, in a list of six
//   row pitch     29px of a 562px shot
//
// **A grid and not a flex, which is the part a reading would miss.** In the
// reference every home name starts at the same x, every score ends at the same
// x, and every away name starts at the same x — six rows, one set of columns.
// The app's four scoreline rows all flexed instead, so the home name was pushed
// right against the score and the column bent with the longest name on screen.
//
// **Four call sites, so this is an extraction and not a component built for
// one** (CODE_RULES §1, which sets the bar at three): `matchday/Scores` draws
// both a draft tie and a football match, `league/schedule/Tie` draws a tie or a
// cup tie, `league/results/Result` draws a settled one. `matchday/desk/Rows` is
// deliberately NOT the fifth — that wall is read at arm's length, nothing on it
// is a tap target and its rows are 26px with no floor at all, which `desk.md`
// makes binding by name.
//
// **What the index block holds is the badge, and that is a departure recorded
// rather than smuggled.** CM's block carries a nation — a flag-like chip that
// says which side this is before you have read the name. Ours is the club crest
// or the manager's own Fantrax badge, which is the same job in this league's
// vocabulary and is what Craig asked for in the same message (*"for all rows
// with a prem team, include logo. draft - use the team logo from fantrax"*). The
// block keeps CM's blue, so a column of them still reads as the spine.

/** One side of a scoreline. */
export interface ScoreSide {
  /** The full name, which is what the desk prints. */
  name: string;
  /** The three or four letters a phone prints instead — Craig, 5 Sep: "full
   *  desktop - full team name". Falls back to the full name when a side has no
   *  short form, which is every Fantrax manager. */
  short?: string;
  /** The badge for the index block. Undefined draws the block empty rather than
   *  a stand-in picture: a wrong image is worse than none. */
  badge?: string;
  /** The reader's own team — the accent, and the only thing it means here. */
  mine?: boolean;
  /** Settled and BEHIND, which is the one this has to be. The reference prints
   *  both scores in the same cyan, so the figure cannot say who won and the name
   *  has to — and dimming the loser is the only version of that which leaves a
   *  live or unplayed row alone. Undefined is a side nobody has beaten yet, and
   *  it prints white like every other name. */
  lost?: boolean;
}

/** The badge inside the index block: 18px, at both widths.
 *
 *  The block around it is 32px under a thumb and 36 on the desk, which is what a
 *  390 screen has to spare after two names, two totals and a tail — measured,
 *  not chosen. CM's own block is 5.4% of its canvas and ours is 8%, because a
 *  Fantrax total is `61.4` where a football score is one digit. */
const BADGE_PX = 18;

export default function ScoreRow({
  home,
  away,
  score,
  pending,
  tail,
  href,
}: {
  home: ScoreSide;
  away: ScoreSide;
  /** Both figures. Null before a ball is kicked — a fixture is not a goalless
   *  draw, and Fantrax answers 0 for every unplayed period (DESIGN §7). */
  score: { home: ReactNode; away: ReactNode } | null;
  /** What stands in the score's column when there is no score: a kickoff time,
   *  or the `v` a fixture list prints. */
  pending?: ReactNode;
  /** The right-hand slot, past the away block: a clock, `FT`, a day, a count of
   *  the reader's men in the match. Held open even when empty so a column of
   *  rows keeps its columns. */
  tail?: ReactNode;
  /** Where the whole row leads. A row without one is not a control and takes no
   *  tap floor. */
  href?: string;
}) {
  const row = (
    <div
      className={`grid min-h-11 items-stretch lg:min-h-7 ${GRID} ${
        home.mine === true || away.mine === true ? "border-l-4 border-l-accent" : ""
      }`}
    >
      <Block side={home} />
      <Name side={home} />
      {/* The score column, and the colon is the reference's own separator —
          `1:3`, not `1-3`. Cyan, which is DESIGN §3's derived-reading slot and
          exactly what the game spends it on here. `.numeric` is what keeps a
          column of them lined up. */}
      <span className="numeric flex w-14 shrink-0 items-center justify-center text-sm font-bold text-info lg:w-24 lg:text-base">
        {score === null ? (
          <span className="text-2xs font-normal text-faint">{pending}</span>
        ) : (
          <>
            {score.home}
            <span aria-hidden className="px-px text-muted">
              :
            </span>
            {score.away}
          </>
        )}
      </span>
      <Name side={away} />
      <Block side={away} />
      {/* **A fixed width, for the score column's own reason.** It was `auto`,
          so a row with nothing to say on the right — a match none of your men
          are in — was 40px narrower in that column than the rows around it, and
          the two `1fr` name columns took the difference. Every kickoff time in
          the panel landed at a slightly different x, which is the one thing a
          column of scorelines exists to avoid. */}
      <span className="flex w-12 shrink-0 items-center justify-end gap-1 text-right lg:w-20 lg:px-1">
        {tail}
      </span>
    </div>
  );

  // `.cm-row` rides on the LINK when there is one, which is the pattern
  // `TableRow`, `Result` and `Tie` each arrived at separately: a tappable line
  // in a list carries the class itself, or `tapfit` measures it against the
  // control floor and fails.
  return href === undefined ? (
    row
  ) : (
    <Link href={href} className="cm-row block hover:brightness-110">
      {row}
    </Link>
  );
}

/** The columns, named once. A block, a name, the score, a name, a block, and the
 *  tail — the reference's own six, and the two `1fr`s are what hold every name
 *  in the panel at the same x.
 *
 *  **The score column is a fixed width and that is not a tidy-up.** It was
 *  `auto`, so a `12:0` row was 14px wider in the middle than a `4:2` row and the
 *  two `1fr` columns took the difference — every colon in the panel landed
 *  somewhere slightly different. In the reference all six colons are on one
 *  vertical, which is the whole reason the eye can run down a results screen.
 *
 *  **What a 390 phone actually has, measured rather than budgeted.** The grid is
 *  282px inside the panel; the two blocks, the score and the tail take 168 of it
 *  and the gaps 10, which leaves 52px for each name. That is why the phone
 *  prints a club's three letters and the desk prints Nottingham Forest — Craig's
 *  own "full desktop - full team name", and the arithmetic that makes it the
 *  only available answer rather than a preference. A Fantrax manager has no
 *  short form, so his name truncates; the badge beside it is what identifies him
 *  at that width, which is the job CM's nation block does in the reference. */
const GRID = "grid-cols-[auto_1fr_auto_1fr_auto_auto] gap-x-0.5 lg:gap-x-2";

/** CM's blue block, at each end of the row and self-stretched to its full
 *  height — in the reference the blue runs edge to edge with no gap between one
 *  row's block and the next's, which is what makes a column of them a spine
 *  rather than six floating chips. */
function Block({ side }: { side: ScoreSide }) {
  return (
    // **The negative margin is what makes a column of these a SPINE.** `.cm-row`
    // puts 2px of padding above and below every row on the desk, so each block
    // stood 2px clear of the one under it and the blue read as a stack of chips.
    // Measured in the reference: at x=30 the blue is unbroken from y=116 to
    // y=290, six rows with no gap at all. This gives the padding back to the
    // block and to nothing else, so the row keeps the height the density table
    // sets and the blue meets.
    <span className="cm-index flex w-8 shrink-0 items-center justify-center lg:-my-0.5 lg:w-9">
      {side.badge === undefined ? null : (
        <Image
          src={side.badge}
          alt=""
          width={BADGE_PX}
          height={BADGE_PX}
          className="h-[1.125rem] w-[1.125rem] object-contain"
        />
      )}
    </span>
  );
}

/** A name in white, left in its own column, and yellow when it is yours.
 *
 *  The chrome face, which is the one thing on this row that is not measured off
 *  the reference but asked for by name (Craig, 5 Sep: *"for all rows, use the
 *  correct CM font"*). It is the face `desk.css` already puts on every plate.
 *
 *  Two names, one slot: the short form under a thumb and the full one from `lg`.
 *  Both are rendered and one is hidden, rather than branching in JS, because a
 *  server component cannot know the width and a media query can. */
function Name({ side }: { side: ScoreSide }) {
  return (
    <span
      className={`flex min-w-0 items-center font-chrome text-sm font-bold lg:text-base ${
        side.mine === true ? "text-accent" : side.lost === true ? "text-muted" : "text-ink"
      }`}
    >
      <span className="truncate lg:hidden">{side.short ?? side.name}</span>
      <span className="hidden truncate lg:inline">{side.name}</span>
    </span>
  );
}
