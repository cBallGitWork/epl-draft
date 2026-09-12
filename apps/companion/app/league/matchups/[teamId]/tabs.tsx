import type { ReactNode } from "react";
import { Withheld } from "./sides";
import { teamDisplay } from "../../../squads";
import type { BreakdownLine, CategoryBand, CategoryPair, LeagueTeam, RosteredTeam } from "@epl/core";
import { isResolved, playerName } from "@epl/core";
import type { LineupDetail } from "@epl/core";
import Section from "../../../components/shell/Section";
import CategoryBands from "../../../components/league/CategoryBands";
import SquadStatBoard from "../../../components/league/SquadStatBoard";
import { PANEL } from "@/app/desk";

// The two boards that EXPLAIN this scoreline: the categories it came out of, and
// every man against every one of them.
//
// Split from `sides.tsx`, which holds the per-side assembly. The seam is the one
// the board itself draws: one view belongs to a manager — his eleven on the
// grass — and everything else is the join of two squads. `wider.tsx` holds the
// other two shared boards, the ones that place the tie rather than explain it.

/** What every shared board needs of one side, once the gate has had its say. */
export interface SharedSide {
  team: LeagueTeam;
  roster: RosteredTeam | undefined;
  shown: boolean;
  detail: LineupDetail | undefined;
  breakdown: Record<string, readonly BreakdownLine[]>;
  names: Map<string, string>;
  withheld: ReactNode;
}

/** The two managers' names, for a board that sets them at opposite ends. */
interface Managers {
  mine: string;
  theirs: string;
}

/** Where the scoreline came from, and who put it there.
 *
 *  **Provenance in the aside rather than across the top of the screen** (Craig,
 *  11 Sep 2026: *"remove A round already played… row"*). It was 44px of prose
 *  over a scoreline nobody was asking it of. The claim is still owed — these are
 *  Fantrax's figures, and on a round already played the elevens may be the
 *  arrangement it stored or may be today's squads — so it is said where a reader
 *  is actually asking where a number came from.
 *
 *  The scores are deliberately not called final either way: `played` is true at
 *  all three finished rungs and only `data_checked` earns that word. */
export function StatsTab({
  bands,
  managers,
  names,
  theirNames,
  withheld,
  played,
  fielded,
}: {
  bands: readonly CategoryBand[];
  managers: Managers;
  names: ReadonlyMap<string, string>;
  theirNames: ReadonlyMap<string, string>;
  withheld: ReactNode;
  played: boolean;
  fielded: boolean;
}) {
  return (
    <Section
      title="By category"
      aside={`Fantrax's own${played ? (fielded ? " · the stored eleven" : " · today's squads") : ""}`}
    >
      <CategoryBands
        bands={bands}
        mine={managers.mine}
        theirs={managers.theirs}
        names={names}
        theirNames={theirNames}
        withheld={withheld}
      />
    </Section>
  );
}

/** Every man on both sides against every category this league scores.
 *
 *  **Both squads, where this was one** (Craig, 11 Sep 2026: *"players is ust a
 *  list"* — and it was one side's list, which is the half of the complaint that
 *  mattered). Comparing two squads is the whole reason to be on this screen, and
 *  a board that shows one of them at a time asks a reader to hold the other in
 *  his head.
 *
 *  Two boards rather than one table of thirty: each keeps its own frozen lead
 *  column and its own sideways scroll, which is DESIGN §2's many-measure board,
 *  and one table would make a manager scroll past his rival's fifteen to reach
 *  his own bench. They share the one `columns` union, so the halves can be read
 *  against each other. */
export function PlayersTab({
  sides,
}: {
  sides: readonly {
    team: LeagueTeam;
    detail: LineupDetail | undefined;
    columns: readonly CategoryPair[];
    breakdown: Record<string, readonly BreakdownLine[]>;
    withheld: ReactNode;
  }[];
}) {
  return (
    <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:items-start">
      {sides.map(({ team, detail, columns, breakdown, withheld }) => (
        <section key={team.teamId} className={PANEL}>
          <h3 className="truncate text-3xs font-bold uppercase text-faint">{team.name}</h3>
          {detail === undefined ? (
            withheld
          ) : (
            <SquadStatBoard
              rows={detail.rows}
              bench={detail.bench}
              columns={columns}
              breakdown={breakdown}
            />
          )}
        </section>
      ))}
    </div>
  );
}

/** What to call each man, by the `fantraxId` core holds.
 *
 *  **Built by the caller and only for a side the gate has opened.** Core deals in
 *  ids and never in names, which is what keeps a category figure from naming a
 *  man in an eleven that is not public yet; this is the other half of that, and
 *  building the map behind the gate makes the leak impossible rather than merely
 *  unexercised. */
export function namesOf(roster: RosteredTeam | undefined): Map<string, string> {
  const names = new Map<string, string>();
  for (const rostered of roster?.players ?? []) {
    names.set(rostered.slot.fantraxId, isResolved(rostered) ? playerName(rostered) : rostered.slot.fantraxId);
  }
  return names;
}

  /** What the four shared boards need of each side, in the URL's order.
   *
   *  **Everything here is behind the gate that `shows` already applied.** A side
   *  whose eleven is not public has no `detail`, no priced breakdown and — the
   *  one that matters most — no NAME MAP: a category figure names a man in the
   *  eleven, and so does a list of the men he holds in a fixture. Building the
   *  map only for a side the gate has opened makes the leak impossible rather
   *  than merely unexercised. */
export function sharedSides({
  pairing,
  rostered,
  shows,
  arranged,
  scored,
  squads,
  mine,
}: {
  pairing: { team: LeagueTeam; opponent: LeagueTeam };
  rostered: Map<string, RosteredTeam>;
  shows: (team: LeagueTeam) => boolean;
  arranged: Map<string, LineupDetail>;
  scored: Map<string, { breakdown: Record<string, readonly BreakdownLine[]> } | null>;
  squads: Parameters<typeof teamDisplay>[0];
  mine: string | null;
}): SharedSide[] {
  const both = [pairing.team, pairing.opponent].map((team) => {
    const roster = rostered.get(team.teamId);
    const shown = roster !== undefined && shows(team);
    return {
      team,
      roster,
      shown,
      detail: shown ? arranged.get(team.teamId) : undefined,
      breakdown: shown ? (scored.get(team.teamId)?.breakdown ?? {}) : {},
      names: shown ? namesOf(roster) : new Map<string, string>(),
      withheld: (
        <Withheld
          team={team}
          known={roster !== undefined}
          because={teamDisplay(squads, team.teamId === mine)}
        />
      ),
    };
  });
  return both;
}

/** The withholding said ONCE and full width, because with both sides in one
 *  object there is no per-side slot for it — and a silently empty column reads as
 *  "he registered nothing", which is false and the opposite of what the gate is
 *  for. Null when both elevens are open. */
export function withheldNotice(sides: readonly SharedSide[]): ReactNode {
  const gated = sides.filter((side) => !side.shown);
  return gated.length === 0 ? null : <>{gated.map((side) => side.withheld)}</>;
}
