import Section from "../../components/shell/Section";
import { FACT } from "@/app/desk";

// What Fantrax reckons he will do this period.
//
// **Their guess, said in the heading, and never in a column headed `FPts`.**
// `FPts` is Fantrax's own word for what a player HAS scored, and the two sit one
// column apart on their own site; a number that switched between them under one
// label would be the confident wrong answer this app refuses
// (docs/ui/conventions.md).
//
// Absent far more often than present, and silently. There is nothing to project
// for a free agent, nothing before Fantrax has guessed, and nothing at all while
// the lineup gate is shut — because Fantrax projects the fielded eleven only, so
// this number appearing would say his manager has picked him. `draft.ts` does
// that gating; this draws whatever survives it.

export default function Projection({
  projection,
}: {
  projection: { points: number; gameweek: number } | null;
}) {
  if (projection === null) return null;

  return (
    <Section title={`Gameweek ${projection.gameweek}`} aside="Fantrax's projection">
      <div className={FACT}>
        <p
          className="min-w-0 flex-1 text-sm text-muted"
          title="Fantrax's own guess, under this league's scoring. It is not what he has scored."
        >
          Expected to score
        </p>
        {/* The amber slot, which means "a figure" (DESIGN §3) — the same one
            every measured number on this page is set in. */}
        <span className="numeric text-lg font-bold text-mid">{projection.points}</span>
      </div>
    </Section>
  );
}
