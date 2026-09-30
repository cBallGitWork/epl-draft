import { ordinal, type StoryDraftMatchup, type StoryDraftSide } from "@epl/core";

// One match-up of a draft report: the score, each side's form strip (place before and after, the last results going in),
// the desk's verdict as the opening line, then the paragraphs. The article's one photograph is its cover.

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
        <div className="grid grid-cols-2 gap-4">
          <Form side={home} align="start" />
          <Form side={away} align="end" />
        </div>
      </header>
      {matchup.standfirst === "" ? null : <p className="text-lg leading-snug font-semibold text-ink">{matchup.standfirst}</p>}
      {matchup.paragraphs.map((p, i) => (
        <p key={i} className="text-base leading-relaxed text-ink">
          {p}
        </p>
      ))}
    </section>
  );
}
