import { LIVE, MAIL } from "./components/shell/sections";

/** The route `proxy.ts` hands a signed-in cold open of `/` to, and which redirects it on. */
export const START = "/start";

/** Whether the browser says the reader opened this page from outside the site: typed, bookmarked or the home-screen icon. */
export function openedCold(headers: Pick<Headers, "get">): boolean {
  return headers.get("sec-fetch-site") === "none" && headers.get("sec-fetch-mode") === "navigate";
}

/** Where a reader opening the site lands: Live while a gameweek is on, else Mail (unknown included); the paper until they sign in. */
export function landing(reader: { signedIn: boolean; live: boolean | null }): string {
  if (!reader.signedIn) return "/";
  return reader.live === true ? LIVE : MAIL;
}
