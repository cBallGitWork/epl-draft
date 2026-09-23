import { Suspense } from "react";
import Squads from "../Squads";
import Skeleton from "../../../../components/shell/Skeleton";
import TabStrip from "../../../../components/shell/TabStrip";
import MatchShell from "../Shell";
import MatchPitch from "../MatchPitch";
import TeamSheet from "../TeamSheet";
import { matchOwners, readMatch } from "../match";
import { leagueOpinions } from "../../../leagueOpinions";
import { matchCards, namedOn, squadsOf } from "../matchCards";
import { matchInjuries, matchManEvents, teamSheets } from "../../../../matchDetail";
import { matchHref } from "../matchRoutes";
import type { Match } from "../match";

// Both elevens and what the afternoon was worth — CM's team sheet (`cm9900/16.jpg`), or the pitch.
// The figure is FPL's per-fixture points: Fantrax answers for 6 of 32 men, with a period total (counted 4 Sep 2026).

export const revalidate = 30;

type View = "sheet" | "pitch";
/** Which club a phone shows; a desk shows both. */
type Side = "home" | "away";

export default async function MatchPlayersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string; side?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const view: View = query.view === "pitch" ? "pitch" : "sheet";
  const side: Side = query.side === "away" ? "away" : "home";
  const match = await readMatch(id);
  const played = match.sheet !== null && match.sheet.lines.length > 0;

  return (
    <MatchShell
      match={match}
      current="players"
      foot={played ? <Views id={match.fixture.id} side={side} view={view} className="max-lg:hidden" /> : undefined}
    >
      <PhoneControls match={match} side={side} view={played ? view : null} />
      <Suspense fallback={<BoardWaiting />}>
        {played ? <Board match={match} view={view} side={side} /> : <BothSquads match={match} side={side} />}
      </Suspense>
    </MatchShell>
  );
}

function lineupsHref(id: number, side: Side, view: View): string {
  return matchHref(id, "players", {
    side: side === "away" ? "away" : undefined,
    view: view === "pitch" ? "pitch" : undefined,
  });
}

/** CM's foot row (`cm0102/02.jpg`): the same elevens as a list or on the grass. */
function Views({ id, side, view, className = "" }: { id: number; side: Side; view: View; className?: string }) {
  return (
    <div className={className}>
      <TabStrip
        label="Line up views"
        tabs={[
          { key: "sheet", label: "Team Sheet", href: lineupsHref(id, side, "sheet") },
          { key: "pitch", label: "Pitch", href: lineupsHref(id, side, "pitch") },
        ]}
        current={view}
        labels="word"
      />
    </div>
  );
}

/** Under a thumb, one club at a time: pick the club, then — once there are elevens — the list or the pitch. */
function PhoneControls({ match, side, view }: { match: Match; side: Side; view: View | null }) {
  const id = match.fixture.id;
  return (
    <div className={`grid gap-2 lg:hidden ${view === null ? "" : "grid-cols-2"}`}>
      <TabStrip
        label="Club"
        tabs={[
          { key: "home", label: match.home?.shortName ?? "Home", href: lineupsHref(id, "home", view ?? "sheet") },
          { key: "away", label: match.away?.shortName ?? "Away", href: lineupsHref(id, "away", view ?? "sheet") },
        ]}
        current={side}
        labels="word"
      />
      {view === null ? null : <Views id={id} side={side} view={view} className="flex [&>nav]:flex-1" />}
    </div>
  );
}

/** Both clubs' books, for a match nobody has named a side for. */
async function BothSquads({ match, side }: { match: Match; side: Side }) {
  const [owners, league] = await Promise.all([matchOwners(match.fixture), leagueOpinions()]);
  return (
    <Squads
      home={match.home}
      away={match.away}
      players={match.snapshot.players}
      owners={owners}
      league={league}
      cards={matchCards(match, squadsOf(match), league)}
      phoneSide={side}
    />
  );
}

async function Board({ match, view, side }: { match: Match; view: View; side: Side }) {
  // `teamSheets` and `matchManEvents` are one cached fixture detail, so the pair is one request.
  const { gameweek, code } = match.fixture;
  const [owners, sheets, events, injured, league] = await Promise.all([
    matchOwners(match.fixture),
    teamSheets(gameweek, code, match.snapshot.players),
    matchManEvents(gameweek, code, match.snapshot.players),
    matchInjuries(gameweek, code, match.snapshot.players),
    leagueOpinions(),
  ]);

  // Their sheet is the only source of a bench; without it, both squads is the honest fallback.
  if (sheets === null) return <BothSquads match={match} side={side} />;
  const cards = matchCards(match, namedOn(sheets), league);
  if (view === "pitch")
    return (
      <MatchPitch
        match={match}
        sheets={sheets}
        events={events}
        cards={cards}
        phoneSide={side}
      />
    );
  return (
    <TeamSheet
      match={match}
      sheets={sheets}
      events={events}
      owners={owners}
      injured={injured}
      league={league}
      cards={cards}
      phoneSide={side}
    />
  );
}

function BoardWaiting() {
  return (
    <div aria-busy className="grid grid-cols-2 gap-2">
      {Array.from({ length: 2 }, (_, side) => (
        <div key={side} className="flex flex-col gap-1">
          {Array.from({ length: 8 }, (_, at) => (
            <Skeleton key={at} width="100%" height="1.5rem" />
          ))}
        </div>
      ))}
    </div>
  );
}
