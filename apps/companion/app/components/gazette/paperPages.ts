// The paper's only page behind the front: a story's own.

/** One story's own page. */
export function storyHref(slug: string): string {
  return `/paper/${slug}`;
}
