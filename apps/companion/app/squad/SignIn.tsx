"use client";

import { useActionState } from "react";
import { claimTeam } from "./actions";

// One box: your code. Client only because the wrong-code message has to come
// back without losing the page, which is what `useActionState` is for — the form
// itself posts and works before any JavaScript arrives.

export default function SignIn() {
  const [message, submit, pending] = useActionState(claimTeam, null);

  return (
    <form action={submit} className="cm-panel flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="code" className="text-2xs font-bold uppercase text-faint">
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
          //
          // The app's one surviving `tracking-widest` on a `.numeric`, and the
          // only one that is not letterspacing a figure against the class that
          // exists to tighten it: this is a code being TRANSCRIBED off a message
          // one character at a time, and the space between the characters is
          // what a reader checks his typing against.
          className="numeric min-h-11 min-w-0 flex-1 border border-line bg-raised px-3 text-base uppercase tracking-widest text-ink placeholder:text-faint"
        />
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 bg-league px-4 text-sm font-bold text-cream disabled:opacity-50"
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
