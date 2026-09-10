import type { ReactNode } from "react";
import { clubGround } from "@epl/core";
import type { PlMatchFacts } from "@epl/core";
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
  const facts = await matchFacts(fixture.gameweek, fixture.code);
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
      <div className="mt-auto flex flex-col">
        <MatchFacts facts={facts} />
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

/** The line CM runs along the foot of a match screen: who refereed it and how
 *  many watched.
 *
 *  Craig, 10 Sep 2026: *"should we put the ref, attendance and weather too at the
 *  bottom."* Two of the three, and the third is not ours to give.
 *
 *  **Both come free.** `PlMatchFacts` has carried them since 5 Sep and `Shell`
 *  read one of its four fields — the referee is on **28 of 30** completed
 *  fixtures on the detail read, the attendance on **24 of 30**, published after
 *  the match rather than during it. The Overview drew a referee from the sister
 *  repo's match log instead, which has him on **2 of 20**; that version is
 *  retired.
 *
 *  **Weather is not published by anybody we read.** Counted 10 Sep 2026 across
 *  every key at every depth of the fixture detail: no `weather`, `temperature`,
 *  `wind`, `rain` or `condition` anywhere, and FPL has none either. It is not a
 *  gap to fill later without a new provider, so the line does not hold a slot for
 *  it.
 *
 *  On the SHELL rather than the Overview, so it is under every tab — a fact about
 *  the match is true on the stats board as much as on the scoresheet, and CM's
 *  own bar sits below the panel on all four of its screens.
 *
 *  Absent entirely rather than printing labels over dashes: a match nobody has
 *  played has neither, which is exactly when both would be a dash. */
function MatchFacts({ facts }: { facts: PlMatchFacts | null }) {
  const said = [
    facts?.referee == null ? null : `Referee - ${facts.referee}`,
    facts?.attendance == null
      ? null
      : `Attendance - ${facts.attendance.toLocaleString("en-GB")}`,
  ].filter((part) => part !== null);

  if (said.length === 0) return null;
  return (
    // **Spread across the foot, in CM's own wording and its own ink.**
    // `cm0102/02.jpg` runs `Referee - Kevin Barnes`, `Attendance - 26034` and
    // `Weather - Dry, 28°C` at the left, centre and right of one line, all in the
    // accent. Ours has two of the three — weather is published by nobody we read
    // — so `justify-between` puts them at the ends rather than holding a gap
    // open for a fact that is not coming.
    //
    // The accent, which is the same ink the ground caption above already takes:
    // this line is the other half of that furniture and CM colours the pair
    // alike.
    <p className="cm-panel flex flex-wrap justify-between gap-x-4 gap-y-0.5 px-2 py-1 text-2xs text-accent">
      {said.map((part) => (
        <span key={part}>{part}</span>
      ))}
    </p>
  );
}
