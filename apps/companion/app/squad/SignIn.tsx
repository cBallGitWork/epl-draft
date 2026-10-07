"use client";

import { useActionState } from "react";
import { claimTeam } from "./actions";
import { LABEL } from "@/app/desk";

// One box: your code. A client component so a wrong code answers in place; the form posts before any JavaScript.

export default function SignIn() {
  const [message, submit, pending] = useActionState(claimTeam, null);

  return (
    <form action={submit} className="cm-panel flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="code" className={LABEL}>
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
          // `text-base`, or iOS zooms on focus; `tracking-widest` because a code is transcribed a character at a time.
          className="cm-panel numeric min-h-11 min-w-0 flex-1 px-3 text-base uppercase tracking-widest text-ink placeholder:text-faint"
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
