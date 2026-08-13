// @epl/core — everything that is not a React component and not a Next.js route.
//
// Two layers, deliberately separate (see PRODUCT.md):
//   football/  the real Premier League, sourced from FPL's public API
//   league/    our fantasy competition, sourced from Fantrax
//
// Neither layer may import the other's adapter. That is what lets the league
// layer be replaced wholesale in 27/28 while the football layer and the entire UI
// stay put.
//
// They meet in two places, both one-directional and both by argument:
//   1. player identity, through the bridge in identity/ — join/roster.ts is that
//      meeting made concrete, and is deliberately neither layer's file
//   2. the calendar — league/calendar.ts is TOLD about gameweek kickoffs as plain
//      data, declaring its own GameweekKickoff rather than importing Fixture
// A script does the wiring. Football never imports league.

export * from "./config";
export * from "./football";
export * from "./identity";
export * from "./join/lineup";
export * from "./join/cleanSheets";
export * from "./fpl-entry";
export * from "./gazette";
export * from "./join/roster";
export * from "./league";
