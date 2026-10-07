// Building a RegExp out of text another source wrote.

/** Text as a literal inside a RegExp: every character the syntax gives a meaning is escaped. */
export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
