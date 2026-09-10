import { Suspense } from "react";
import Link from "next/link";
import { clubColours, inkOn, loggedPlayers, matchLine, sheetSides, subNote } from "@epl/core";
import type { Club, IntelMatchPlayer, PlSquadMan, PlayerOwner, SheetRow } from "@epl/core";
import Squads from "../Squads";
import { IndexCell } from "../../../../components/league/TableCells";
import Skeleton from "../../../../components/shell/Skeleton";
import { chipsFor } from "../../../../components/league/Chips";
import { intelSquads } from "../../../../intel";
import { PLAYER } from "../../../PremNav";
import { BOARD, PANEL_FLUSH, ROW_NAME, ROW_RULE } from "@/app/desk";
import MatchShell from "../Shell";
import { matchOwners, readMatch } from "../match";
import { teamSheets } from "../../../../matchFeed";
import type { Match } from "../match";

// What the afternoon was worth, both sides at once.
//
// **Championship Manager's two-column team sheet** — `cm9900/16.jpg` and
// `cm3/06.jpg` run both elevens facing each other, each name behind its shirt
// number on a blue index block, with the sub note in orange and the figure at
// the end. The game files it as a FOOT button; it is a tab here because it is
// the view this app exists for.
//
// **Ordered down the pitch, keeper to attack** (Craig, 4 Sep 2026: *"ordered by
// position/match line up though (strikers at bottom etc)"*), which is the order
// `cm9900/25.jpg` runs its slot strip. The bench sits under the eleven.
//
// **The figure is FPL's points, and the column says so.** Craig asked for
// Fantrax points and they are not obtainable for a whole match: counted 4 Sep
// 2026 against this fixture's 32 participants, Fantrax's live scoring answers
// for **6** — the men a manager had ACTIVE — and what it answers with is a
// PERIOD total rather than a match one, which would be wrong outright the first
// time a period holds two gameweeks. Its per-player profile answers for all 32
// and costs one rate-limited request each. FPL's own `explain` block answers for
// all 32 in one read, so that is the figure, headed as FPL's and never as
// `FPts`, which is Fantrax's word for Fantrax's scoring of a slot we chose.

export const revalidate = 30;

/** How many chips a row shows before it stops.
 *
 *  Two, which is `chipsFor`'s own reasoning read at a narrower column: "a player
 *  who has done more than two of these has plainly had a day, and the two that
 *  show are the two that decided it". This column shares its width with the sub
 *  note, so it takes the tighter number. */
const MARKS = 2;

export default async function MatchPlayersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await readMatch(id);
  const played = match.sheet !== null && match.sheet.lines.length > 0;

  return (
    // **Never dimmed.** The tab had nothing behind it before a ball was kicked
    // and now it has both squads, which is what a manager reads a fixture for.
    <MatchShell match={match} current="players">
      <Suspense fallback={<BoardWaiting />}>
        {played ? <Board match={match} /> : <BothSquads match={match} />}
      </Suspense>
    </MatchShell>
  );
}

/** Both clubs' books, for a match nobody has played. */
async function BothSquads({ match }: { match: Match }) {
  const owners = await matchOwners(match.fixture);
  return (
    <Squads
      home={match.home}
      away={match.away}
      players={match.snapshot.players}
      owners={owners}
    />
  );
}

async function Board({ match }: { match: Match }) {
  // **The bench comes from the Premier League and can only come from there**
  // (Craig, 5 Sep 2026: "needs to include the bench as well"). FPL's per-fixture
  // stats carry a row for a man who accrued something and nothing at all for one
  // who sat, so this board was eleven names a side and a bench that did not
  // exist. `teamSheets` is two cached reads — the round to resolve their fixture
  // id, the detail for the sheet — and answers null rather than throwing, so a
  // provider that will not serve costs the bench and never the board.
  const [owners, sheets] = await Promise.all([
    matchOwners(match.fixture),
    // A fixture FPL has not put in a gameweek has no round to resolve their id
    // from, which is a real state — a postponement loses its `event` — and one
    // the bench simply does not exist for.
    match.fixture.gameweek === null
      ? null
      : teamSheets(match.fixture.gameweek, match.fixture.code, match.snapshot.players),
  ]);
  const { home, away } = sheetSides(match.sheet ?? { fixtureId: 0, lines: [] }, match.snapshot);
  const logged = loggedPlayers(match.logged);

  return (
    <div className="grid grid-cols-2 gap-2">
      <Side
        club={match.home}
        rows={home}
        bench={sheets?.home.substitutes}
        logged={logged}
        owners={owners}
        match={match}
      />
      <Side
        club={match.away}
        rows={away}
        bench={sheets?.away.substitutes}
        logged={logged}
        owners={owners}
        match={match}
      />
    </div>
  );
}

