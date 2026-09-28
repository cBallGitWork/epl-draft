import { fullClubName, type FootballSnapshot, type PublishedStory } from "@epl/core";
import { seasonFixtures } from "../../football";
import { matchHighlight } from "../../matchFeed";
import { matchHref } from "../../prem/match/[id]/matchRoutes";
import ReportMatch from "./ReportMatch";

// A match-day report: the day's results as a strip, lead first, then each match. A phone shows one match at a time, chosen
// from the strip by its anchor in CSS alone (the article is static, so no request data); a desk shows them all.

export default async function Reports({
  story,
  snapshot,
}: {
  story: PublishedStory;
  snapshot: FootballSnapshot | null;
}) {
  const reports = story.extras?.reports ?? [];
  if (reports.length === 0) return null;
  const clubs = new Map((snapshot?.clubs ?? []).map((club) => [club.code, club]));
  const names = (code: number) => fullClubName(clubs.get(code)?.name ?? "—");
  const short = (code: number) => clubs.get(code)?.shortName ?? "—";
  const lead = reports[0];

  // Per-season ids are never stored: the desk's link and the video fallback are found by the fixture's code, at render.
  const season = await seasonFixtures().catch(() => []);
  const idOf = (code: number) => season.find((f) => f.code === code)?.id ?? null;
  // The lead's highlights play here; a video Sky posted after filing is looked up when the page is drawn.
  const video =
    lead.video ??
    (await matchHighlight({ home: clubs.get(lead.home.code)?.name ?? "", away: clubs.get(lead.away.code)?.name ?? "", homeScore: lead.home.score, awayScore: lead.away.score }))?.id ??
    null;

  return (
    <div className="flex flex-col pt-4">
      {reports.length < 2 ? null : (
      <nav aria-label="The day's matches" className="flex flex-wrap gap-x-1.5 gap-y-1 font-sans text-3xs font-semibold uppercase tracking-[0.16em]">
        {reports.map((r) => (
          <a key={r.fixtureCode} href={`#m-${r.fixtureCode}`} className="numeric flex min-h-11 items-center px-2 text-ink underline-offset-4 hover:underline">
            {short(r.home.code)} {r.home.score}-{r.away.score} {short(r.away.code)}
          </a>
        ))}
      </nav>
      )}
      {/* On a phone one match shows: the one the strip's anchor targets, or the lead. A desk shows every match. */}
      <div
        className="flex flex-col divide-y max-lg:[&:has(>section:target)>section:not(:target)]:hidden max-lg:[&:not(:has(>section:target))>section:not(:first-child)]:hidden"
        style={{ borderColor: "var(--paper-rule)" }}
      >
        {reports.map((r) => {
          const id = idOf(r.fixtureCode);
          return (
            <ReportMatch
              key={r.fixtureCode}
              report={r}
              names={names}
              video={r === lead ? video : null}
              highlightsHref={id === null || r === lead || r.video === null ? null : matchHref(id, "highlights")}
              matchHref={id === null ? null : matchHref(id, "overview")}
            />
          );
        })}
      </div>
    </div>
  );
}
