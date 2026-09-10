import { Suspense } from "react";
import Link from "next/link";
import { FANTRAX_PLAYER_BASE } from "@epl/core";
import ScoutShell from "../Shell";
import Nothing from "../../components/shell/Nothing";
import CompareBar from "./CompareBar";
import Figures from "./Figures";
import Measures from "./Measures";
import PickBar from "./PickBar";
import Pitch from "./Pitch";
import { StackWaiting } from "../[fantraxId]/Waiting";
import { playerGrid, realPosition } from "../[fantraxId]/grid";
import { subject } from "../[fantraxId]/subject";
import { BUTTON } from "../../components/shell/ButtonLink";
import { getLeaguePool } from "../pool";
import { COMPARE } from "../query";
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
  const b = one(asked.b);
  const qa = one(asked.qa) ?? "";
  const qb = one(asked.qb) ?? "";

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
      <ScoutShell current="compare" title="Compare" rows={0}>
        {picker}
        <Nothing title="Fantrax would not answer for one of them" code={refused}>
          A profile is one live read each and this one refused. Nothing is cached for it, so
          there is no older answer to show instead.
        </Nothing>
      </ScoutShell>
    );
  }

  // Nothing chosen, or only one: an ordinary state and not an error. The boxes
  // above are the way out of it, which is what changed on 10 Sep 2026 — this
  // used to send the reader to the board and back.
  if (one_ === null || two === null || names.a === null || names.b === null) {
    return (
      <ScoutShell current="compare" title="Compare" rows={0}>
        {picker}
        <Nothing title={one_ === null && two === null ? "Two players, side by side" : "One more"}>
          {one_ === null && two === null
            ? "Search for a player in either box above. Pick two and they arrive here together, with a link you can send to anybody."
            : "One is chosen. Search the other box for somebody to set him against."}
        </Nothing>
      </ScoutShell>
    );
  }

  return (
    <ScoutShell current="compare" title="Compare" rows={0}>
      {picker}

      <CompareBar
        a={{ name: names.a, club: one_.football?.club, code: one_.football?.player.code ?? null }}
        b={{ name: names.b, club: two.football?.club, code: two.football?.player.code ?? null }}
      />

      {/* What they have DONE, which is FPL's alone and needs no second read. */}
      <Figures
        a={one_.football?.player.season ?? null}
        b={two.football?.player.season ?? null}
        names={{ a: names.a, b: names.b }}
      />

      {/* Streamed: each grid is a percentile over every player in the division
          who has passed the minutes floor, so it is real work — and the bar
          above is the half of the screen a reader came to see first. */}
      <Suspense fallback={<StackWaiting />}>
        <Grids left={one_} right={two} names={{ a: names.a, b: names.b }} />
      </Suspense>

      {/* The swap costs nothing and answers the one thing a mirrored table
          cannot: which side you are reading. */}
      <div className="flex flex-wrap gap-1.5">
        <Link href={`${COMPARE}?a=${b}&b=${a}`} className={BUTTON}>
          Swap sides
        </Link>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {[
          { id: a, name: names.a },
          { id: b, name: names.b },
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

/** The two grids and the pitch, read behind the boundary above. */
async function Grids({
  left,
  right,
  names,
}: {
  left: Found;
  right: Found;
  names: { a: string; b: string };
}) {
  const [gridA, gridB] = await Promise.all([
    left.football ? playerGrid(left.football.player) : Promise.resolve([]),
    right.football ? playerGrid(right.football.player) : Promise.resolve([]),
  ]);

  const roleA = left.football ? realPosition(left.football.player.code) : null;
  const roleB = right.football ? realPosition(right.football.player.code) : null;

  return (
    <>
      <Pitch
        a={{ name: names.a, club: left.football?.club, position: roleA?.position ?? null }}
        b={{ name: names.b, club: right.football?.club, position: roleB?.position ?? null }}
      />
      <Measures a={gridA} b={gridB} names={names} />
    </>
  );
}
