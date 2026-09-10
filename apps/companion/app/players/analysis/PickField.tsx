"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PRESSABLE } from "../BoardControls";

// One of the two search boxes, which narrows its own list while you type.
//
// **`Search.tsx`'s shape, and it is the second occurrence rather than the
// third.** The board's box and this one debounce identically, navigate with
// `replace` identically, and follow the URL rather than their own state
// identically — so it is COPIED (CODE_RULES §1) and the third will say what
// varies. What already differs is the one thing that matters: the board's box
// narrows the page it sits on, and this one narrows a LIST BESIDE IT while the
// two men on screen stay put. That is the whole feature — Craig, 10 Sep 2026:
// *"we need to compare players without leaving this screen, so we need search
// bars"* — and it is why the field cannot simply be the board's, which navigates
// away by design.
//
// **The filtering stays on the SERVER.** `pool.ts` is explicit that the whole
// pool never crosses to the phone as data; six hundred and seventy names with
// twenty measures each is not a payload a search box gets to ask for. So each
// settled keystroke becomes a URL and the server answers with the matches as
// HTML — which also leaves the address bar describing what is on screen.

/** How long the box waits after the last keystroke. `Search.tsx`'s quarter
 *  second, for its reason: longer than the gap between keystrokes in ordinary
 *  typing, shorter than the pause before somebody looks up. */
const SETTLE = 250;

export default function PickField({
  side,
  query,
  action,
  label,
  children,
}: {
  /** Which man this box picks. The only thing that differs between the two, and
   *  it is what names the query parameter — `qa` or `qb`. */
  side: "a" | "b";
  /** What the page was rendered with, which is the authority this box follows. */
  query: string;
  action: string;
  label: string;
  /** The rest of the query as hidden inputs, rendered on the SERVER. A GET form
   *  posts only its own fields, so without them searching for one man would
   *  forget the other. They arrive as children rather than being rebuilt here so
   *  that both paths out of this component — the submit and the debounced
   *  navigation, which reads these same inputs back — preserve identical state
   *  by construction rather than by two lists agreeing. */
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [text, setText] = useState(query);
  const [rendered, setRendered] = useState(query);
  const form = useRef<HTMLFormElement>(null);

  // The URL is the authority, not this state — a reader who picks a man, uses
  // the back button or opens a shared link gets a new query from the server, and
  // a box still holding what was typed a moment ago would disagree with the list
  // under it. Adjusted during the render rather than in an effect, which is
  // React's own shape for resetting state when a prop changes; not `key={query}`,
  // which remounts the field and takes the caret with it.
  if (query !== rendered) {
    setRendered(query);
    setText(query);
  }

  useEffect(() => {
    if (text === query) return;
    const timer = setTimeout(() => {
      const target = form.current;
      if (target === null) return;
      const next = new URLSearchParams();
      for (const [name, value] of new FormData(target)) {
        if (typeof value === "string" && value.trim() !== "") next.set(name, value.trim());
      }
      const search = next.toString();
      // `replace` so eight keystrokes are not eight history entries, and
      // `scroll: false` because the list is under the box — jumping to the top
      // on every settled keystroke moves the thing being read.
      router.replace(search === "" ? action : `${action}?${search}`, { scroll: false });
    }, SETTLE);
    return () => clearTimeout(timer);
  }, [text, query, router, action]);

  return (
    <form ref={form} action={action} className="flex min-w-0 gap-1.5">
      {children}
      <input
        name={`q${side}`}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={label}
        aria-label={label}
        type="search"
        // `text-base` STAYS: below 16px an iPhone zooms the page on focus, which
        // is worse than a field a step above its neighbours — and a field is
        // read and typed into, not pressed. `lg:min-h-9` puts it on the desk's
        // control step beside every plate on the row.
        className="cm-panel min-h-11 min-w-0 flex-1 px-3 text-base lg:min-h-9"
      />
      {/* Still here with a script running, and deliberately: the way out for
          somebody who does not want to wait 250ms, and the only control here at
          all for a reader with no JavaScript. */}
      <button type="submit" className={PRESSABLE}>
        Find
      </button>
    </form>
  );
}
