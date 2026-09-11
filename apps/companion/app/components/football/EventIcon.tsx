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

/** Opta's own type strings → a glyph.
 *
 *  **Every type in the vocabulary has one now** (Craig, 11 Sep 2026: *"maybe we
 *  have symbols for all rows"*). It used to name the seven that change a match
 *  and leave the rest blank, on the argument that a report is mostly corners and
 *  blocked shots. That was true when the rest were also set three sizes smaller
 *  in grey; with every row at one size, a blank column is a ragged left edge
 *  rather than a restraint, and the glyph is the thing that now says at a glance
 *  which rows are the match and which are the play between.
 *
 *  **The sentence carries the detail, so the glyph need not.** `post` takes the
 *  same mark as `miss` because both are an attempt that stayed out and Opta's
 *  own line says which; `whistle` covers all six period marks.
 *
 *  **Two or three shapes each, and no more.** These render at about 14px on a
 *  phone. A drawn glove and a drawn whistle were the first attempt at `save` and
 *  the period marks and both were a smudge on the screen, which is the kind of
 *  thing only a screenshot tells you. A type this map
 *  does not name takes `note`, so no row is ever left without one. */
export type EventGlyph =
  | "ball"
  | "card"
  | "swap"
  | "var"
  | "save"
  | "miss"
  | "block"
  | "corner"
  | "whistle"
  | "spot"
  | "note";

const GLYPHS: Record<string, EventGlyph> = {
  goal: "ball",
  "penalty goal": "ball",
  "own goal": "ball",
  "VAR cancelled goal": "var",
  "yellow card": "card",
  "red card": "card",
  substitution: "swap",
  "attempt saved": "save",
  miss: "miss",
  post: "miss",
  "attempt blocked": "block",
  corner: "corner",
  "penalty won": "spot",
  "penalty lost": "spot",
  lineup: "whistle",
  start: "whistle",
  "added time": "whistle",
  "end 1": "whistle",
  "end 2": "whistle",
  "end 14": "whistle",
};

/** The glyph for a type, and `note` for one nothing has named — so a caller can
 *  mark every row without testing for undefined. */
export function glyphFor(type: string): EventGlyph {
  return GLYPHS[type] ?? "note";
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
      ) : glyph === "var" ? (
        <>
          {/* A screen, for the decision taken at one. */}
          <rect x="2" y="3.5" width="12" height="9" rx="1" />
          <path d="M6.5 12.5h3" />
        </>
      ) : glyph === "save" ? (
        <>
          {/* The ball stopped dead against a flat hand. Two shapes, because a
              drawn glove is mush at the size this actually renders — these
              glyphs are about 14px on a phone and every one of them has to
              survive that. */}
          <circle cx="5.5" cy="8" r="3" />
          <path d="M11 3.5v9" />
        </>
      ) : glyph === "miss" ? (
        <>
          {/* The ball going away, for a shot that stayed out — a miss or the
              woodwork. The goal frame was in this drawing until it was looked at
              on a phone: three shapes in 16px is a smudge. */}
          <circle cx="5" cy="11" r="2.5" />
          <path d="M9 7.5 13.5 3m0 0H9.7m3.8 0v3.8" />
        </>
      ) : glyph === "block" ? (
        // A shield, for the body that got in the way.
        <path d="M8 2.5 13 4.4v4.1c0 2.4-2 4-5 5-3-1-5-2.6-5-5V4.4Z" />
      ) : glyph === "corner" ? (
        <>
          {/* A corner flag: the pole with the pennant at its top. */}
          <path d="M4.5 13.5V2.5" />
          <path d="M4.5 3 11 5.2 4.5 7.4" />
        </>
      ) : glyph === "spot" ? (
        <>
          {/* The penalty spot inside its arc — the mark itself, for the award
              rather than the kick. */}
          <path d="M2.5 3.5h11v5a5.5 5.5 0 0 1-11 0Z" />
          <circle cx="8" cy="7" r="1.2" fill="currentColor" stroke="none" />
        </>
      ) : glyph === "whistle" ? (
        <>
          {/* A clock, for every mark that opens or closes a period — which is
              what all six of them are about. A drawn whistle was the first
              attempt and is unreadable below about 20px. */}
          <circle cx="8" cy="8" r="5.5" />
          <path d="M8 4.8V8l2.2 2.2" />
        </>
      ) : (
        // The unremarkable row: a mark that says "this is a line of the report"
        // and nothing more. Never blank, so no row has a ragged left edge.
        <circle cx="8" cy="8" r="2" fill="currentColor" stroke="none" />
      )}
    </svg>
  );
}
