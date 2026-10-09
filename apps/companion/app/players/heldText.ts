/** What a search box holds when the page re-renders with `query`: the URL's text, unless the page is answering the
 *  box's own search (`sent`), when it keeps what was typed after that search went. */
export function heldText(query: string, sent: string | null, text: string): string {
  return query === sent ? text : query;
}
