import type { PublishedStory, StorySheetSide } from "@epl/core";
import { yoursInk } from "../../mine";

// Team news at the lock, a head-to-head at a time: each side's paragraph, then its eleven and its
// bench as Fantrax holds them, in the shape of a BBC team-news item. The names are printed, not written.

export default function Sheets({
  story,
  named,
  mine,
}: {
  story: PublishedStory;
  named: (teamId: string) => string;
  mine: string | null;
}) {
  const ties = story.extras?.sheets ?? [];
  if (ties.length === 0) return null;

  return (
    <div className="flex flex-col divide-y pt-4" style={{ borderColor: "var(--paper-rule)" }}>
      {ties.map((tie) => (
        <section key={`${tie.home.teamId}-${tie.away.teamId}`} className="py-4">
          <h3 className="paper-display text-xl leading-tight font-semibold text-ink">
            <span className={yoursInk(tie.home.teamId === mine)}>{named(tie.home.teamId)}</span>
            <span className="text-muted"> v </span>
            <span className={yoursInk(tie.away.teamId === mine)}>{named(tie.away.teamId)}</span>
          </h3>
          {/* Stacked on a phone; side by side at a desk, where one paragraph across the sheet is too long a line. */}
          <div className="grid @3xl:grid-cols-2 @3xl:gap-x-8">
            <Side side={tie.home} named={named} mine={mine} />
            <Side side={tie.away} named={named} mine={mine} />
          </div>
          {tie.between === "" ? null : <p className="pt-3 text-base leading-snug text-muted italic">{tie.between}</p>}
        </section>
      ))}
    </div>
  );
}

function Side({ side, named, mine }: { side: StorySheetSide; named: (teamId: string) => string; mine: string | null }) {
  return (
    <div className="pt-3">
      <p className="text-base leading-snug text-ink">{side.line}</p>
      <p className="pt-2 text-base leading-snug text-ink">
        <strong className={`font-bold ${yoursInk(side.teamId === mine)}`}>
          {named(side.teamId)} XI{side.formation === null ? "" : ` (${side.formation})`}:
        </strong>{" "}
        {side.xi.join(", ")}.
      </p>
      {side.bench.length === 0 ? null : (
        <p className="pt-1 text-base leading-snug text-muted">
          <strong className="font-bold">Substitutes:</strong> {side.bench.join(", ")}.
        </p>
      )}
    </div>
  );
}
