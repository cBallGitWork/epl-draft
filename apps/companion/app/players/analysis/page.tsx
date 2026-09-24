import { Suspense } from "react";
import {
  FANTRAX_PLAYER_BASE,
  assistsOf,
  fixtureGameweeks,
  gameweekSpan,
  inGameweeks,
  lastPlayed,
  totalsOver,
  touchFixtures,
  touchesOf,
} from "@epl/core";
import ScoutShell from "../Shell";
import Nothing from "../../components/shell/Nothing";
import TabStrip from "../../components/shell/TabStrip";
import OutLink from "../../components/shell/OutLink";
import CompareBar from "./CompareBar";
import CompareMap from "./CompareMap";
import Figures from "./Figures";
import Measures from "./Measures";
import PickBar from "./PickBar";
import PlayerMap from "./PlayerMap";
import type { Played } from "./rates";
import { Chip } from "../BoardControls";
import { StackWaiting } from "../[fantraxId]/Waiting";
import { playerGrid } from "../[fantraxId]/grid";
import { subject } from "../[fantraxId]/subject";
import { gameLog } from "../[fantraxId]/scouting";
import { getLeaguePool } from "../pool";
import { ANALYSIS, lastValue } from "../routes";
import { intelShots, intelTouches } from "../../intel";
import { seasonFixtures } from "../../football";
import { SECTION_BAR, phoneShows } from "@/app/desk";

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

/** One block at a time under a thumb; the desk shows every one (Craig, 24 Sep 2026). */
const VIEWS = [
  { key: "figures", label: "Figures" },
  { key: "shots", label: "Shots" },
  { key: "passes", label: "Key passes" },
  { key: "touches", label: "Touches" },
  { key: "attributes", label: "Attributes" },
] as const;
type View = (typeof VIEWS)[number]["key"];

