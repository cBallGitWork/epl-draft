import type { MatchupContext } from "../brief";
import type { DraftMan } from "../types";
import { contextOf } from "./context";
import { SATURDAY, draftMan, goalAt } from "./draftMan";
import { draftSide, eleven } from "./draftSide";

// GW5's two match-ups as the rehearsal league played them, cut down to what made each one's story.

export const FRIDAY = "2026-09-25";
export const SUNDAY = "2026-09-27";
const on = (day: string, points: number) => ({ day, points });
const sunday = (man: DraftMan): DraftMan => ({ ...man, byDay: man.byDay.map((d) => ({ ...d, day: SUNDAY })) });

/** test2 v 123: 123 led from Friday, test2 came back to within one, and Haaland's 81st-minute goal on Sunday settled it. */
export function lateDecider(): MatchupContext {
  const haaland = sunday(draftMan("Haaland", "F", 6, 90, 0, { club: "Man City", goals: 1, scoredAt: [goalAt(81, undefined, `${SUNDAY}T15:30:00Z`)] }));
  const test2 = draftSide("test2", 34, eleven("t", { 5: draftMan("Millar", "M", null, 0, 0, { club: "Hull City" }) }), [sunday(draftMan("Meunier", "D", 3, 90, 0, { club: "Sunderland" }))], [on(FRIDAY, 0), on(SATURDAY, 16), on(SUNDAY, 18)]);
  const one23 = draftSide("123", 38, eleven("o", { 9: haaland }), [], [on(FRIDAY, 11), on(SATURDAY, 15), on(SUNDAY, 12)]);
  return contextOf(test2, one23);
}

/** test4 v test3: test4 led 26-24 at the end of Sunday, and test3's reserves turned it. */
export function benchTurned(): MatchupContext {
  const test4 = draftSide("test4", 26, eleven("f", { 4: draftMan("Rodon", "D", null, 0, 0, { club: "Leeds" }) }), [draftMan("Davis", "D", 2, 90, 0, { club: "Ipswich" })], [on(SATURDAY, 5), on(SUNDAY, 21)]);
  const test3 = draftSide(
    "test3",
    24,
    eleven("c", { 1: draftMan("Dunk", "D", null, 0, 0, { club: "Brighton" }), 5: draftMan("Jensen", "M", null, 0, 0, { club: "Brentford" }) }),
    [draftMan("Vuskovic", "D", 6, 90, 0, { club: "Tottenham", cleanSheets: 1 }), draftMan("Janelt", "M", 3, 90, 0, { club: "Brentford" })],
    [on(SATURDAY, 15), on(SUNDAY, 9)],
  );
  return contextOf(test4, test3);
}

/** 123 v test2 after Saturday: Groß's goal and assist built a ten-point lead with most of both sides still to play;
 *  test2's reserve comes on only if he plays. */
export function saturdayLead(): MatchupContext {
  const toCome = (name: string, slot: string, club: string) => draftMan(name, slot, null, 0, 1, { club });
  const one23 = draftSide(
    "123",
    26,
    eleven("o", { 2: toCome("Hume", "D", "Sunderland"), 7: toCome("Stach", "M", "Leeds"), 8: draftMan("Groß", "M", 11, 90, 0, { club: "Brighton", goals: 1, assists: 1 }), 9: toCome("Haaland", "F", "Man City") }),
    [],
    [on(FRIDAY, 11), on(SATURDAY, 15)],
  );
  const test2 = draftSide(
    "test2",
    16,
    eleven("t", { 5: draftMan("Millar", "M", null, 0, 0, { club: "Hull City" }), 9: toCome("Isak", "F", "Liverpool"), 10: toCome("Cunha", "F", "Man Utd") }),
    [toCome("Meunier", "D", "Sunderland")],
    [on(FRIDAY, 0), on(SATURDAY, 16)],
  );
  return contextOf(one23, test2, {}, "saturday");
}
