import type { ReactNode } from "react";
import { clubGround } from "@epl/core";
import { matchFacts } from "../../../matchDetail";
import PhotoGround from "../../../components/football/PhotoGround";
import Caption from "../../../components/shell/Caption";
import BackPlate from "./BackPlate";
import MatchBar from "./MatchBar";
import MatchTabs from "./MatchTabs";
import type { MatchTab } from "./matchRoutes";
import type { Match } from "./match";

// The frame every match tab wears: the home ground behind it, both clubs on one bar (`cm9900/21.jpg`), the tabs,
// and on the Overview alone the ground caption — CM names the ground there, not the view (Craig, 4 Sep 2026).

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
  // The ground it was played on, off a read the wire already caches; the hand-written table is the fallback.
  const facts = overview ? await matchFacts(fixture.gameweek, fixture.code) : null;
  // The ground and its town (`St.Andrews, Birmingham`); the fallback table has no town to give.
  const ground =
    facts?.ground === null || facts?.ground === undefined
      ? home === undefined
        ? null
        : clubGround(home.shortName)
      : [facts.ground, facts.city].filter((part) => part !== null).join(", ");

  return (
    // A screen tall, so the foot row sits at the foot of a short match and follows a long one.
    <div className="flex min-h-[calc(100dvh-var(--page-top)-var(--page-foot))] flex-col gap-2">
      {/* The HOME club's ground: a fixture id says nothing about who is at home, so this is where it is known. */}
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
      {/* A panel ends where its content does, and blocks keep a gap between them. */}
      <div className="flex flex-col gap-2">{children}</div>
      {foot === undefined ? null : <div className="mt-auto">{foot}</div>}
    </div>
  );
}

/** The caption for a ground nobody has written down — `clubGround` returns null rather than invent one. */
function roundName({ fixture }: Match): string {
  return fixture.gameweek === null ? "Gameweek TBC" : `Gameweek ${fixture.gameweek}`;
}
