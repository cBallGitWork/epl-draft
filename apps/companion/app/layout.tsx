import type { Metadata, Viewport } from "next";
import { Archivo, Archivo_Narrow, Jost, Oxanium } from "next/font/google";
import { LEAGUE_NAME, POLL } from "@epl/core";
import { footballNow, groundFaces, offerLive, pollSeconds } from "./football";
import { Suspense } from "react";
import AutoRefresh from "./components/shell/AutoRefresh";
import LiveCount from "./components/shell/LiveCount";
import LiveNow from "./components/shell/LiveNow";
import PhotoGround from "./components/football/PhotoGround";
import Rail from "./components/shell/Rail";
import { liveTie } from "./components/shell/liveTie";
import "./globals.css";

// **Championship Manager had two faces and so does the desk now** (Craig, 31
// Aug). The game set its top header and menu bars in Handel Gothic — geometric,
// wide, 1970s-futuristic — and its player names and data in Eras Demi, a
// humanist geometric. Both are licensed and neither is free, so these are the
// nearest faces that are:
//
// · **Oxanium** for chrome — title bars, tab strips, the rail, column heads.
//   Squarish geometric with 200–800 weights, which is what Handel Gothic's
//   descendants in game interfaces look like, and it holds up in capitals at
//   nine pixels where Michroma (closer in shape) is far too wide for a 64px
//   rail label.
// · **Jost** for text and names — Futura-lineage geometric humanist, in Eras's
//   role. It is not an Eras clone; what it shares is the register.
//
// Archivo stays, and only the PAPER uses it: DESIGN §6 gives it the letterspaced
// small capitals a newspaper sets its standing heads in, and a serif at nine
// pixels with 0.16em of tracking is a smudge. It no longer dresses the desk,
// which is the whole point — a neutral grotesque is what a screen looks like
// when nobody chose a typeface.
//
// Archivo Narrow keeps every figure in both registers, untouched. That is not
// deference to the old pairing: `tnum` tabular numerals are why a score does not
// jitter as it ticks, and DESIGN §6 calls it the single most important
// typographic decision in a live view.
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const oxanium = Oxanium({
  subsets: ["latin"],
  variable: "--font-oxanium",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
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

  // **Started, not awaited.** Two pieces of chrome draw the same live tie — the
  // red strip on the desk and the score under the Live plate on the phone — and
  // the shell renders above every page in the app, so awaiting Fantrax here
  // would hold up the football, the paper and the pool alike. One promise, two
  // consumers, each behind its own boundary: one read rather than two, and
  // neither of them blocking.
  const tie = liveTie();

  return (
    <html lang="en-GB" className={`${archivo.variable} ${archivoNarrow.variable} ${oxanium.variable} ${jost.variable}`}>
      {/* A row, not a stack: Championship Manager's screen is a rail down the
          side and everything else beside it. `min-w-0` on the content column is
          not optional — it is full of `truncate` and `overflow-x-auto` children,
          and a flex item's default `min-width: auto` lets every one of them push
          the column wider than the screen. */}
      <body className="flex min-h-dvh antialiased">
        {/* Championship Manager drew every screen over a darkened match
            photograph. It was on one route until now and belongs on all of them,
            because it is the ground and not a decoration on one page. It stands
            down on the paper, which is ink on stock.

            `sweep` cannot check what it does to contrast — it is `fixed` at
            `-z-10`, an ancestor of nothing, so sweep composites straight past
            it and calls every route clean whatever is behind it. What holds
            instead is the rule the component's constants rest on, which is CM's
            own: nothing prints text on the bare ground, so the photograph is
            only ever seen between the plates. `tools/ui/groundfit.mjs` measures
            that on all eight desk routes. */}
        <PhotoGround faces={await groundFaces()} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[60] focus:bg-raised focus:px-3 focus:py-2 focus:text-sm"
        >
          Skip to content
        </a>
        <Rail
          matchday={matchday}
          live={
            <Suspense fallback={null}>
              <LiveCount tie={tie} />
            </Suspense>
          }
        />
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
            <LiveNow tie={tie} />
          </Suspense>
          {/* The bottom padding is room and nothing else now. It used to be the
              tab bar's own height plus the phone's safe area, because the bar
              was fixed across the foot of the screen; the rail holds the side
              instead and the foot is free. The front page runs its stock out
              through it, which is why it is a token rather than a `pb-`. */}
          <main
            id="main"
            className="mx-auto w-full max-w-[var(--page-frame)] px-[var(--page-gutter)] pb-[var(--page-foot)] pt-[var(--page-top)]"
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
