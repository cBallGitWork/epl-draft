import Link from "next/link";
import ScoutShell from "./Shell";
import Nothing from "../components/shell/Nothing";
import PlayerTable, { STATUS } from "./PlayerTable";
import { getPlayerStats } from "./playerStats";
import { getLeaguePool } from "./pool";
import { PAGE_ROWS, POOL, filterHref, isChosen, playersQuery, showAllHref, shownRows } from "./query";
import type { PlayersSearchParams } from "./query";
import { FANTRAX_SILENT } from "../config";
import { FANTRAX_APP_BASE, FANTRAX_LEAGUE_ID, FANTRAX_PLAYERS_PATH } from "@epl/core";
import { positionLabel } from "../positions";
import { BUTTON } from "../components/shell/ButtonLink";
import OutLink from "../components/shell/OutLink";

// Every player Fantrax knows, what our league has decided about him, and what
// Fantrax scores him. The numbers are theirs under our league's scoring, which
// is why the heading says which season they are and whether they were played or
// predicted — a column headed FPts that silently switched between the two would
// be the confident wrong answer. (That read defaulted to a PROJECTION until
// 5 Sep 2026 and now defaults to year-to-date; the heading followed the payload
// without anyone touching it, which is the whole reason it is read off the
// answer. PLATFORM_NOTES carries the re-probe.)
//
// **It is its own section as of 6 Sep 2026** (Craig: *"I think this function
// will be its own section away from the league etc"*), so it wears `ScoutShell`
// rather than `LeagueShell`. It wore the league's frame for a day, which fixed
// the real fault of the day before — a bar of a third shape, no panel, and the
// directory printed straight onto the match photograph, which is the one thing
// DESIGN §2 forbids and was 40 of `groundfit`'s findings — but it did it by
// putting a screen about six hundred Premier League footballers under a bar
// naming our ten-team fantasy competition. True about who PRICES them and wrong
// about who they are.
//
// **The caption is the CATEGORY, not the view.** `cm9900/16.jpg` captions its
// stat list `Average Rating` and lets the frame say where you are, which is the
// arrangement here: the bar names the section, and the caption names what the
// board is ranked by. That is why `Board` draws no `Caption` of its own — two
// captions stacked is the screen saying its own name twice.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

/** A filter, drawn as the TOGGLE it behaves like.
 *
 *  **It was a `cm-tab` and multi-select killed that reading** (Craig, 6 Sep
 *  2026: *"those blue button for search are terrible here"*, alongside asking
 *  for several filters at once). A Championship Manager tab strip picks ONE of a
 *  set and marks exactly one plate current — that is what the object means, and
 *  it is why `league/SectionNav` and the section rail wear it. Six blue plates
 *  where any number can be lit at once is a tab strip making a claim it cannot
 *  keep, and at `text-sm` with `px-3` they were the loudest thing on a screen
 *  whose point is a table of six hundred names.
 *
 *  So they take DESIGN §2's other grammar, which fits exactly: `cm-bevel` is
 *  "something you press" and `cm-bevel-pressed` is "the same thing, held down".
 *  A filter that is on IS held down. It is also the same grey plate the column
 *  heads above them wear, so the two rows of controls on this screen finally
 *  read as one family rather than as a blue bar and a grey one.
 *
 *  `min-h-11 lg:min-h-9` is the CONTROL floor and not a row's: a filter is aimed
 *  at rather than read, and DESIGN §6 is explicit that a control never relaxes
 *  below its floor under a thumb.
 *
 *  **A tick and not the accent, and that is `desk.css`'s rule rather than a
 *  taste.** It reads in as many words: "a plate owns its ink. No call site sets
 *  `text-*` on one. Dark ink on the grey plate is 7.52:1 and `--color-ink` on it
 *  is 2.27:1, so a component that brought its own colour would silently land
 *  under the floor." This file set `text-accent` on the pressed plate for one
 *  build and `probe.mjs` read the same dark ink off a pressed chip and an
 *  unpressed one — the utility dropped exactly as that paragraph says, and the
 *  accent would have been illegible if it had won.
 *
 *  So the pressed bevel carries the state and a tick carries it again in a
 *  SHAPE, which is what PRODUCT.md's accessibility section asks for: pair every
 *  signal with a label, shape or position rather than leaving it to a colour. A
 *  two-pixel inverted bevel on a 44px plate is a real mark and a quiet one, and
 *  a reader scanning six chips for the two that are on should not have to look
 *  twice. */
const CHIP =
  "cm-bevel flex min-h-11 items-center gap-1 px-2 text-2xs font-bold uppercase hover:brightness-110 lg:min-h-9";
