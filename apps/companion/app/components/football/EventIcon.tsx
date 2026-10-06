// A monochrome glyph per commentary row, in `currentColor` and never emoji, beside the word and never instead of it.

/** Two or three shapes each, as they render at about 14px on a phone. `cross` is not in `GLYPHS`: an
 *  injury is a substitution, so the caller picks it with core's `saysInjury` (see `Commentary`). */
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
  | "cross"
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

/** The glyph for an Opta type, or `note` for one `GLYPHS` does not name. */
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
          {/* The panel, so the circle reads as a football. */}
          <path d="M8 4.6 5.3 6.6l1 3.2h3.4l1-3.2Z" />
        </>
      ) : glyph === "card" ? (
        // A card, filled: an outline reads as a form field.
        <rect x="4.5" y="2.5" width="7" height="11" rx="1" fill="currentColor" stroke="none" />
      ) : glyph === "swap" ? (
        <>
          {/* Two arrows passing: the man arriving above the man leaving. */}
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
          {/* The ball stopped dead against a flat hand. */}
          <circle cx="5.5" cy="8" r="3" />
          <path d="M11 3.5v9" />
        </>
      ) : glyph === "miss" ? (
        <>
          {/* The ball going away: a miss or the woodwork. */}
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
          {/* The penalty spot inside its arc, for the award rather than the kick. */}
          <path d="M2.5 3.5h11v5a5.5 5.5 0 0 1-11 0Z" />
          <circle cx="8" cy="7" r="1.2" fill="currentColor" stroke="none" />
        </>
      ) : glyph === "cross" ? (
        <>
          {/* A medical cross, for a change forced rather than chosen. */}
          <path d="M6.2 3h3.6v3.2H13v3.6H9.8V13H6.2V9.8H3V6.2h3.2Z" fill="currentColor" stroke="none" />
        </>
      ) : glyph === "whistle" ? (
        <>
          {/* A clock, for every mark that opens or closes a period. */}
          <circle cx="8" cy="8" r="5.5" />
          <path d="M8 4.8V8l2.2 2.2" />
        </>
      ) : (
        // Every other row: a dot, so none is left blank.
        <circle cx="8" cy="8" r="2" fill="currentColor" stroke="none" />
      )}
    </svg>
  );
}
