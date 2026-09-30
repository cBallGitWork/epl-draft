import { ordinal, returnText, stepLabel, type StoryDraftMatchup, type StoryDraftReturn, type StoryDraftSide, type StoryDraftStep } from "@epl/core";
import DraftEleven from "./DraftEleven";

// One match-up of a draft report, set as a BBC match report is: the score with each side's goals under it, the assists and
// clean sheets, how the score ran by day and each side's form strip; then the verdict and the story, with both elevens
// after it on a phone and beside it on a desk. The article's one photograph is its cover.

const SMALL = "font-sans text-3xs font-semibold uppercase tracking-[0.16em] text-muted";
const RULE = { borderColor: "var(--paper-rule)" };

function Form({ side, align }: { side: StoryDraftSide; align: "start" | "end" }) {
  const place = side.rankBefore === null ? null : side.rankAfter === null || side.rankAfter === side.rankBefore ? ordinal(side.rankBefore) : `${ordinal(side.rankBefore)} → ${ordinal(side.rankAfter)}`;
  return (
    <div className={`flex flex-col gap-1 ${align === "end" ? "items-end" : "items-start"}`}>
      {place === null ? null : <span className="numeric text-xs text-ink">{place}</span>}
      {side.run === "" ? null : (
        <span className="flex gap-0.5" aria-label={`Last results ${side.run.split("").join(" ")}`}>
          {side.run.split("").map((r, i) => (
            <span key={i} className={`numeric grid h-4 w-4 place-items-center border text-3xs ${r === "W" ? "font-bold text-ink" : "text-muted"}`} style={RULE}>
              {r}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}

/** A side's scorers under its name, one a line. */
function Goals({ goals, align }: { goals: StoryDraftReturn[]; align: "start" | "end" }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 text-xs leading-snug text-ink ${align === "end" ? "text-right" : "text-left"}`}>
      {goals.map((g) => (
        <span key={g.name}>{returnText(g)}</span>
      ))}
    </div>
  );
}

/** "Assists test2: Meunier · 123: Groß", leaving out a side with none. */
function Tally({ label, sides, of }: { label: string; sides: StoryDraftSide[]; of: (side: StoryDraftSide) => StoryDraftReturn[] }) {
  const parts = sides.filter((side) => of(side).length > 0).map((side) => `${side.name}: ${of(side).map(returnText).join(", ")}`);
  if (parts.length === 0) return null;
  return (
    <p className="text-2xs leading-snug text-muted">
      <span className={SMALL}>{label} </span>
      {parts.join(" · ")}
    </p>
  );
}

/** "Fri 0-11 · Sat 16-26 · Sun 34-38 · Subs 37-38", the last step in ink; nothing when the score moved on one day only. */
function ByDay({ steps }: { steps: StoryDraftStep[] }) {
  if (steps.length < 2) return null;
  return (
    <p className="numeric text-center text-2xs text-muted" aria-label="The score by day">
      {steps.map((step, i) => (
        <span key={i}>
          {i === 0 ? null : " · "}
          <span className={`whitespace-nowrap ${i === steps.length - 1 ? "text-ink" : ""}`}>
            {stepLabel(step)} {step.home}-{step.away}
          </span>
        </span>
      ))}
    </p>
  );
}

export default function DraftMatchup({ matchup, n, saturday }: { matchup: StoryDraftMatchup; n: number; saturday: boolean }) {
  const { home, away } = matchup;
  return (
    <section id={`d-${n}`} className="flex scroll-mt-4 flex-col gap-3 py-5">
      <header className="flex flex-col gap-2 border-y py-3" style={RULE}>
        <p className={SMALL}>{saturday ? "After Saturday" : "Full time"}</p>
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
          <span className="paper-display text-base leading-tight font-semibold text-ink sm:text-lg">{home.name}</span>
          <span className="numeric paper-display text-4xl leading-none font-semibold text-ink">
            {home.score}-{away.score}
          </span>
          <span className="paper-display text-right text-base leading-tight font-semibold text-ink sm:text-lg">{away.name}</span>
        </div>
        <ByDay steps={matchup.byDay} />
        {home.returns.goals.length + away.returns.goals.length === 0 ? null : (
          <div className="grid grid-cols-2 gap-4">
            <Goals goals={home.returns.goals} align="start" />
            <Goals goals={away.returns.goals} align="end" />
          </div>
        )}
        <Tally label="Assists" sides={[home, away]} of={(side) => side.returns.assists} />
        <Tally label="Clean sheets" sides={[home, away]} of={(side) => side.returns.cleanSheets} />
        <div className="grid grid-cols-2 gap-4">
          <Form side={home} align="start" />
          <Form side={away} align="end" />
        </div>
      </header>
      <div className="grid gap-x-8 gap-y-5 @3xl:grid-cols-[1fr_24rem]">
        <div className="flex min-w-0 flex-col gap-3">
          {matchup.standfirst === "" ? null : <p className="text-lg leading-snug font-semibold text-ink">{matchup.standfirst}</p>}
          {matchup.paragraphs.map((p, i) => (
            <p key={i} className="text-base leading-relaxed text-ink">
              {p}
            </p>
          ))}
        </div>
        <DraftEleven home={home} away={away} />
      </div>
    </section>
  );
}
