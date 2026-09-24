"use client";

import { use, useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { MAIL, owns } from "./sections";
import { unreadCount, unreadText } from "./unread";

// Unread mail on the Mail tab, against the ids this device saw on its last visit; the visit is the read.

const SEEN = "mail-seen";
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** The stored ids as their raw string, so the snapshot is stable between renders; null before a first visit. */
function readSeen(): string | null {
  try {
    return localStorage.getItem(SEEN);
  } catch {
    return null;
  }
}

/** The seen ids, or null before a first visit; a value this code cannot read counts as a first visit. */
function parseSeen(raw: string | null): Set<string> | null {
  if (raw === null) return null;
  try {
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return null;
  }
}

function writeSeen(ids: readonly string[]): void {
  try {
    localStorage.setItem(SEEN, JSON.stringify(ids));
  } catch {
    return; // A private window keeps nothing, and the badge stays at nought.
  }
  for (const listener of listeners) listener();
}

/** Takes the layout's un-awaited inbox read, so the rail never waits on it. */
export default function UnreadBadge({ inbox }: { inbox: Promise<readonly string[]> }) {
  const ids = use(inbox);
  const reading = owns([MAIL], usePathname());
  // Undefined on the server and in hydration, so a count already there never pulses on load.
  const stored = useSyncExternalStore(subscribe, readSeen, () => undefined);
  const seenIds = stored === undefined ? undefined : parseSeen(stored);
  const firstVisit = seenIds === null;
  const count = reading || !seenIds ? 0 : unreadCount(ids, seenIds);

  useEffect(() => {
    if (reading || firstVisit) writeSeen(ids);
  }, [ids, reading, firstVisit]);

  const [lastCount, setLastCount] = useState<number | null>(null);
  const [arriving, setArriving] = useState(false);
  if (stored !== undefined && count !== lastCount) {
    setLastCount(count);
    if (lastCount !== null && count > lastCount) setArriving(true);
  }

  if (count === 0) return null;
  return (
    <span
      className={`cm-unread ${arriving ? "cm-unread-arriving" : ""}`}
      onAnimationEnd={() => setArriving(false)}
    >
      {unreadText(count)}
      <span className="sr-only"> unread</span>
    </span>
  );
}
