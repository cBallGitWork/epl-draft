import type { Metadata, Viewport } from "next";
import { Archivo, Archivo_Narrow } from "next/font/google";
import { LEAGUE_NAME } from "@epl/core";
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
  // sRGB of `--color-bg` in globals.css. Repeated as a literal because this is
  // serialised into a <meta> tag at build time and cannot read a CSS variable —
  // the same constraint as `revalidate`. Change both together.
  themeColor: "#0f0810",
  // The reference device is a phone held one-handed; lock out the accidental
  // double-tap zoom without disabling deliberate pinch-zoom.
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${archivo.variable} ${archivoNarrow.variable}`}>
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[60] focus:rounded focus:bg-raised focus:px-3 focus:py-2 focus:text-sm"
        >
          Skip to content
        </a>
        <main id="main" className="mx-auto w-full max-w-2xl px-3 pb-24 pt-3 sm:px-4">
          {children}
        </main>
      </body>
    </html>
  );
}
