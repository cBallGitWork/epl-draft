import Caption from "../components/shell/Caption";
import PageHeader from "../components/shell/PageHeader";
import PoolNav from "./PoolNav";
import type { ScoutView } from "./PoolNav";
import { PANEL } from "@/app/desk";
import { SCOUT, SCOUT_CAPTION } from "../titles";

// The frame the scouting screens wear.
//
// **Its own section as of 6 Sep 2026** (Craig: *"I think this function will be
// its own section away from the league etc"*). The pool wore `LeagueShell`
// until then, which put a screen about six hundred Premier League footballers
// under a bar naming our ten-team fantasy competition — true of who PRICES them
// and wrong about who they are. DESIGN §1 has listed Players among the Desk's
// own sections all along; it was `sections.ts` that drifted when the foot row
// ran out of room, and the `More` door is what gave it back.
//
// **The blue bar, not the cream competition plate.** `PageHeader` draws two, and
// which one a screen gets says what KIND of thing it is about: `cm9900/24.jpg`
// is a competition — light plate, blue title — and `25.jpg` is a club or a
// person. The cream plate is spoken for twice already, by `/league` and `/prem`,
// and wearing it here would open the pool on one of their bars. Scout is not a
// competition; it is the activity. So it takes the royal-blue bar every other
// subject-without-a-colour takes, which is `/fpl` and `/squad` today.
//
// **The strip arrived with the second view**, which is how it was meant to: this
// shipped without one because the section had a single view, on
// `league/SectionNav`'s recorded ruling that "one entry is a stray button under a
// panel, not a bar". Compare is the second, so `PoolNav` draws two plates.
//
// A copy of `prem/Shell`'s composition rather than a generalisation of it, on
// that file's own argument: three shells are still four lines of composition
// each, everything they genuinely share is already in `components/shell/`, and a
// `Shell` taking a nav as a prop would be a parameter added so a second caller
// could exist.

/** How many rows a scouting panel is drawn to hold.
 *
 *  Not the league's ten and not the division's twenty: this panel holds a
 *  DIRECTORY, and the number that matters is how much of one a reader can see
 *  before scrolling. Fourteen is `cm9900/16.jpg`'s own count: the shot shows
 *  fourteen rows with a scrollbar saying there are more, which is the
 *  arrangement here. It reached this file from `players/Board`'s `VISIBLE_ROWS`,
 *  which is why it is cited to the SHOT now — that file was deleted on 6 Sep
 *  2026 and a constant whose only authority is a deleted file is a number
 *  nobody can check. */
const PANEL_ROWS = 14;

export default function ScoutShell({
  title,
  sub,
  current = "pool",
  rows = PANEL_ROWS,
  children,
}: {
  /** Which view this is, for the strip's current plate. */
  current?: ScoutView;
  /** How many rows to hold the panel open for, when the view knows better.
   *
   *  **An override and not a floor**, which is where this differs from
   *  `prem/Shell`'s `rows` — that one takes the larger of the two because every
   *  Premiership view is a table of at least twenty clubs. Scout has two views
   *  of different kinds: the board IS a directory and wants the fourteen rows,
   *  and Compare is three stacked panels that fill their own height. Taking the
   *  max there held fourteen rows of empty ground open under the attributes,
   *  which is the opposite of the fault the floor exists to prevent. */
  rows?: number;
  /** What the panel is ranked by, when the screen knows — the pool's caption is
   *  its CATEGORY, which is `cm9900/16.jpg`'s own arrangement: the bar names the
   *  subject, the strip marks the section, and the caption says `Average Rating`.
   *  Falls back to the view's own name. */
  title?: string;
  sub?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <PageHeader title={SCOUT} sub={sub} />
      <PoolNav current={current} />
      <Caption>{title ?? SCOUT_CAPTION}</Caption>

      {/* Sized in ROWS rather than pixels, because only CSS has the breakpoint:
          a row is 45px under a thumb and 29px on the desk (`--table-row` in
          `desk.css`, measured rather than assumed). A panel that shrinks to its
          contents is why CM's tables look full and ours looked abandoned. */}
      <section
        className={PANEL}
        style={{
          minHeight: `calc(${rows} * var(--table-row) + var(--table-chrome))`,
        }}
      >
        {children}
      </section>
    </div>
  );
}
