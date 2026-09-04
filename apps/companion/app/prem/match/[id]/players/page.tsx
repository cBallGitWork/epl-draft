import { Suspense } from "react";
import Link from "next/link";
import { clubColours, inkOn, loggedPlayers, matchLine, sheetSides, subNote } from "@epl/core";
import type { Club, IntelMatchPlayer, PlayerOwner, SheetRow } from "@epl/core";
import Squads from "../Squads";
import { IndexCell } from "../../../../components/league/TableCells";
import Skeleton from "../../../../components/shell/Skeleton";
import { intelSquads } from "../../../../intel";
import { PLAYER } from "../../../PremNav";
import { BOARD, PANEL_FLUSH, ROW_RULE } from "@/app/desk";
import MatchShell from "../Shell";
import { matchOwners, readMatch } from "../match";
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
  const owners = await matchOwners(match.fixture);
  const { home, away } = sheetSides(match.sheet ?? { fixtureId: 0, lines: [] }, match.snapshot);
  const logged = loggedPlayers(match.logged);

  return (
    <div className="grid grid-cols-2 gap-2">
      <Side club={match.home} rows={home} logged={logged} owners={owners} match={match} />
      <Side club={match.away} rows={away} logged={logged} owners={owners} match={match} />
    </div>
  );
}

function Side({
  club,
  rows,
  logged,
  owners,
  match,
}: {
  club: Club | undefined;
  rows: readonly SheetRow[];
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
          <span className="min-w-0 truncate text-sm group-hover:underline">{row.player.name}</span>
          {owner === undefined ? null : (
            <span className="min-w-0 truncate text-3xs text-faint">{owner.teamName}</span>
          )}
        </Link>
      </td>
      {/* ORANGE, which `docs/ui/reference/README.md` records as CM's ink for an
          EVENT or a change — never for a figure. `16.jpg` writes `on 71` and
          `sub 58` in exactly this column. */}
      <td className="numeric whitespace-nowrap px-1 text-right text-3xs text-mid">{note ?? ""}</td>
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
