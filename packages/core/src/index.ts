// @epl/core — everything that is not a React component and not a Next.js route.
//
// Two layers, deliberately separate (see PRODUCT.md):
//   football/  the real Premier League, sourced from FPL's public API
//   league/    our fantasy competition, sourced from Fantrax
//
// Neither layer may import the other's adapter. They meet only through player
// identity, which is what lets the league layer be replaced wholesale in 27/28
// while the football layer and the entire UI stay put.

export * from "./config";
export * from "./football";
