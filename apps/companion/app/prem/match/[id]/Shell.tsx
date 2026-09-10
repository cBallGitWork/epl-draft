import type { ReactNode } from "react";
import { clubGround } from "@epl/core";
import { matchFacts } from "../../../matchFeed";
import Caption from "../../../components/shell/Caption";
import MatchBar from "./MatchBar";
import MatchFoot from "./MatchFoot";
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

export default async function MatchShell({
  match,
  current,
  children,
}: {
  match: Match;
  current: MatchTab;
  children: ReactNode;
}) {
  const { fixture, home, away } = match;
  // **The ground the match was actually played on**, off the round read the wire
  // already caches — so it costs nothing and it is right for a neutral venue or a
  // club that has moved, which the hand-authored table can never be. It falls
  // back to that table, which is what it is still for.
  const facts =
    fixture.gameweek === null ? null : await matchFacts(fixture.gameweek, fixture.code);
  const ground =
    facts?.ground ?? (home === undefined ? null : clubGround(home.shortName));

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
      <MatchBar
        home={home}
        away={away}
        // `v` until a ball is kicked. FPL writes a running score from the first
        // goal, so a live match shows its real one and the tense is carried by
        // the state line rather than by the figures.
        homeScore={fixture.status === "upcoming" ? null : fixture.homeScore}
        awayScore={fixture.status === "upcoming" ? null : fixture.awayScore}
      />
      <MatchTabs id={fixture.id} current={current} />
      <Caption>{ground ?? roundName(match)}</Caption>
      {children}
      <div className="mt-auto">
        <MatchFoot home={home} away={away} />
      </div>
    </div>
  );
}

/** What to head the panel with when the home club's ground is not in the table.
 *  The round is the one other thing about the fixture that is not already on the
 *  bar above it. */
function roundName({ fixture }: Match): string {
  return fixture.gameweek === null ? "Gameweek TBC" : `Gameweek ${fixture.gameweek}`;
}
