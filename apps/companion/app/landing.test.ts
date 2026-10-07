import { describe, expect, it } from "vitest";
import { LIVE, MAIL } from "./components/shell/sections";
import { landing, openedCold } from "./landing";

// What a browser sends, measured in Chrome and WebKit on 6 Oct 2026: typed or bookmarked is `none`,
// a link or a reload of a page reached by one is `same-origin`, and a redirect keeps the first one's.
const typed = new Headers({ "sec-fetch-site": "none", "sec-fetch-mode": "navigate", "sec-fetch-dest": "document" });
const tapped = new Headers({ "sec-fetch-site": "same-origin", "sec-fetch-mode": "navigate", "sec-fetch-dest": "document" });

describe("openedCold", () => {
  it("is a document the reader asked for from outside the site", () => {
    expect(openedCold(typed)).toBe(true);
  });

  it("is not a tap inside the site, or the reload of one", () => {
    expect(openedCold(tapped)).toBe(false);
  });

  it("is not a link from another site", () => {
    expect(openedCold(new Headers({ "sec-fetch-site": "cross-site", "sec-fetch-mode": "navigate" }))).toBe(false);
  });

  it("is not the client router's own fetch", () => {
    expect(openedCold(new Headers({ "sec-fetch-site": "none", "sec-fetch-mode": "cors" }))).toBe(false);
  });

  it("is not a client that sends no fetch metadata: a crawler, curl, the smoke walk", () => {
    expect(openedCold(new Headers())).toBe(false);
  });
});

describe("landing", () => {
  it("opens a signed-in reader on Mail between gameweeks", () => {
    expect(landing({ signedIn: true, live: false })).toBe(MAIL);
  });

  it("opens a signed-in reader on Live while a gameweek is on", () => {
    expect(landing({ signedIn: true, live: true })).toBe(LIVE);
  });

  it("opens Mail when it cannot tell whether a gameweek is on", () => {
    expect(landing({ signedIn: true, live: null })).toBe(MAIL);
  });

  it("keeps the paper for a reader who has not signed in, live or not", () => {
    expect(landing({ signedIn: false, live: false })).toBe("/");
    expect(landing({ signedIn: false, live: true })).toBe("/");
  });
});
