import { LEAGUE_NAME, clubById } from "@epl/core";
import { named } from "../components/gazette/named";
import Pages from "../components/gazette/Pages";
import Teaser from "../components/gazette/Teaser";
import Brief from "../components/gazette/Brief";
import Scoreboard from "../components/gazette/Scoreboard";
import Drawing from "../components/gazette/Drawing";
import Face from "../components/gazette/Face";
import Splash from "../components/gazette/Splash";
import Deals from "../components/gazette/Deals";
import Doubts from "../components/gazette/Doubts";
import Lead, { Headline } from "../components/gazette/Stories";
import Picture from "../components/gazette/Picture";
import Masthead from "../components/gazette/Masthead";
import TeamOfTheWeek from "../components/gazette/TeamOfTheWeek";
import {
  FANTRAX_SILENT,
  HEADLINES_SHOWN,
  SECONDARY_STORIES,
  SHOULDER_STORIES,
  servedLeague,
} from "../config";
import Column from "../components/gazette/Column";
import Nothing from "../components/shell/Nothing";
import PaperTable from "../components/gazette/PaperTable";
import { edition } from "../edition";
import { londonDate, londonDayAndTime } from "../londonTime";
import { readerTeamId } from "../squads";
import { draftRows, footballRows, scorerRows } from "../tables";

// The Gazetta. What the league did this week, on the front page.
//
// A first edition rather than the full paper: the lead, the week's business, who
// is injured, and when lineups lock. It ships early on purpose, so it is read on
// real Saturdays while the stakes are four rehearsal teams rather than met for
// the first time on 10 Oct.
//
// Sections that have nothing to say do not appear. An edition padded out with
// "no transactions this week" is a worse paper than a shorter one.
//
// The `.paper` register, the serifs, the cream chrome and the poll cadence are
// the group layout's — `(paper)/layout.tsx` — so this file is only the edition.

/** Draft night for the league we are actually serving — the two draft nine weeks
 *  apart, so this is read from config rather than written down. */
const DRAFT_DATE = londonDate(servedLeague()?.draftDate ?? "");

