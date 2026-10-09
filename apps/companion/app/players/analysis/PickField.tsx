"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PRESSABLE } from "../BoardControls";
import { formHref } from "../../components/shell/formHref";
import { heldText } from "../heldText";

// One of Compare's two search boxes, narrowing the list beside it as you type. `Search.tsx`'s shape, copied: the second
// occurrence, and it differs in what it narrows.

/** How long the box waits after the last keystroke, as the board's does. */
const SETTLE = 250;

export default function PickField({
  side,
  query,
  action,
  label,
  placeholder,
  children,
}: {
  /** Which man this box picks, which names its parameter, `qa` or `qb`. */
  side: "a" | "b";
  /** What the page was rendered with, which is the authority this box follows. */
  query: string;
  action: string;
  /** What the box and its button do, for a screen reader: "Swap B.Fernandes for another player". */
  label: string;
  placeholder: string;
  /** The rest of the query as hidden inputs, rendered on the server; both the submit and the debounce post them. */
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [text, setText] = useState(query);
  const [rendered, setRendered] = useState(query);
  const [sent, setSent] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);

  // The URL is the authority: reset during render, as `Search.tsx` does.
  if (query !== rendered) {
    setRendered(query);
    setText(heldText(query, sent, text));
  }

  useEffect(() => {
    if (text === query) return;
    const timer = setTimeout(() => {
      const target = form.current;
      if (target === null) return;
      setSent(text.trim());
      // `replace`, so a search is one history entry; `scroll: false`, so the list under the box stays put.
      router.replace(formHref(action, new FormData(target)), { scroll: false });
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
        placeholder={placeholder}
        aria-label={label}
        type="search"
        // `text-base` stays: below 16px an iPhone zooms the page on focus.
        className="cm-panel min-h-11 min-w-0 flex-1 px-3 text-base lg:min-h-9"
      />
      {/* The only control without a script, and a way not to wait for the debounce. */}
      <button type="submit" aria-label={label} className={PRESSABLE}>
        Find
      </button>
    </form>
  );
}
