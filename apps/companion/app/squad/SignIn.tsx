"use client";

import { useActionState } from "react";
import { claimTeam } from "./actions";

// One box: your code. Client only because the wrong-code message has to come
// back without losing the page, which is what `useActionState` is for — the form
// itself posts and works before any JavaScript arrives.

export default function SignIn() {
  const [message, submit, pending] = useActionState(claimTeam, null);

  return (
    <form action={submit} className="elev flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="code" className="text-2xs font-bold uppercase tracking-widest text-faint">
          Your code
        </label>
        <p className="text-sm text-muted">
          The commissioner gave every manager one. It tells the app whose team is yours.
        </p>
      </div>

      <div className="flex gap-2">
        <input
          id="code"
          name="code"
          required
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="ABCD2345"
          // `text-base` deliberately: anything smaller and iOS zooms the page in
          // when the field takes focus.
          className="numeric min-h-11 min-w-0 flex-1 rounded-lg border border-line bg-raised px-3 text-base uppercase tracking-widest text-ink placeholder:text-faint"
        />
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-lg bg-league px-4 text-sm font-bold text-cream disabled:opacity-50"
        >
          {pending ? "…" : "Sign in"}
        </button>
      </div>

      {message ? (
        <p role="alert" className="text-sm text-live">
          {message}
        </p>
      ) : null}

      <p className="text-2xs text-faint">
        Everything here is readable without a code. Signing in only tells the app which side to
        take.
      </p>
    </form>
  );
}
