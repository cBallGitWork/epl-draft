import { Fragment, type ReactNode } from "react";

// Setting the footballers' names in bold wherever they appear in filed prose.
//
// **Deterministic, from names we already hold — never markup from the writer.**
// The alternative was asking the model for `**Name**` and parsing it, which puts
// the page's typography inside the thing `strangers()` exists to police. Here
// the names come off the story's own team-news rows, so a name can only be set
// in bold if the desk put it there.
//
// Longest first, so "João Pedro" wins the span "Pedro" would also match — the
// same rule the presser ingestion applies for the same reason.

export function emphasise(text: string, names: readonly string[]): ReactNode {
  const wanted = [...new Set(names)].filter((name) => name.length >= 3).sort((a, b) => b.length - a.length);
  if (wanted.length === 0) return text;

  // **Whole words only.** Without the boundaries `["Burn"]` set "Newcastle
  // travel to **Burn**ley"; `banned.ts` solves the same problem the same way
  // and says why. Unicode letter classes rather than `\b`, because a surname's
  // last letter is often not ASCII — "Milenković" ends on a letter `\b` does
  // not know about.
  //
  // It is NOT accent-insensitive: "Nico González" does not match a prose
  // "Gonzalez". Left alone deliberately — the names and the prose are both
  // written from the same brief, so a mismatch means the writer re-spelled him,
  // and silently bolding a spelling the desk did not file is the wrong repair.
  const pattern = new RegExp(`(?<!\\p{L})(${wanted.map(escape).join("|")})(?!\\p{L})`, "gu");
  const parts = text.split(pattern);
  if (parts.length === 1) return text;

  return parts.map((part, at) =>
    // An odd index is a captured name; `split` with one group alternates.
    at % 2 === 1 ? (
      <strong key={at} className="font-bold">
        {part}
      </strong>
    ) : (
      <Fragment key={at}>{part}</Fragment>
    ),
  );
}

function escape(name: string): string {
  return name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
