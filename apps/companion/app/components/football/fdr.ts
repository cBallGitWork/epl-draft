// How hard a fixture is, in FPL's five steps (never ours), and the ink each step carries.

/** Ground and ink per step; 5 is darker than 4, so its ink turns to cream. Written out: Tailwind
 *  drops a theme variable it never reads literally, so `var(--color-fdr-${n})` would emit nothing. */
const STEPS: Record<number, { ground: string; ink: string }> = {
  1: { ground: "var(--color-fdr-1)", ink: "text-black/85" },
  2: { ground: "var(--color-fdr-2)", ink: "text-black/85" },
  3: { ground: "var(--color-fdr-3)", ink: "text-black/85" },
  4: { ground: "var(--color-fdr-4)", ink: "text-black/85" },
  5: { ground: "var(--color-fdr-5)", ink: "text-cream" },
};

/** An unrated fixture, or one outside the scale, is drawn neutral rather than given a middle score. */
const UNRATED = { ground: "var(--color-raised)", ink: "text-muted" };

/** The scale, for anything that draws a fixture by how hard it is. */
export function fdrStep(difficulty: number | null): { ground: string; ink: string } {
  return (difficulty === null ? undefined : STEPS[difficulty]) ?? UNRATED;
}
