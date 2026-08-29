import type { Viewport } from "next";
import { LEAGUE_NAME, clubById } from "@epl/core";
import AsItStands from "./components/gazette/AsItStands";
import AutoRefresh from "./components/shell/AutoRefresh";
import Deals from "./components/gazette/Deals";
import Doubts from "./components/gazette/Doubts";
import Lead, { Headline } from "./components/gazette/Stories";
import Picture from "./components/gazette/Picture";
import Written from "./components/gazette/Written";
import Masthead from "./components/gazette/Masthead";
import TeamOfTheWeek from "./components/gazette/TeamOfTheWeek";
import { FANTRAX_SILENT, SECONDARY_STORIES, servedLeague } from "./config";
import Column from "./components/gazette/Column";
import Nothing from "./components/shell/Nothing";
import { edition } from "./edition";
import { pollSeconds } from "./football";
import { fraunces, newsreader } from "./paperFonts";
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

// The paper is the one surface that is not dark, so it is the one surface whose
// browser chrome the root layout gets wrong: an iOS address bar in the app's
// dark chrome above a cream page is a seam across the top of the front page.
// sRGB of `--paper` in tokens.css, repeated as a literal for the same reason the
// layout repeats `--color-bg` — this is serialised into a <meta> tag at build
// time and cannot read a CSS variable. Change both together.
export const viewport: Viewport = { themeColor: "#f5ece1" };

/** Draft night for the league we are actually serving — the two draft nine weeks
 *  apart, so this is read from config rather than written down. */
const DRAFT_DATE = londonDate(servedLeague()?.draftDate ?? "");

