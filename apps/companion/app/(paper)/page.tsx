import { LEAGUE_NAME, clubById } from "@epl/core";
import Article from "../components/gazette/Article";
import Scoreboard from "../components/gazette/Scoreboard";
import Deals from "../components/gazette/Deals";
import Doubts from "../components/gazette/Doubts";
import Lead, { Headline } from "../components/gazette/Stories";
import Picture from "../components/gazette/Picture";
import Written from "../components/gazette/Written";
import Index from "../components/gazette/Index";
import Masthead from "../components/gazette/Masthead";
import TeamOfTheWeek from "../components/gazette/TeamOfTheWeek";
import { FANTRAX_SILENT, HEADLINES_SHOWN, SECONDARY_STORIES, servedLeague } from "../config";
import Column from "../components/gazette/Column";
import Nothing from "../components/shell/Nothing";
import PaperTable from "../components/gazette/PaperTable";
import { edition } from "../edition";
import { londonDate, londonDayAndTime } from "../londonTime";
import { readerTeamId } from "../squads";
import { draftRows, footballRows, scorerRows } from "../tables";
import { offerLive } from "../football";

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
  // The desk's rail stands down here, so the paper prints the index itself.
  // `offerLive` and not `paper.live`: `live` is "a ball is in the air" and goes
  // false in every gap between kickoffs, which would take the Live section out
  // of the contents at tea-time on a Saturday.
  const matchday = await offerLive();
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
  // The selector's captions, if that column has filed. Keyed by player name,
  // which is what the column was given and told to key on.
  const captions = new Map(
    (paper.filed.find((story) => story.kind === "eleven")?.extras?.captions ?? []).map(
      (caption) => [caption.key, caption.line] as const,
    ),
  );
  const names = new Map(paper.teams.map((team) => [team.teamId, team.name]));
  const who = (teamId: string | null) =>
    teamId === null ? "the wire" : (names.get(teamId) ?? "—");

  return (
    // The paper's second column is a SIDEBAR here and never a "rail". The desk
    // has a rail now — `shell/Rail`, the six sections down the left — and one
    // word for two different columns in one codebase is how a reader ends up
    // reading the wrong file.
    <>
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

      <Index matchday={matchday} here="/" />

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
          desk is what chose the photograph for it. */}
          {paper.filed[0] ? (
            <>
              {paper.stories[0] ? (
                <Picture lead={paper.stories[0]} who={who} clubs={clubs} />
              ) : null}
              <Written story={paper.filed[0]} teams={paper.teams} />
            </>
          ) : paper.stories[0] ? (
            <Lead lead={paper.stories[0]} who={who} clubs={clubs} />
          ) : null}

          {/* The rest of the edition, as a front page carries it: headlines,
              each opening where it stands. The lead above is the one article
              printed whole. */}
          {paper.filed.length > 1 ? (
            <div className="flex flex-col gap-1">
              {paper.filed.slice(1, HEADLINES_SHOWN + 1).map((story) => (
                <Article key={story.slug} story={story} named={who} mine={paper.mine} />
              ))}
            </div>
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
              captions={captions}
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
