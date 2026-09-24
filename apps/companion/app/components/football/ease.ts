import { easeStep } from "@epl/core";

// The planner's ten-step ease ramp: an opponent's 1-20 rank as a cell's ground and ink. Ours, never FPL's
// (`fdr.ts`). The names are written out literally: Tailwind v4 drops a theme variable it never reads in source.

const STEPS: Record<number, { ground: string; ink: string }> = {
  1: { ground: "var(--color-ease-1)", ink: "text-black" },
  2: { ground: "var(--color-ease-2)", ink: "text-black" },
  3: { ground: "var(--color-ease-3)", ink: "text-black" },
  4: { ground: "var(--color-ease-4)", ink: "text-black" },
  5: { ground: "var(--color-ease-5)", ink: "text-black" },
  6: { ground: "var(--color-ease-6)", ink: "text-black" },
  7: { ground: "var(--color-ease-7)", ink: "text-black" },
  8: { ground: "var(--color-ease-8)", ink: "text-cream" },
  9: { ground: "var(--color-ease-9)", ink: "text-cream" },
  10: { ground: "var(--color-ease-10)", ink: "text-cream" },
};

/** An opponent the export has no rating for: a quiet cell that reads as a hole. */
const UNRATED = { ground: "var(--color-raised)", ink: "text-muted" };

export function easeGround(rank: number | null): { ground: string; ink: string } {
  return rank === null ? UNRATED : (STEPS[easeStep(rank)] ?? UNRATED);
}
