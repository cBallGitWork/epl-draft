import type { ReactNode } from "react";
import { Withheld } from "./sides";
import { teamDisplay } from "../../../squads";
import type { CategoryBand, LeagueTeam, RosteredTeam } from "@epl/core";
import { isResolved, playerName } from "@epl/core";
import type { LineupDetail } from "@epl/core";
import Section from "../../../components/shell/Section";
import CategoryBands from "../../../components/league/CategoryBands";
import SideStats from "./SideStats";

// Stats' boards: the fantasy report (where the scoreline came from) and one manager's board. `wider.tsx`
// holds the boards that place the tie rather than explain it.

/** What every shared board needs of one side, once the gate has had its say. */
export interface SharedSide {
  team: LeagueTeam;
  roster: RosteredTeam | undefined;
  shown: boolean;
  detail: LineupDetail | undefined;
  names: Map<string, string>;
  withheld: ReactNode;
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
  names,
  theirNames,
  withheld,
  played,
  fielded,
}: {
  bands: readonly CategoryBand[];
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
        names={names}
        theirNames={theirNames}
        withheld={withheld}
      />
    </Section>
  );
}

/** One manager's board, or the panel saying his eleven is not public yet. */
export function SideTab({
  side,
  ...board
}: { side: SharedSide } & Omit<Parameters<typeof SideStats>[0], "team" | "sheet">) {
  return side.detail === undefined ? (
    <>{side.withheld}</>
  ) : (
    <SideStats team={side.team} sheet={side.detail} {...board} />
  );
}

/** What to call each man, by the `fantraxId` core holds.
 *
 *  **Built by the caller and only for a side the gate has opened.** Core deals in
 *  ids and never in names, which is what keeps a category figure from naming a
 *  man in an eleven that is not public yet; this is the other half of that, and
 *  building the map behind the gate makes the leak impossible rather than merely
 *  unexercised. */
function namesOf(roster: RosteredTeam | undefined): Map<string, string> {
  const names = new Map<string, string>();
  for (const rostered of roster?.players ?? []) {
    names.set(rostered.slot.fantraxId, isResolved(rostered) ? playerName(rostered) : rostered.slot.fantraxId);
  }
  return names;
}

  /** What the shared boards need of each side, in the URL's order.
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
  squads,
  mine,
}: {
  pairing: { team: LeagueTeam; opponent: LeagueTeam };
  rostered: Map<string, RosteredTeam>;
  shows: (team: LeagueTeam) => boolean;
  arranged: Map<string, LineupDetail>;
  squads: Parameters<typeof teamDisplay>[0];
  mine: string | null;
}): [SharedSide, SharedSide] {
  const one = (team: LeagueTeam): SharedSide => {
    const roster = rostered.get(team.teamId);
    const shown = roster !== undefined && shows(team);
    return {
      team,
      roster,
      shown,
      detail: shown ? arranged.get(team.teamId) : undefined,
      names: shown ? namesOf(roster) : new Map<string, string>(),
      withheld: (
        <Withheld
          team={team}
          known={roster !== undefined}
          because={teamDisplay(squads, team.teamId === mine)}
        />
      ),
    };
  };
  return [one(pairing.team), one(pairing.opponent)];
}

/** The withholding said ONCE and full width, because with both sides in one
 *  object there is no per-side slot for it — and a silently empty column reads as
 *  "he registered nothing", which is false and the opposite of what the gate is
 *  for. Null when both elevens are open. */
export function withheldNotice(sides: readonly SharedSide[]): ReactNode {
  const gated = sides.filter((side) => !side.shown);
  return gated.length === 0 ? null : <>{gated.map((side) => side.withheld)}</>;
}
