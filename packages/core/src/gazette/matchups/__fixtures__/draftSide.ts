import type { DayPoints, DraftMan, DraftSide } from "../types";
import { draftMan } from "./draftMan";

/** The shape every test eleven takes: a keeper, four at the back, four in midfield, two up front. */
const SHAPE = ["G", "D", "D", "D", "D", "M", "M", "M", "M", "F", "F"];

/** An eleven of plain men on 2 points and 90 minutes, each at a club of his own so none are club-mates by accident, any
 *  place replaced by its index. */
export function eleven(tag: string, over: Record<number, DraftMan> = {}): DraftMan[] {
  return SHAPE.map((slot, i) => over[i] ?? draftMan(`${tag}${slot}${i}`, slot, 2, 90, 0, { club: `${tag}${i} FC` }));
}

/** A side with its eleven and bench, the bench numbered to come on in the order given, its total scored on one day. */
export function draftSide(name: string, total: number, men: DraftMan[], bench: DraftMan[] = [], byDay: DayPoints[] = [{ day: "2026-09-27", points: total }]): DraftSide {
  return { teamId: name, name, total, byDay, eleven: men, bench, subOrder: bench.map((m) => m.fantraxId) };
}
