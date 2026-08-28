import { LEAGUE_NAME } from "@epl/core";
import Deals from "./components/gazette/Deals";
import Doubts from "./components/gazette/Doubts";
import Lead from "./components/gazette/Lead";
import Live from "./components/gazette/Live";
import Masthead from "./components/gazette/Masthead";
import TeamOfTheWeek from "./components/gazette/TeamOfTheWeek";
import { FANTRAX_SILENT, servedLeague } from "./config";
import Column from "./components/gazette/Column";
import Nothing from "./components/shell/Nothing";
import { edition } from "./edition";
import { londonDate, londonDayAndTime } from "./londonTime";
import { readerTeamId } from "./squads";

// The Gazetta. What the league did this week, on the front page.
//
// A first edition rather than the full paper: the lead, the week's business, who
// is injured, and when lineups lock. It ships early on purpose, so it is read on
// real Saturdays while the stakes are four rehearsal teams rather than met for
// the first time on 10 Oct.
//
// Sections that have nothing to say do not appear. An edition padded out with
// "no transactions this week" is a worse paper than a shorter one.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

/** Draft night for the league we are actually serving — the two draft nine weeks
 *  apart, so this is read from config rather than written down. */
const DRAFT_DATE = londonDate(servedLeague()?.draftDate ?? "");

export default async function GazettePage() {
  const mine = await readerTeamId();
  const paper = await edition(mine);
  const names = new Map(paper.teams.map((team) => [team.teamId, team.name]));
  const who = (teamId: string | null) => (teamId === null ? "the wire" : names.get(teamId) ?? "—");

  return (
    <div className="flex flex-col gap-5">
      <Masthead
        at={paper.snapshot?.fetchedAt ?? null}
        line={
          paper.live
            ? "Football is on. The scores are moving."
            : paper.deadline
              ? `Lineups lock ${londonDayAndTime(paper.deadline.locksAt)}.`
              : `${LEAGUE_NAME}, week by week.`
        }
      />

      {paper.live ? <Live /> : null}

      {/* The lead. Absent most of the week and absent while football is on, on
          purpose: a paper does not manufacture a front-page story, and a
          headline is the one place a provisional claim cannot go. */}
      {paper.lead ? <Lead lead={paper.lead} who={who} /> : null}

      {/* Nothing to print is a real state, not an empty page — our own league is
          in it every day until draft night, and this is the first thing sixteen
          people open. Which nothing it is decides the sentence: only one of the
          three is about the league not existing yet, and telling a drafted league
          it has not drafted is the confident wrong statement `squads.ts` keeps
          these apart to prevent. */}
      {paper.silence?.kind === "unavailable" ? (
        <Nothing title={FANTRAX_SILENT} code={paper.silence.code}>
          The league is there and the football is on the other tabs. We just cannot read Fantrax
          right now, so rather than guess at the week this says nothing.
        </Nothing>
      ) : null}

      {paper.silence?.kind === "undrafted" ? (
        <Nothing title="No news yet" code={`${LEAGUE_NAME} drafts ${DRAFT_DATE}`}>
          There is nothing to report until there are squads to report on. The football is on the
          other tabs in the meantime, and it needs nobody to have drafted.
        </Nothing>
      ) : null}

      {paper.silence?.kind === "quiet" ? (
        <Nothing title="A quiet week" code={`${LEAGUE_NAME}`}>
          Nobody has signed anybody, nobody is hurt, and no deadline is close enough to worry
          about. The football is still on the other tabs.
        </Nothing>
      ) : null}

      {paper.eleven ? (
        <TeamOfTheWeek
          eleven={paper.eleven}
          mine={paper.mine}
          partial={paper.partial}
          fielded={paper.fielded}
        />
      ) : null}

      {paper.deals.length > 0 ? (
        <Deals deals={paper.deals} at={paper.dealsAt} who={who} />
      ) : null}

      {paper.availability.length > 0 ? (
        <Doubts notes={paper.availability} mine={paper.mine} who={who} />
      ) : null}

      {paper.deadline ? (
        <Column title="Next deadline">
          {/* Terse, per the voice: the lock is the fact a manager needs, the
              kickoff is context, and neither needs a paragraph explaining where
              we got it. The masthead states the same instant, so the two can no
              longer disagree. */}
          <p className="text-sm text-muted">
            Lineups lock{" "}
            <span className="numeric font-semibold text-ink">
              {londonDayAndTime(paper.deadline.locksAt)}
            </span>
            , a quarter of an hour before period {paper.deadline.period} kicks off at{" "}
            <span className="numeric text-ink">{londonDayAndTime(paper.deadline.at)}</span>.
          </p>
        </Column>
      ) : null}
    </div>
  );
}
