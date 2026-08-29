import Link from "next/link";
import { Suspense } from "react";
import ButtonLink from "../components/shell/ButtonLink";
import Skeleton from "../components/shell/Skeleton";
import { type FootballSnapshot, duringGameweek, nextRound } from "@epl/core";
import { footballNow, seasonFixtures } from "../football";
import GameweekView from "../components/football/GameweekView";
import Afternoon from "./Afternoon";
import YourMatchup from "./YourMatchup";
import { marks } from "../involvement";
import PageHeader from "../components/shell/PageHeader";
import { londonDayAndTime } from "../londonTime";

// The live centre. Your head-to-head first, the real football under it — the
// order a manager actually cares about them in.
//
// The football half runs entirely off FPL's public API, so it works from the
// first match of the season without Fantrax, a draft, or a single credential.
// The head-to-head renders nothing when there is nothing to say, which keeps
// that true.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

/** The snapshot and whether there is football on. The clock is read here rather
 *  than in the component: a render is meant to be reproducible, and fetching is
 *  already where this page touches the world. */
async function matchday(): Promise<{
  snapshot: FootballSnapshot;
  during: boolean;
  up: { gameweek: number; kickoff: string } | null;
}> {
  // The season, not the snapshot: `getFootballSnapshot` fetches one round's
  // fixtures, so nothing on it can name the round after it. `seasonFixtures` is
  // the read that sees the rest of the calendar, and it is already warm.
  const [snapshot, season] = await Promise.all([footballNow(), seasonFixtures()]);
  const at = new Date().toISOString();
  return { snapshot, during: duringGameweek(snapshot, at), up: nextRound(season, at) };
}

export default async function MatchdayPage() {
  const { snapshot, during, up } = await matchday();
  const league = await marks(snapshot.fixtures);

  // The tab is hidden between gameweeks, but the route still has to answer:
  // someone lands here from a bookmark, or is reading it when the last match
  // ends. A redirect would take the page out from under them; a `Nothing` would
  // claim something failed. Neither is true, so it says where the football went.
  // The head-to-head leads either way. Between rounds it is the pairing without
  // a score, which is the honest version of "who am I playing next" — and it is
  // the same component, so the one that matters on Saturday is the one that has
  // been on screen all week.
  return (
    <div className="flex flex-col gap-4">
      {/* The Desk is reached from here and nowhere else — six tabs already
          brushes the 320px clip `matchdayfit` measures, and a seventh would cost
          every other tab its label to buy one screen a permanent home. */}
      <div className="flex justify-end pt-1">
        <Link
          href="/matchday/desk"
          className="text-2xs font-bold uppercase tracking-widest text-faint hover:text-muted"
        >
          The desk →
        </Link>
      </div>
      {/* The head-to-head arrives after the football, and the boundary is what
          lets it. `YourMatchup` makes the one read on this page nothing else
          waits for — `getLiveScoringStats`, the busiest request the app makes on
          a Saturday — while the fixtures and the marks above are already
          resolved by the time this renders. Without it the whole screen, the ten
          scorelines included, waits on Fantrax's scoreboard.

          It stays first in the document because it is the question the tab is
          for: it lands into a card of its own height, so the football under it
          does not move when it does. */}
      <Suspense fallback={<MatchupWaiting />}>
        <YourMatchup />
      </Suspense>
      {/* Under the scoreline, because it is the same question asked forwards:
          the card says where you are, this says what is left to change it. */}
      <Afternoon snapshot={snapshot} players={league.afternoon} />
      {during ? (
        <GameweekView snapshot={snapshot} mine={league.mine} owners={league.owners} />
      ) : (
        <BetweenGameweeks snapshot={snapshot} up={up} />
      )}
    </div>
  );
}

/** The head-to-head card at its own height while the scoreboard is read.
 *
 *  Neutral-bordered rather than accented: the accent means "yours" everywhere in
 *  the app, and this is drawn before anything has established that the reader
 *  has a team at all.
 *
 *  `YourMatchup` renders nothing for a reader with no team or no pairing, so for
 *  him this card appears and goes. Drawn anyway: every one of the sixteen this
 *  app is for has both during a round, and holding the space for the number they
 *  came to read is worth a flicker on the visit that has no number. */
function MatchupWaiting() {
  return (
    <section
      aria-busy
      className="elev flex flex-col gap-2 rounded-xl border border-line bg-surface p-3"
    >
      <Skeleton width="9rem" height="0.75rem" />
      <Skeleton width="100%" height="2.75rem" />
      <Skeleton width="60%" height="0.75rem" />
    </section>
  );
}

function BetweenGameweeks({
  snapshot,
  up,
}: {
  snapshot: FootballSnapshot;
  /** The round the next ball will be kicked in, from the whole season's
   *  fixtures. Null only when the season's football is genuinely all played. */
  up: { gameweek: number; kickoff: string } | null;
}) {
  // The round in view is the one FPL is pointing at, and after the last whistle
  // it keeps pointing at it until the next deadline — hours, and across a
  // Monday-night round, four days. `up` is the other question, and it is the one
  // this page used to have no way to ask: it read the next kickoff off the
  // snapshot, which holds only the focused round, so a finished round looked
  // like a season with nothing left in it.
  const over = up === null || up.gameweek !== snapshot.gameweek;

  return (
    <div className="flex flex-col gap-3">
      <PageHeader
        title="No football today"
        sub={over ? `Gameweek ${snapshot.gameweek} is done` : `Gameweek ${snapshot.gameweek} next`}
      />

      <div className="elev flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
        {up === null ? (
          <p className="text-sm text-muted">Every match of the season has been played.</p>
        ) : (
          <p className="text-sm text-muted">
            {over ? `Gameweek ${up.gameweek} starts ` : "First kickoff "}
            <span className="numeric font-semibold text-ink">{londonDayAndTime(up.kickoff)}</span>.
          </p>
        )}
        {/* FPL's deadline is the focused round's, and the next round's is not on
            this payload. Only worth printing while the two are the same round —
            and the lock that actually matters is the commissioner's, which the
            paper announces on the front page. */}
        {!over && snapshot.deadline ? (
          <p className="text-sm text-muted">
            FPL&apos;s deadline is{" "}
            <span className="numeric text-ink">{londonDayAndTime(snapshot.deadline)}</span>. Ours is
            the commissioner&apos;s, and it is on the League tab.
          </p>
        ) : null}
      </div>

      <div className="flex gap-2">
        {/* The finished round keeps its button. On a Tuesday the thing a reader
            wants is Monday night's result, and sending them only forwards would
            take it away to fix a sentence. */}
        <ButtonLink href={`/gw/${snapshot.gameweek}`} fill>
          {over ? `GW${snapshot.gameweek} results` : "The fixtures"}
        </ButtonLink>
        {over && up !== null ? (
          <ButtonLink href={`/gw/${up.gameweek}`} fill>
            {`GW${up.gameweek} fixtures`}
          </ButtonLink>
        ) : (
          <ButtonLink href="/league/matchups" fill>
            Who plays whom
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
