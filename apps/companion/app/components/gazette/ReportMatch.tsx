import Link from "next/link";
import { YOUTUBE_EMBED_BASE, type StoryReport } from "@epl/core";
import ReportHeader from "./ReportHeader";
import ReportSidebar from "./ReportSidebar";

// One match of a match-day report, laid out as BBC Sport sets one: the header, then the report beside its sidebar on a desk
// and above it on a phone. The report is the standfirst, the account, the highlights and the sections.

const STANDING = "font-sans text-3xs font-semibold uppercase tracking-[0.16em] text-muted";

export default function ReportMatch({
  report,
  names,
  video,
  highlightsHref,
  matchHref,
}: {
  report: StoryReport;
  /** The paper's name for a club, by FPL code. */
  names: (code: number) => string;
  /** The video to play here: the lead's only, so a page holds one player. */
  video: string | null;
  /** The desk's Highlights tab for any other match with a video. */
  highlightsHref: string | null;
  matchHref: string | null;
}) {
  const title = `${names(report.home.code)} ${report.home.score}-${report.away.score} ${names(report.away.code)}`;
  return (
    <section id={`m-${report.fixtureCode}`} className="scroll-mt-4 py-5">
      <ReportHeader report={report} names={names} />
      <div className="grid gap-x-8 gap-y-5 pt-4 @3xl:grid-cols-[1fr_18rem]">
        <div className="flex min-w-0 flex-col gap-3">
          <p className="text-lg leading-snug font-semibold text-ink">{report.standfirst}</p>
          {report.account === "" ? null : <p className="text-base leading-relaxed text-ink">{report.account}</p>}
          {video !== null ? (
            <figure className="aspect-video w-full max-w-full overflow-hidden">
              <iframe
                src={`${YOUTUBE_EMBED_BASE}/${video}`}
                title={`${title}, highlights`}
                loading="lazy"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full"
              />
            </figure>
          ) : highlightsHref !== null ? (
            <Link href={highlightsHref} className={`${STANDING} flex min-h-11 items-center text-ink underline`}>
              Watch the highlights
            </Link>
          ) : null}
          {report.sections.map((section) => (
            <div key={section.head} className="flex flex-col gap-1">
              <h4 className="paper-display text-base leading-tight font-semibold text-ink">{section.head}</h4>
              <p className="text-base leading-relaxed text-ink">
                {section.pitch} {section.stake}
              </p>
            </div>
          ))}
        </div>
        <ReportSidebar report={report} names={names} matchHref={matchHref} />
      </div>
    </section>
  );
}
