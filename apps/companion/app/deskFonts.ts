import localFont from "next/font/local";

// Google Fonts' own latin and latin-ext files, committed (OFL) so a build never asks Google. Each
// `*Ext` face leads its stack in tokens.css/paper.css; its unicode-range (a literal: next/font reads
// no other) keeps it unfetched until a ć or an š. The Arial fallbacks are in fonts/fallbacks.css.

// Oxanium is the chrome (Handel Gothic's role in CM); 800 is `.cm-index`'s alone.
const oxanium = localFont({
  src: "./fonts/oxanium/latin.woff2",
  weight: "400 800",
  variable: "--font-oxanium",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["Oxanium Fallback"],
});
const oxaniumExt = localFont({
  src: "./fonts/oxanium/latin-ext.woff2",
  weight: "400 800",
  variable: "--font-oxanium-ext",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
});

// Jost is text and names (Eras Demi's role).
const jost = localFont({
  src: "./fonts/jost/latin.woff2",
  weight: "400 700",
  variable: "--font-jost",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["Jost Fallback"],
});
const jostExt = localFont({
  src: "./fonts/jost/latin-ext.woff2",
  weight: "400 700",
  variable: "--font-jost-ext",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
});

// Archivo Narrow sets every figure in both registers, with `tnum`.
const archivoNarrow = localFont({
  src: "./fonts/archivo-narrow/latin.woff2",
  weight: "600 700",
  variable: "--font-archivo-narrow",
  display: "swap",
  adjustFontFallback: false,
  fallback: ["Archivo Narrow Fallback"],
});
const archivoNarrowExt = localFont({
  src: "./fonts/archivo-narrow/latin-ext.woff2",
  weight: "600 700",
  variable: "--font-archivo-narrow-ext",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF" }],
});

/** Every desk face's variable, for the root layout's <html>. */
export const deskFontVariables = [oxanium, oxaniumExt, jost, jostExt, archivoNarrow, archivoNarrowExt]
  .map((face) => face.variable)
  .join(" ");
