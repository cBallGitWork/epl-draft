import { Suspense } from "react";
import { FANTRAX_PLAYER_BASE } from "@epl/core";
import ScoutShell from "../Shell";
import Nothing from "../../components/shell/Nothing";
import CompareBar from "./CompareBar";
import Figures from "./Figures";
import Measures from "./Measures";
import PickBar from "./PickBar";
import MapSection from "./MapSection";
import { StackWaiting } from "../[fantraxId]/Waiting";
import { playerGrid } from "../[fantraxId]/grid";
import { subject } from "../[fantraxId]/subject";
import { getLeaguePool } from "../pool";
import { ANALYSIS } from "../query";
import { intelShots, intelTouches } from "../../intel";
import OutLink from "../../components/shell/OutLink";

// Two players, side by side.
//
// Craig, 6 Sep 2026: *"we need the player comparison tool too — I attached the
// scout page a while back. Would need tables and probably a pitch (which would
// plot the end points such as heat map/shot map etc)"*. The references are
// Fantasy Football Scout's Player Maps and Understat's player compare.
//
// **Two profile reads and never more.** `subject()` is one live, uncached
// `getPlayerProfile` each, and Fantrax throttles that endpoint at about
// twenty-seven calls — `docs/ui/player.md` states the policy as "one profile per
// tap, never a sweep of the 697". Two per view is within it. **The search boxes
// cost nothing on top**: they read the pool, which is one `leagueCache` entry the
// board already keeps warm, so a keystroke is never a Fantrax call. That is what
// makes an on-screen picker possible at all, and `pick.ts` carries the argument.
//
// **Both halves are read in parallel and neither blocks the other's frame.** The
// bar needs both men, so it waits; the grids are streamed, because each is a
// percentile over the whole division and the screen is worth showing before they
// land.

export const revalidate = 30;

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const asked = await searchParams;
  const a = one(asked.a);
  // **A man is never set against himself.** `pick.ts` already refuses to OFFER
  // him — "a name you cannot pick should not be in a list of names to pick" —
  // but the picker is not the only way in: a hand-edited URL or a link somebody
  // shared reaches `?a=X&b=X`, and that drew the full comparison with a `v` in
  // the middle, thirty rows all tied, and two identical maps. Found in the
  // refactor pass by reading the rendered output rather than the source.
  //
  // Collapsed to the one-man screen rather than refused, because it is not an
  // error — he is a player somebody asked to look at, and that screen exists.
  const wanted = one(asked.b);
  const b = wanted === a ? undefined : wanted;
  const qa = one(asked.qa) ?? "";
  const qb = one(asked.qb) ?? "";
  const map = one(asked.map);

  const pool = await getLeaguePool();
  const rows = "unavailable" in pool ? [] : pool.rows;

  // Both men are read before anything draws, because the boxes above them print
  // the name of whoever is currently chosen and a box labelled with an id would
  // be worse than a box labelled with nothing.
  const [left, right] = await Promise.all([
    a === undefined ? null : subject(a),
    b === undefined ? null : subject(b),
  ]);

  const found = (side: Awaited<ReturnType<typeof subject>> | null) =>
    side !== null && !("unavailable" in side) ? side : null;
  const one_ = found(left);
  const two = found(right);

  // **FPL's web name where we have it.** `intel.name` is Fantrax's full
  // registration — "Bruno Miguel Borges Fernandes" — which the bar truncates and
  // the pitch printed whole, straight across the other man's marker. FPL's
  // `name` is the short form a broadcaster would use.
  const names = {
    a: one_ ? (one_.football?.player.name ?? one_.intel.name) : null,
    b: two ? (two.football?.player.name ?? two.intel.name) : null,
  };

  const picker = (
    <PickBar
      rows={rows}
      a={{ chosen: a, typed: qa, label: names.a ?? "First player", hint: "Search a name…" }}
      b={{ chosen: b, typed: qb, label: names.b ?? "Compare with", hint: "Search an opponent…" }}
    />
  );

  // A profile that refused is not the same as a man not yet chosen, and the
  // screen says which. The picker stays either way — a refusal a reader can do
  // nothing about is still a screen he can pick a different man on.
  const refused = refusal(left) ?? refusal(right);
  if (refused !== null) {
    return (
      <ScoutShell current="analysis" title="Analysis" rows={0}>
        {picker}
        <Nothing title="Fantrax would not answer for one of them" code={refused}>
          A profile is one live read each and this one refused. Nothing is cached for it, so
          there is no older answer to show instead.
        </Nothing>
      </ScoutShell>
    );
  }

  // **Nobody chosen is the only empty state left.** Craig, 10 Sep 2026: *"give
  // me the option to look at 1 player only"* — so one man is a whole screen with
  // every panel on it, and the second box above stays open for whenever somebody
  // is worth setting him against. It used to be a dead end that sent the reader
  // back to the board.
  if (one_ === null || names.a === null) {
    return (
      <ScoutShell current="analysis" title="Analysis" rows={0}>
        {picker}
        <Nothing title="A player, or two">
          Search for anybody in the pool. One man fills the screen on his own; pick a second
          and they arrive side by side, with a link you can send to anybody.
        </Nothing>
      </ScoutShell>
    );
  }

  // A man on his own, and a man against another, are the same screen with the
  // right-hand column left out — every panel below takes null for the second.
  const solo = two === null || names.b === null;

  return (
    <ScoutShell current="analysis" title="Analysis" rows={0}>
      {picker}

      <CompareBar
        a={{ name: names.a, club: one_.football?.club, code: one_.football?.player.code ?? null }}
        b={
          solo || two === null || names.b === null
            ? null
            : { name: names.b, club: two.football?.club, code: two.football?.player.code ?? null }
        }
      />

      {/* What they have DONE, which is FPL's alone and needs no second read. */}
      <Figures
        a={one_.football?.player.season ?? null}
        b={solo ? null : (two?.football?.player.season ?? null)}
        names={{ a: names.a, b: solo ? null : names.b }}
      />

      {/* Streamed: each grid is a percentile over every player in the division
          who has passed the minutes floor, so it is real work — and the bar
          above is the half of the screen a reader came to see first. */}
      <Suspense fallback={<StackWaiting />}>
        <Grids
          left={one_}
          right={solo ? null : two}
          names={{ a: names.a, b: solo ? null : names.b }}
          map={map}
          mapHref={(kind) => mapHref({ a, b: solo ? undefined : b, kind })}
        />
      </Suspense>

      <div className="flex flex-wrap gap-1.5">
        {[
          { id: a, name: names.a },
          ...(solo || names.b === null ? [] : [{ id: b, name: names.b }]),
        ].map((man) => (
          <OutLink key={man.id} href={`${FANTRAX_PLAYER_BASE}/${man.id}`}>
            {man.name} on Fantrax
          </OutLink>
        ))}
      </div>
    </ScoutShell>
  );
}

