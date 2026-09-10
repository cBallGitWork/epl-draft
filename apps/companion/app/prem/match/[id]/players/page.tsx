import { Suspense } from "react";
import Squads from "../Squads";
import Skeleton from "../../../../components/shell/Skeleton";
import Formation from "../Formation";
import MatchShell from "../Shell";
import TeamSheet from "../TeamSheet";
import { matchOwners, readMatch } from "../match";
import { matchManEvents, teamSheets } from "../../../../matchFeed";
import type { Match } from "../match";

// What the afternoon was worth, both sides at once.
//
// **Championship Manager's two-column team sheet** — `cm9900/16.jpg` and
// `cm3/06.jpg` run both elevens facing each other, each name behind its shirt
// number on a blue index block, with the sub note in orange and the figure at
// the end. The game files it as a FOOT button; it is a tab here because it is
// the view this app exists for.
//
// **Ordered down the pitch, keeper to attack** (Craig, 4 Sep 2026: *"ordered by
// position/match line up though (strikers at bottom etc)"*), which is the order
// `cm9900/25.jpg` runs its slot strip. The bench sits under the eleven.
//
// **The figure is FPL's points, and the column says so.** Craig asked for
// Fantrax points and they are not obtainable for a whole match: counted 4 Sep
// 2026 against this fixture's 32 participants, Fantrax's live scoring answers
// for **6** — the men a manager had ACTIVE — and what it answers with is a
// PERIOD total rather than a match one, which would be wrong outright the first
// time a period holds two gameweeks. Its per-player profile answers for all 32
// and costs one rate-limited request each. FPL's own `explain` block answers for
// all 32 in one read, so that is the figure, headed as FPL's and never as
// `FPts`, which is Fantrax's word for Fantrax's scoring of a slot we chose.

export const revalidate = 30;

export default async function MatchPlayersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await readMatch(id);
  const played = match.sheet !== null && match.sheet.lines.length > 0;

  return (
    // **Never dimmed.** The tab had nothing behind it before a ball was kicked
    // and now it has both squads, which is what a manager reads a fixture for.
    <MatchShell match={match} current="players">
      <Suspense fallback={<BoardWaiting />}>
        {played ? <Board match={match} /> : <BothSquads match={match} />}
      </Suspense>
    </MatchShell>
  );
}

/** Both clubs' books, for a match nobody has played. */
async function BothSquads({ match }: { match: Match }) {
  const owners = await matchOwners(match.fixture);
  return (
    <Squads
      home={match.home}
      away={match.away}
      players={match.snapshot.players}
      owners={owners}
    />
  );
}

async function Board({ match }: { match: Match }) {
  // **The sheet is the board now, not a decoration on it.** Both reads are the
  // SAME cached fixture detail — `teamSheets` for who was named and in what
  // shape, `matchManEvents` for what happened to each of them — so the pair
  // costs one upstream request, not two. A fixture with no gameweek answers
  // absent from both without a guard here; `matchFeed` owns that.
  const { gameweek, code } = match.fixture;
  const [owners, sheets, events] = await Promise.all([
    matchOwners(match.fixture),
    teamSheets(gameweek, code, match.snapshot.players),
    matchManEvents(gameweek, code, match.snapshot.players),
  ]);

  // Their sheet is the only source of a bench, so without it there is no team
  // sheet to draw — and both squads is the honest fallback rather than eleven
  // names pretending to be a lineup.
  if (sheets === null) return <BothSquads match={match} />;

  // **The board first and the shape under it**, which is the opposite of how it
  // was first drawn and the measurement is why: a pitch is 612px tall at 390 and
  // two of them put the scores this tab exists for two screens down. It clears
  // the fold on its own — `pitchfit`'s invariant is that the GRASS fits the first
  // screen, not the page — but clearing the fold and being the first thing a
  // reader meets are different claims, and only one of them is this tab's
  // question.
  //
  // No picker over the pitch, because there is one kind of map to draw.
  // `maps.ts` records the rule: a control offering a single choice is furniture.
  // Average position joins it when the sister repo exports one.
  return (
    <div className="flex flex-col gap-2">
      <TeamSheet match={match} sheets={sheets} events={events} owners={owners} />
      <Formation sheets={sheets} home={match.home} away={match.away} byCode={match.byCode} />
    </div>
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