/** "Last 6" is the last six gameweeks with a match played (Craig, 24 Sep 2026). */
const RECENT = 6;

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const asked = await searchParams;
  const a = lastValue(asked.a);
  // A man is never set against himself: `?a=X&b=X` collapses to the one-man screen.
  const wanted = lastValue(asked.b);
  const b = wanted === a ? undefined : wanted;
  const qa = lastValue(asked.qa) ?? "";
  const qb = lastValue(asked.qb) ?? "";
  const view: View = VIEWS.find((entry) => entry.key === lastValue(asked.view))?.key ?? "figures";
  const recent = lastValue(asked.range) === String(RECENT);

  const [pool, fixtures] = await Promise.all([getLeaguePool(), seasonFixtures()]);
  const rows = "unavailable" in pool ? [] : pool.rows;

  // Both men are read before anything draws: the boxes are named after whoever is chosen.
  const [left, right] = await Promise.all([
    a === undefined ? null : subject(a),
    b === undefined ? null : subject(b),
  ]);

  const found = (side: Awaited<ReturnType<typeof subject>> | null) =>
    side !== null && !("unavailable" in side) ? side : null;
  const one_ = found(left);
  const two = found(right);

  // FPL's web name where we have it; Fantrax's full registration is too long for the bar.
  const names = {
    a: one_ ? (one_.football?.player.name ?? one_.intel.name) : null,
    b: two ? (two.football?.player.name ?? two.intel.name) : null,
  };

  const picker = (
    <PickBar
      rows={rows}
      a={{ chosen: a, typed: qa, name: names.a }}
      b={{ chosen: b, typed: qb, name: names.b }}
    />
  );

  // A profile that refused is not a man not yet chosen, and the screen says which.
  const refused = refusal(left) ?? refusal(right);
  if (refused !== null) {
    return (
      <ScoutShell current="analysis" title="Compare" rows={0}>
        {picker}
        <Nothing title="Fantrax would not answer for one of them" code={refused}>
          A profile is one live read each and this one refused. Nothing is cached for it, so
          there is no older answer to show instead.
        </Nothing>
      </ScoutShell>
    );
  }

  if (one_ === null || names.a === null) {
    return (
      <ScoutShell current="analysis" title="Compare" rows={0}>
        {picker}
        <Nothing title="A player, or two">
          Search for anybody in the pool. One man fills the screen on his own; pick a second
          and they arrive side by side, with a link you can send to anybody.
        </Nothing>
      </ScoutShell>
    );
  }

  const solo = two === null || names.b === null;
  const played = lastPlayed(fixtures, Number.POSITIVE_INFINITY);
  const window = recent ? lastPlayed(fixtures, RECENT) : played;
  const span = gameweekSpan(window) || "no gameweeks yet";
  const told = recent ? `gameweeks ${window[0]} to ${window[window.length - 1]}` : "this season";
  const gameweekOf = fixtureGameweeks(fixtures);
  const inWindow = new Set(window);

  const men = await Promise.all(
    [
      { side: one_, name: names.a },
      ...(solo || two === null || names.b === null ? [] : [{ side: two, name: names.b }]),
    ].map(({ side, name }) => man(side, name, { recent, inWindow, gameweekOf })),
  );
  const [first, second] = [men[0], men[1] ?? null];

  const href = (changes: { view?: View; range?: string }) => {
    const next = new URLSearchParams();
    if (a !== undefined) next.set("a", a);
    if (!solo && b !== undefined) next.set("b", b);
    const nextView = changes.view ?? view;
    if (nextView !== "figures") next.set("view", nextView);
    const nextRange = "range" in changes ? changes.range : recent ? String(RECENT) : undefined;
    if (nextRange !== undefined) next.set("range", nextRange);
    return `${ANALYSIS}?${next.toString()}`;
  };
  const has = {
    shots: men.some((each) => each.shots.length > 0),
    passes: men.some((each) => each.keyPasses.length > 0),
    touches: men.some((each) => each.touches !== undefined),
  };
  const dim = VIEWS.filter((entry) => entry.key in has && !has[entry.key as keyof typeof has]).map((entry) => entry.key);

  return (
    <ScoutShell current="analysis" title="Compare" rows={0}>
      {picker}

      <CompareBar
        a={{ name: names.a, club: one_.football?.club, code: one_.football?.player.code ?? null }}
        b={
          second === null || two === null || names.b === null
            ? null
            : { name: names.b, club: two.football?.club, code: two.football?.player.code ?? null }
        }
      />

      <div className="lg:hidden">
        <TabStrip
          label="Compare views"
          tabs={VIEWS.map((entry) => ({ ...entry, href: href({ view: entry.key }) }))}
          current={view}
          dim={dim}
          labels="word"
        />
      </div>

      {/* The range governs the figures and every map; the attributes are a season's percentiles. */}
      <div className={`flex items-center gap-1.5 ${view === "attributes" ? "max-lg:hidden" : ""}`}>
        <Chip on={!recent} href={href({ range: undefined })}>
          Season
        </Chip>
        <Chip on={recent} href={href({ range: String(RECENT) })}>
          Last {RECENT}
        </Chip>
        <span className="numeric px-1.5 text-sm text-muted">{span}</span>
      </div>

      <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
        <div className="flex min-w-0 flex-col gap-3">
          <CompareMap
            title="Shots"
            men={men.map((each) => ({ name: each.name, club: each.club, shots: each.shots }))}
            passes={false}
            window={told}
            className={phoneShows(view === "shots")}
          />
          <CompareMap
            title="Key passes"
            men={men.map((each) => ({ name: each.name, club: each.club, shots: each.keyPasses }))}
            passes
            window={told}
            className={phoneShows(view === "passes")}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <div className={phoneShows(view === "figures")}>
            <Figures
              a={first.played}
              b={second?.played ?? null}
              names={{ a: names.a, b: second === null ? null : names.b }}
              window={told}
            />
          </div>
          {/* Streamed: each grid is a percentile over the whole division, real work behind the rest. */}
          <div className={phoneShows(view === "attributes")}>
            <Suspense fallback={<StackWaiting />}>
              <Grids left={one_} right={second === null ? null : two} names={{ a: names.a, b: second === null ? null : names.b }} />
            </Suspense>
          </div>
        </div>
      </div>

      <section className={`flex flex-col gap-1 ${phoneShows(view === "touches")}`}>
        <p className={`${SECTION_BAR} max-lg:hidden`}>Touches</p>
        <div className="grid gap-2 lg:grid-cols-2">
          {men.map((each, index) => (
            <PlayerMap
              key={index}
              id={index === 0 ? "a" : "b"}
              name={each.name}
              club={each.club}
              touches={touchesOf(each.touches, null)}
              matches={touchFixtures(each.touches).length}
            />
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-1.5">
        {[
          { id: a, name: names.a },
          ...(second === null || names.b === null ? [] : [{ id: b, name: names.b }]),
        ].map((each) => (
          <OutLink key={each.id} href={`${FANTRAX_PLAYER_BASE}/${each.id}`}>
            {each.name} on Fantrax
          </OutLink>
        ))}
      </div>
    </ScoutShell>
  );
}


/** The tell from a side that refused, or null. */
function refusal(side: Awaited<ReturnType<typeof subject>> | null): string | null {
  return side !== null && "unavailable" in side ? side.unavailable : null;
}

type Found = Extract<Awaited<ReturnType<typeof subject>>, { intel: unknown }>;

/** One man over the window: FPL's totals (the season's, or his game log's added up), and the export's marks.
 *  A man the export never bridged has no touches, and his three export counts are a dash rather than nought. */
async function man(
  side: Found,
  name: string,
  { recent, inWindow, gameweekOf }: { recent: boolean; inWindow: ReadonlySet<number>; gameweekOf: ReadonlyMap<number, number> },
) {
  const player = side.football?.player;
  const code = player?.code ?? -1;
  const keep = <Row extends { fplFixtureId: number }>(rows: readonly Row[]) =>
    recent ? inGameweeks(rows, gameweekOf, inWindow) : [...rows];
  const all = intelTouches.get(code);
  const touches = all === undefined ? undefined : { ...all, fixtures: keep(all.fixtures) };
  const shots = keep(intelShots.get(code) ?? []);
  const keyPasses = keep(assistsOf(intelShots, code));
  const totals =
    player === undefined
      ? null
      : recent
        ? totalsOver((await gameLog(player)).map((row) => row.match), inWindow)
        : player.season;
  const played: Played | null =
    totals === null
      ? null
      : {
          ...totals,
          touches: touches === undefined ? null : touchesOf(touches, null).length,
          shots: touches === undefined ? null : shots.length,
          keyPasses: touches === undefined ? null : keyPasses.length,
        };
  return { name, club: side.football?.club, touches, shots, keyPasses, played };
}

/** The two attribute grids, read behind the boundary above. */
async function Grids({ left, right, names }: { left: Found; right: Found | null; names: { a: string; b: string | null } }) {
  const [gridA, gridB] = await Promise.all([
    left.football ? playerGrid(left.football.player) : Promise.resolve([]),
    right?.football ? playerGrid(right.football.player) : Promise.resolve([]),
  ]);
  return <Measures a={gridA} b={gridB} names={names} />;
}
