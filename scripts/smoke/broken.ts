// A server component that threw, inside a page that still answered 200: Next streams the error into the flight payload
// as its own row, `47:E{"digest":"578425273"}` (escaped inside the page's script), and the browser shows its error
// screen. Status codes cannot see it, so a walk reads the payload.

const ERROR_ROW = /\b[0-9a-f]+:E\{\\?"digest\\?":\\?"([^"\\]+)\\?"/;

/** The digest of a server error streamed into the page, or null when it rendered. */
export function serverError(body: string): string | null {
  return ERROR_ROW.exec(body)?.[1] ?? null;
}