function Side({
  club,
  rows,
  bench,
  logged,
  owners,
  match,
}: {
  club: Club | undefined;
  rows: readonly SheetRow[];
  /** Everyone the Premier League named on this side's bench. Undefined when
   *  their sheet is not published — told apart from an empty one, which is a
   *  side that genuinely named nobody. */
  bench: readonly PlSquadMan[] | undefined;
  logged: Map<number, IntelMatchPlayer>;
  owners: Map<number, PlayerOwner>;
  match: Match;
}) {
  const colours = clubColours(club?.shortName ?? "");
  // Down the pitch, then by what he was worth — so a bench of men with no
  // position is still ordered by the afternoon rather than by nothing.
  const ordered = [...rows].sort((a, b) => {
    const line =
      matchLine(logged.get(a.player.code)?.position ?? null) -
      matchLine(logged.get(b.player.code)?.position ?? null);
    return line !== 0 ? line : points(match, b) - points(match, a);
  });

  // Everyone on the bench who never got on. Matched on FPL's `code`, which is
  // what both sides of this join speak — the sheet through the Opta bridge, the
  // board through the bootstrap.
  const appeared = new Set(rows.map((row) => row.player.code));
  const unused = (bench ?? []).filter((man) => man.code === null || !appeared.has(man.code));

  // **FPL's short name where we have it, the sheet's where we do not.** The
  // Premier League gives a man his full name — `Michele Di Gregorio` — and the
  // eleven above him is FPL's web form, `Barnes`. One column, two naming
  // conventions, and the long one wraps to two lines beside rows that do not.
  // The join is already made, so this costs a lookup and nothing else.
  const named = new Map(match.snapshot.players.map((player) => [player.code, player.name]));
  const shortName = (man: PlSquadMan) =>
    (man.code === null ? undefined : named.get(man.code)) ?? man.name;

  return (
    <section className={PANEL_FLUSH}>
      {/* The club's own colour, which is the one place CM spends it —
          `cm9900/21.jpg` heads each side's stats with that side's colours. */}
      <h2
        className="flex min-h-7 items-center px-1.5 text-2xs font-bold uppercase"
        style={{ background: colours.primary, color: inkOn(colours) }}
      >
        {club?.name ?? "—"}
      </h2>
      <table className={BOARD}>
        <tbody>
          {ordered.map((row) => (
            <Row
              key={row.player.id}
              row={row}
              logged={logged.get(row.player.code)}
              owner={owners.get(row.player.code)}
              match={match}
            />
          ))}
        </tbody>
      </table>
      {/* **The men who did not get on**, under a rule and their own caption —
          which is where `cm9900/16.jpg` puts them and how it tells them apart
          from the eleven: same columns, greyed, below a line.

          Only those who never appeared. A substitute who came on has a row
          above with minutes and a figure against it, and printing him twice
          would be the same man in two states on one board. `rows` is FPL's list
          of everyone who accrued something, so it is exactly the set to
          subtract. */}
      {unused.length === 0 ? null : (
        <>
          <p className="border-t border-line px-1.5 pt-1 text-3xs font-bold uppercase text-faint">
            Substitutes
          </p>
          <table className={BOARD}>
            <tbody>
              {unused.map((man) => (
                <tr key={`${man.name}-${man.shirt ?? ""}`} className={`${ROW_RULE} cm-out`}>
                  <IndexCell>{man.shirt ?? ""}</IndexCell>
                  <td className={`px-1.5 py-1 ${ROW_NAME}`}>{shortName(man)}</td>
                  {/* No figure. He did not play, and a nought here would be a
                      claim about an afternoon he had no part in (DESIGN §7). */}
                  <td className="numeric w-8 px-1.5 text-right text-sm">&mdash;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <p className="mt-auto border-t border-line px-1.5 py-1 text-3xs text-faint">
        Points · FPL&rsquo;s own
      </p>
    </section>
  );
}

function Row({
  row,
  logged,
  owner,
  match,
}: {
  row: SheetRow;
  logged: IntelMatchPlayer | undefined;
  owner: PlayerOwner | undefined;
  match: Match;
}) {
  const note = logged === undefined ? null : subNote(logged);
  return (
    <tr className={ROW_RULE}>
      {/* CM's blue index block, carrying the shirt number it carries in the
          game. FPL publishes `squad_number` as a key and null as a value on
          every element, so this is the sister repo's — 527 of 625 — and a man
          nobody has a number for gets the block and no figure rather than a nought. */}
      <IndexCell>{intelSquads.get(row.player.code)?.squadNumber ?? ""}</IndexCell>
      <td className="p-0">
        <Link
          href={`${PLAYER}/${row.player.code}`}
          className="group flex min-h-11 flex-col justify-center px-1.5 lg:min-h-9"
        >
          <span className={`min-w-0 truncate group-hover:underline ${ROW_NAME}`}>
            {row.player.name}
          </span>
          {owner === undefined ? null : (
            <span className="min-w-0 truncate text-3xs text-faint">{owner.teamName}</span>
          )}
        </Link>
      </td>
      {/* **What he did, as the app's own chips** (Craig, 5 Sep 2026: "maybe here
          we add goal, assist and yellow card icons"). Not an icon set — the app
          has none, and `shell/Rail` records why introducing one for two marks is
          a whole visual language — but `chipsFor` is exactly this vocabulary
          already, drawn on the pitch and in the pool: `G`, `A`, `RC`, `YC`, with
          the tones and the order a manager would rank them in. Same events, same
          two letters, same colours, on a third screen.

          Beside the sub note rather than instead of it, and the note keeps its
          ORANGE — `docs/ui/reference/README.md` records that as CM's ink for an
          EVENT or a change, and `16.jpg` writes `on 71` and `sub 58` in exactly
          this column. */}
      <td className="whitespace-nowrap px-1 text-right">
        <span className="inline-flex items-center gap-0.5">
          {chipsFor(row.line)
            .slice(0, MARKS)
            .map((chip, at) => (
              <span
                key={chip.label}
                // **The second chip stands down under a thumb**, measured: with
                // both, this board took the document to 405px against a 390
                // viewport — two chips plus a sub note plus a figure, twice, in
                // a two-column table. `chipsFor` is already ordered most
                // consequential first, so the one that survives is the one that
                // decided his afternoon.
                className={`px-1 text-3xs font-bold ${at > 0 ? "hidden lg:inline" : ""} ${
                  chip.className
                }`}
              >
                {chip.label}
              </span>
            ))}
          {note === null ? null : <span className="numeric text-3xs text-mid">{note}</span>}
        </span>
      </td>
      {/* CYAN (Craig, 4 Sep 2026: *"scores need cyan"*), and the slot agrees: a
          fantasy score is a reading DERIVED by a scoring system from recorded
          events, which is exactly what `--color-info` means. `16.jpg` runs its
          ratings column in the same ink. */}
      <td className="numeric w-8 px-1.5 text-right text-sm font-bold text-info">
        {points(match, row)}
      </td>
    </tr>
  );
}

/** What FPL's game paid him for this fixture. Nought is a real answer here and
 *  not an absence — a man who played and did nothing scored nothing. */
function points(match: Match, row: SheetRow): number {
  return match.figures.get(row.player.id)?.fplPoints ?? 0;
}

function BoardWaiting() {
  return (
    <div aria-busy className="grid grid-cols-2 gap-2">
      {Array.from({ length: 2 }, (_, side) => (
        <div key={side} className="flex flex-col gap-1">
          {Array.from({ length: 8 }, (_, at) => (
            <Skeleton key={at} width="100%" height="1.5rem" />
          ))}
        </div>
      ))}
    </div>
  );
}
