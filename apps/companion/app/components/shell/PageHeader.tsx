import type { ReactNode } from "react";

// How a section opens: the title bar, and at most a line or two under it.
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
//
// **One bar shape, and the third one is gone** (5 Sep 2026). This file drew three:
// a 64px cream competition plate, a 64px club plate, and — for any subject with
// no colour of its own — a bare ~30px strip with the league crest in it and the
// title at `text-sm`. So `/players`, `/fpl`, `/squad` and `/prem/player/[code]`
// opened on a different OBJECT from every other screen in the app, and
// `groundfit` counted the directory printing on the bare photograph underneath
// it. The argument that retired it is `25.jpg`'s, already made below for the
// plated bar: a screen's SUBJECT is the biggest thing on it whatever the subject
// is, and a club does not get a smaller bar than the division it plays in. The
// crest went with it for the reason recorded there — it is the LEAGUE's mark, and
// on the FPL tab or a Premier League footballer's page it says the wrong thing.

export default function PageHeader({
  title,
  sub,
  competition = false,
  plate,
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
  /** The plate this bar is drawn on, when the subject has a colour of its own —
   *  a fantasy team does, and nothing else here yet. Absent leaves the chrome
   *  blue, which is the bar every other screen opens with, at the same size.
   *
   *  **Not a third treatment, an override on the club/person one.** The bar is
   *  already the shape Championship Manager draws a club with (`cm9900/25.jpg`);
   *  what a team's colour changes is the plate, not the design. `21.jpg` is the
   *  argument for allowing it at all — the game colours a side's header in that
   *  side's own colours, and a fantasy team is the object this app has that a
   *  club is there.
   *
   *  Inline rather than a token, because a Tailwind v4 theme variable is dropped
   *  unless its name appears literally in scanned source and there is no literal
   *  name for a colour picked per team at runtime. `clubColours` reaches its call
   *  sites the same way.
   *
   *  Absent leaves the chrome blue every other screen opens with. */
  plate?: { background: string; ink: string };
  children?: React.ReactNode;
}) {
  if (competition) {
    return (
      <header>
        {/* The same bevel mechanism with the plate turned over — the light and
            dark edges mixed off `--color-ink` instead of off the chrome. */}
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
      {/* `cm-titlebar` still carries the bevel; the plate moves the two colours.
          Left alone when no plate is given, so every screen that does not have a
          subject with a colour is untouched.

          **A plated bar is drawn at the competition bar's size, and without the
          crest** (Craig, 2 Sep: "team title needs to match the league title in
          size/font etc, logo bye bye"). The reference agrees and says why:
          `cm9900/24.jpg` heads the league and `25.jpg` heads Everton, and the
          two bars are the same object at the same scale — the title is the
          SUBJECT of the screen either way, and a club does not get a smaller
          bar than the division it plays in. The crest goes because it is the
          LEAGUE's mark: on a team's own screen it says the wrong thing, and CM
          puts nothing but the name in that bar. */}
      <div
        className="cm-titlebar flex min-h-11 items-center gap-2 px-2 py-1 lg:min-h-24"
        style={plate ? { background: plate.background } : undefined}
      >
        <h1
          className="cm-title min-w-0 flex-1 truncate text-center font-chrome text-lg font-bold uppercase lg:text-3xl"
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

/** The line under the title bar: a league's name, a gameweek, a manager.
 *
 *  **On a plate, because nothing prints on the bare ground** (DESIGN §2, and the
 *  one rule `tools/ui/groundfit.mjs` exists to measure). It was a bare `<p>` on
 *  the photograph, and it was FOUR of the six findings that instrument had open
 *  on 5 Sep 2026 — the schedule's league name, the head-to-head's gameweek and
 *  the number beside it, and the FPL tab's manager. One `<p>`, four routes,
 *  every one of them a line a reader is meant to read against a bright patch of
 *  a crowd photograph.
 *
 *  **And it was written out TWICE in this file**, once per header variant, which
 *  is how the first fix cleared three routes and left the fourth exactly as it
 *  was. That is the whole argument for it being a component rather than a
 *  string: two copies of a `<p>` in one file agreed for months and then did not.
 *
 *  **A SURFACE and not a plate, and `sweep` is why.** The first fix made it a
 *  `cm-bevel`, and a plate owns its ink: `/league/matchups` passes `RoundWord`
 *  into this slot, which brings `--color-live` with it, and that is 1.39:1 on
 *  light grey. One AA failure across the whole app, at both widths, from making
 *  chrome out of something every caller treats as content — a gameweek, a league
 *  name, a manager, a live round word. `--color-surface` is the ground every
 *  ratio in DESIGN §3 was measured against, so a caller's ink keeps the contrast
 *  it was checked at and the line is still not on the photograph.
 *
 *  `h-6` is `HEAD_PLATE`'s height, so this strip and the caption plates further
 *  down a page agree. */
function Sub({ children }: { children?: ReactNode }) {
  if (children === undefined || children === null || children === false) return null;
  return (
    <p className="numeric flex h-6 items-center border border-line bg-surface px-2 text-2xs font-bold text-muted">
      {children}
    </p>
  );
}