/** Next hands a repeated query parameter as an array; the last one wins, which
 *  is what a browser does with a repeated field and what a reader editing the
 *  URL by hand means. `players/query.ts` narrows the board's own the same way. */
function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[value.length - 1] : value;
}

/** The tell from a side that refused, or null. */
function refusal(side: Awaited<ReturnType<typeof subject>> | null): string | null {
  return side !== null && "unavailable" in side ? side.unavailable : null;
}

type Found = Extract<Awaited<ReturnType<typeof subject>>, { intel: unknown }>;

/** One man as the maps need him — his marks, looked up by FPL code.
 *
 *  `-1` for a man with no football half, which no export carries, so both maps
 *  come back empty and the section says so rather than the page branching. */
function man(side: Found, name: string) {
  const code = side.football?.player.code ?? -1;
  return { name, touches: intelTouches.get(code), shots: intelShots.get(code) ?? [] };
}

/** Where a map plate points: the two men as they are, and the kind it offers.
 *
 *  The searches are deliberately NOT carried. A reader who has picked his two
 *  men and is now choosing a map has finished searching, and carrying a spent
 *  query would reopen both result lists under the boxes on every plate. */
function mapHref({
  a,
  b,
  kind,
}: {
  a: string | undefined;
  b: string | undefined;
  kind: string;
}): string {
  const next = new URLSearchParams();
  if (a !== undefined) next.set("a", a);
  if (b !== undefined) next.set("b", b);
  next.set("map", kind);
  return `${ANALYSIS}?${next.toString()}`;
}

/** The two grids and the pitch, read behind the boundary above. */
async function Grids({
  left,
  right,
  names,
  map,
  mapHref,
}: {
  left: Found;
  /** Null when one man is being looked at on his own. */
  right: Found | null;
  names: { a: string; b: string | null };
  /** The map the URL asked for, and where each plate of the picker points. */
  map: string | undefined;
  mapHref: (kind: string) => string;
}) {
  const [gridA, gridB] = await Promise.all([
    left.football ? playerGrid(left.football.player) : Promise.resolve([]),
    right?.football ? playerGrid(right.football.player) : Promise.resolve([]),
  ]);

  return (
    <>
      <MapSection
        asked={map}
        href={mapHref}
        a={man(left, names.a)}
        b={right === null || names.b === null ? null : man(right, names.b)}
      />
      <Measures a={gridA} b={gridB} names={names} />
    </>
  );
}
