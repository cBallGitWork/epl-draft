import type { Metadata, Viewport } from "next";
import { LEAGUE_NAME } from "@epl/core";
import { footballNow, groundFaces, liveIn, offerLive } from "./football";
import { Suspense } from "react";
import AutoRefresh from "./components/shell/AutoRefresh";
import Glyph from "./components/shell/glyphs";
import LiveFigure from "./components/shell/LiveFigure";
import LiveNow from "./components/shell/LiveNow";
import PhotoGround from "./components/football/PhotoGround";
import Rail from "./components/shell/Rail";
import ReplayStrip from "./components/shell/ReplayStrip";
import UnreadBadge from "./components/shell/UnreadBadge";
import { liveTie } from "./components/shell/liveTie";
import { readInbox } from "./news/inbox";
import { deskFontVariables } from "./deskFonts";
import { APP_SHORT_NAME, TOKEN_SRGB } from "./config";
import "./globals.css";

export const metadata: Metadata = {
  title: LEAGUE_NAME,
  description: `Live scores, head-to-head and the week's news for the ${LEAGUE_NAME}.`,
  // An iPhone names a home-screen icon after the page's title, which on `/more` is "More".
  appleWebApp: { title: APP_SHORT_NAME },
};

export const viewport: Viewport = {
  // The front page overrides it, being the one surface that is not the desk.
  themeColor: TOKEN_SRGB.bg,
  // A phone held one-handed: no accidental double-tap zoom, and pinch-zoom still works.
  width: "device-width",
  initialScale: 1,
  // Without it iOS reports every safe-area inset as 0, and the rail sits on the home indicator.
  viewportFit: "cover",
};

/** Whether to offer the Live section, and how far off live football is, which sets the poll rate.
 *  A failed read gives null, the idle rate, so a failing provider is not polled hard. */
async function round(): Promise<{ matchday: boolean; live: number | null }> {
  const matchday = await offerLive();
  try {
    return { matchday, live: await liveIn(await footballNow()) };
  } catch {
    return { matchday, live: null };
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { matchday, live } = await round();

  // Started, not awaited: one read for the desk strip and the Live plate's score, each behind its own
  // boundary, so Fantrax never holds up every page.
  const tie = liveTie();
  // The inbox's ids for the Mail tab's badge, started like the tie; a failed read is no badge.
  const mail = readInbox()
    .then((inbox) => inbox.items.map((item) => item.id))
    .catch(() => []);

  return (
    <html lang="en-GB" className={deskFontVariables}>
      {/* A row: the rail, then the content. `min-w-0` on the content column stops its `truncate` and
          `overflow-x-auto` children pushing it wider than the screen. */}
      <body className="flex min-h-dvh antialiased">
        {/* CM's darkened match photograph under every desk screen. `sweep` cannot see it, so nothing prints
            on the bare ground, and `tools/ui/groundfit.mjs` checks that. */}
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
            <Suspense fallback={<Glyph name="live" />}>
              <LiveFigure tie={tie} />
            </Suspense>
          }
          mail={
            <Suspense fallback={null}>
              <UnreadBadge inbox={mail} />
            </Suspense>
          }
        />
        <div className="flex min-w-0 flex-1 flex-col">
          {/* One poller for the whole app. The server says how far off live football is and the client counts
              down (`cadence.ts`). Live means the round is under way, never only that a ball is in the air. */}
          <AutoRefresh liveIn={live} />
          <ReplayStrip />
          {/* In the content column, so the strip does not start under the rail; suspended so a slow
              league read holds up no page, and drawn as nothing while it waits. */}
          <Suspense fallback={null}>
            <LiveNow tie={tie} />
          </Suspense>
          {/* The bottom padding is a token because the front page runs its stock out through it. */}
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
