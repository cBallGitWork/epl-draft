import Image from "next/image";
import { crestUrl, londonDayAndDate, type StoryReport, type StoryReportSide } from "@epl/core";

// A match's header as BBC Sport sets one (Craig, 28 Sep 2026): date and competition, each club with its crest either side of
// the score, full time and half-time, the goals and the men who made them under their own side, then the ground and the crowd.

const SMALL = "font-sans text-3xs font-semibold uppercase tracking-[0.16em] text-muted";

function Club({ side, name, align }: { side: StoryReportSide; name: string; align: "start" | "end" }) {
  return (
    <div className={`flex min-w-0 flex-col items-center gap-1 ${align === "end" ? "sm:items-end" : "sm:items-start"}`}>
      {/* A raster badge reads none of the sheet's tokens, so it is not `.crest` (DESIGN §5). */}
      <Image src={crestUrl({ code: side.code })} alt="" width={40} height={40} className="h-10 w-10 object-contain" />
      <span className="paper-display text-center text-base leading-tight font-semibold text-ink sm:text-lg">{name}</span>
    </div>
  );
}

function Events({ side, align }: { side: StoryReportSide; align: "start" | "end" }) {
  const text = `text-xs leading-snug text-ink ${align === "end" ? "text-right" : "text-left"}`;
  return (
    <div className="flex min-w-0 flex-col gap-1">
      {side.goals.map((goal) => (
        <span key={goal} className={text}>
          {goal.replace(/ (\d+(?:\+\d+)?)( og| pen)?$/u, " ($1')$2")}
        </span>
      ))}
    </div>
  );
}

export default function ReportHeader({ report, names }: { report: StoryReport; names: (code: number) => string }) {
  const assists = (side: StoryReportSide) => side.assists.map((a) => a.replace(/ (\d+(?:\+\d+)?)$/u, " ($1')")).join(", ");
  return (
    <header className="flex flex-col gap-3 border-y py-3" style={{ borderColor: "var(--paper-rule)" }}>
      <p className={SMALL}>{report.kickoff === "" ? "Premier League" : `${londonDayAndDate(report.kickoff)} · Premier League`}</p>
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
        <Club side={report.home} name={names(report.home.code)} align="start" />
        <div className="flex flex-col items-center gap-1 pt-1">
          <span className="numeric paper-display text-4xl leading-none font-semibold text-ink">
            {report.home.score}-{report.away.score}
          </span>
          <span className={SMALL}>FT{report.halfTime === null ? "" : ` · HT ${report.halfTime.home}-${report.halfTime.away}`}</span>
        </div>
        <Club side={report.away} name={names(report.away.code)} align="end" />
      </div>
      {report.home.goals.length + report.away.goals.length === 0 ? null : (
        <div className="grid grid-cols-2 gap-4">
          <Events side={report.home} align="start" />
          <Events side={report.away} align="end" />
        </div>
      )}
      {report.home.assists.length + report.away.assists.length === 0 ? null : (
        <p className="text-2xs leading-snug text-muted">
          <span className={SMALL}>Assists </span>
          {[report.home.assists.length > 0 ? `${names(report.home.code)}: ${assists(report.home)}` : null, report.away.assists.length > 0 ? `${names(report.away.code)}: ${assists(report.away)}` : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
      {report.venue === null && report.attendance === null ? null : (
        <p className="text-2xs text-muted">
          {[report.venue, report.attendance === null ? null : `attendance ${report.attendance.toLocaleString("en-GB")}`].filter(Boolean).join(" · ")}
        </p>
      )}
    </header>
  );
}
