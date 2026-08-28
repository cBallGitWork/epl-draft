"use client";

import { useState, type ReactNode } from "react";

// A number that just moved, said so briefly.
//
// The page is server-rendered and `AutoRefresh` asks for a fresh render every
// thirty seconds, so a score on a phone left open on the sofa simply swaps one
// digit for another with nothing to catch the eye. PRODUCT.md's accessibility
// clause names this as the one place motion carries meaning — something
// changed — and requires a reduced-motion path that still communicates it.
//
// **It works because a refresh is not a remount.** `router.refresh()` re-fetches
// the server payload and React reconciles it into the existing tree; client
// components keep their state, so the value we last saw survives and the new one
// arrives as a prop on the same instance. That holds only while the element
// keeps its position and key across renders — so anything mapping these over a
// list must key by something stable (a team id), never by an index or a score.
//
// The memory is state adjusted during render rather than a ref, which is React's
// own pattern for "something changed since last time" and the one the compiler
// will allow: a ref read during render is a value React does not know it must
// re-render for.
//
// It renders a `<span>` and takes its children already formatted, so the figure
// itself stays a server component and this boundary costs one element.

export default function Changed({
  /** What to watch. A primitive, because the comparison is `!==` — handing this
   *  an object would fire on every render and mean nothing. */
  value,
  children,
}: {
  value: string | number | null;
  children: ReactNode;
}) {
  const [seen, setSeen] = useState(value);
  const [moved, setMoved] = useState(false);

  if (seen !== value) {
    setSeen(value);
    setMoved(true);
  }

  return (
    // Keyed on the value so a second change lands while the first is still
    // running: without the key React keeps the node, `setMoved(true)` bails out
    // as a no-op against the state it already holds, and the animation never
    // restarts. Cleared by the animation itself rather than a timer, so the two
    // cannot drift apart.
    <span
      key={String(value)}
      className={moved ? "value-changed" : undefined}
      onAnimationEnd={() => setMoved(false)}
    >
      {children}
    </span>
  );
}
