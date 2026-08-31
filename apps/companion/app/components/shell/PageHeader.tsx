import LeagueCrest from "./LeagueCrest";

// How a section opens: the crest, the title, and at most a line or two under it.
// Five screens had grown their own copy of this header by the time /matchup
// added a sixth, which is well past the rule of 2/3 — and the copies were
// already drifting (`truncate` on one h1 and not the others). The matchday
// screen keeps its own header on purpose: baseline-aligned with a live badge on
// the right, it is a different design, not a seventh copy of this one.
//
// **A CM title bar, because every one of its consumers is the Desk.** The paper
// has its own masthead and never reaches this file, so the royal-blue bar with
// the bold white title on it — the thing every Championship Manager screen opens
// with — can be the shared shape rather than one screen's special case.
//
// The `sub` line sits UNDER the bar rather than inside it. CM's title bars carry
// a title and nothing else, and a count or a date set in the bar would make the
// bar the place where content lives.

export default function PageHeader({
  title,
  sub,
  competition = false,
  children,
}: {
  title: string;
  /** The line under the title — a count, a period, a date. Styled here because
   *  three pages had written the identical classes on it (§1). */
  sub?: React.ReactNode;
  /** Draw it the way Championship Manager draws a COMPETITION rather than a club
   *  or a person: a light plate with the title in blue, centred, and no crest.
   *
   *  The game has two title bars and we had drawn one. `cm9900/12.jpg`, `13.jpg`
   *  and `25.jpg` are a club or a player — royal blue, white title. `24.jpg` is
   *  "English Premier Division" — a light plate with the title in blue. Which bar
   *  you get says what KIND of thing the screen is about, and the league table is
   *  the one screen here that is about the competition itself rather than about
   *  somebody in it. No crest, because a competition is not a club.
   *
   *  The pair is `--color-chrome` on `--color-ink`, which is the blue plate's own
   *  ink and ground swapped: 7.0:1 either way round, because contrast is a
   *  property of the pair and not of which one is behind. */
  competition?: boolean;
  children?: React.ReactNode;
}) {
  if (competition) {
    return (
      <header>
        {/* The same bevel mechanism with the plate turned over — the light and
            dark edges mixed off `--color-ink` instead of off the chrome. */}
        <div
          className="flex items-center gap-2 border-2 px-2 py-1"
          style={{
            background: "var(--color-ink)",
            borderColor:
              "color-mix(in oklch, var(--color-ink), white 55%) color-mix(in oklch, var(--color-ink), black 55%) color-mix(in oklch, var(--color-ink), black 55%) color-mix(in oklch, var(--color-ink), white 55%)",
          }}
        >
          <h1
            className="min-w-0 flex-1 truncate text-center font-display text-base font-bold"
            style={{ color: "var(--color-chrome)" }}
          >
            {title}
          </h1>
        </div>
        {sub ? <p className="numeric px-2 pt-1 text-2xs text-faint">{sub}</p> : null}
        {children}
      </header>
    );
  }

  return (
    <header>
      <div className="cm-titlebar flex items-center gap-2 px-2 py-1">
        <LeagueCrest height={18} />
        <h1 className="min-w-0 flex-1 truncate text-sm font-bold uppercase text-ink">
          {title}
        </h1>
      </div>
      {sub ? <p className="numeric px-2 pt-1 text-2xs text-faint">{sub}</p> : null}
      {children}
    </header>
  );
}
