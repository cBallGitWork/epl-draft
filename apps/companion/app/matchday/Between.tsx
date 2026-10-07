import type { FootballSnapshot } from "@epl/core";
import ButtonLink from "../components/shell/ButtonLink";
import PageHeader from "../components/shell/PageHeader";
import Skeleton from "../components/shell/Skeleton";
import { londonDayAndTime } from "@epl/core";
import { MATCHUPS } from "@/app/league/routes";
import { GAMEWEEK } from "../components/shell/sections";

// What the Live tab draws without live football: the card held while the scoreboard loads, and the between-rounds screen.

/** The head-to-head card held at its height while the scoreboard is read; it flickers for a reader with no team.
 *  Neutral border: the accent means yours, and no team is known yet. */
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
  // FPL keeps pointing at a finished round until the next deadline, so an `up` elsewhere means it is done.
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
        {/* The next round's deadline is not on this payload, so FPL's prints only while it is the round in view. */}
        {!over && snapshot.deadline ? (
          <p className="text-sm text-muted">
            FPL&apos;s deadline is{" "}
            <span className="numeric text-ink">{londonDayAndTime(snapshot.deadline)}</span>. Ours is
            the commissioner&apos;s, and it is on the League tab.
          </p>
        ) : null}
      </div>

      <div className="flex gap-2">
        {/* The finished round keeps its button: on a Tuesday a reader wants Monday night's result. */}
        <ButtonLink href={`${GAMEWEEK}/${snapshot.gameweek}`} fill>
          {over ? `GW${snapshot.gameweek} results` : "The fixtures"}
        </ButtonLink>
        {over && up !== null ? (
          <ButtonLink href={`${GAMEWEEK}/${up.gameweek}`} fill>
            {`GW${up.gameweek} fixtures`}
          </ButtonLink>
        ) : (
          <ButtonLink href={MATCHUPS} fill>
            Who plays whom
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
