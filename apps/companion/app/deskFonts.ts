import { Archivo, Archivo_Narrow, Jost, Oxanium } from "next/font/google";

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
export const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// **800 is the blue index block's text and nothing else** (Craig, 7 Sep 2026:
// *"the text in the blue box"* — bolder, larger, with a slight shadow). 700 was
// the ceiling here and every one of those twenty sites was already at it, so
// "bolder" had nowhere to go without another file. One more weight is the cost,
// and `.cm-index` in `desk.css` is its only consumer: the league placing is the
// mark a reader counts a table down by, and `cm9900/24.jpg` sets it heavier than
// the club names beside it. Everything else on the desk stays at 700.
export const oxanium = Oxanium({
  subsets: ["latin"],
  variable: "--font-oxanium",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const archivoNarrow = Archivo_Narrow({
  subsets: ["latin"],
  variable: "--font-archivo-narrow",
  weight: ["600", "700"],
  display: "swap",
});
