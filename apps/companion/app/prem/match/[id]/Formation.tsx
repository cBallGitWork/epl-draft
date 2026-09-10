import type { Club, FootballPlayer, PlSquadMan, PlTeamSheet } from "@epl/core";
import PitchMarker from "../../../components/league/PitchMarker";
import { PANEL } from "@/app/desk";
import PitchRows, { widestLine } from "../../../components/league/PitchRows";
import { sheetName } from "./match";

// The shape both sides were named in, drawn rather than described.
//
// Craig, 10 Sep 2026: *"we need the line ups page to show the actual formation
// too… not sure where to put it."* Here, over the team sheet, because the two
// are one answer: the pitch says how they lined up and the board under it says
// what each of them then did.
//
// **The flat diagram and not the trapezoid**, which is `PitchRows`' own rule
// read straight off its docblock: *"flat is the desk's diagram and the trapezoid
// is football's photograph. A screen about ARRANGEMENT — how a manager lined up
// — gets the diagram, because a diagram is what a formation is."* A team sheet
// is that screen exactly.
//
// **One `widest` across both pitches**, which is the head-to-head's reason and
// applies here for the first time since: two elevens sized independently draw a
// 4-2-3-1's discs larger than a 3-4-3's, so the two sides of one match would be
// drawn to different scales and read as different pitches.

/** What names each line, and why they have to be unique.
 *
 *  `PitchRow.label` is both the React key and the row's `aria-label`, so two
 *  lines called "Midfield" is a duplicate key as well as a screen reader saying
 *  the same thing twice. A 4-2-3-1 has two middle bands and a 3-4-2-1 has two
 *  more, so the middles are numbered and the ends are named. */
function lineNames(rows: readonly PlSquadMan[][]): string[] {
  const last = rows.length - 1;
  let middles = 0;
  return rows.map((_, n) => {
    if (n === 0) return "Goalkeeper";
    if (n === last) return "Attack";
    if (n === 1) return "Defence";
    middles += 1;
    return `Midfield ${middles}`;
  });
}

export default function Formation({
  sheets,
  home,
  away,
  byCode,
}: {
  sheets: { home: PlTeamSheet; away: PlTeamSheet };
  home: Club | undefined;
  away: Club | undefined;
  byCode: Map<number, FootballPlayer>;
}) {
  // Absent rather than empty: a fixture whose sheets carry no formation is one
  // the feed did not publish a shape for, and two blank pitches would be a
  // drawing of a fact we do not have. Both sides carried one on 30/30 completed
  // fixtures of gameweeks 1-3.
  if (sheets.home.shape === null || sheets.away.shape === null) return null;

  // One number for both, read across the two shapes together.
  const widest = Math.max(widestLine(sheets.home.shape.map((players) => ({ players }))), widestLine(
    sheets.away.shape.map((players) => ({ players })),
  ));

  return (
    // **On a panel, because the shape label is text.** DESIGN §2's rule is that
    // nothing on the desk prints on the bare ground — CM never takes the risk,
    // every word in the game is on a plate or inside a translucent well. The
    // formation caption shipped bare over the photograph for one commit and
    // `groundfit` caught it; `sweep` cannot, because the ground is `fixed` at
    // `-z-10` and composites straight past it.
    <div className={`${PANEL} gap-2 lg:grid lg:grid-cols-2`}>
      <Side sheet={sheets.home} club={home} byCode={byCode} widest={widest} />
      <Side sheet={sheets.away} club={away} byCode={byCode} widest={widest} />
    </div>
  );
}

function Side({
  sheet,
  club,
  byCode,
  widest,
}: {
  sheet: PlTeamSheet;
  club: Club | undefined;
  byCode: Map<number, FootballPlayer>;
  widest: number;
}) {
  const shape = sheet.shape ?? [];
  const names = lineNames(shape);
  // The first line IS the keeper's — the provider publishes the grid keeper
  // first (`RawPlFormation`), which is the one ordering fact the shape asserts.
  const keepers = new Set(shape[0] ?? []);

  return (
    <figure className="flex min-w-0 flex-col gap-1">
      {/* The shape over the pitch, which is where `cm9900/19.jpg` sets it. */}
      <figcaption className="cm-title text-center font-chrome text-sm font-bold text-accent lg:text-base">
        {sheet.formation}
      </figcaption>
      <PitchRows
        rows={shape.map((players, n) => ({ label: names[n], players }))}
        keyOf={(man) => String(man.code ?? man.name)}
        flat
        inColumn
        widest={widest}
      >
        {(man) => {
          const player = man.code === null ? undefined : byCode.get(man.code);
          return (
            <PitchMarker
              player={player ?? null}
              // Only reached for a man with neither a club nor a footballer
              // behind him, which a team sheet never has — the shape came from
              // the club's own grid. His number is on the board underneath, in
              // the blue index block CM keeps it in (Craig, 10 Sep 2026: "ditch
              // the number actually" — it was on the chest for one afternoon).
              label={man.shirt === null ? "?" : String(man.shirt)}
              // A 110px card needs "Gakpo", not "Cody Mathès Gakpo".
              name={sheetName(man, byCode)}
              keeper={keepers.has(man)}
              club={club}
              // **Empty, because the board underneath says all of it.** The card
              // can carry one line and `PitchMarker` falls through to the club's
              // short name without one — eleven identical labels saying nothing.
              // The pitch here is the SHAPE; who came off, who was booked and
              // what it was worth are the team sheet's columns, and repeating
              // one of them on the grass would be the screen saying it twice.
              band=""
            />
          );
        }}
      </PitchRows>
    </figure>
  );
}
