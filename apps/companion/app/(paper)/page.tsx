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

  // The sheet's three ranks under the splash: these are the second and the
  // third, sliced here rather than in the markup so the two boundaries are one
  // line apart and cannot drift.
  const shoulders = paper.filed.slice(1, SHOULDER_STORIES + 1);
  // Pictures on the shoulders only when every shoulder has one. See `Teaser`:
  // twin seconds that start their headlines at different heights read as a
  // fault, not as a rank.
  const shouldersPictured = shoulders.every(hasPicture);
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
              {/* One picture over the splash, in order of how much we know: the drawing, the story's own
                  picture, then the desk's typographic band. */}
              {paper.filed[0].image !== null ? (
                <Drawing story={paper.filed[0]} />
              ) : hasPicture(paper.filed[0]) ? (
                <StoryFace story={paper.filed[0]} clubs={clubs} rank="splash" />
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

          {/* The rest, in briefs: thumbnail, standing head, headline. No deck
              and no dateline, which is what keeps the third rank visibly third. */}
          {briefs.length > 0 ? (
            <ul>
              {briefs.map((story) => (
                <Brief key={story.slug} story={story} clubs={clubs} />
              ))}
            </ul>
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
