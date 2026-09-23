import type { CSSProperties } from "react";
import { clubColours, inkOn } from "@epl/core";
import type { Club, PlManMatch, PlTeamSheet, PlayerOwner } from "@epl/core";
import { BOARD, PANEL_FLUSH } from "@/app/desk";
import { Head, HeadRow, MUTE, PLATE } from "../../../components/league/TableHeads";
import type { Match } from "./match";
import SheetRow from "./SheetRow";
import { joinOf, ordered, type Join } from "./sheetJoin";

// Championship Manager's team sheet, `cm9900/16.jpg`, both sides at once.
//
// **Every column on it now has a 30/30 source, and three of them did not.** The
// shirt number came from the sister repo's SEASON squad numbers, the sub note
// and the down-the-pitch ordering from its match log — which covers fixtures
// 1-20 of a season whose other exports reach 30, so Ipswich 0-2 Liverpool showed
// a board with no numbers, no sub notes and no order. The Premier League's own
// fixture detail carries all three for every played match: `matchShirtNumber` is
// the number he wore in THIS match, `events` the minute he came on or off, and
// `formation.players` the shape he was named in.
//
// **So the eleven is ordered by the FORMATION and not by a position string.**
// Keeper, then each line as the manager drew it. That is better than sorting on
// a line ordinal in the way a photograph is better than a description: it is the
// actual shape, and a back three stops being read as a back four.

export default function TeamSheet({
  match,
  sheets,
  events,
  owners,
  injured,
}: {
  match: Match;
  sheets: { home: PlTeamSheet; away: PlTeamSheet };
  events: Map<number, PlManMatch>;
  owners: Map<number, PlayerOwner>;
  /** Who went off hurt and when, by FPL code — from the commentary, which is
   *  the only place that says so. Empty is the ordinary answer: 5 of 87
   *  substitutions in a round. This board wants only the `has`; the scoresheet
   *  on the Overview prints the minute. */
  injured: ReadonlyMap<number, number>;
}) {
  const join = joinOf(match);
  return (
    // **Stacked under a thumb, paired on a desk.** CM runs both elevens facing
    // each other because its canvas is 800px and each panel gets ~340. Ours is
    // 390, and two columns gave each side 175 against a row that measures 199 —
    // so Liverpool's points column was pushed out of its panel and silently
    // clipped. The document never overflowed and no row reported a scroll
    // width, which is why only the screenshot caught it.
    // **`min-w-0` down the whole chain, or none of it works.** A flex item AND a
    // grid item both default to `min-width: auto`, which means "never shrink
    // below your content" — so a nowrap head plate deep inside sets a floor that
    // propagates all the way out, and the panel came out 392 wide in the 366 a
    // 390 screen leaves it. It is on this wrapper, on each `<section>`, and on
    // the head cell that had the nowrap.
    <div className="grid min-w-0 gap-2 lg:grid-cols-2">
      <Side
        club={match.home}
        sheet={sheets.home}
        events={events}
        owners={owners}
        join={join}
        injured={injured}
      />
      <Side
        club={match.away}
        sheet={sheets.away}
        events={events}
        owners={owners}
        join={join}
        injured={injured}
      />
    </div>
  );
}

