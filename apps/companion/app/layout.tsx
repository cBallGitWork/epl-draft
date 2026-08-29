import type { Metadata, Viewport } from "next";
import { Archivo, Archivo_Narrow } from "next/font/google";
import { LEAGUE_NAME, POLL, duringGameweek } from "@epl/core";
import { footballNow, pollSeconds } from "./football";
import { Suspense } from "react";
import AutoRefresh from "./components/shell/AutoRefresh";
import LiveNow from "./components/shell/LiveNow";
import TabNav from "./components/shell/TabNav";
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
 *  Matchday tab, and how often to ask the server for a fresh render.
 *
 *  Fails **open** on the tab: if FPL cannot be reached we show it rather than
 *  hide it. Navigation must not lie by omission during the one window it
 *  matters, and the page behind it says honestly that nothing could be read. The
 *  reverse failure — a section silently missing mid-match — is the one nobody
 *  could diagnose from a phone. The poll falls back to the idle rate, because
 *  polling hard against a provider that just failed is how a wobble becomes an
 *  outage. */
async function round(): Promise<{ matchday: boolean; seconds: number }> {
  try {
    const snapshot = await footballNow();
    return {
      matchday: duringGameweek(snapshot, new Date().toISOString()),
      seconds: pollSeconds(snapshot),
    };
  } catch {
    return { matchday: true, seconds: POLL.idle };
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { matchday, seconds } = await round();

  return (
    <html lang="en-GB" className={`${archivo.variable} ${archivoNarrow.variable}`}>
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[60] focus:rounded focus:bg-raised focus:px-3 focus:py-2 focus:text-sm"
        >
          Skip to content
        </a>
        {/* Before <main> so the desktop bar can be sticky at the top in normal
            flow. On a phone it is fixed to the bottom and out of flow, where
            document order costs nothing. */}
        <TabNav matchday={matchday} />
        {/* One poller for the whole app. It was eight, each reading the interval
            off whatever snapshot its own page happened to hold — so a page with
            no live read of its own simply froze, and `/league/schedule` polled at
            the live rate on a condition none of the others used. The shell knows
            the round; the pages know their subject.

            The rate is `pollSeconds`, which asks whether the ROUND is under way
            and never whether a ball is in the air. That distinction cost the
            Live tab a whole afternoon once: `isMatchdayLive` goes false in every
            gap between kickoffs, so the page dropped to the idle 300s while the
            boards beside it stayed on 30s — and between kickoffs is exactly when
            a score is most likely to have moved since you looked. */}
        <AutoRefresh seconds={seconds} />
        {/* Behind a boundary because it is the only thing in the shell that asks
            Fantrax anything, and the shell renders above every page in the app:
            un-suspended, a slow league read would hold up the football, the
            paper and the pool alike. `null` while it waits, because a strip that
            flickers in as a grey bar and out again is worse than one that
            arrives a beat late. */}
        <Suspense fallback={null}>
          <LiveNow />
        </Suspense>
        {/* The bottom padding is the bar's own height plus the phone's safe area,
            rather than a round number chosen to cover both. It was `pb-24`: right
            on a notched iPhone, where the bar is 56px plus a 34px inset, and 39px
            of empty page under everything on any phone without an inset.
            Above `md` the bar is overhead
            instead and the room underneath is just room. */}
        <main id="main" className="mx-auto w-full max-w-[var(--page-frame)] px-[var(--page-gutter)] pb-[var(--page-foot)] pt-3">
          {children}
        </main>
      </body>
    </html>
  );
}
