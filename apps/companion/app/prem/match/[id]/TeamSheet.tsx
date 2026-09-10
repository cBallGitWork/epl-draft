import Link from "next/link";
import { clubColours, inkOn } from "@epl/core";
import type {
  Club,
  MatchSheetLine,
  PlManMatch,
  PlSquadMan,
  PlTeamSheet,
  PlayerOwner,
} from "@epl/core";
import { IndexCell } from "../../../components/league/TableCells";
import { chipsFor } from "../../../components/league/Chips";
import { PLAYER } from "../../PremNav";
import { BOARD, PANEL_FLUSH, ROW_RULE } from "@/app/desk";
import { sheetName } from "./match";
import type { Match } from "./match";

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

/** **This board sets its type a step above the desk's row default**, and it is a
 *  recorded exception to DESIGN §6's density table rather than drift (Craig,
 *  10 Sep 2026: *"the player text could be much bigger on this screen too like
 *  CM… data much bigger too"*).
 *
 *  The reason it earns one: `cm9900/16.jpg` is a screen whose ONLY content is
 *  twenty-two names and their figures, so the game gives them the room a
 *  many-column board cannot. Every other list on the desk shares its width with
 *  four or more measures and takes `ROW_NAME`'s `sm`/`lg:base`; this one carries
 *  a name, a mark and one figure, and at `sm` it was setting a whole screen in
 *  the size other screens use for a column of noughts.
 *
 *  It does NOT change `ROW_NAME` itself. Six other boards wear that recipe and
 *  none of them has the room. */
const SHEET_NAME = "font-chrome text-base font-bold lg:text-lg";

/** The figure beside him, sized to match. `ROW_FIGURE` is `sm` at both widths —
 *  which Craig set on 10 Sep after "numbers in rows are good on desktop, still
 *  small/hard to read to mobile" — and the same argument applies harder here,
 *  where the figure is the point of the row. */
const SHEET_FIGURE = "text-base lg:text-lg";

/** How many chips a row shows before it stops. Two, which is `chipsFor`'s own
 *  reasoning read at a narrower column, and this one shares its width with the
 *  sub note. */
const MARKS = 2;

/** The two chips the card block already draws.
 *
 *  Enciso shipped for one screenshot with a yellow rectangle AND a `YC` chip
 *  beside it — the same fact twice, which is the thing DESIGN's "strip what
 *  another column owns" is about. The block is CM's own mark and it is the one
 *  that stays. */
const CARDED = new Set(["YC", "RC"]);

/** FPL's side of a man, found by the `code` the team sheet carries.
 *
 *  Built once for the whole board rather than looked up per row, and kept out of
 *  `Match` on purpose: that interface is the shared assembly four routes read,
 *  and two maps only this board wants do not belong in it. */
interface Join {
  /** What FPL's own per-fixture sheet says he did — the chips are drawn from it.
   *  Undefined for a man who accrued nothing, which includes everyone who did
   *  not play. */
  line: (code: number | null) => MatchSheetLine | undefined;
  points: (code: number | null) => number;
  /** What to call him — FPL's short form where the bridge reaches him. */
  name: (man: { code: number | null; name: string }) => string;
}

function joinOf(match: Match): Join {
  const byId = new Map((match.sheet?.lines ?? []).map((line) => [line.playerId, line]));
  const player = (code: number | null) => (code === null ? undefined : match.byCode.get(code));
  return {
    name: (man) => sheetName(man, match.byCode),
    line: (code) => {
      const id = player(code)?.id;
      return id === undefined ? undefined : byId.get(id);
    },
    points: (code) => {
      const id = player(code)?.id;
      return id === undefined ? 0 : (match.figures.get(id)?.fplPoints ?? 0);
    },
  };
}

/** One man, joined across the two providers that describe him. */
interface Named {
  man: PlSquadMan;
  /** His marks from the Premier League's events. Undefined for a man nothing
   *  happened to, which is most of them. */
  did: PlManMatch | undefined;
  /** Whether he is on the bench and never got on — CM greys these and prints no
   *  figure. */
  unused: boolean;
}