export default async function GazettePage() {
  const mine = await readerTeamId();
  const paper = await edition(mine);
  // One lookup for the whole paper: the lead's cut-out and the eleven's eleven
  // all want the same clubs, keyed the way a snapshot keys them.
  const clubs = paper.snapshot ? clubById(paper.snapshot) : new Map();
  const names = new Map(paper.teams.map((team) => [team.teamId, team.name]));
  const who = (teamId: string | null) =>
    teamId === null ? "the wire" : (names.get(teamId) ?? "—");

  return (
    // The two serifs are declared here and nowhere else. A route that is not the
    // paper never mounts them, which is the whole reason `paperFonts.ts` is not
    // in the layout.
    // The two serifs are declared here and nowhere else. A route that is not the
    // paper never mounts them, which is the whole reason `paperFonts.ts` is not
    // in the layout.
    //
    // `@container` and not a breakpoint, for everything below: what decides
    // whether this page can be a broadsheet is the width of the FRAME, not of
    // the window. A `lg:` rail engages at a 1024px window whatever the frame is
    // doing, and while the frame was 42rem that cut a 640px page into 304 and
    // 304 — two equal columns, which is not a lead and a rail. The frame is
    // wider now and the rail does arrive, but asking the container is what
    // makes that a consequence of there being room rather than a coincidence.
    <div
      className={`paper @container ${fraunces.variable} ${newsreader.variable} -mx-[var(--page-gutter)] -mb-[var(--page-foot)] -mt-3 flex flex-col gap-5 px-[var(--page-gutter)] pb-[calc(2rem+var(--page-foot))] pt-4`}
    >
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

      {/* The page asks the server for a fresh render on the same interval every
          other live surface uses. Without it a phone left open on the sofa shows
          a frozen scoreline under a pulsing dot for a whole half — which is what
          the front page did, alone among the app's screens, until now. */}
      {paper.snapshot ? (
        <AutoRefresh seconds={pollSeconds(paper.snapshot)} />
      ) : null}

      <div className="grid gap-5 @3xl:grid-cols-[1fr_19rem] @3xl:gap-x-10">
        {/* The lead column. `--page-gutter: 0` inside it once the rail exists:
            the picture band and the pitch break out of the PAGE's gutters, and
            in a two-column grid the page's gutter is no longer the edge they are
            breaking out to — left as it was, the widest thing on the lead would
            have run out under the rail. */}
        <div className="flex flex-col gap-5 @3xl:[--page-gutter:0px]">
          {/* While the round is being played the score IS the story, and it is the
          splash. `underway` and not `partial`: before the first kickoff every
          total is a legitimate nought, and eight ties reading 0–0 would be
          reporting a round nobody has played. */}
          {paper.board && paper.underway ? (
            <AsItStands
              pairings={paper.board.pairings}
              scores={paper.board.scores}
              mine={paper.mine}
              live={paper.live}
            />
          ) : null}

          {/* The lead. Absent most of the week and absent while football is on, on
          purpose: a paper does not manufacture a front-page story, and a
          headline is the one place a provisional claim cannot go.

          **When a columnist has filed, HIS headline is the lead and the desk's
          is dropped.** Both would be about the same match — a fact-headline and
          a written one, stacked, saying the same thing twice — and a paper runs
          one splash. The picture stays: the story is the same story, and the
          desk is what chose the photograph for it. */}
          {/* `!paper.underway`, and it is the same rule `AsItStands` states: while the
          round is being played the paper reports the score and says nothing
          about what it means. A filed column BECOMES the lead — see below — so
          without this the one place a provisional claim may not go is exactly
          where the preview went, from the Friday lock to the last whistle. The
          preview's own prose makes it worse: the writer is told "nobody has
          kicked a ball", so it said so, under moving scores. */}
          {paper.written && !paper.underway ? (
            <>
              {paper.stories[0] ? (
                <Picture lead={paper.stories[0]} who={who} clubs={clubs} />
              ) : null}
              <Written edition={paper.written} teams={paper.teams} />
            </>
          ) : paper.stories[0] ? (
            <Lead lead={paper.stories[0]} who={who} clubs={clubs} />
          ) : null}

          {paper.stories.length > 1 ? (
            <Column title="Also this week">
              <ul>
                {paper.stories.slice(1, SECONDARY_STORIES + 1).map((story) => (
                  <Headline key={story.kind} story={story} who={who} />
                ))}
              </ul>
            </Column>
          ) : null}

          {/* Nothing to print is a real state, not an empty page — our own league is
          in it every day until draft night, and this is the first thing sixteen
          people open. Which nothing it is decides the sentence: only one of the
          three is about the league not existing yet, and telling a drafted league
          it has not drafted is the confident wrong statement `squads.ts` keeps
          these apart to prevent. */}
          {paper.silence?.kind === "unavailable" ? (
            <Nothing title={FANTRAX_SILENT} code={paper.silence.code}>
              The league is there and the football is on the other tabs. We just
              cannot read Fantrax right now, so rather than guess at the week
              this says nothing.
            </Nothing>
          ) : null}

          {paper.silence?.kind === "undrafted" ? (
            <Nothing
              title="No news yet"
              code={`${LEAGUE_NAME} drafts ${DRAFT_DATE}`}
            >
              There is nothing to report until there are squads to report on.
              The football is on the other tabs in the meantime, and it needs
              nobody to have drafted.
            </Nothing>
          ) : null}

          {paper.silence?.kind === "quiet" ? (
            <Nothing title="A quiet week" code={`${LEAGUE_NAME}`}>
              Nobody has signed anybody, nobody is hurt, and no deadline is
              close enough to worry about. The football is still on the other
              tabs.
            </Nothing>
          ) : null}

          {paper.eleven ? (
            <TeamOfTheWeek
              eleven={paper.eleven}
              clubs={clubs}
              mine={paper.mine}
              partial={paper.partial}
              fielded={paper.fielded}
            />
          ) : null}
        </div>

        {/* The rail. Three short columns a manager scans rather than reads —
            who is hurt, who signed whom, when the lock is — so they are the
            three that come out of the lead's flow and stand beside it. On a
            phone the grid is one column and this is simply what follows, which
            is the order `docs/ui/gazetta.md` sets and does not renegotiate. */}
        <div className="flex flex-col gap-5 @3xl:border-l @3xl:border-line @3xl:pl-6">
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
                , a quarter of an hour before period {paper.deadline.period}{" "}
                kicks off at{" "}
                <span className="numeric text-ink">
                  {londonDayAndTime(paper.deadline.at)}
                </span>
                .
              </p>
            </Column>
          ) : null}
        </div>
      </div>
    </div>
  );
}
