"use client";

import { useEffect, useRef, useState } from "react";
import type { PublishedStory } from "@epl/core";
import { STANDING_HEAD } from "./heads";
import { shareOf } from "./shareLink";

// An article's share, in words: the phone's own share sheet where there is one, else the address on the clipboard.

/** How long "Link copied" stands before the word goes back to "Share", in milliseconds. */
const COPIED_MS = 2000;

/** Two strings, not the story: a client component's props ride in the page's payload. */
export default function Share({ slug, headline }: Pick<PublishedStory, "slug" | "headline">) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function share() {
    const data = shareOf({ slug, headline }, window.location.origin);
    if (typeof navigator.share === "function") {
      // A dismissed sheet rejects; there is nothing to say about it.
      await navigator.share(data).catch(() => undefined);
      return;
    }
    const written = await navigator.clipboard?.writeText(data.url).then(() => true, () => false);
    if (!written) return;
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  }

  return (
    // The tap is a thumb's; the negative margin keeps the dateline's row at the line's own height.
    <button type="button" onClick={share} className={`${STANDING_HEAD} -my-3 flex min-h-11 shrink-0 items-center`}>
      <span aria-live="polite">{copied ? "Link copied" : "Share"}</span>
    </button>
  );
}
