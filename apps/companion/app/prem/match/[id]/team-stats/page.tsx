import { averageTouchPosition, shotsInFixture, touchesOf } from "@epl/core";
import type { PlTeamSheet } from "@epl/core";
import MatchShell from "../Shell";
import MatchStats from "../MatchStats";
import ShotMap from "../ShotMap";
import AveragePosition from "../AveragePosition";
import type { Placed } from "../labels";
import { readMatch, sheetName } from "../match";
import { intelShots, intelTouches } from "../../../../intel";
import { matchStatsBoard } from "../../../../matchFeed";
import { teamSheets } from "../../../../matchDetail";

// Championship Manager's second tab, filled at last.
//
// **`/team-stats` and not `/stats`**, which the Player Stats tab already holds.
// The two are a real pair and the names say which is which: this one is the two
// SIDES against each other, that one is every man in the match.
//
// **One page, and everything about the two sides is on it** (Craig, 11 Sep 2026:
// *"Match Stats as one page"*): the thirteen-row board, then the shot map, then
// the average-position map, each map drawn once per TEAM. Five pictures where
// the game had a tab called Action Zones — which is why that tab is not one
// here, and `MatchTabs` carries the arithmetic of the strip that settles it.
//
// Its own read rather than part of `readMatch`: `matchStatsBoard` is the only
// caller of `/stats/match` in the app, no other tab wants it, and folding it
// into the shared assembly would make four screens pay for one screen's request.

export const revalidate = 30;

export default async function MatchTeamStatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await readMatch(id);
  // **One request, not two.** `matchStatsBoard` is `/stats/match` and this tab is
  // its only caller anywhere; `teamSheets` is the fixture detail four other tabs
  // have already fetched and `matchFeed` caches, so the eleven costs nothing
  // upstream. They are independent reads and the map needs both, so they go
  // together rather than one after the other.
  const [rows, sheets] = await Promise.all([
    matchStatsBoard(match.fixture.gameweek, match.fixture.code),
    teamSheets(match.fixture.gameweek, match.fixture.code, match.snapshot.players),
  ]);

  // **Where the shots came from, under the count of them.** The board says
  // fourteen and ten; the map says which of them were worth anything and from
  // where — the same question at two depths, which is why they share a tab.
  //
  // Split by club here, because the sister repo's export carries no team: it
  // keys on the FPL player code, and which side a man is on is a fact the
  // bootstrap already holds.
  const here = shotsInFixture(intelShots, match.fixture.id);
  const side = (id: number | undefined) =>
    [...here].flatMap(([code, shots]) => (match.byCode.get(code)?.clubId === id ? shots : []));

  // **Where each starter played, from the touch cloud we already ship.** The
  // eleven comes off the team sheet rather than off the cloud: a cloud says a man
  // touched the ball, not that he started, and Craig's rule for this map is the
  // eleven who started (10 Sep 2026) — a substitute's centre comes off as few as
  // two touches.
  //
  // **Nothing is turned round any more.** Both sides used to share one pitch and
  // the away eleven was rotated onto it; a side with a pitch of its own is
  // already facing the way the export stores it, which is his own goal to the one
  // he attacks.
  const placed = (sheet: PlTeamSheet | null): Placed[] =>
    (sheet?.lineup ?? []).flatMap((man) => {
      // A man the bridge could not place has no cloud to average, so the two
      // absences are one test: no code, no point on the pitch.
      const code = man.code;
      if (code === null) return [];
      const centre = averageTouchPosition(touchesOf(intelTouches.get(code), match.fixture.id));
      if (centre === null) return [];
      return [{ code, name: sheetName(man, match.byCode), x: centre.x, y: centre.y }];
    });

  return (
    <MatchShell match={match} current="team-stats">
      <div className="flex flex-col gap-2">
        <MatchStats rows={rows} />
        {/* **Each map is a row of two pitches and the maps stack**, rather than
            the maps sitting side by side with four pitches between them. A pitch
            in a quarter of 1440 is 265px, which is `ShotMarks`' blot arithmetic
            run backwards and a five-letter name every forty pixels. */}
        <ShotMap
          home={match.home}
          away={match.away}
          homeShots={side(match.home?.id)}
          awayShots={side(match.away?.id)}
        />
        {/* The board says what each side did, the shot map says where they did it
            from, and this says where they stood to do it — one question at three
            depths, which is what puts all three on one page. */}
        <AveragePosition
          home={match.home}
          away={match.away}
          homeMen={placed(sheets?.home ?? null)}
          awayMen={placed(sheets?.away ?? null)}
          homeShape={sheets?.home.formation ?? null}
          awayShape={sheets?.away.formation ?? null}
          homeNamed={sheets?.home.lineup.length ?? 0}
          awayNamed={sheets?.away.lineup.length ?? 0}
        />
      </div>
    </MatchShell>
  );
}
