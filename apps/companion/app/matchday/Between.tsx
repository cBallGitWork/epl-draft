import type { FootballSnapshot } from "@epl/core";
import ButtonLink from "../components/shell/ButtonLink";
import PageHeader from "../components/shell/PageHeader";
import Skeleton from "../components/shell/Skeleton";
import { londonDayAndTime } from "@epl/core";

// The two things the Live tab draws when there is no live football: the card it
// holds open while Fantrax's scoreboard is being read, and the screen a reader
// gets between rounds.
//
// Split out of `page.tsx` on 5 Sep 2026 when the route passed CODE_RULES §4's
// 300-line ceiling. Neither is about a matchday, which is what makes the seam
// the right one: the page assembles the round, and these two say what to draw
// when there isn't one yet.

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
export function MatchupWaiting() {
  return (
    <section
      aria-busy
      className="cm-panel flex flex-col gap-2 p-3"
    >
      <Skeleton width="9rem" height="0.75rem" />
      <Skeleton width="100%" height="2.75rem" />
      <Skeleton width="60%" height="0.75rem" />
    </section>
  );
}

export function BetweenGameweeks({
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

      <div className="cm-panel flex flex-col gap-3 p-4">
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