function Side({
  club,
  sheet,
  events,
  owners,
  join,
  injured,
}: {
  club: Club | undefined;
  sheet: PlTeamSheet;
  events: Map<number, PlManMatch>;
  owners: Map<number, PlayerOwner>;
  join: Join;
  injured: ReadonlyMap<number, number>;
}) {
  const colours = clubColours(club?.shortName ?? "");
  const rows = ordered(sheet, events);
  // Where the eleven stops and the bench starts, so the rule goes in one place
  // rather than every row asking whether it is the first substitute.
  const bench = rows.findIndex((row) => row.bench);

  return (
    // **The club's colour, spent on the index block rather than a heading.**
    // `.cm-index` takes `--cm-index` from any scope above it — the idiom a
    // manager's own screens already use — so re-pointing it here colours all
    // eighteen blocks down the side at once (Craig, 11 Sep 2026: *"number cards
    // should match teams"*). `inkOn` answers a pale side, which is a case the
    // reference has: `cm9900/16.jpg` is Everton blue against Torquay white.
    <section
      // **`cm-index-scoped` is a CONTRAST fix, not a look.** Re-pointing the
      // block to a club's colour broke two things that were measured against the
      // app's own deep blue: the 22%-white gradient stop (the scoped ramp now
      // runs away from the ink instead), and `.cm-out`'s dimmed plate ink. `desk.css` carries both and the reasoning; `sweep` found them
      // at 3.63:1 on six shirt numbers at both widths, which is the whole reason
      // that file has a rule at all.
      className={`${PANEL_FLUSH} cm-index-scoped min-w-0`}
      style={
        {
          "--cm-index": colours.primary,
          "--cm-index-ink": inkOn(colours),
        } as CSSProperties
      }
    >
      {/* **The shape, and not the club's name** (Craig, 11 Sep 2026: *"remove
          Fulham / 4-2-3-1 rows, redundant"*, then *"add formation on top row
          again"* once the pitch came off). The plate above this panel already
          names both clubs and carries the score, so the name was the fact twice;
          the shape was on the pitch and now has nowhere else to be.

          Which list is which, when the two stack under a thumb, is answered by
          the index block — it wears the club's own colour down the whole side. */}
      {sheet.formation === null ? null : (
        <p
          className="numeric flex min-h-7 items-center justify-center text-xs font-bold lg:text-sm"
          style={{ background: colours.primary, color: inkOn(colours) }}
        >
          {sheet.formation}
        </p>
      )}
      {/* **`table-fixed`, because `truncate` cannot shrink an AUTO table.**
          `truncate` is `white-space: nowrap`, which makes a cell's min-content
          its full text width — so auto layout sized the name column to the
          longest name on the sheet and the table came out 378 inside a 366
          panel, with the points column over the edge. Every column but the name
          states a width; the name takes what is left and truncates into it,
          which is what it was always meant to do.

          **The widths go on the HEAD row**, which is the half of `table-fixed`
          that bites: a fixed table takes its column widths from the first row
          and ignores every cell below it. Stating them on the `<td>`s left the
          head row's six unsized cells to split the table into sixths, and the
          names came out as `C…`, `A…`, `J…`. Measured at 390 and 1440. */}
      <table className={`${BOARD} table-fixed`}>
        {/* **Column heads** (Craig, 11 Sep 2026: *"need a FPTS column header,
            position ane name and i guess manager too?"*). The board had none —
            it was CM's own sheet, which labels nothing — and that was fine while
            a row was a number, a name and a figure. It now carries five things
            and three of them share one cell, so the head names that cell's
            contents in the order they appear.

            **The figure is headed `Pts` and cannot be headed `FPts`.** That is
            CLAUDE.md's provenance rule in as many words: `FPts` is Fantrax's
            word for Fantrax's scoring of a slot WE chose, and this is FPL's own
            per-fixture points. The two are different numbers — Fantrax scores
            the roster slot, so Saka at M and Saka at F are paid differently for
            one afternoon. `players/page.tsx` carries what was measured before
            settling on FPL's: Fantrax answers for 6 of 32 participants and
            answers with a PERIOD total. */}
        {/* **The shared strip, not a hand-rolled one** (Craig, 11 Sep 2026:
            *"lets use proper column headers (use shared code)"*). This was three
            bespoke `<th>`s wrapping `HEAD_PLATE` divs — the fourth spelling of a
            head row in the app, and `MUTE`'s own docblock counts seven and says
            what they share. `HeadRow`, `Head` and `PLATE` are what every other
            board wears, so the bevel, the height and the case now match them
            without this file knowing any of the three.

            **No head over the sub column** (*"remiove on header"*). `On` labelled
            a column whose cells read `sub on 61'` — the word twice, and the
            second one abbreviated. `MUTE` keeps it in the tree for a screen
            reader, which is the same call the ten other boards make for the
            columns that name themselves. */}
        <thead>
          <HeadRow>
            {/* **Every cell wears a plate, even the silent ones.** A bare `<th>`
                is `MUTE`'s own answer for a column that names itself, and it is
                the right one in a table whose head strip runs edge to edge. This
                strip does not: the shirt block, the card slot and the marks
                column sit between plates, so an empty `<th>` was a dark hole
                punched through the middle of the bevel. The word goes silent,
                the plate stays — which is what `NameHead` does and is why it
                exists.

                **`px-0` on the silent ones**, because `PLATE`'s own padding is
                for a word and these have none: with it, three columns each grew
                by 12px the row below did not want and the table ran past 390
                with the points column clipped off the right. */}
            <Head width="w-8 lg:w-9">
              <span className={`${PLATE} px-0`}>
                <span className={MUTE}>Shirt number</span>
              </span>
            </Head>
            <Head width="w-3">
              <span className={`${PLATE} px-0`}>
                <span className={MUTE}>Card</span>
              </span>
            </Head>
            {/* **`min-w-0` and a truncating label.** `PLATE` is
                `whitespace-nowrap`, which is right for `Pld` and `Pts` and wrong
                for three words: it set a 212px floor under this column, and a
                grid item will not shrink below its content, so the panel came
                out 392 wide in the 366 a 390 screen leaves it and the points
                column was clipped off the right. Measured — the table itself was
                388 and fitted; it was the BOX that overflowed. */}
            <Head width="">
              <span className={`${PLATE} min-w-0 justify-start`}>
                <span className="min-w-0 truncate">Pos &middot; Player &middot; Manager</span>
              </span>
            </Head>
            <Head width="w-9 lg:w-16">
              <span className={`${PLATE} px-0`}>
                <span className={MUTE}>Goals and cards</span>
              </span>
            </Head>
            <Head width="w-10 lg:w-12" title="FPL's own points for this fixture">
              <span className={PLATE}>Pts</span>
            </Head>
          </HeadRow>
        </thead>
        <tbody>
          {rows.map((row, at) => (
            <SheetRow
              key={`${row.man.code ?? row.man.name}-${row.man.shirt ?? at}`}
              row={row}
              owner={row.man.code === null ? undefined : owners.get(row.man.code)}
              join={join}
              club={club}
              hurt={row.man.code !== null && injured.has(row.man.code)}
              opensBench={at === bench}
            />
          ))}
        </tbody>
      </table>
      {/* **No provenance footer** (Craig, 11 Sep 2026: *"remove Points · FPL's
          own row"*). It was there because DESIGN's provenance rule says ours are
          labelled and never sit in a column headed `FPts` — which the column no
          longer is, and never was: the rule is about not passing our reading off
          as Fantrax's, and nothing on this board claims to be. The docblock at
          the head of `players/page.tsx` carries why the figure is FPL's and what
          was measured before settling on it. */}
    </section>
  );
}
