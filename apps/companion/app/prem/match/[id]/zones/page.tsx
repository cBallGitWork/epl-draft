import { averageTouchPosition, clubColoursOf, inkOn, shotsInFixture, touchesOf, DASH } from "@epl/core";
import { clubIndex } from "../../../../components/football/clubIndex";
import type { Club, PlTeamSheet, Shot } from "@epl/core";
import Nothing from "../../../../components/shell/Nothing";
import TabStrip from "../../../../components/shell/TabStrip";
import { PANEL, phoneShows } from "@/app/desk";
import MatchShell from "../Shell";
import ShotMap, { type PlottedShot, type ShotOrder, type ShotSide } from "../ShotMap";
import AveragePosition from "../AveragePosition";
import type { Placed } from "../labels";
import { readMatch, sheetName, type Match } from "../match";
import { intelShots, intelTouches } from "../../../../intel";
import { teamSheets } from "../../../../matchDetail";
import { matchHref } from "../matchRoutes";

// CM's Action Zones (`cm9900/22.jpg`): where both sides shot from and who took them, then where the eleven stood.

export const revalidate = 30;

type View = "shots" | "positions";

export default async function MatchZonesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string; order?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const view: View = query.view === "positions" ? "positions" : "shots";
  const order: ShotOrder = query.order === "xg" ? "xg" : "minute";
  const match = await readMatch(id);
  const sheets = await teamSheets(match.fixture.gameweek, match.fixture.code, match.snapshot.players);

  const shots = plottedShots(match, fullNames(sheets));
  // The eleven who STARTED, off the team sheet; a man with no code has no cloud to average.
  const placed = (sheet: PlTeamSheet | null): Placed[] =>
    (sheet?.lineup ?? []).flatMap((man) => {
      const code = man.code;
      if (code === null) return [];
      const centre = averageTouchPosition(touchesOf(intelTouches.get(code), match.fixture.id));
      if (centre === null) return [];
      return [{ code, name: sheetName(man, match.byCode), x: centre.x, y: centre.y }];
    });
  const homeMen = placed(sheets?.home ?? null);
  const awayMen = placed(sheets?.away ?? null);

  if (shots.length === 0 && homeMen.length === 0 && awayMen.length === 0) {
    return (
      <MatchShell match={match} current="zones">
        <Nothing title="No shot data yet">The shot and touch export has not reached this match.</Nothing>
      </MatchShell>
    );
  }

  return (
    <MatchShell match={match} current="zones">
      {/* One section at a time under a thumb; a desk shows both (Craig, 23 Sep 2026). */}
      <div className="lg:hidden">
        <TabStrip
          label="Action zones views"
          tabs={[
            { key: "shots", label: "Shots", href: matchHref(match.fixture.id, "zones") },
            { key: "positions", label: "Average Position", href: matchHref(match.fixture.id, "zones", { view: "positions" }) },
          ]}
          current={view}
          labels="word"
        />
      </div>
      <section className={PANEL}>
        <div className={phoneShows(view === "shots")}>
          <ShotMap
            shots={shots}
            home={sideOf(match.home)}
            away={sideOf(match.away)}
            order={order}
            hrefs={{ minute: matchHref(match.fixture.id, "zones"), xg: matchHref(match.fixture.id, "zones", { order: "xg" }) }}
          />
        </div>
        <div className={phoneShows(view === "positions")}>
          <AveragePosition
            home={match.home}
            away={match.away}
            homeMen={homeMen}
            awayMen={awayMen}
            homeShape={sheets?.home.formation ?? null}
            awayShape={sheets?.away.formation ?? null}
            homeNamed={sheets?.home.lineup.length ?? 0}
            awayNamed={sheets?.away.lineup.length ?? 0}
          />
        </div>
      </section>
    </MatchShell>
  );
}

function sideOf(club: Club | undefined): ShotSide {
  const colours = clubColoursOf(club);
  return { label: club?.shortName ?? DASH, colour: colours.primary, ink: inkOn(colours), index: clubIndex(club) };
}

/** Both sides' shots on one pitch: home turned round to attack the left box, away left as exported.
 *  The export is player-relative — his own goal to the one he attacks — so a half-turn is all it takes. */
function plottedShots(match: Match, names: ReadonlyMap<number, string>): PlottedShot[] {
  // The shot export carries no team, so each shot is split by the shooter's club.
  const here = shotsInFixture(intelShots, match.fixture.id);
  const scoredOwnGoal = ownGoalers(match);
  const kept = (code: number, shot: Shot) => !(shot.outcome === "goal" && shot.xg === null && scoredOwnGoal.has(code));
  return [...here].flatMap(([code, shots]) => {
    const clubId = match.byCode.get(code)?.clubId;
    const side = clubId === match.home?.id ? "home" : clubId === match.away?.id ? "away" : null;
    if (side === null) return [];
    const name = names.get(code) ?? match.byCode.get(code)?.name ?? DASH;
    return shots
      .filter((shot) => kept(code, shot))
      .map((shot) => (side === "home" ? { ...shot, x: 100 - shot.x, y: 100 - shot.y } : shot))
      .map((shot) => ({ ...shot, side, name }));
  });
}

/** Each named man's full name off the team sheet — the list has the room (Craig, 23 Sep 2026). */
function fullNames(sheets: { home: PlTeamSheet; away: PlTeamSheet } | null): Map<number, string> {
  const named = sheets === null ? [] : [sheets.home, sheets.away].flatMap((sheet) => [...sheet.lineup, ...sheet.substitutes]);
  return new Map(named.flatMap((man) => (man.code === null ? [] : [[man.code, man.name] as const])));
}

/** Who FPL credits with an own goal in this match, by code. The export marks none, so an own goal
 *  is dropped only where its unpriced goal and FPL's count agree — it is not a shot by his side. */
function ownGoalers(match: Match): Set<number> {
  const codeOf = new Map(match.snapshot.players.map((player) => [player.id, player.code]));
  return new Set(
    [...match.figures].flatMap(([id, figures]) => {
      const code = codeOf.get(id);
      return figures.ownGoals > 0 && code !== undefined ? [code] : [];
    }),
  );
}
