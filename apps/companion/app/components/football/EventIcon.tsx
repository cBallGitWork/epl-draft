// A glyph for the seven events that change a match.
//
// **The app's first icons, and they are a register decision rather than a
// decoration** (Craig, 10 Sep 2026: *"maybe we add icons too where
// appropiate"*). DESIGN §2 has a rule for them now; this is the implementation
// and the rule is worth restating where it is used:
//
// **Inline monochrome SVG, never emoji.** An emoji carries its own colour and
// its own house style — Apple's football is a different object from Google's —
// so a screen built on a palette where every colour is a slot would be handing
// that palette to the reader's operating system. These take `currentColor`, so
// an icon in a `text-bad` row is red because the ROW is, and the seven tones the
// report already assigns keep meaning exactly what they meant.
//
// **They stand beside the word, not instead of it.** `LOUD` gives each of these
// a word already, and a glyph alone is a rebus — CM never drew one and a reader
// who does not know the icon has nothing to fall back on. `aria-hidden`, because
// the word beside it is the accessible name and two would be a screen reader
// saying "goal goal".
//
// Sized in `em` so a glyph matches whatever type it sits in without a second
// scale to keep in step.

/** Opta's own type strings → a glyph. A type absent from this table draws
 *  nothing, which is most of them: a report is mostly corners and blocked
 *  shots, and the seven that change a match are the seven worth marking. */
export type EventGlyph = "ball" | "card" | "swap" | "var";

const GLYPHS: Record<string, EventGlyph> = {
  goal: "ball",
  "penalty goal": "ball",
  "own goal": "ball",
  "VAR cancelled goal": "var",
  "yellow card": "card",
  "red card": "card",
  substitution: "swap",
};

export function glyphFor(type: string): EventGlyph | undefined {
  return GLYPHS[type];
}

export default function EventIcon({ glyph }: { glyph: EventGlyph }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      focusable="false"
      className="size-[1.1em] shrink-0 self-center"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {glyph === "ball" ? (
        <>
          <circle cx="8" cy="8" r="6" />
          {/* The panel, which is what makes a circle read as a football rather
              than as a bullet. */}
          <path d="M8 4.6 5.3 6.6l1 3.2h3.4l1-3.2Z" />
        </>
      ) : glyph === "card" ? (
        // A card is a rectangle standing up, drawn FILLED — a booking is a solid
        // object in the referee's hand and an outline reads as a form field.
        <rect x="4.5" y="2.5" width="7" height="11" rx="1" fill="currentColor" stroke="none" />
      ) : glyph === "swap" ? (
        <>
          {/* Two arrows passing, which is the one universal drawing of a
              substitution — the man arriving above the man leaving. */}
          <path d="M2.5 5.5h8m0 0L8 3m2.5 2.5L8 8" />
          <path d="M13.5 10.5h-8m0 0L8 8m-2.5 2.5L8 13" />
        </>
      ) : (
        <>
          {/* A screen, for the decision taken at one. */}
          <rect x="2" y="3.5" width="12" height="9" rx="1" />
          <path d="M6.5 12.5h3" />
        </>
      )}
    </svg>
  );
}
