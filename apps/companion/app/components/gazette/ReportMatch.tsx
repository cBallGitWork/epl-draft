import type { StoryReport } from "@epl/core";
import Highlights from "./Highlights";
import ReportHeader from "./ReportHeader";
import ReportSidebar from "./ReportSidebar";

// One match of a match-day report, laid out as BBC Sport sets one: the header, then the report beside its sidebar on a desk
// and above it on a phone. The report is the standfirst, the highlights, the account a paragraph to a line, and the sections.

export default function ReportMatch({
  report,
  names,
  video,
  matchHref,
}: {
  report: StoryReport;
  /** The paper's name for a club, by FPL code. */
  names: (code: number) => string;
  /** Sky's video for this match, drawn as a thumbnail that plays when tapped; null when it is not up. */
  video: string | null;
  matchHref: string | null;
}) {
  const title = `${names(report.home.code)} ${report.home.score}-${report.away.score} ${names(report.away.code)}`;
  return (
    <section id={`m-${report.fixtureCode}`} className="scroll-mt-4 py-5">
      <ReportHeader report={report} names={names} />
      <div className="grid gap-x-8 gap-y-5 pt-4 @3xl:grid-cols-[1fr_18rem]">
        <div className="flex min-w-0 flex-col gap-3">
          <p className="text-lg leading-snug font-semibold text-ink">{report.standfirst}</p>
          {video === null ? null : <Highlights id={video} title={title} />}
          {report.account
            .split("\n")
            .filter((paragraph) => paragraph !== "")
            .map((paragraph, i) => (
              <p key={i} className="text-base leading-relaxed text-ink">
                {paragraph}
              </p>
            ))}
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
