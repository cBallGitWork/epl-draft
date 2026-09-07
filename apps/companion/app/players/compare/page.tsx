import { Suspense } from "react";
import Link from "next/link";
import { FANTRAX_PLAYER_BASE } from "@epl/core";
import ScoutShell from "../Shell";
import Nothing from "../../components/shell/Nothing";
import CompareBar from "./CompareBar";
import Measures from "./Measures";
import Pitch from "./Pitch";
import { StackWaiting } from "../[fantraxId]/Waiting";
import { playerGrid, realPosition } from "../[fantraxId]/grid";
import { subject } from "../[fantraxId]/subject";
import { BUTTON } from "../../components/shell/ButtonLink";
import { COMPARE, POOL } from "../query";
import OutLink from "../../components/shell/OutLink";

// Two players, side by side.
//
// Craig, 6 Sep 2026: *"we need the player comparison tool too — I attached the
// scout page a while back. Would need tables and probably a pitch (which would
// plot the end points such as heat map/shot map etc)"*. The reference is Fantasy
// Football Scout's Player Maps; `Pitch.tsx` records exactly how much of it we
// can honestly draw today and what has to arrive first.
//
// **Two profile reads and never more.** `subject()` is one live, uncached
// `getPlayerProfile` each, and Fantrax throttles that endpoint at about
// twenty-seven calls — `docs/ui/player.md` states the policy as "one profile per
// tap, never a sweep of the 697". Two per view is within it; a board of them
// never would be, which is why comparison is a ROUTE you arrive at with two ids
// rather than a column on the directory.
//
// **Both halves are read in parallel and neither blocks the other's frame.** The
// bar needs both men, so it waits; the grids are streamed, because each is a
// percentile over the whole division and the screen is worth showing before they
// land.

export const revalidate = 30;

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string | string[]; b?: string | string[] }>;
}) {
  const asked = await searchParams;
  const a = one(asked.a);
  const b = one(asked.b);

  // Nothing chosen yet is an ordinary state and not an error: the way in is a
  // player's own screen, so this says which two taps get you here rather than
  // pretending something failed.
  if (a === undefined || b === undefined) {
    return (
      <ScoutShell current="compare" title="Compare" rows={0}>
        <Nothing title="Two players, side by side">
          Open a player from the board and press Compare. Pick a second and they arrive here
          together, with a link you can send to anybody.
        </Nothing>
        <Link href={POOL} className={BUTTON}>
          Back to the board
        </Link>
      </ScoutShell>
    );
  }

  const [left, right] = await Promise.all([subject(a), subject(b)]);

  if ("unavailable" in left || "unavailable" in right) {
    const code = "unavailable" in left ? left.unavailable : (right as { unavailable: string }).unavailable;
    return (
      <ScoutShell current="compare" title="Compare" rows={0}>
        <Nothing title="Fantrax would not answer for one of them" code={code}>
          A profile is one live read each and this one refused. Nothing is cached for it, so
          there is no older answer to show instead.
        </Nothing>
      </ScoutShell>
    );
  }

  // **FPL's web name where we have it.** `intel.name` is Fantrax's full
  // registration — "Bruno Miguel Borges Fernandes" — which the bar truncates and
  // the pitch printed whole, straight across the other man's marker. FPL's
  // `name` is the short form a broadcaster would use, and the bridge gives it
  // for every man FPL has ever listed.
  const names = {
    a: left.football?.player.name ?? left.intel.name,
    b: right.football?.player.name ?? right.intel.name,
  };

  return (
    <ScoutShell current="compare" title="Compare" rows={0}>
      <CompareBar
        a={{ name: names.a, club: left.football?.club, code: left.football?.player.code ?? null }}
        b={{ name: names.b, club: right.football?.club, code: right.football?.player.code ?? null }}
      />

      {/* Streamed: each grid is a percentile over every player in the division
          who has passed the minutes floor, so it is real work — and the bar
          above is the half of the screen a reader came to see first. */}
      <Suspense fallback={<StackWaiting />}>
        <Grids left={left} right={right} names={names} />
      </Suspense>

      <div className="flex flex-wrap gap-1.5">
        <Link href={`${POOL}?compare=${a}`} className={BUTTON}>
          Change {names.a}
        </Link>
        <Link href={`${POOL}?compare=${b}`} className={BUTTON}>
          Change {names.b}
        </Link>
        {/* The swap costs nothing and answers the one thing a mirrored table
            cannot: which side you are reading. */}
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

type Found = Awaited<ReturnType<typeof subject>> & object;

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
  if (!("intel" in left) || !("intel" in right)) return null;

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
