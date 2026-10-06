"use client";

import { useState, type ReactNode } from "react";

// Flashes a figure that just changed. `router.refresh()` reconciles rather than remounts, so the last value survives;
// a list of these must key by something stable (a team id), never an index or a score.
// The memory is state set during render, not a ref, which the React compiler would reject.

export default function Changed({
  /** Compared with `!==`, so a primitive: an object would fire on every render. */
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
    // Keyed on the value, or a second change mid-animation is a no-op `setMoved(true)` and never restarts it.
    // The animation clears itself, so no timer can drift from it.
    <span
      key={String(value)}
      className={moved ? "value-changed" : undefined}
      onAnimationEnd={() => setMoved(false)}
    >
      {children}
    </span>
  );
}
