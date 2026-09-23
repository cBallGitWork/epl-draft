import Link from "next/link";
import Image from "next/image";
import { crestForShortName, signed, toFplClubCode, DASH } from "@epl/core";
import type { PoolRow } from "./pool";
import type { PoolColumn, RawStats } from "./columns";
import { figureOf } from "./figure";
import { isStandout } from "./standout";
import { STATUS } from "./status";
import { ANALYSIS, playerHref } from "./routes";
import type { PlayersQuery } from "./query";
import { BOARD_FIGURE, ROW_FIGURE, ROW_NAME, STICKY_LEAD } from "@/app/desk";

// One cell of the pool board, which is two shapes rather than twenty: the
// name is a link with a face on it, and everything else is a figure.
//
// Split out of `PlayerTable.tsx` on 10 Sep 2026, when the standout marks and the
// per-90 rates took that file past CODE_RULES §4's 300-line hard ceiling. The
// seam is the one the file's own docblock already described — the table decides
// which columns exist and in what order, and this decides what one figure looks
// like — and every decision that is about a single figure is now on one side of
// it.

/** One cell. The name is a link with a face on it and everything else is a
 *  figure, so this is two shapes rather than twenty. */
export default function Cell({
  column,
  row,
  query,
  stats,
  teamNames,
  rated,
  cut,
}: {
  column: PoolColumn;
  row: PoolRow;
  query: PlayersQuery;
  stats: RawStats;
  teamNames: Map<string, string>;
  rated: boolean;
  cut: number | null;
}) {
  if (column.key === "name") {
    // Fantrax's club code translated to FPL's spelling before anything is looked
    // up by it. The two agree on eighteen clubs of twenty — Forest is `NOT` on
    // Fantrax and `NFO` on FPL — and an untranslated code would draw no crest
    // for those two on every row they appear in.
    const crest = crestForShortName(toFplClubCode(row.entry.player.clubCode ?? ""));
    return (
      // `lg:py-0` because the cell pads the row from outside it and `.cm-row`
      // cannot reach a `<td>`: 8px here plus the 28 inside is a 37px row on a
      // desk that asked for 28. The phone keeps the padding, and so keeps its 53.
      <td className={`py-1 lg:py-0 ${STICKY_LEAD}`}>
        {/* **Where a row leads depends on what the reader is doing.** With a
            first man chosen (`?compare=`), the board IS the picker and every row
            completes the pair; otherwise a row is the man's own screen. One
            table, two jobs, and the URL says which — no mode toggle, and a
            half-made comparison survives a filter, a sort and being shared. */}
        <Link
          href={
            query.compare && query.compare !== row.entry.player.fantraxId
              ? `${ANALYSIS}?a=${query.compare}&b=${row.entry.player.fantraxId}`
              : playerHref(row.entry.player.fantraxId)
          }
          className="cm-row flex min-h-11 items-center gap-2.5 px-1"
        >
          {/* **The club's crest, not the man's face** (Craig, 10 Sep 2026:
              *"maybe swap out the portrait for the team logo, portrait too small
              here"*). `--row-portrait` is 22px inside a `.cm-row` on the desk,
              which is a photograph of a head at a size where every head looks
              the same — and this row is now two lines tall, so the mark had room
              it was not using.

              A crest reads at 22px where a portrait does not, because it is
              drawn to: it is a flat shape in two or three colours, designed to
              be recognised on a shirt from the back of a stand. `SquadRows` made
              the same choice and its docblock carries the other half of the
              argument — the crest is the one identifying mark we ALWAYS have,
              where a portrait is missing for weeks for a January signing.

              **No plate behind it**, on `SquadRows`'s finding: a Premier League
              badge carries its own shape and its own colours, and a
              club-coloured tile behind one is a second statement of the same
              fact competing with the badge it was meant to support. Nothing in
              `cm9900` puts a plate behind an identifying mark.

              Sized in both axes for the reason recorded there too — `h-full`
              resolves to auto against an auto-sized box, so only the width bound
              applies and a 150:112 crest renders taller than its box and
              overhangs the row. */}
          <span className="grid size-7 shrink-0 place-items-center">
            {crest ? (
              <Image src={crest} alt="" width={28} height={28} className="size-7 object-contain" />
            ) : null}
          </span>
          {/* **The name and, under it, who he is.** Craig, 10 Sep 2026:
              *"position and club are constants, they should be next to the
              player in the same column… probably status too"*. They were three
              text columns between the name and the first figure, which on a
              phone meant a board of twenty measures opened on `M · MUN · 123`
              and no number at all. They are identity rather than measures — you
              do not rank six hundred men by club — and every other table in the
              app already sets a club beside a name rather than in a column of
              its own.

              Two lines inside the link, not two cells: the whole block is one
              tap to his screen, and the subordinate line inherits the row's
              hover and the frozen column's ground for free.

              `truncate` rather than a smaller type: DESIGN §8's rule for the
              pitch cards is the rule here too — the box shrinks and the type
              never does. The cap is gone from the name now that nothing follows
              it across, so a long name uses the column it was given. */}
          <span className="flex min-w-0 flex-col">
            <span className={`truncate ${ROW_NAME}`}>{row.entry.player.displayName}</span>
            <Identity row={row} teamNames={teamNames} />
          </span>
        </Link>
      </td>
    );
  }

  const value = figureOf(column, row, stats, rated);

  if (column.kind === "text") {
    return (
      <td className={`whitespace-nowrap px-1.5 text-left text-2xs text-faint`}>{value ?? DASH}</td>
    );
  }

  if (value === null) {
    return <td className={`${BOARD_FIGURE} text-faint`}>{DASH}</td>;
  }

  if (column.kind === "percent") {
    return <td className={`${BOARD_FIGURE} text-muted`}>{value}%</td>;
  }

  if (column.kind === "signed") {
    return (
      <td className={`${BOARD_FIGURE}`}>
        <Trend value={Number(value)} />
      </td>
    );
  }

  // `FPts` is the one figure the whole board is ordered by out of the box, so it
  // is the one drawn at full strength. Everything else is a measure among
  // twenty, and a table where every column shouts has no hierarchy at all.
  //
  // **A lit cell overrides that, and it has to.** `--color-faint` is 3.42:1 on
  // the hot ground and `--color-muted` is 5.15 — so a marked figure that kept
  // the quiet ink of an ordinary one would be the least legible thing on the
  // board, in the one place the board is pointing at. `tokens.css` records the
  // pair and says in as many words that the loud ink is a rule here rather than
  // a preference.
  const lit = column.mark !== undefined && isStandout(Number(value), cut);
  // **The quiet branch names a SIZE where the loud one names a WEIGHT**, which
  // is one slot holding two different kinds of decision — and it is why this
  // board's ordinary figures sat at 12px on a desk while the same row's `FPts`
  // sat at 14. Craig, 10 Sep 2026: *"The numbers in the rows for each column are
  // still too small on desktop."* `ROW_FIGURE` is the step every other figure in
  // the app takes, so on the desk the two now agree at 14 and the hierarchy is
  // carried by the weight and the ink the docblock above argues for. The phone
  // is untouched: `FPts` keeps the size it stands out by at 390, where there is
  // no room to say it any other way.
  return (
    <td
      className={`numeric px-1.5 text-right ${MARK[lit ? column.mark ?? "high" : "off"]} ${
        lit || column.key === "fpts" ? "font-bold" : ROW_FIGURE
      }`}
    >
      {rated && column.rate === true ? Number(value).toFixed(2) : value}
    </td>
  );
}

