import { clubById, londonDayAndTime } from "@epl/core";
import { named } from "../components/gazette/named";
import Teaser from "../components/gazette/Teaser";
import Brief from "../components/gazette/Brief";
import Scoreboard from "../components/gazette/Scoreboard";
import Drawing from "../components/gazette/Drawing";
import Splash from "../components/gazette/Splash";
import Deals from "../components/gazette/Deals";
import Lead from "../components/gazette/Stories";
import Picture from "../components/gazette/Picture";
import StoryFace, { hasPicture } from "../components/gazette/StoryFace";
import Masthead from "../components/gazette/Masthead";
import TeamOfTheWeek from "../components/gazette/TeamOfTheWeek";
import { HEADLINES_SHOWN, SHOULDER_STORIES } from "../config";
import Column from "../components/gazette/Column";
import Silence from "../components/gazette/Silence";
import PaperTable from "../components/gazette/PaperTable";
import { edition } from "../edition";
import { readerTeamId } from "../squads";
import { draftRows, footballRows, scorerRows } from "../tables";

// The Gazetta's front page: the stories, the eleven, the tables, the business and the lock.
// A section with nothing to say does not appear; the register is `(paper)/layout.tsx`'s.

export default async function GazettePage() {
  const mine = await readerTeamId();
  const paper = await edition(mine);
  // The three tables, from reads the page already makes.
  const [draft, football, scorers] = await Promise.all([
    draftRows(mine),
    footballRows(),
    scorerRows(),
  ]);
  // One lookup for the whole paper: the lead's cut-out and the eleven's eleven
  // all want the same clubs, keyed the way a snapshot keys them.
  const clubs = paper.snapshot ? clubById(paper.snapshot) : new Map();
  // The same join the article page makes, plus the one case only this page has:
  // a deal whose other side is nobody — a waiver claim comes from the wire, not
  // from a manager.
  const byId = named(paper.teams);
  const who = (teamId: string | null) => (teamId === null ? "the wire" : byId(teamId));

  // The ranks under the splash, sliced together so the two boundaries cannot drift.
  const shoulders = paper.filed.slice(1, SHOULDER_STORIES + 1);
  // Twin shoulders carry pictures together or not at all: headlines at two heights read as a fault.
  const shouldersPictured = shoulders.every(hasPicture);
  const briefs = paper.filed.slice(SHOULDER_STORIES + 1, HEADLINES_SHOWN + 1);
  // The lead: the splash's picture (the drawing, the story's own, else the desk's) over its headline.
  const splash = paper.filed[0];
  const lead = splash ? (
    <>
      {splash.image !== null ? (
        <Drawing story={splash} />
      ) : hasPicture(splash) ? (
        <StoryFace story={splash} clubs={clubs} rank="splash" />
      ) : paper.stories[0] ? (
        <Picture lead={paper.stories[0]} who={who} clubs={clubs} />
      ) : null}
      <Splash story={splash} />
    </>
  ) : paper.stories[0] ? (
    <Lead lead={paper.stories[0]} who={who} clubs={clubs} />
  ) : null;

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

      <div className="grid gap-5 @3xl:grid-cols-[1fr_19rem] @3xl:gap-x-10">
        {/* The lead column: no gutter beside the sidebar, so a full-bleed picture stops at its edge. */}
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

          {/* The lead is journalism at all times, as a headline: the article is at `/paper/{slug}`.
              A filed column leads over the desk's own story and keeps the desk's picture. */}
          {lead !== null ? (
            // A phone stacks the three ranks; from 28rem the stories are one grid of equal cards,
            // the lead across two columns, and two rows too from 42rem, where the grid is three wide.
            <div className="@container/stories">
              <div className="flex flex-col gap-5 @md/stories:grid @md/stories:grid-cols-2 @md/stories:gap-x-5 @md/stories:gap-y-6 @2xl/stories:grid-cols-3">
                <div
                  className={`flex flex-col gap-5 @md/stories:gap-3 ${
                    shoulders.length + briefs.length === 0
                      ? "@md/stories:col-span-full"
                      : "@md/stories:col-span-2 @2xl/stories:row-span-2"
                  }`}
                >
                  {lead}
                </div>

                {/* The shoulders, abreast on a phone and the lead's own column on a desk. `grid-flow-col`
                    so a lone one takes a phone's full measure rather than half of it. */}
                {shoulders.length > 0 ? (
                  <div className="grid auto-cols-fr grid-flow-col gap-x-5 @md/stories:contents">
                    {shoulders.map((story) => (
                      <Teaser key={story.slug} story={story} clubs={clubs} pictured={shouldersPictured} />
                    ))}
                  </div>
                ) : null}

                {/* The rest: rows on a phone, cards on a desk. */}
                {briefs.length > 0 ? (
                  <ul className="@md/stories:contents">
                    {briefs.map((story) => (
                      <Brief key={story.slug} story={story} clubs={clubs} />
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Which nothing it is decides the sentence, and `Silence` owns all
              three — see its docblock on why they must not collapse. */}
          {paper.silence ? <Silence silence={paper.silence} /> : null}

        </div>

        {/* The sidebar: the week's eleven, the three tables, who signed whom and
            when the lock is. On a phone it follows the lead, in `docs/ui/gazetta.md`'s order. */}
        <div className="flex flex-col gap-5 @3xl:border-l @3xl:border-line @3xl:pl-6">
          {paper.eleven ? (
            <TeamOfTheWeek
              eleven={paper.eleven}
              mine={paper.mine}
              partial={paper.partial}
              fielded={paper.fielded}
            />
          ) : null}

          {/* Printed copies, not links: the sortable versions live on their own tabs. */}
          <PaperTable title="Top scorers" rows={scorers} />
          <PaperTable title="The draft table" rows={draft} />
          <PaperTable title="The Premier League" aside="P · GD · Pts" rows={football} />

          {paper.deals.length > 0 ? (
            <Deals deals={paper.deals} who={who} />
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
                , a quarter of an hour before gameweek {paper.deadline.period}{" "}
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
