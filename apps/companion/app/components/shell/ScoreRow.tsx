import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ordinal } from "@epl/core";

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
// **The index block holds the side's LEAGUE POSITION** (Craig, 5 Sep 2026: *"The
// blue box in CM is for league position… Put current league position there
// instead. Keep the logos in the row."*). It held the badge for half a day, on a
// reading of the Evening Results shot where the block carries a NATION — which
// it does, and which is a fact about the team rather than a ranking. `24.jpg`
// is the one to follow: CM's league table runs `1st` `2nd` `3rd` down the same
// blue block, and a position is the thing that block means everywhere else in
// the game and everywhere else in this app (`league/TableRow`, `prem/ClubRow`,
// the wire's minute).
//
// So the badge moved one column right and sits beside the name, which is where
// every other list in this app already draws it. Both are on the row and each is
// in the slot it belongs in — which is also what pays for the extra width: see
// `GRID`.
//
// **The position is the caller's to supply and may be absent.** A cup side
// nobody has been drawn into has none, and neither does a club in a table with
// no football played in it yet. Absent draws an empty block rather than a nought
// — the block is the spine and it holds its place (DESIGN §7).

/** One side of a scoreline. */
export interface ScoreSide {
  /** The full name, which is what the desk prints. */
  name: string;
  /** The three or four letters a phone prints instead — Craig, 5 Sep: "full
   *  desktop - full team name". Falls back to the full name when a side has no
   *  short form, which is every Fantrax manager. */
  short?: string;
  /** His badge, beside the name. Undefined draws nothing rather than a stand-in
   *  picture: a wrong image is worse than none, because only one of the two looks
   *  like an answer. */
  badge?: string;
  /** Where he stands in his own competition — the ordinal that goes in CM's blue
   *  block. Null or undefined for a side with no position: a placeholder in a
   *  cup draw, or a club in a table nobody has played a game in. */
  place?: number | null;
  /** The reader's own team — the accent, and the only thing it means here. */
  mine?: boolean;
  /** Settled and BEHIND, which is the one this has to be. The reference prints
   *  both scores in the same cyan, so the figure cannot say who won and the name
   *  has to — and dimming the loser is the only version of that which leaves a
   *  live or unplayed row alone. Undefined is a side nobody has beaten yet, and
   *  it prints white like every other name. */
  lost?: boolean;
}

/** The badge beside the name: 16px under a thumb, 18 on the desk.
 *
 *  Smaller than `TeamBadge`'s 26/20, and deliberately: this row now carries a
 *  position block AND a badge AND two names AND two totals inside 282px on a
 *  390 phone, so every fixed thing on it is at the smallest size it can be read
 *  at. `_PX` is what `next/image` is told to fetch and is the LARGER of the two,
 *  on `TeamBadge`'s own rule — a source fetched smaller than it is drawn is a
 *  soft badge nobody thinks to blame the CSS for. */
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
   *  the reader's men in the match.
   *
   *  **`undefined` removes the column; an empty node keeps it.** The distinction
   *  is the one a panel needs: a football row always passes something, even when
   *  the match is unstarted and none of your men are in it, so every kickoff time
   *  in the panel lands at the same x. A results row passes nothing at all, and
   *  a permanently empty 48px column on a 390 screen is 48px the two names
   *  wanted. */
  tail?: ReactNode;
  /** Where the whole row leads. A row without one is not a control and takes no
   *  tap floor. */
  href?: string;
}) {
  const row = (
    <div
      className={`grid min-h-11 items-stretch lg:min-h-7 ${tail === undefined ? GRID.plain : GRID.tailed} ${
        home.mine === true || away.mine === true ? "border-l-4 border-l-accent" : ""
      }`}
    >
      <Block side={home} />
      <Name side={home} />
      {/* The score column, and the colon is the reference's own separator —
          `1:3`, not `1-3`. Cyan, which is DESIGN §3's derived-reading slot and
          exactly what the game spends it on here. `.numeric` is what keeps a
          column of them lined up. */}
      <span className="numeric flex w-16 shrink-0 items-center justify-center gap-1 text-sm font-bold text-info lg:w-24 lg:text-base">
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
      {tail === undefined ? null : (
        <span className="flex w-7 shrink-0 items-center justify-end gap-1 text-right lg:w-20 lg:px-1">
          {tail}
        </span>
      )}
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
 *  282px inside the panel and the gaps take 10 of it. A row with a tail spends
 *  156 more on two blocks, the score and the tail, leaving **58px a name**; one
 *  without spends 128 and leaves 73. Take the badge and its gap off the first and
 *  a club has about 40px of text — which is why the phone prints three letters
 *  and the desk prints Nottingham Forest. That is Craig's own "full desktop -
 *  full team name", and the arithmetic is what makes it the only available answer
 *  rather than a preference.
 *
 *  A Fantrax manager has no short form, so his name truncates on the phone; the
 *  badge beside it and the position block before it are what identify him at that
 *  width. **The tail is 28px and not 48**, which it was until the ownership count
 *  came off it: all that is left in there is a clock or `FT`, and the 20px went
 *  to the two names. */
/** Five tracks when the row has no tail, six when it has.
 *
 *  **Written out twice rather than composed**, and `desk.ts` records the reason
 *  by name: two utilities of one kind on one element are resolved by their order
 *  in the GENERATED stylesheet, not by their order in the class attribute, so
 *  `${GRID} grid-cols-[...six...]` picks a winner nobody chose. Both spellings
 *  also have to appear literally in scanned source or Tailwind v4 emits
 *  neither. */
const GRID = {
  plain: "grid-cols-[auto_1fr_auto_1fr_auto] gap-x-0.5 lg:gap-x-2",
  tailed: "grid-cols-[auto_1fr_auto_1fr_auto_auto] gap-x-0.5 lg:gap-x-2",
} as const;

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
    <span className="cm-index numeric flex w-8 shrink-0 items-center justify-center text-3xs font-bold lg:-my-0.5 lg:w-9">
      {/* An ORDINAL, which is what `cm9900/24.jpg` prints — `1st`, `2nd` — and
          not a bare number. Empty rather than a dash for a side with no place:
          the block is furniture that holds the column, and a dash inside it
          would read as a figure. */}
      {side.place === null || side.place === undefined ? "" : ordinal(side.place)}
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
      className={`flex min-w-0 items-center gap-1 font-chrome text-sm font-bold lg:gap-1.5 lg:text-base ${
        side.mine === true ? "text-accent" : side.lost === true ? "text-muted" : "text-ink"
      }`}
    >
      {/* **The logo stays in the row** (Craig, 5 Sep 2026), beside the name
          rather than inside the blue block — which is where every other list in
          this app already draws it, and where it has to be now that the block
          carries a position. */}
      {side.badge === undefined ? null : (
        <Image
          src={side.badge}
          alt=""
          width={BADGE_PX}
          height={BADGE_PX}
          className="h-3.5 w-3.5 shrink-0 object-contain lg:h-[1.125rem] lg:w-[1.125rem]"
        />
      )}
      <span className="truncate lg:hidden">{side.short ?? side.name}</span>
      <span className="hidden truncate lg:inline">{side.name}</span>
    </span>
  );
}
