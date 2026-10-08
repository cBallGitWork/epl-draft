import localFont from "next/font/local";

// The paper's two serifs and its small capitals, imported only by the paper's layout so the desk never loads them.
// Files and the `*Ext` pattern as in deskFonts.ts; Georgia is the serifs' declared fallback, with no
// metric-matched face, as Google's loader gave them none.

/** Masthead, headlines, drop caps; its `opsz` axis is spent by `font-optical-sizing: auto`. */
const fraunces = localFont({
  src: "./fonts/fraunces/latin.woff2",
  weight: "100 900",
  variable: "--font-fraunces",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["Georgia", "Times New Roman", "Liberation Serif", "serif"],
});
const frauncesExt = localFont({
  src: "./fonts/fraunces/latin-ext.woff2",
  weight: "100 900",
  variable: "--font-fraunces-ext",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
});

/** Body prose, and the italic decks under a headline, which must not be a slanted roman. */
const newsreader = localFont({
  src: [
    { path: "./fonts/newsreader/latin.woff2", style: "normal" },
    { path: "./fonts/newsreader/italic-latin.woff2", style: "italic" },
  ],
  weight: "200 800",
  variable: "--font-newsreader",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["Georgia", "Times New Roman", "Liberation Serif", "serif"],
});
const newsreaderExt = localFont({
  src: [
    { path: "./fonts/newsreader/latin-ext.woff2", style: "normal" },
    { path: "./fonts/newsreader/italic-latin-ext.woff2", style: "italic" },
  ],
  weight: "200 800",
  variable: "--font-newsreader-ext",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
});

/** The letterspaced small capitals of standing heads, kickers, datelines and bylines: `paper.css`'s `font-sans`. */
const archivo = localFont({
  src: "./fonts/archivo/latin.woff2",
  weight: "400 700",
  variable: "--font-archivo",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["Archivo Fallback"],
});
const archivoExt = localFont({
  src: "./fonts/archivo/latin-ext.woff2",
  weight: "400 700",
  variable: "--font-archivo-ext",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
});

/** Every paper face's variable, for the paper layout's frame. */
export const paperFontVariables = [fraunces, frauncesExt, newsreader, newsreaderExt, archivo, archivoExt]
  .map((face) => face.variable)
  .join(" ");
