import { describe, expect, it } from "vitest";
import { CUPS } from "@epl/core";
import { DESK_ROUTES, playerRoutes } from "./routes.mjs";

// The instruments' route list, and the routes they discover, against a browser written here: no Chrome.

/** A page per route, each a selector and the href it finds; `discover` asks with the selector in its expression. */
function browser(pages) {
  let at = "";
  return {
    open: async (route) => {
      at = route;
    },
    js: async (expression) =>
      Object.entries(pages[at] ?? {}).find(([selector]) => expression.includes(selector))?.[1] ?? "",
  };
}

describe("the instruments' routes", () => {
  it("walk each declared cup but the first, which the bare page draws, by its id", () => {
    const cups = DESK_ROUTES.flatMap((route) => /^\/league\/cups\?cup=([^&]+)$/.exec(route)?.[1] ?? []);
    expect(cups).toEqual(CUPS.slice(1).map((cup) => cup.id));
  });

  it("name no player: a Fantrax id is discovered, never written down", () => {
    expect(DESK_ROUTES.filter((route) => /^\/players\/analysis\?/.test(route))).toEqual([]);
  });

  it("compare the directory's first man with whoever the board's own Compare link pairs him", async () => {
    const cdp = browser({
      "/players": { 'tbody a[href^="/players/"]': "/players/p1" },
      "/players?compare=p1": { 'tbody a[href^="/players/analysis?"]': "/players/analysis?a=p1&b=p2" },
    });
    expect(await playerRoutes(cdp)).toContain("/players/analysis?a=p1&b=p2");
  });
});
