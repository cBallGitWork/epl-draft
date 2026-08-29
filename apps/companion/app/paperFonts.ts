import { Fraunces, Newsreader } from "next/font/google";

// The two faces the paper is set in, and nothing else in the app loads them.
//
// `app/layout.tsx` carries Archivo and Archivo Narrow because every screen needs
// them — the narrow one sets every figure in both registers, which is the spine
// the two halves of this site share. These two are the Gazetta's alone, so they
// are imported by the paper route rather than by the layout: the five desk tabs
// are a management terminal and must not pay for a newspaper's serifs.
//
// Georgia is the declared fallback and it is not a courtesy. It is a real
// transitional serif on every device that will open this, which is what made it
// the right choice while there was no webfont at all — the same argument the
// portraits make for the crest. `adjustFontFallback` (next/font's default)
// additionally synthesises a metric-matched face, so the swap when the real one
// arrives moves the line breaks and not the layout.

/** Masthead, headlines, drop caps.
 *
 *  `opsz` is asked for by name because next/font ships only the weight axis
 *  otherwise, and Fraunces without it is a text face blown up: the whole point of
 *  a masthead at 4rem and a byline at 0.6rem cut from one family is that the
 *  drawing changes between them. `font-optical-sizing: auto` in `tokens.css` is
 *  what spends it. */
export const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-fraunces",
  display: "swap",
  // Written out rather than shared with the stack below it: next/font is read by
  // the compiler before anything runs, and it rejects a value it cannot see as a
  // literal ("Font loader values must be explicitly written literals").
  fallback: ["Georgia", "Times New Roman", "Liberation Serif", "serif"],
});

/** Body prose and the italic decks under a headline.
 *
 *  Both styles, because the deck is italic by design rather than by emphasis —
 *  a browser asked for italic it does not have will slant the roman, and a
 *  slanted serif is the one thing on a newspaper page that looks like a mistake. */
export const newsreader = Newsreader({
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "Liberation Serif", "serif"],
});
