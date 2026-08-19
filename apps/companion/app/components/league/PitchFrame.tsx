import type { ReactNode } from "react";
import LeagueCrest from "../shell/LeagueCrest";
import PitchTurf from "./PitchTurf";

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
    <div className="pitch -mx-3 sm:-mx-4">
      <div className="pitch-boards">
        {/* The league's own boards. A sponsor's would go here, in the same two
            slots, the day the league has one. */}
        <LeagueCrest variant="full" height={17} />
        <LeagueCrest variant="full" height={17} />
      </div>
      <span className="pitch-goal" aria-hidden />
      <PitchTurf />

      {/* Above the ground, and clear of the hoardings by their own height. */}
      <div className="relative z-base flex flex-col gap-1.5 px-1 pb-2 pt-[calc(var(--pitch-boards)+0.25rem)]">
        {children}
      </div>
    </div>
  );
}