const CHIP_ON =
  "cm-bevel-pressed flex min-h-11 items-center gap-1 px-2 text-2xs font-bold uppercase lg:min-h-9";

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<PlayersSearchParams>;
}) {
  const [pool, asked, lines] = await Promise.all([
    getLeaguePool(),
    searchParams,
    getPlayerStats(),
  ]);
  const query = playersQuery(asked);

  // The raw counts, by Fantrax id. Two reads feed this table and neither is new:
  // the plain `getPlayerStats` carries the seven fantasy columns on `PoolRow`,
  // and the same endpoint asked by position group carries the eighteen or twenty
  // raw ones. `mapPlayerStats` drops the fantasy seven from its bag, so the two
  // do not overlap and each column reads from exactly one of them.
  const raw = new Map(lines.map((line) => [line.fantraxId, line.stats]));

  if ("unavailable" in pool) {
    return (
      <ScoutShell>
        <Nothing title={FANTRAX_SILENT} code={pool.unavailable}>
          The player pool is Fantrax&apos;s and we cannot read it right now. Ownership is the part
          that would go stale first, so this shows nothing rather than yesterday&apos;s.
        </Nothing>
      </ScoutShell>
    );
  }

  const shown = shownRows(pool.rows, query, raw);
  const capped = query.all ? shown : shown.slice(0, PAGE_ROWS);

  const counted = new Map<string, number>();
  for (const row of pool.rows) {
    // Skipped rather than counted under a blank label: a player our league has
    // said nothing about is still listed, he simply has no status to filter by.
    if (row.entry.status) counted.set(row.entry.status, (counted.get(row.entry.status) ?? 0) + 1);
  }

  return (
    <ScoutShell
      sub={
        <>
          {shown.length} of {pool.rows.length}
          {pool.season ? (
            <>
              {" · "}
              {pool.season.projected ? "Fantrax projection" : pool.season.name || "this season"}
            </>
          ) : null}
        </>
      }
    >
      <form action="/players" className="flex gap-1.5">
        {/* The chips, the sort and the box all filter the same list, so each has
            to carry the others' state — a GET form posts only its own fields. */}
        {(["status", "pos", "sort", "dir", "all"] as const).map((key) =>
          query[key] ? <input key={key} type="hidden" name={key} value={query[key]} /> : null,
        )}
        <input
          name="q"
          defaultValue={(query.q ?? "").trim()}
          placeholder="Find a player"
          aria-label="Find a player"
          className="cm-panel min-h-11 min-w-0 flex-1 px-3 text-base"
        />
        <button
          type="submit"
          className={BUTTON}
        >
          Find
        </button>
      </form>

      {/* Said out loud while the board is a picker, because a table whose rows
          have quietly changed destination is a screen that lies about what a tap
          does. It carries its own way out. */}
      {query.compare ? (
        <p className="flex flex-wrap items-center gap-2 border border-accent bg-surface px-3 py-2 text-sm">
          <span className="font-bold text-accent">Pick the second player.</span>
          <Link href={POOL} className="underline">
            Cancel
          </Link>
        </p>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {[...counted.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([code, count]) => (
            <Link
              key={code}
              href={filterHref(query, "status", code)}
              aria-pressed={isChosen(query, "status", code)}
              className={isChosen(query, "status", code) ? CHIP_ON : CHIP}
            >
              {isChosen(query, "status", code) ? <Tick /> : null}
              {STATUS[code] ?? code}
              <span className="numeric font-normal">{count}</span>
            </Link>
          ))}
        {pool.positions.map((position) => (
          <Link
            key={position}
            href={filterHref(query, "pos", position)}
            aria-pressed={isChosen(query, "pos", position)}
            className={isChosen(query, "pos", position) ? CHIP_ON : CHIP}
          >
            {isChosen(query, "pos", position) ? <Tick /> : null}
            {positionLabel(position) ?? position}
          </Link>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className=" border border-line bg-surface px-3 py-2.5 text-sm text-muted">
          Nobody in the pool matches that. Tap a filter again to clear it.
        </p>
      ) : (
        <PlayerTable rows={capped} query={query} teamNames={pool.teamNames} raw={raw} />
      )}

      {capped.length < shown.length ? (
        <p className="text-2xs text-faint">
          Showing the first {capped.length}. Search or filter to narrow it, or{" "}
          <Link href={showAllHref(query)} className="font-bold text-accent underline">
            show all {shown.length}
          </Link>
          .
        </p>
      ) : null}

      {/* Both say why a number is missing rather than leaving a dash to be read
          as a nought. The first is a read that did not answer at all; the second
          is one that answered short. */}
      {pool.statsRefused ? (
        <p className="text-2xs text-faint">
          No points here — Fantrax would not give us its numbers ({pool.statsRefused}). Everything
          else on this page is current.
        </p>
      ) : null}

      {pool.missing > 0 ? (
        <p className="text-2xs text-faint">
          Fantrax has numbers for {pool.missing} more than this read carried; those rows show a dash.
        </p>
      ) : null}

      {/* **The way out.** This screen is where a manager decides who to claim,
          and Fantrax is where the claim happens — we read their league and never
          write to it. Their own list rather than their home page, on the
          matrix-parameter path taken off a real browser session; a deeper guess
          would break silently the day they reorganise their routes, which is the
          reason `FANTRAX_APP_BASE` has carried that warning since it was added. */}
      <OutLink href={`${FANTRAX_APP_BASE}/${FANTRAX_LEAGUE_ID}/${FANTRAX_PLAYERS_PATH}`}>
        Claim on Fantrax
      </OutLink>
    </ScoutShell>
  );
}

/** The mark on a filter that is on. `aria-hidden` because `aria-pressed` on the
 *  link already says it, and a screen reader announcing "tick DEF pressed" says
 *  it twice. */
function Tick() {
  return (
    <span aria-hidden className="text-[0.625rem] leading-none">
      ✓
    </span>
  );
}
