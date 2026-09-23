import type { ReactNode } from "react";
import { clubGround, thousands } from "@epl/core";
import type { PlMatchFacts } from "@epl/core";
import { matchFacts } from "../../../matchDetail";
import PhotoGround from "../../../components/football/PhotoGround";
import Caption from "../../../components/shell/Caption";
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
// **Both furniture rows belong to the OVERVIEW alone** (Craig, 11 Sep 2026:
// *"stadium name and ref row only show on overview page"*). This shell put them
// under every tab on the argument that a fact about the match is true on the
// stats board as much as on the scoresheet — which it is, and is beside the
// point: the other four tabs are TABLES, and a table that has been pushed down
// by a ground it did not ask for and hemmed in by a referee it cannot use has
// paid two rows of a phone's screen for a fact the reader has already read. The
// Overview is the screen CM builds around those two — `cm0102/02.jpg` is a dated
// head, who scored, and the foot line — and it is the only one of the five that
// is not a table. So they stay there and nowhere else, and the detail read they
// come off is only made on that route now.

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
  const overview = current === "overview";
  // **The ground the match was actually played on**, off the round read the wire
  // already caches — so it costs nothing and it is right for a neutral venue or a
  // club that has moved, which the hand-authored table can never be. It falls
  // back to that table, which is what it is still for.
  //
  // Only on the Overview, which is the only tab that draws either of the two
  // things it answers. The Overview page makes the same call for its half-time
  // score and they share one cache entry.
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
      {overview ? <Caption>{ground ?? roundName(match)}</Caption> : null}
      {/* **The panel fills down to the foot line** (Craig, 10 Sep 2026: *"dont
          cut off the opaque box, let it fill the page"*). CM's own screens are a
          single well running from the caption to the status bar, with the
          photograph only ever seen AROUND it; ours stopped at its content and
          let the crowd back in halfway down. A page whose content is longer than
          the screen pushes past, which is the same rule read the other way. */}
      <div className="flex flex-1 flex-col [&>section]:flex-1">{children}</div>
      {/* **The related-screens strip is gone for now** (Craig, 10 Sep 2026:
          *"ips/liverppol stats dont link to anything, rmeove for now"*). Worth
          recording that they did link — `/prem/club/40` and `/prem/club/14` both
          answered 200 — so what was wrong with them was that they did not LOOK
          like doors: two flat plates with no affordance, reading as labels for a
          section that was not there. CM's foot row earns its place by carrying
          five or six of them; two is a strip pretending to be one.
          `docs/ui/reference/README.md` still lists the object, and it comes back
          when there is a row's worth to put in it. */}
      {overview ? (
        <div className="mt-auto">
          <MatchFacts facts={facts} />
        </div>
      ) : null}
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
 *  **On the Overview alone** since 11 Sep 2026, though it is still drawn by the
 *  shell because it is chrome around the panel rather than content inside it —
 *  CM's own bar sits below the panel, not in it. The shell's docblock carries
 *  why the other four tabs stopped showing it.
 *
 *  Absent entirely rather than printing labels over dashes: a match nobody has
 *  played has neither, which is exactly when both would be a dash. */
function MatchFacts({ facts }: { facts: PlMatchFacts | null }) {
  const said = [
    facts?.referee == null ? null : `Referee - ${facts.referee}`,
    facts?.attendance == null
      ? null
      : `Attendance - ${thousands(facts.attendance)}`,
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
    // **The same row every other row on this screen is**: opaque `--color-surface`,
    // cyan, and set at the size the date strip above it takes. It shipped
    // translucent and in the accent and read as a dull olive smear over the
    // photograph — `.cm-panel`'s 88% is for a panel, not for a bar with two facts
    // on it.
    //
    // **A step and a half larger since 11 Sep 2026** (Craig: *"stadium name,
    // data, and gameweek, referee row all way to small"*). `02.jpg` sets this
    // line at about 1.4% of its 800px canvas, which is 20px on a 1440 desk; ours
    // was 14. The date strip on the Overview moved with it, and they are still
    // the same size as each other, which is the rule this line has always been
    // under.
    <p className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 border-t border-line bg-surface px-3 py-1.5 text-sm font-bold text-info lg:text-xl">
      {said.map((part) => (
        <span key={part}>{part}</span>
      ))}
    </p>
  );
}
