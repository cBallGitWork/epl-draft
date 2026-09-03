import { COMPETITION_NAME } from "@epl/core";
import Caption from "../components/shell/Caption";
import PageHeader from "../components/shell/PageHeader";
import PremNav from "./PremNav";
import type { PremSection } from "./PremNav";
import { PANEL } from "@/app/desk";

// The frame every Premiership screen wears, including when it has nothing to
// show.
//
// `league/Shell.tsx`'s argument applies here unchanged, and this is deliberately
// a copy of it rather than a generalisation of it: two shells are a coincidence
// (CODE_RULES §1), and everything the two genuinely share — the bar, the strip,
// the caption — is already extracted into `components/shell/`. What is left is
// four lines of composition and one number, and a `Shell` taking a nav as a prop
// would be a parameter added so that a second caller could exist.
//
// **The competition bar, which is the one this section is entitled to.** CM
// draws two title bars and which one you get says what KIND of thing the screen
// is about: `cm9900/24.jpg` is a competition — a light plate with the title in
// blue, centred, no crest — and `25.jpg` is a club. This section is about the
// competition itself, which makes it the only screen in the app besides
// `/league` that opens with the first.

/** How many rows a Premiership panel is drawn to hold.
 *
 *  Twenty, and unlike `league/Shell`'s ten this is not a floor waiting to be
 *  overtaken by a league that says otherwise: the Premier League is twenty
 *  clubs, FPL publishes twenty, and a season in which it is not twenty is a
 *  season this whole section is rewritten for. It is still read from the caller
 *  where the caller knows — a table drawn before FPL answers should not be a
 *  strip. */
export const PANEL_ROWS = 20;

export default function PremShell({
  title,
  current,
  rows,
  children,
}: {
  /** What this VIEW is — "League Table", "Results". CM's yellow caption inside
   *  the panel: the bar above names the competition, this names what is in the
   *  box, and every screen in the reference carries both. */
  title: string;
  current: PremSection;
  /** How many rows the panel is drawn to hold, when the caller knows better
   *  than `PANEL_ROWS` — a results page holds rounds rather than clubs. */
  rows?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      {/* No `sub`. `PageHeader` will set a line under the bar and every screen
          in the reference has nothing there — a count floating between the bar
          and the strip reads as debris rather than as a caption, and the
          caption box below already names the screen. */}
      <PageHeader title={COMPETITION_NAME} competition />
      <PremNav current={current} />
      <Caption>{title}</Caption>

      {/* Sized in ROWS rather than pixels, because only CSS has the breakpoint:
          a row is 45px under a thumb and 29px on the desk (`--table-row` in
          `desk.css`, measured rather than assumed). A panel that shrinks to its
          contents is why CM's tables look full and ours looked abandoned. */}
      <section
        className={PANEL}
        style={{
          minHeight: `calc(${Math.max(rows ?? 0, PANEL_ROWS)} * var(--table-row) + var(--table-chrome))`,
        }}
      >
        {children}
      </section>
    </div>
  );
}
