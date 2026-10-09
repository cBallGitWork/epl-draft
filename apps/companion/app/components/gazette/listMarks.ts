// The chosen row of a report's list in reverse ink: the targeted section's, else the lead's. One rule per row,
// because CSS cannot carry an anchor from the target to the link.

const REVERSED = "{background:var(--color-ink);color:var(--color-bg)}";

/** The rules for a report scoped `.${scope}` with its list `.${scope}-list`; `anchors` are the sections' ids, lead first. */
export function listMarks(scope: string, anchors: readonly string[]): string {
  return [
    `.${scope}:not(:has(section:target)) .${scope}-list a:first-child${REVERSED}`,
    ...anchors.map((id) => `.${scope}:has(#${id}:target) .${scope}-list a[href="#${id}"]${REVERSED}`),
  ].join("");
}