export default function TeamSheet({
  match,
  sheets,
  events,
  owners,
}: {
  match: Match;
  sheets: { home: PlTeamSheet; away: PlTeamSheet };
  events: Map<number, PlManMatch>;
  owners: Map<number, PlayerOwner>;
}) {
  const join = joinOf(match);
  return (
    // **Stacked under a thumb, paired on a desk.** CM runs both elevens facing
    // each other because its canvas is 800px and each panel gets ~340. Ours is
    // 390, and two columns gave each side 175 against a row that measures 199 —
    // so Liverpool's points column was pushed out of its panel and silently
    // clipped. The document never overflowed and no row reported a scroll
    // width, which is why only the screenshot caught it.
    <div className="grid gap-2 lg:grid-cols-2">
      <Side club={match.home} sheet={sheets.home} events={events} owners={owners} join={join} />
      <Side club={match.away} sheet={sheets.away} events={events} owners={owners} join={join} />
    </div>
  );
}

/** The eleven in the shape they were named in, then the men who came on, then
 *  the men who never did.
 *
 *  `shape` is used where the feed publishes it and `lineup` where it does not —
 *  both are the same eleven and only the ORDER differs, so a sheet with no
 *  formation loses the shape and keeps every man. */
function ordered(sheet: PlTeamSheet, events: Map<number, PlManMatch>): Named[] {
  const did = (man: PlSquadMan) => (man.code === null ? undefined : events.get(man.code));
  const eleven = (sheet.shape ?? [sheet.lineup]).flat();
  const cameOn = sheet.substitutes
    .filter((man) => did(man)?.onAt != null)
    .sort((a, b) => (did(a)?.onAt ?? 0) - (did(b)?.onAt ?? 0));
  const unused = sheet.substitutes.filter((man) => did(man)?.onAt == null);

  return [
    ...eleven.map((man) => ({ man, did: did(man), unused: false })),
    ...cameOn.map((man) => ({ man, did: did(man), unused: false })),
    ...unused.map((man) => ({ man, did: did(man), unused: true })),
  ];
}

function Side({
  club,
  sheet,
  events,
  owners,
  join,
}: {
  club: Club | undefined;
  sheet: PlTeamSheet;
  events: Map<number, PlManMatch>;
  owners: Map<number, PlayerOwner>;
  join: Join;
}) {
  const colours = clubColours(club?.shortName ?? "");
  const rows = ordered(sheet, events);
  // Where the eleven stops and the bench starts, so the rule goes in one place
  // rather than every row asking whether it is the first substitute.
  const bench = rows.findIndex((row) => row.unused);

  return (
    <section className={PANEL_FLUSH}>
      {/* The club's own colour, which is the one place CM spends it —
          `cm9900/21.jpg` heads each side's stats with that side's colours. */}
      <h2
        className="flex min-h-7 items-center gap-1.5 px-1.5 text-2xs font-bold uppercase"
        style={{ background: colours.primary, color: inkOn(colours) }}
      >
        <span className="min-w-0 truncate">{club?.name ?? "—"}</span>
        {/* The shape, beside the name that was drawn in it. Absent rather than
            dashed: a sheet with no formation is one the feed did not publish
            one for, and a dash in a heading reads as a missing club. */}
        {sheet.formation === null ? null : (
          <span className="numeric ml-auto font-normal opacity-80">{sheet.formation}</span>
        )}
      </h2>
      <table className={BOARD}>
        <tbody>
          {rows.map((row, at) => (
            <Row
              key={`${row.man.code ?? row.man.name}-${row.man.shirt ?? at}`}
              row={row}
              owner={row.man.code === null ? undefined : owners.get(row.man.code)}
              join={join}
              opensBench={at === bench}
            />
          ))}
        </tbody>
      </table>
      <p className="mt-auto border-t border-line px-1.5 py-1 text-3xs text-faint">
        Points · FPL&rsquo;s own
      </p>
    </section>
  );
}

