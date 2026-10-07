import { Fragment, type ReactNode } from "react";

// The footballers' names in bold in filed prose, from the story's own rows, never from the writer's markup.
// Longest first, so "João Pedro" wins the span "Pedro" would also match.

export function emphasise(text: string, names: readonly string[]): ReactNode {
  const wanted = [...new Set(names)].filter((name) => name.length >= 3).sort((a, b) => b.length - a.length);
  if (wanted.length === 0) return text;

  // Whole words by Unicode letter class, since `\b` misses "Milenković"; deliberately not accent-insensitive.
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
