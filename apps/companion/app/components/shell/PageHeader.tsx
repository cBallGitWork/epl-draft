import type { ReactNode } from "react";

// How a desk screen opens: CM's title bar, and the `sub` line under it, never in it (a CM bar holds only a title).
// The matchday screen keeps its own header on purpose: baseline-aligned with a live badge, a different design.

export default function PageHeader({
  title,
  sub,
  competition = false,
  plate,
  children,
}: {
  title: string;
  /** The line under the title: a count, a period, a date. */
  sub?: React.ReactNode;
  /** CM's competition bar rather than a club's: a light plate with the title in blue, no crest.
   *  `--color-chrome` on `--color-ink` is the blue plate's pair swapped, 7.0:1 either way. */
  competition?: boolean;
  /** The bar's plate when the subject has a colour of its own, a fantasy team; absent leaves the chrome blue.
   *  Inline, because a colour picked per team at runtime has no literal token name for Tailwind to emit. */
  plate?: { background: string; ink: string };
  children?: React.ReactNode;
}) {
  if (competition) {
    return (
      <header>
        {/* The bevel with the plate turned over: its edges mixed off `--color-ink` rather than the chrome. */}
        <div
          className="flex min-h-11 items-center gap-2 border-2 px-2 py-1 lg:min-h-24"
          style={{
            background: "var(--color-ink)",
            borderColor:
              "color-mix(in oklch, var(--color-ink), white 55%) color-mix(in oklch, var(--color-ink), black 55%) color-mix(in oklch, var(--color-ink), black 55%) color-mix(in oklch, var(--color-ink), white 55%)",
          }}
        >
          <h1
            className="cm-title min-w-0 flex-1 truncate text-center font-chrome text-lg font-bold lg:text-3xl"
            style={{ color: "var(--color-chrome)" }}
          >
            {title}
          </h1>
        </div>
        <Sub>{sub}</Sub>
        {children}
      </header>
    );
  }

  return (
    <header>
      {/* `cm-titlebar` carries the bevel and a plate moves only its two colours; a team's bar is the
          competition bar's size, with no crest, which is the league's mark. */}
      <div
        className="cm-titlebar flex min-h-11 items-center gap-2 px-2 py-1 lg:min-h-24"
        style={plate ? { background: plate.background } : undefined}
      >
        {/* Wraps rather than clips: a fantasy team's name is printed whole. */}
        <h1
          className="cm-title min-w-0 flex-1 text-balance text-center font-chrome text-lg font-bold uppercase lg:text-3xl"
          style={plate ? { color: plate.ink } : undefined}
        >
          {title}
        </h1>
      </div>
      <Sub>{sub}</Sub>
      {children}
    </header>
  );
}

/** The line under the title bar, on the surface so nothing prints on the bare photograph (`groundfit`).
 *  A surface, not a grey plate: callers bring their own ink, and the live red is 1.39:1 on the plate.
 *  `h-6` is `HEAD_PLATE`'s height. */
function Sub({ children }: { children?: ReactNode }) {
  if (children === undefined || children === null || children === false) return null;
  return (
    <p className="numeric flex h-6 items-center border border-line bg-surface px-2 text-2xs font-bold text-muted">
      {children}
    </p>
  );
}
