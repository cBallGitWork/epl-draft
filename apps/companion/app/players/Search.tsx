"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// The board's search box, narrowing as you type (Craig, 10 Sep 2026). A GET form first: without a script Enter submits
// it; with one, a settled keystroke becomes a URL and the server answers, so the pool never ships to the phone.

/** How long the box waits after the last keystroke: each settled one is a server render of the board. */
const SETTLE = 250;

export default function Search({
  query,
  action,
  children,
}: {
  /** What the page was rendered with, which is the authority this box follows. */
  query: string;
  action: string;
  /** The rest of the query as hidden inputs, rendered on the server; both the submit and the debounce post them. */
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [text, setText] = useState(query);
  const [rendered, setRendered] = useState(query);
  const form = useRef<HTMLFormElement>(null);

  // The URL is the authority: reset during render (not an effect, which flashes the old text; not `key`, which drops
  // the caret).
  if (query !== rendered) {
    setRendered(query);
    setText(query);
  }

  useEffect(() => {
    if (text === query) return;
    const timer = setTimeout(() => {
      const target = form.current;
      if (target === null) return;

      // Built from the form, so the hidden fields keep the rest of the query.
      const next = new URLSearchParams();
      for (const [name, value] of new FormData(target)) {
        if (typeof value === "string" && value.trim() !== "") next.set(name, value.trim());
      }
      const search = next.toString();

      // `replace`, so a search is one history entry; `scroll: false`, so the board under the box stays put.
      router.replace(search === "" ? action : `${action}?${search}`, { scroll: false });
    }, SETTLE);
    return () => clearTimeout(timer);
  }, [text, query, router, action]);

  return (
    <form
      ref={form}
      action={action}
      // Under a thumb it shares the row with the chips until it would drop below its placeholder, then takes a line.
      className="flex min-w-0 grow basis-26 lg:w-36 lg:flex-none"
    >
      {children}
      <input
        name="q"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Find a player"
        aria-label="Find a player"
        type="search"
        // `text-base` stays: below 16px an iPhone zooms the page on focus.
        className="cm-panel min-h-11 min-w-0 flex-1 px-2 text-base lg:min-h-9 lg:px-3"
      />
    </form>
  );
}