/** What a marked cell wears, written out in full.
 *
 *  **A `Record` and not `bg-${column.mark}`**, and the reason is Tailwind v4
 *  rather than style: it drops a theme variable whose name never appears
 *  literally in scanned source, so a composed class name emits NOTHING and ships
 *  a colourless cell with no error anywhere. `fdr.ts` carries the same
 *  constant for the same reason, and the five colourless difficulty chips that
 *  taught us are recorded in `.claude/rules/register-palette.md`.
 *
 *  `off` is the unmarked case rather than an empty string at the call site, so
 *  the three states are one lookup and a fourth cannot be spelled by accident. */
const MARK = {
  high: "bg-hot text-ink",
  low: "bg-cold text-ink",
  off: "text-muted",
} as const;

/** Who he is, under his name: what our league lets him be filed as, his club,
 *  and what may be done with him.
 *
 *  **`·` between them and no labels**, because the three are self-describing in
 *  a way a column head had to say out loud — `M`, `MUN`, and either an owner's
 *  team name or Fantrax's own word for the shelf he is on. A row of three
 *  labelled fields under every name would be furniture six hundred times over.
 *
 *  **The owner reads LOUD and a status reads quiet**, which is the one piece of
 *  ranking in the line: "Rostered by test2" is a fact about our league that
 *  changes what a reader can do next, and "Free agent" is the default state of
 *  most of the pool. That distinction was the `Sta` column's whole design and it
 *  comes across with it.
 *
 *  `ROW_FIGURE` for the size rather than `text-2xs` written out — it is the
 *  step a subordinate line in a row takes on this desk, and the one that goes up
 *  a pixel on a monitor with everything else. */
function Identity({ row, teamNames }: { row: PoolRow; teamNames: Map<string, string> }) {
  const owner = row.entry.ownerTeamId
    ? (teamNames.get(row.entry.ownerTeamId) ?? row.entry.ownerTeamId)
    : null;
  const positions = row.entry.eligiblePositions.join("/");

  return (
    <span className={`flex min-w-0 items-center gap-1 truncate ${ROW_FIGURE} text-faint`}>
      {positions ? <span>{positions}</span> : null}
      {row.entry.player.clubCode ? (
        <>
          <Dot />
          <span>{row.entry.player.clubCode}</span>
        </>
      ) : null}
      {owner ? (
        <>
          <Dot />
          <span className="truncate font-bold text-ink">{owner}</span>
        </>
      ) : row.entry.status ? (
        <>
          <Dot />
          <span className="truncate">{STATUS[row.entry.status] ?? row.entry.status}</span>
        </>
      ) : null}
    </span>
  );
}

/** The separator between the three facts.
 *
 *  `aria-hidden` because it is punctuation a screen reader already gets as three
 *  separate elements, and "M dot MUN dot free agent" is the row saying a
 *  character nobody wanted.
 *
 *  **`text-faint` and not `text-faint/60`, and `sweep` is why.** It shipped at
 *  60% opacity on the reasoning that punctuation should sit under the words it
 *  separates — which is a real design instinct and an AA failure: 2.68:1 against
 *  the 4.5 floor, six times on the board at both widths. DESIGN's floor is about
 *  TEXT, and a `·` in a `<span>` is text however decorative it looks. It is the
 *  quiet ink now, like the words on either side of it; the separation comes from
 *  the gap rather than from a second level of quiet. */
function Dot() {
  return (
    <span aria-hidden className="text-faint">
      ·
    </span>
  );
}

/** Which way ownership moved, said in the sign as well as the colour — a green
 *  number and a red one are the same number to a reader who cannot tell them
 *  apart. Nought is neither, and is drawn quiet rather than as a flat week. */
function Trend({ value }: { value: number }) {
  if (value === 0) return <span className="text-faint">0%</span>;
  return <span className={value > 0 ? "text-up" : "text-bad"}>{signed(value)}%</span>;
}
