import Link from "next/link";
import { YOUTUBE_EMBED_BASE, type StoryReport } from "@epl/core";

// One match of a match-day report: the score block, the standfirst, the account, the highlights, the sections, the key
// stats, the details and a way to the desk's full match. A desk sets the details beside the prose; a phone folds them away.

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
  const home = names(report.home.code);
  const away = names(report.away.code);
  const title = `${home} ${report.home.score}-${report.away.score} ${away}`;
  return (
    <section id={`m-${report.fixtureCode}`} className="scroll-mt-4 py-5">
      <header className="flex flex-col gap-1">
        <h3 className="paper-display text-2xl leading-tight font-semibold text-ink">
          {home} <span className="numeric">{report.home.score}-{report.away.score}</span> {away}
        </h3>
        <p className="text-xs text-muted">
          {[report.home.scorers.length > 0 ? `${home}: ${report.home.scorers.join(", ")}` : null, report.away.scorers.length > 0 ? `${away}: ${report.away.scorers.join(", ")}` : null]
            .filter(Boolean)
            .join(" · ")}
          {report.halfTime === null ? null : <span className={`${STANDING} pl-2`}>HT {report.halfTime.home}-{report.halfTime.away}</span>}
        </p>
      </header>

      <div className="grid gap-x-8 pt-3 @3xl:grid-cols-[1fr_16rem]">
        <div className="flex min-w-0 flex-col gap-3">
          <p className="text-base leading-snug font-semibold text-ink">{report.standfirst}</p>
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
              <h4 className={STANDING}>{section.head}</h4>
              <p className="text-base leading-relaxed text-ink">
                {section.pitch} {section.stake}
              </p>
            </div>
          ))}
        </div>

        <aside className="flex flex-col gap-4 pt-4 @3xl:pt-0">
          {report.keyStats.length === 0 ? null : (
            <div className="flex flex-col gap-1 border-t pt-2" style={{ borderColor: "var(--paper-rule)" }}>
              <h4 className={STANDING}>Key stats</h4>
              <ul className="flex flex-col gap-1 text-xs leading-snug text-ink">
                {report.keyStats.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          )}
          <Details report={report} home={home} away={away} />
          {matchHref === null ? null : (
            <Link href={matchHref} className={`${STANDING} flex min-h-11 items-center text-ink underline`}>
              Full stats and line-ups
            </Link>
          )}
        </aside>
      </div>
    </section>
  );
}

/** The agate: every moment in minute order, the referee and managers, and what comes next. Folded on a phone. */
function Details({ report, home, away }: { report: StoryReport; home: string; away: string }) {
  const side = (s: "home" | "away" | null) => (s === "home" ? home : s === "away" ? away : "");
  return (
    <details className="border-t pt-2" style={{ borderColor: "var(--paper-rule)" }}>
      <summary className={`${STANDING} flex min-h-11 cursor-pointer items-center`}>Timeline and details</summary>
      <ol className="flex flex-col text-2xs leading-snug text-ink">
        {report.rows.map((row, i) => (
          <li key={`${row.minute}-${i}`} className="grid grid-cols-[2.75rem_4.5rem_1fr] gap-x-2 border-b py-1" style={{ borderColor: "var(--paper-rule)" }}>
            <span className="numeric text-right text-muted">{row.minute}&apos;</span>
            <span className="font-sans uppercase tracking-wide text-muted">{row.kind}</span>
            <span>
              {row.text}
              {row.side === null ? null : <span className="text-faint"> · {side(row.side)}</span>}
            </span>
          </li>
        ))}
      </ol>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 pt-3 text-2xs text-ink">
        {report.referee === null ? null : (
          <>
            <dt className="text-muted">Referee</dt>
            <dd>{report.referee}</dd>
          </>
        )}
        {(["home", "away"] as const).map((s) => (
          <div key={s} className="contents">
            <dt className="text-muted">{side(s)}</dt>
            <dd>
              {[report.managers[s], report.ahead[s].length === 0 ? null : `next: ${report.ahead[s].join(", ")}`].filter(Boolean).join(" · ") || "—"}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
