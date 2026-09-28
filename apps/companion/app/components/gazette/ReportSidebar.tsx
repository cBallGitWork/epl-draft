import Link from "next/link";
import type { FantasyMan, StoryLineup, StoryReport } from "@epl/core";

// The sidebar beside a match's report: the league's side of it first (Draft Man of the Match, top scorers, the wire, off days),
// then the football's (key stats, line-ups as a paper prints them, the timeline). A phone reads it after the report.

const HEAD = "font-sans text-3xs font-semibold uppercase tracking-[0.16em] text-muted";
const RULE = { borderColor: "var(--paper-rule)" };

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5 border-t pt-2" style={RULE}>
      <h4 className={HEAD}>{title}</h4>
      {children}
    </section>
  );
}

function Men({ men, points }: { men: readonly FantasyMan[]; points: boolean }) {
  return (
    <ul className="flex flex-col gap-1 text-xs leading-snug text-ink">
      {men.map((man) => (
        <li key={`${man.name}-${man.club}`} className="flex items-baseline justify-between gap-2">
          <span className="min-w-0">
            <span className="font-semibold">{man.name}</span> <span className="text-muted">({man.club}{man.holder === null ? ", free" : `, ${man.holder}`})</span>
            {man.did === "" ? null : <span className="block text-2xs text-muted">{man.did}</span>}
          </span>
          {points && man.points !== null ? <span className="numeric shrink-0">{man.points} pt{man.points === 1 ? "" : "s"}</span> : null}
        </li>
      ))}
    </ul>
  );
}

/** "Porro (Gray 19)": the man replaced with his replacement and the minute, half-time as "h-t", no apostrophe. */
function lineupText(club: string, lineup: StoryLineup): string {
  const minute = (m: string) => (m === "46" ? "h-t" : m);
  const lines = lineup.lines.map((line) =>
    line.map((man) => `${man.name}${man.replacedBy === null ? "" : ` (${man.replacedBy.name} ${minute(man.replacedBy.minute)})`}`).join(", "),
  );
  return `${club}${lineup.formation === null ? "" : ` (${lineup.formation})`}: ${lines.join("; ")}.`;
}

function Lineup({ club, lineup }: { club: string; lineup: StoryLineup }) {
  const booked = lineup.lines.flat().flatMap((m) => [...(m.booked ? [m.name] : []), ...(m.replacedBy?.booked ? [m.replacedBy.name] : [])]);
  const off = lineup.lines.flat().filter((m) => m.sentOff).map((m) => m.name);
  return (
    <p className="text-2xs leading-snug text-ink">
      {lineupText(club, lineup)}
      {lineup.unused.length === 0 ? null : <span className="block text-muted">Subs not used: {lineup.unused.join(", ")}.</span>}
      {booked.length === 0 ? null : <span className="block text-muted">Booked: {booked.join(", ")}.</span>}
      {off.length === 0 ? null : <span className="block text-muted">Sent off: {off.join(", ")}.</span>}
    </p>
  );
}

export default function ReportSidebar({ report, names, matchHref }: { report: StoryReport; names: (code: number) => string; matchHref: string | null }) {
  const { fantasy } = report;
  const home = names(report.home.code);
  const away = names(report.away.code);
  const side = (s: "home" | "away" | null) => (s === "home" ? home : s === "away" ? away : "");
  return (
    <aside className="flex flex-col gap-4">
      {fantasy.motm === null ? null : (
        <Panel title="Draft Man of the Match">
          <p className="paper-display text-lg leading-tight font-semibold text-ink">{fantasy.motm.name}</p>
          <p className="text-xs text-muted">
            {fantasy.motm.club}, {fantasy.motm.holder}
            {fantasy.motm.points === null ? "" : `, ${fantasy.motm.points} pts`}
            {fantasy.motm.did === "" ? "" : ` · ${fantasy.motm.did}`}
          </p>
        </Panel>
      )}
      {fantasy.top.length < 2 ? null : (
        <Panel title="Top league scorers">
          <Men men={fantasy.top} points />
        </Panel>
      )}
      {fantasy.wire.length === 0 ? null : (
        <Panel title="Free agents">
          <Men men={fantasy.wire} points={false} />
        </Panel>
      )}
      {fantasy.offDays.length === 0 ? null : (
        <Panel title="Off days">
          <Men men={fantasy.offDays} points={false} />
        </Panel>
      )}
      {report.keyStats.length === 0 ? null : (
        <Panel title="Key stats">
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs leading-snug text-ink">
            {report.keyStats.map((stat) => (
              <div key={stat.label} className="contents">
                <dt className="text-muted">{stat.label}</dt>
                <dd className="numeric">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      )}
      {report.home.lineup === null && report.away.lineup === null ? null : (
        <Panel title="Line-ups">
          {report.home.lineup === null ? null : <Lineup club={home} lineup={report.home.lineup} />}
          {report.away.lineup === null ? null : <Lineup club={away} lineup={report.away.lineup} />}
          {report.referee === null ? null : <p className="text-2xs text-muted">Referee: {report.referee}.</p>}
        </Panel>
      )}
      <Panel title="Timeline">
        <ol className="flex flex-col text-2xs leading-snug text-ink">
          {report.rows.map((row, i) => (
            <li key={`${row.minute}-${i}`} className="grid grid-cols-[2.5rem_4.5rem_1fr] gap-x-2 border-b py-1" style={RULE}>
              <span className="numeric text-right text-muted">{row.minute}&apos;</span>
              <span className="font-sans uppercase tracking-wide text-muted">{row.kind}</span>
              <span>
                {row.text}
                {row.side === null ? null : <span className="text-faint"> · {side(row.side)}</span>}
              </span>
            </li>
          ))}
        </ol>
      </Panel>
      {matchHref === null ? null : (
        <Link href={matchHref} className={`${HEAD} flex min-h-11 items-center text-ink underline`}>
          Full stats and line-ups
        </Link>
      )}
    </aside>
  );
}
