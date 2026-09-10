"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PRESSABLE } from "./BoardControls";

// The search box, which narrows the board while you type.
//
// Craig, 10 Sep 2026: *"searching should be dynamic, so it updates while i
// type"*. The board was a GET form with a `Find` button — one round trip per
// search, and a reader who mistyped a name got a whole page back before finding
// out.
//
// **A GET form first and JavaScript second**, which is the pattern
// `league/team-stats/Filters` already sets on this desk: without a script the
// button submits and the page works exactly as it did; with one, typing
// navigates on its own and the button becomes a way to skip the wait. That
// matters more here than anywhere else in the app, because every other control
// on this board is a link precisely so the page needs no script — a search box
// that stopped working without one would be the exception that makes the rule
// worthless.
//
// **The filtering stays on the SERVER, and that is not laziness.** The obvious
// dynamic search filters an array in the browser, and it would need the array:
// six hundred and seventy players with twenty measures each, which `pool.ts` is
// explicit about never shipping — *"the whole pool never crosses to the phone as
// data"*. So each keystroke settles into a URL and the server answers with
// HTML, which also means the address bar still describes what is on screen and a
// search is still a link somebody can send.

/** How long the box waits after the last keystroke.
 *
 *  **A quarter second, and it is a round trip rather than a feel.** Every
 *  character typed without a debounce is a request for a hundred rows of a
 *  six-hundred-row board; "haaland" is eight of them, and the first seven are
 *  answers nobody reads. 250ms is longer than the gap between keystrokes in
 *  ordinary typing and shorter than the pause before somebody looks up at the
 *  screen, so the board is already right when the eye arrives.
 *
 *  It also has to be long enough that the SERVER is not the queue: this page is
 *  cached and revalidates on 30s, so a settled search is fast — but a burst of
 *  eight is eight renders whatever the cache says. */
const SETTLE = 250;

export default function Search({
  query,
  action,
  children,
}: {
  /** What the page was rendered with, which is the authority this box follows. */
  query: string;
  action: string;
  /** The rest of the query as hidden inputs, rendered on the SERVER.
   *
   *  A GET form posts only its own fields, so without them a search would clear
   *  the sort, every filter, the stat group and the drawer. They arrive as
   *  children rather than being rebuilt here for two reasons: the whole query
   *  object never has to cross to the browser, and the debounced navigation
   *  reads these same inputs back out of the form — so both paths through this
   *  component preserve identical state by construction rather than by two lists
   *  agreeing with each other. */
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [text, setText] = useState(query);
  const [rendered, setRendered] = useState(query);
  const form = useRef<HTMLFormElement>(null);

  // **The URL is the authority, not this state.** A reader who taps a filter
  // chip, uses the back button, or opens a shared link gets a new `q` from the
  // server, and a box still holding what was typed a moment ago would be a
  // control disagreeing with the board beside it. `query` is what the page was
  // rendered with, so following it is following the answer.
  //
  // **Adjusted during the render and not in an effect**, which is React's own
  // documented shape for resetting state when a prop changes — and the ESLint
  // rule that caught the effect version is right about why: `setState` in an
  // effect body renders once with the stale value and again with the new one,
  // so the box would visibly show the old search for a frame. Setting state
  // while rendering makes React discard this pass and re-run it before anything
  // reaches the DOM.
  //
  // Not `key={query}` on the component, which is the other documented answer: it
  // remounts the input, and remounting the field somebody is typing into takes
  // the caret with it.
  if (query !== rendered) {
    setRendered(query);
    setText(query);
  }

  useEffect(() => {
    if (text === query) return;
    const timer = setTimeout(() => {
      const target = form.current;
      if (target === null) return;

      // **Built from the FORM, so the search cannot drop the rest of the
      // query.** The hidden inputs already carry the sort, the filters, the stat
      // group and the drawer; reading them back is how this stays the one place
      // that knows what a search must preserve. Building a `URLSearchParams`
      // from `q` alone is the bug this shape exists to prevent, and it is the
      // same one `href()` prevents for every link on the page.
      const next = new URLSearchParams();
      for (const [name, value] of new FormData(target)) {
        if (typeof value === "string" && value.trim() !== "") next.set(name, value.trim());
      }
      const search = next.toString();

      // `replace` and not `push`: eight keystrokes should not be eight entries
      // in the history, and a reader pressing back means "the screen before I
      // started typing". `scroll: false` because the board is under the box —
      // jumping to the top on every settled keystroke moves the thing being
      // read.
      router.replace(search === "" ? action : `${action}?${search}`, { scroll: false });
    }, SETTLE);
    return () => clearTimeout(timer);
  }, [text, query, router, action]);

  return (
    <form
      ref={form}
      action={action}
      className="flex min-w-0 flex-1 gap-1.5 lg:w-44 lg:flex-none xl:w-64"
    >
      {children}
      <input
        name="q"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Find a player"
        aria-label="Find a player"
        // A search field rather than a text one, so a phone offers the search
        // key and Safari draws its own clear button — the two conveniences a
        // reader of six hundred names actually wants, and neither costs a line.
        type="search"
        // `lg:min-h-9` so the field is the same height as every plate beside
        // it — it was the one control on the row with no desk step, and at 44px
        // against their 36 it was what made the row look assembled rather than
        // drawn. `text-base` STAYS: below 16px an iPhone zooms the page on
        // focus, which is a worse fault than a field whose type is a step above
        // its neighbours' — and a field is read and typed into, not pressed.
        className="cm-panel min-h-11 min-w-0 flex-1 px-3 text-base lg:min-h-9"
      />
      {/* Still here with a script running, and deliberately. It is the way out
          for somebody who typed and does not want to wait 250ms, and it is the
          only control on the row for a reader with no JavaScript at all. */}
      <button type="submit" className={PRESSABLE}>
        Find
      </button>
    </form>
  );
}