function Row({
  row,
  owner,
  join,
  opensBench,
}: {
  row: Named;
  owner: PlayerOwner | undefined;
  join: Join;
  opensBench: boolean;
}) {
  const { man, did, unused } = row;
  const line = join.line(man.code);

  return (
    <tr className={`${ROW_RULE} ${unused ? "cm-out" : ""} ${opensBench ? "border-t-line" : ""}`}>
      {/* CM's blue index block, carrying the number he wore in THIS match. */}
      {/* The shirt block keeps pace with the name beside it — `.cm-index` sets
          its own size, so the step up is an addition here rather than a
          reach into the class. */}
      <IndexCell>
        <span className="text-sm lg:text-base">{man.shirt ?? ""}</span>
      </IndexCell>
      {/* **The card, as a card.** `16.jpg` marks a booked man with a small
          coloured block between his number and his name, and every row keeps the
          slot so the names stay in one column. It is a rectangle in an existing
          palette slot rather than an icon — the accent for a booking, `--color-bad`
          for a sending off — so it needs no icon set and no new rule. */}
      <td className="w-2 px-0">
        {did?.sentOff != null ? (
          <span className="block h-3 w-1.5 bg-bad" title={`Sent off ${did.sentOff}'`} />
        ) : did?.booked != null ? (
          <span className="block h-3 w-1.5 bg-accent" title={`Booked ${did.booked}'`} />
        ) : null}
      </td>
      <td className="min-w-0 p-0">
        <Link
          href={`${PLAYER}/${man.code ?? ""}`}
          className="group flex min-h-11 flex-col justify-center px-1.5 lg:min-h-9"
        >
          <span className={`min-w-0 truncate group-hover:underline ${SHEET_NAME}`}>
            {join.name(man)}
            {man.captain ? <span className="ml-1 text-2xs text-faint">(c)</span> : null}
          </span>
          {/* **The sub note sits UNDER the name, not beside it.** CM puts it in
              its own column because `16.jpg` is 800px across two panels of about
              340; ours is 390 across two of about 190, and beside the name it
              pushed the figure out of the panel and was silently clipped — the
              document never overflowed, so nothing but the picture said so. */}
          <span className="flex min-w-0 gap-1.5 truncate text-3xs">
            {owner === undefined ? null : <span className="text-faint">{owner.teamName}</span>}
            <SubNote did={did} />
          </span>
        </Link>
      </td>
      {/* **One chip under a thumb and two on a desk.** CM's own board keeps a
          scorer's goals at this width — `16.jpg` prints a small figure beside
          Hutchison's rating — so dropping them entirely to make room was the
          wrong economy: a team sheet that cannot say who scored is missing the
          thing a reader came for. `chipsFor` is ordered most consequential
          first, so the one that survives is the one that decided his
          afternoon. */}
      <td className="whitespace-nowrap px-1 text-right">
        <span className="inline-flex items-center gap-0.5">
          {(line === undefined ? [] : chipsFor(line))
            .filter((chip) => !CARDED.has(chip.label))
            .slice(0, MARKS)
            .map((chip, at) => (
              <span
                key={chip.label}
                className={`px-1 text-3xs font-bold ${at > 0 ? "hidden lg:inline" : ""} ${chip.className}`}
              >
                {chip.label}
              </span>
            ))}
        </span>
      </td>
      {/* CYAN (Craig, 4 Sep 2026: *"scores need cyan"*): a fantasy score is a
          reading DERIVED from recorded events, which is `--color-info` exactly,
          and `16.jpg` runs its ratings column in the same ink. */}
      <td className={`numeric w-9 px-1.5 text-right font-bold text-info ${SHEET_FIGURE}`}>
        {/* No figure for a man who never played. A nought would be a claim about
            an afternoon he had no part in (DESIGN §7). */}
        {unused ? "—" : join.points(man.code)}
      </td>
    </tr>
  );
}

/** `on 64`, `sub 71`, or both — CM's own words, in CM's own ink.
 *
 *  Amber is `--color-mid`: "a figure standing alone beside a name", which is
 *  what this is, and `docs/ui/reference/README.md` records it as the game's ink
 *  for an event or a change. `16.jpg` writes `on 71` and `sub 58` in exactly
 *  this column. */
function SubNote({ did }: { did: PlManMatch | undefined }) {
  const parts = [
    did?.onAt == null ? null : `on ${did.onAt}`,
    did?.offAt == null ? null : `sub ${did.offAt}`,
  ].filter((part) => part !== null);
  return parts.length === 0 ? null : (
    <span className="numeric text-3xs text-mid">{parts.join(" · ")}</span>
  );
}
