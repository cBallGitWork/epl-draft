/** Where a credit's source link goes, in words: Wikimedia Commons by name, any other site by its address. */
export function sourceLabel(source: string): string {
  if (!URL.canParse(source)) return source;
  const host = new URL(source).hostname.replace(/^www\./, "");
  return host === "commons.wikimedia.org" ? "Wikimedia Commons" : host;
}
