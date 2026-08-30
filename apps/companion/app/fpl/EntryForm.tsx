"use client";

import { useActionState } from "react";
import { rememberEntry } from "./actions";

// Your FPL team id — the number in the URL when you look at your own points on
// the FPL site. Client only so a bad number can be answered without losing the
// page; the form posts and works before any JavaScript arrives.

export default function EntryForm() {
  const [message, submit, pending] = useActionState(rememberEntry, null);

  return (
    <form action={submit} className="cm-panel flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="entry" className="text-2xs font-bold uppercase tracking-widest text-faint">
          Your FPL team id
        </label>
        <p className="text-sm text-muted">
          The number in the address bar when you look at your own points on the FPL site:
          fantasy.premierleague.com/entry/<span className="text-ink">1234567</span>/event/1.
        </p>
      </div>

      <div className="flex gap-2">
        <input
          id="entry"
          name="entry"
          inputMode="numeric"
          required
          placeholder="1234567"
          className="numeric min-h-11 min-w-0 flex-1 border border-line bg-raised px-3 text-base text-ink placeholder:text-faint"
        />
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 bg-raised px-4 text-sm font-bold text-ink disabled:opacity-50"
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
