import Image from "next/image";
import { DASH, crestUrl, fullClubName, type FootballSnapshot, type PublishedStory } from "@epl/core";
import { seasonFixtures } from "../../football";
import { matchHighlight } from "../../matchFeed";
import { matchHref } from "../../prem/match/[id]/matchRoutes";
import { STANDING_HEAD } from "./heads";
import { listMarks } from "./listMarks";
import ReportMatch from "./ReportMatch";

// A match-day report: the day's scores as a list, lead first, then each match. A phone shows one match at a time, chosen from
// the list by its anchor in CSS alone (the article is static, so no request data); a desk shows them all, the list as contents.

export default async function Reports({ story, snapshot }: { story: PublishedStory; snapshot: FootballSnapshot | null }) {
  const reports = story.extras?.reports ?? [];
  if (reports.length === 0) return null;
  const clubs = new Map((snapshot?.clubs ?? []).map((club) => [club.code, club]));
  const names = (code: number) => fullClubName(clubs.get(code)?.name ?? DASH);

  // Per-season ids are never stored: the desk's links and the video fallback are found by the fixture's code, at render.
  const season = await seasonFixtures().catch(() => []);
  const idOf = (code: number) => season.find((f) => f.code === code)?.id ?? null;
  // Every match opens on its highlights; a video Sky posted after filing is looked up when the page is drawn.
  const videos = await Promise.all(
    reports.map(async (r) => r.video ?? (await matchHighlight({ home: clubs.get(r.home.code)?.name ?? "", away: clubs.get(r.away.code)?.name ?? "", homeScore: r.home.score, awayScore: r.away.score }))?.id ?? null),
  );

  const marked = listMarks(
    "rpt",
    reports.map((r) => `m-${r.fixtureCode}`),
  );

  return (
    <div className="rpt flex flex-col pt-4">
      <style>{marked}</style>
      {reports.length < 2 ? null : (
        <nav aria-label="The day's matches" className="rpt-list flex flex-col border-t" style={{ borderColor: "var(--paper-rule)" }}>
          <h3 className={`${STANDING_HEAD} py-2`}>The day&apos;s matches</h3>
          {reports.map((r) => (
            <a
              key={r.fixtureCode}
              href={`#m-${r.fixtureCode}`}
              className="grid min-h-11 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b px-2 text-sm text-ink"
              style={{ borderColor: "var(--paper-rule)" }}
            >
              <span className="flex min-w-0 items-center justify-end gap-2 text-right">
                <span className="truncate">{names(r.home.code)}</span>
                <Image src={crestUrl({ code: r.home.code })} alt="" width={20} height={20} className="h-5 w-5 shrink-0 object-contain" />
              </span>
              <span className="numeric font-semibold">
                {r.home.score}-{r.away.score}
              </span>
              <span className="flex min-w-0 items-center gap-2">
                <Image src={crestUrl({ code: r.away.code })} alt="" width={20} height={20} className="h-5 w-5 shrink-0 object-contain" />
                <span className="truncate">{names(r.away.code)}</span>
              </span>
            </a>
          ))}
        </nav>
      )}
      {/* On a phone one match shows: the one the list's anchor targets, or the lead. A desk shows every match. */}
      <div className="flex flex-col divide-y divide-[var(--paper-rule)] max-lg:[&:has(>section:target)>section:not(:target)]:hidden max-lg:[&:not(:has(>section:target))>section:not(:first-child)]:hidden">
        {reports.map((r, i) => {
          const id = idOf(r.fixtureCode);
          return (
            <ReportMatch
              key={r.fixtureCode}
              report={r}
              names={names}
              video={videos[i]}
              matchHref={id === null ? null : matchHref(id, "overview")}
            />
          );
        })}
      </div>
    </div>
  );
}
