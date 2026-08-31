import type { Metadata, Viewport } from "next";
import { Archivo, Archivo_Narrow } from "next/font/google";
import { LEAGUE_NAME, POLL } from "@epl/core";
import { footballNow, offerLive, pollSeconds } from "./football";
import { Suspense } from "react";
import AutoRefresh from "./components/shell/AutoRefresh";
import LiveNow from "./components/shell/LiveNow";
import Rail from "./components/shell/Rail";
import "./globals.css";

// One superfamily across two widths: Archivo carries the UI, Archivo Narrow the
// scores and numerals. Width is the contrast axis — pairing two unrelated
// grotesques reads as an accident rather than a decision.
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const archivoNarrow = Archivo_Narrow({
  subsets: ["latin"],
  variable: "--font-archivo-narrow",
  weight: ["600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: LEAGUE_NAME,
  description: `Live scores, head-to-head and the week's news for the ${LEAGUE_NAME}.`,
};

export const viewport: Viewport = {
  // sRGB of `--color-bg` in tokens.css. Repeated as a literal because this is
  // serialised into a <meta> tag at build time and cannot read a CSS variable —
  // the same constraint as `revalidate`. Change both together. The front page
  // overrides it, being the one surface that is not the desk.
  themeColor: "#091227",
  // The reference device is a phone held one-handed; lock out the accidental
  // double-tap zoom without disabling deliberate pinch-zoom.
  width: "device-width",
  initialScale: 1,
};

/** The round, for the two things the shell decides from it: whether to offer the
 *  Live section, and how often to ask the server for a fresh render.
 *
 *  The first question is `offerLive`'s, in `football.ts`, because the paper asks
 *  it too and a fail-open policy written down twice is a policy that will only
 *  be corrected once. The poll falls back to the idle rate on the same reasoning
 *  the rail is offered on: polling hard against a provider that just failed is
 *  how a wobble becomes an outage. */
async function round(): Promise<{ matchday: boolean; seconds: number }> {
  const matchday = await offerLive();
  try {
    return { matchday, seconds: pollSeconds(await footballNow()) };
  } catch {
    return { matchday, seconds: POLL.idle };
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { matchday, seconds } = await round();

  return (
    <html lang="en-GB" className={`${archivo.variable} ${archivoNarrow.variable}`}>
      {/* A row, not a stack: Championship Manager's screen is a rail down the
          side and everything else beside it. `min-w-0` on the content column is
          not optional — it is full of `truncate` and `overflow-x-auto` children,
          and a flex item's default `min-width: auto` lets every one of them push
          the column wider than the screen. */}
      <body className="flex min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[60] focus: focus:bg-raised focus:px-3 focus:py-2 focus:text-sm"
        >
          Skip to content
        </a>
        <Rail matchday={matchday} />
        <div className="flex min-w-0 flex-1 flex-col">
          {/* One poller for the whole app. It was eight, each reading the
              interval off whatever snapshot its own page happened to hold — so a
              page with no live read of its own simply froze, and
              `/league/schedule` polled at the live rate on a condition none of
              the others used. The shell knows the round; the pages know their
              subject.

              The rate is `pollSeconds`, which asks whether the ROUND is under
              way and never whether a ball is in the air. That distinction cost
              the Live tab a whole afternoon once: `isMatchdayLive` goes false in
              every gap between kickoffs, so the page dropped to the idle 300s
              while the boards beside it stayed on 30s — and between kickoffs is
              exactly when a score is most likely to have moved since you
              looked. */}
          <AutoRefresh seconds={seconds} />
          {/* Inside the content column, not beside the rail: the strip is the
              shell speaking to the page, and a full-bleed bar that started under
              the rail would be a bar with a navy bite out of its left end.

              Behind a boundary because it is the only thing in the shell that
              asks Fantrax anything, and the shell renders above every page in
              the app: un-suspended, a slow league read would hold up the
              football, the paper and the pool alike. `null` while it waits,
              because a strip that flickers in as a grey bar and out again is
              worse than one that arrives a beat late. */}
          <Suspense fallback={null}>
            <LiveNow />
          </Suspense>
          {/* The bottom padding is room and nothing else now. It used to be the
              tab bar's own height plus the phone's safe area, because the bar
              was fixed across the foot of the screen; the rail holds the side
              instead and the foot is free. The front page runs its stock out
              through it, which is why it is a token rather than a `pb-`. */}
          <main
            id="main"
            className="mx-auto w-full max-w-[var(--page-frame)] px-[var(--page-gutter)] pb-[var(--page-foot)] pt-3"
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
