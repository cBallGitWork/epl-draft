import type { ReactNode } from "react";
import { clubGround } from "@epl/core";
import { matchFacts } from "../../../matchDetail";
import PhotoGround from "../../../components/football/PhotoGround";
import Caption from "../../../components/shell/Caption";
import BackPlate from "./BackPlate";
import MatchBar from "./MatchBar";
import MatchTabs from "./MatchTabs";
import type { MatchTab } from "./MatchTabs";
import type { Match } from "./match";

// The frame both match views wear.
//
// **Neither of `PageHeader`'s two bars, and that is the point.** A club takes the
// filled plate and the competition takes the light one; a match belongs to
// neither side and is not the division either. `cm9900/21.jpg` answers it with a
// third shape — both clubs at once, each on its own colour — which is `MatchBar`.
//
// **The caption names the GROUND, not the view** (Craig, 4 Sep 2026: *"dont use
// 'match overview' as the yellow title, use stadium name"*). The reference says
// the same thing twice over: `cm9900/21.jpg` runs "Goodison Park, Liverpool"
// along the foot of every match screen and `cm0102/02.jpg` puts "St.James's
// Park, Newcastle" in the yellow caption at the top. The tab strip already names
// the view, so a caption repeating it said nothing the plate above it had not.
//
// A ground nobody has written down falls back to the round — `clubGround`
// returns null for a promoted club rather than inventing a stadium.
//
// **The ground caption is the Overview's alone** (Craig, 11 Sep 2026); the referee and attendance row
// under it went on 23 Sep 2026 (*"remove that ref row and attendance"*).

export default async function MatchShell({
  match,
  current,
  foot,
  children,
}: {
  match: Match;
  current: MatchTab;
  /** CM's foot row of related screens (`cm0102/02.jpg`), under the panel. */
  foot?: ReactNode;
  children: ReactNode;
}) {
  const { fixture, home, away } = match;
  const overview = current === "overview";
  // **The ground the match was actually played on**, off the round read the wire
  // already caches — so it costs nothing and it is right for a neutral venue or a
  // club that has moved, which the hand-authored table can never be. It falls
  // back to that table, which is what it is still for.
  //
  // Only on the Overview, the one tab that draws the ground; the page shares the cache entry for its half-time score.
  const facts = overview ? await matchFacts(fixture.gameweek, fixture.code) : null;
  // **The ground AND its town**, which is what `cm0102/02.jpg` puts in this slot:
  // `St.Andrews, Birmingham`, not `St.Andrews`. `city` has been on
  // `PlMatchFacts` since 5 Sep and nothing read it. The fallback table has no
  // town to give, so a club we only know from there keeps the bare name.
  const ground =
    facts?.ground === null || facts?.ground === undefined
      ? home === undefined
        ? null
        : clubGround(home.shortName)
      : [facts.ground, facts.city].filter((part) => part !== null).join(", ");

  return (
    // **Tall enough to hold the screen, so the foot row lands at the foot of
    // it.** The related-screens strip is the last thing on a match page and CM
    // draws it across the bottom; on a short match — a preview with no scoresheet
    // — it was floating halfway up with a third of a phone of bare photograph
    // under it. `mt-auto` on the strip puts it at the bottom of this box, and
    // this box is the viewport less the two pieces of chrome the page did not
    // draw itself: the air above it and the room held for the section nav.
    // A long match pushes past and the strip follows the content, which is the
    // same rule read the other way.
    <div className="flex min-h-[calc(100dvh-var(--page-top)-var(--page-foot))] flex-col gap-2">
      {/* **The HOME club's ground, because that is where the match was played.**
          The shell's standing photograph stands down on this route
          (`drawsOwnGround`) — it renders above every route in the app and a
          fixture id says nothing about who is at home, so the one place that can
          answer is here. `home` is undefined for a fixture FPL has filed without
          a side, and null is how this says so: the desk's own ground, never some
          other club's. */}
      <PhotoGround subject={home?.shortName ?? null} />
      <div className="flex items-stretch">
        <BackPlate />
        <div className="min-w-0 flex-1">
          {/* `v` until a ball is kicked; FPL writes a running score from the first goal. */}
          <MatchBar
            home={home}
            away={away}
            homeScore={fixture.status === "upcoming" ? null : fixture.homeScore}
            awayScore={fixture.status === "upcoming" ? null : fixture.awayScore}
          />
        </div>
      </div>
      <MatchTabs id={fixture.id} current={current} />
      {overview ? <Caption>{ground ?? roundName(match)}</Caption> : null}
      {/* A panel ends where its content does (Craig, 23 Sep 2026), and blocks keep a gap between them. */}
      <div className="flex flex-col gap-2">{children}</div>
      {foot === undefined ? null : <div className="mt-auto">{foot}</div>}
    </div>
  );
}

/** What to head the panel with when the home club's ground is not in the table.
 *  The round is the one other thing about the fixture that is not already on the
 *  bar above it. */
function roundName({ fixture }: Match): string {
  return fixture.gameweek === null ? "Gameweek TBC" : `Gameweek ${fixture.gameweek}`;
}
