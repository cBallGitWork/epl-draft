import type { CSSProperties, ReactNode } from "react";
import LeagueCrest from "../shell/LeagueCrest";
import PitchTurf, { FAR_INSET } from "./PitchTurf";

// The ground itself: hoardings, goal, grass — and whatever is standing on it.
//
// One frame for both pitches. The matchday XI and the squad board are the same
// place seen on two different days, and two pitches that framed themselves
// differently would read as two apps.

export default function PitchFrame({ children }: { children: ReactNode }) {
  return (
    // Out through the page's own gutters. The pitch is the widest thing in the
    // app and the only one that gains from every pixel: the alternative is
    // narrower stickers, and a narrower sticker is an unreadable name.
    // The taper's own figure, handed to the stylesheet: the hoardings stand
    // behind the far goal line and the row padding keeps a line inside the
    // touchlines, and both are that one number. Written out in the CSS it was
    // two numbers that had to agree, with a comment where the agreement should
    // have been.
    <div className="pitch pitch-framed bleed" style={{ "--pitch-inset": `${FAR_INSET}%` } as CSSProperties}>
      <div className="pitch-boards">
        {/* The league's own boards. A sponsor's would go here, in the same two
            slots, the day the league has one. */}
        <LeagueCrest variant="full" height={17} />
        <LeagueCrest variant="full" height={17} />
      </div>
      <span className="pitch-goal" aria-hidden />
      <PitchTurf />

      {/* Above the ground, and clear of the hoardings by their own height. The
          gap is what makes a shape legible as a shape — four lines packed tight
          read as one crowd — but it was set when the pitch carried all fifteen
          and nothing sat under it. An eleven with a bench beneath has a row
          fewer and a strip more, and the old spacing put that strip under the
          tab bar that used to run across the foot of a phone. */}
      {/* The side padding is the taper's own inset, not a fixed one and not a
          number of its own: the grass is narrowest at the far goal line, so a
          column padded by exactly that much stands every row inside the
          touchlines — including the back five, which used to be drawn off the
          pitch and onto the page. */}
      <div className="relative z-base flex flex-col gap-4 px-[var(--pitch-inset)] pb-3 pt-[var(--pitch-boards)]">
        {children}
      </div>
    </div>
  );
}
