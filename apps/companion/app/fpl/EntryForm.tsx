"use client";

import { useActionState } from "react";
import { rememberEntry } from "./actions";
import { BUTTON } from "../components/shell/ButtonLink";
import { LABEL } from "@/app/desk";

// Your FPL team id — the number in the URL when you look at your own points on
// the FPL site. Client only so a bad number can be answered without losing the
// page; the form posts and works before any JavaScript arrives.

export default function EntryForm() {
  const [message, submit, pending] = useActionState(rememberEntry, null);

  return (
    <form action={submit} className="cm-panel flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="entry" className={LABEL}>
          Your FPL team id
        </label>
        <p className="text-sm text-muted">
          The number in the address bar when you look at your own points on the FPL site:
        </p>
        {/* Its own line, and `break-all`. A URL is one unbreakable token, so at
            390 — the reference width — it ran past the panel's own border and
            off the screen edge, clipped rather than scrollable, permanently
            eating the end of it. Found by `ui-verifier` on 31 Aug; it takes a
            human opening the image, because the document never scrolled
            sideways and every instrument therefore called the page clean. */}
        <p className="break-all font-display text-sm text-muted">
          fantasy.premierleague.com/entry/<span className="text-ink">1234567</span>/event/1
        </p>
      </div>

      <div className="flex gap-2">
        <input
          id="entry"
          name="entry"
          inputMode="numeric"
          required
          placeholder="1234567"
          className="cm-panel numeric min-h-11 min-w-0 flex-1 px-3 text-base text-ink placeholder:text-faint"
        />
        <button
          type="submit"
          disabled={pending}
          className={`${BUTTON} shrink-0 font-bold disabled:opacity-50`}
        >
          {pending ? "…" : "Save"}
        </button>
      </div>

      {message ? (
        <p role="alert" className="text-sm text-live">
          {message}
        </p>
      ) : null}
    </form>
  );
}