export default async function GazettePage() {
  const mine = await readerTeamId();
  const paper = await edition(mine);
  // The two tables, from reads the page already makes.
  const [draft, football, scorers] = await Promise.all([
    draftRows(mine),
    footballRows(),
    scorerRows(),
  ]);
  // One lookup for the whole paper: the lead's cut-out and the eleven's eleven
  // all want the same clubs, keyed the way a snapshot keys them.
  const clubs = paper.snapshot ? clubById(paper.snapshot) : new Map();
  // The same join the inside pages make, plus the one case only this page has:
  // a deal whose other side is nobody — a waiver claim comes from the wire, not
  // from a manager.
  const byId = named(paper.teams);
  const who = (teamId: string | null) => (teamId === null ? "the wire" : byId(teamId));

  // The sheet's three ranks under the splash: these are the second and the
  // third, sliced here rather than in the markup so the two boundaries are one
  // line apart and cannot drift.
  const shoulders = paper.filed.slice(1, SHOULDER_STORIES + 1);
  // Pictures on the shoulders only when every shoulder has one. See `Teaser`:
  // twin seconds that start their headlines at different heights read as a
  // fault, not as a rank.
  const shouldersPictured = shoulders.every((story) => story.face !== null);
  const briefs = paper.filed.slice(SHOULDER_STORIES + 1, HEADLINES_SHOWN + 1);

  return (
    // The paper's second column is a SIDEBAR here and never a "rail". The desk
    // has a rail now — `shell/Rail`, the six sections down the left — and one
    // word for two different columns in one codebase is how a reader ends up
    // reading the wrong file.
    <>
      {/* Publisher, title, dateline. The masthead carried a plate and a
          standing service line as well until 3 Sep 2026; `Masthead.tsx` records
          why both went, which is that the page below already says what they
          said. */}
      <Masthead at={paper.snapshot?.fetchedAt ?? null} />

      {/* The paper's own pages, and now the only strip on the sheet. The app's
          six sections printed here too until 16 Sep 2026 (`gazette/Index`),
          because the rail stood down on the paper and a front page with no way
          out is a dead end. The rail is back (Craig's ruling, `Rail.tsx`), so
          the app's navigation is the app's again and this says only which page
          of the PAPER you are on — which is what it always meant. */}
      <Pages here="/" />

      <div className="grid gap-5 @3xl:grid-cols-[1fr_19rem] @3xl:gap-x-10">
        {/* The lead column. `--page-gutter: 0` inside it once the sidebar exists:
            the picture band and the pitch break out of the PAGE's gutters, and
            in a two-column grid the page's gutter is no longer the edge they are
            breaking out to — left as it was, the widest thing on the lead would
            have run out under the sidebar. */}
        <div className="flex flex-col gap-5 @3xl:[--page-gutter:0px]">
          {/* The scoreboard strip. `underway` and not `partial`: before the
          first kickoff every total is a legitimate nought, and a strip reading
          0–0 across eight ties would be reporting a round nobody has played. */}
          {paper.board && paper.underway ? (
            <Scoreboard
              pairings={paper.board.pairings}
              scores={paper.board.scores}
              mine={paper.mine}
              live={paper.live}
            />
          ) : null}

          {/* The lead — journalism, AT ALL TIMES. This reverses the recorded
          rule that suppressed the written column while football was on:
          "a headline is the one place a provisional claim cannot go" was a
          rule about the PAGE, and it has moved to the PIPELINE — the writer
          decides what is safe to file, and every column carries its filed
          instant, so a Friday preview under Saturday's moving strip is an
          honest dated opinion rather than a claim about now. The desk's own
          fact-stories still wait for the round to finish; they carry no
          dateline and would claim the week.

          **When a columnist has filed, HIS headline is the lead and the desk's
          is dropped.** Both would be about the same match — a fact-headline and
          a written one, stacked, saying the same thing twice — and a paper runs
          one splash. The picture stays: the story is the same story, and the
          desk is what chose the photograph for it.

          **And it is a HEADLINE, not the article.** This page printed the lead
          column whole until 3 Sep 2026, which put the second story on the sheet
          about nineteen hundred pixels down a phone — so the two ranks under it
          were furniture nobody reached. A front page's job is to make a reader
          choose what to read, and it cannot do that while the first choice is
          being read to him. `Written` prints it whole at `/paper/{slug}`, which
          is where an article goes. */}
          {paper.filed[0] ? (
            <>
              {/* The drawing when the lead has one, and the desk's own
                  typographic band when it does not. Never both: a paper runs
                  one picture over one splash. */}
              {/* Three pictures in order of how much we know: CI's drawing when
                  it made one, then the splash's own man, then the desk's
                  typographic band. Never two — a paper runs one picture over
                  one splash. The face outranks the band because a scorer is a
                  photograph and a scoreline set large is a stand-in for one. */}
              {paper.filed[0].image !== null ? (
                <Drawing story={paper.filed[0]} />
              ) : paper.filed[0].face ? (
                <Face face={paper.filed[0].face} clubs={clubs} rank="splash" />
              ) : paper.stories[0] ? (
                <Picture lead={paper.stories[0]} who={who} clubs={clubs} />
              ) : null}
              <Splash story={paper.filed[0]} />
            </>
          ) : paper.stories[0] ? (
            <Lead lead={paper.stories[0]} who={who} clubs={clubs} />
          ) : null}

          {/* The shoulders: the two stories that rank behind the lead, side by
              side under it, each with its deck and its dateline. Two columns at
              every width and not just the wide one — a phone is where this page
              is read, and a news site on a phone runs its two seconds abreast
              for the same reason a broadsheet does: side by side is what says
              "these two are equals, and both are below the splash".

              `grid-flow-col auto-cols-fr` rather than `grid-cols-2`, because a
              round that filed only two stories has ONE shoulder, and a lone
              half-width story with dead paper beside it is a column that lost
              its neighbour. Flowing by column gives it the full measure. */}
          {shoulders.length > 0 ? (
            <div className="grid auto-cols-fr grid-flow-col gap-x-5">
              {shoulders.map((story) => (
                <Teaser
                  key={story.slug}
                  story={story}
                  clubs={clubs}
                  pictured={shouldersPictured}
                />
              ))}
            </div>
          ) : null}

          {/* The rest, in briefs: standing head, headline, folio number. No deck
              and no dateline, which is what keeps the third rank visibly third. */}
          {briefs.length > 0 ? (
            <ul>
              {briefs.map((story) => (
                <Brief key={story.slug} story={story} clubs={clubs} />
              ))}
            </ul>
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

        </div>

        {/* The sidebar. Four short columns a manager scans rather than reads — the
            week's best eleven, who is hurt, who signed whom, when the lock is —
            so they are the four that come out of the lead's flow and stand
            beside it. On a phone the grid is one column and this is simply what
            follows, which is the order `docs/ui/gazetta.md` sets.

            The eleven leads the sidebar because it is the one block here anybody
            reads for pleasure; the other three are admin. It used to close the
            lead column as a full-width pitch, which is the size a picture gets
            and not the size a list of names earns. */}
        <div className="flex flex-col gap-5 @3xl:border-l @3xl:border-line @3xl:pl-6">
          {paper.eleven ? (
            <TeamOfTheWeek
              eleven={paper.eleven}
              mine={paper.mine}
              partial={paper.partial}
              fielded={paper.fielded}
            />
          ) : null}

          {/* The two tables, the way a back page carries them: the league we
              are actually in first, the one it is played out of second. Rank ·
              team · played · record or goal difference · points, and neither
              is a link — the sortable, tappable, badged versions are on the
              League and Players tabs, where a manager goes to USE them. */}
          <PaperTable title="The season's scorers" aside="Fantrax FPts" rows={scorers} />
          <PaperTable title="The draft table" aside="Fantrax" rows={draft} />
          <PaperTable title="The Premier League" aside="P · GD · Pts" rows={football} />

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
    </>
  );
}
