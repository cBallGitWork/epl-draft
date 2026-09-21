// A short note in the caution ink, saying why something on screen is missing or
// degraded: a roster slot with no footballer behind it, a points table Fantrax
// refused.
//
// **A component and not a `desk.ts` recipe**, on that file's own three-way rule:
// appearance plus layout with NO per-caller variation, at three or more sites,
// is a component. All three wrap one sentence and none varies. It also keeps
// sixteen lines out of a file already 319 over CODE_RULES §4's hard ceiling,
// which §4 forbids a PR from adding to.
//
// Two of the three had already drifted — `PlayerCard` drew the box as
// `border border-line bg-raised` and the live card drew the same sentence as a
// `cm-panel`, which is one object rendered two ways on two cards a reader flips
// between.
//
// **`text-mid` on PROSE, and the only place in the app that does it.** DESIGN §3
// gives amber to "a figure standing alone beside a name"; counted 21 Sep 2026,
// the other twenty sites are fifteen figures and five position labels, and not
// one is a sentence.

export default function Note({ children }: { children: React.ReactNode }) {
  return <p className="cm-panel px-3 py-2 text-2xs text-mid">{children}</p>;
}
