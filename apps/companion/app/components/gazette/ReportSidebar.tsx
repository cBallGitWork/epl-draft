import Link from "@/app/components/shell/Link";
import type { FantasyMan, StoryLineup, StoryReport } from "@epl/core";
import { DASH, fixed, plural } from "@epl/core";
import { STANDING_CAPS, STANDING_HEAD as HEAD } from "./heads";
import { RULE } from "./rules";

// The sidebar beside a match's report: the line-ups first as a paper prints them, each man with our mark, then the Star man,
// the league's side (top scorers, free agents who scored) and the key stats. A phone reads it after the report.

/** Fantasy points as the sidebar prints them: "1 pt", "7 pts". */
const pts = (n: number) => `${n} ${plural(n, "pt")}`;

function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className={`flex flex-col gap-1.5 border-t pt-2 ${RULE}`}>
      <h4 className={HEAD} title={hint}>{title}</h4>
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
          {points && man.points !== null ? <span className="numeric shrink-0">{pts(man.points)}</span> : null}
        </li>
      ))}
    </ul>
  );
}

/** Where the marks come from, on hover: ours, not Fantrax's or anybody else's. */
const MARKS = "Our rating out of ten: his league points, weighed by the opponent and by the chances missed, errors and extras the league does not score.";

/** " 6.3", " —" for a man too brief to rate, nothing on a report filed before marks. */
const markText = (mark: number | null | undefined) => (mark === undefined ? "" : ` ${mark === null ? DASH : fixed(mark, "rating")}`);

const rated = (lineup: StoryLineup | null) => lineup?.lines.flat().some((m) => m.mark !== undefined) ?? false;

type Starter = StoryLineup["lines"][number][number];
type Sub = NonNullable<Starter["replacedBy"]>;

/** Every man who came on in a starter's place, in order: his replacement, and whoever replaced him. */
function subsOf(man: Starter): Sub[] {
  const out: Sub[] = [];
  for (let on = man.replacedBy ?? undefined; on !== undefined; on = on.replacedBy) out.push(on);
  return out;
}

/** "(Gray 19, 6.1 (Kudus 80))": a replacement with the minute and mark, half-time as "h-t", and his own replacement inside. */
function On({ on }: { on: Sub }) {
  const minute = on.minute === "46" ? "h-t" : on.minute;
  return (
    <>
      {` (${on.name} ${minute}`}
      {on.mark === undefined ? null : <span className="numeric">,{markText(on.mark)}</span>}
      {on.replacedBy === undefined ? null : <On on={on.replacedBy} />})
    </>
  );
}

/** "Porro 4.5 (Gray 19, 6.1)": the man, his mark, and the chain of men who came on for him. */
function Man({ man }: { man: Starter }) {
  return (
    <>
      {man.name}
      <span className="numeric">{markText(man.mark)}</span>
      {man.replacedBy === null ? null : <On on={man.replacedBy} />}
    </>
  );
}

function Lineup({ club, lineup }: { club: string; lineup: StoryLineup }) {
  const booked = lineup.lines.flat().flatMap((m) => [m, ...subsOf(m)].filter((each) => each.booked).map((each) => each.name));
  const off = lineup.lines.flat().filter((m) => m.sentOff).map((m) => m.name);
  return (
    <p className="text-2xs leading-snug text-ink">
      {club}
      {lineup.formation === null ? "" : ` (${lineup.formation})`}:{" "}
      {lineup.lines.map((line, i) => (
        <span key={i}>
          {line.map((man, j) => (
            <span key={`${man.name}-${j}`}>
              <Man man={man} />
              {j < line.length - 1 ? ", " : ""}
            </span>
          ))}
          {i < lineup.lines.length - 1 ? "; " : "."}
        </span>
      ))}
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
  return (
    <aside className="flex flex-col gap-4">
      {report.home.lineup === null && report.away.lineup === null ? null : (
        <Panel title={rated(report.home.lineup) || rated(report.away.lineup) ? "Line-ups and ratings" : "Line-ups"} hint={MARKS}>
          {report.home.lineup === null ? null : <Lineup club={home} lineup={report.home.lineup} />}
          {report.away.lineup === null ? null : <Lineup club={away} lineup={report.away.lineup} />}
          {report.referee === null ? null : <p className="text-2xs text-muted">Referee: {report.referee}.</p>}
        </Panel>
      )}
      {report.star == null ? null : (
        <Panel title="Star man" hint={MARKS}>
          <p className="paper-display text-lg leading-tight font-semibold text-ink">
            {report.star.name} <span className="numeric">{fixed(report.star.mark, "rating")}</span>
          </p>
          <p className="text-xs text-muted">
            {report.star.club}, {report.star.holder ?? "free"}
            {report.star.did === "" ? "" : ` · ${report.star.did}`}
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
      {matchHref === null ? null : (
        <Link href={matchHref} className={`${STANDING_CAPS} flex min-h-11 items-center text-ink underline`}>
          Full stats and line-ups
        </Link>
      )}
    </aside>
  );
}
