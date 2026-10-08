"use server";

import { updateTag } from "next/cache";
import {
  FANTRAX_LEAGUE_ID,
  benchToWrite,
  changesLineup,
  eligibilityOf,
  fetchLineupState,
  fieldMapFor,
  firstKickoff,
  locksAt,
  mapLineupState,
  readBenchAnswer,
  readLineupAnswer,
  stillHeld,
  saveOpen,
  sendBenchOrder,
  sendLineup,
  violations,
  type RosterSlot,
  type WriteAnswer,
} from "@epl/core";
import { now, replayAt } from "../../clock";
import { leagueTag } from "../../leagueCache";
import { planningRound } from "../../round";
import { rosterMinimums } from "../../rosterMinimums";
import { signedTeamId } from "../../session";
import { SQUADS_KEY, getLeagueSquads } from "../../squads";
import { commissionerSession } from "./saving";

// Saves the signed-in manager's planned lineup and bench order to Fantrax. The server names the team and the
// week, and refuses a week that has locked or is about to: the commissioner's write can override a live team.

export interface Plan {
  /** The period the page planned, which must still be the open one. */
  period: number;
  slots: RosterSlot[];
  /** Reserves' ids in the order they come on. */
  bench: string[];
  /** Whether the manager reordered the bench; an unnumbered one is otherwise left to Fantrax. */
  reordered: boolean;
  /** What the page loaded as Fantrax's: the save is refused if Fantrax has moved on since. */
  held: { slots: RosterSlot[]; bench: string[] };
}

const SWITCHED_OFF = "Saving to Fantrax is switched off. Set this lineup in Fantrax instead.";
const RELOAD = "Your squad has changed since this page loaded. Reload and try again.";
const REFUSED = "Fantrax would not take the save. Set this lineup in Fantrax instead.";
const CHANGED = "Your lineup has changed in Fantrax since this page loaded. Reload to see it, then save again.";

const refuse = (message: string): WriteAnswer => ({ ok: false, messages: [message] });

const isSlots = (slots: unknown): slots is RosterSlot[] =>
  Array.isArray(slots) &&
  slots.every(
    (s: RosterSlot | null) => typeof s?.fantraxId === "string" && typeof s.status === "string" && (s.position === null || typeof s.position === "string"),
  );
const isBench = (bench: unknown): bench is string[] =>
  Array.isArray(bench) && bench.every((id) => typeof id === "string") && new Set(bench).size === bench.length;

function isPlan(value: unknown): value is Plan {
  const plan = value as Plan | null;
  return (
    Number.isInteger(plan?.period) &&
    isSlots(plan?.slots) &&
    isBench(plan?.bench) &&
    typeof plan?.reordered === "boolean" &&
    isSlots(plan?.held?.slots) &&
    isBench(plan?.held?.bench)
  );
}

export async function saveLineup(input: unknown): Promise<WriteAnswer> {
  if (!isPlan(input)) return refuse(RELOAD);
  // A replayed clock would plan a week that locked long ago, and the commissioner's write overrides a lock.
  if (replayAt() !== null) return refuse(SWITCHED_OFF);

  const round = await planningRound();
  const squads = await getLeagueSquads(round);
  if (round === null || !("period" in squads) || squads.info === null) return refuse(REFUSED);
  if (input.period !== round.period) return refuse(`That gameweek has locked. Reload to plan gameweek ${round.gameweek}.`);
  const period = squads.info.rosterPeriods.find((p) => p.number === round.period);
  const kickoff = period === undefined ? null : firstKickoff(period, squads.kickoffs);
  if (!saveOpen(kickoff === null ? null : locksAt(kickoff), now().toISOString())) {
    return refuse(`Gameweek ${round.gameweek} is about to lock. Set this lineup in Fantrax instead.`);
  }

  const teamId = await signedTeamId(squads.period.teams);
  if (teamId === null) return refuse("Sign in with your team code to save.");
  const session = commissionerSession(teamId);
  if (session === null) return refuse(SWITCHED_OFF);

  const limits = { ...squads.info.roster, minActiveByPosition: rosterMinimums() };
  if (violations(input.slots, eligibilityOf(squads.info.players), limits).length > 0) {
    return refuse("This lineup breaks the league's rules. Fix it before saving.");
  }
  const reserves = new Set(input.slots.filter((s) => s.status !== "ACTIVE").map((s) => s.fantraxId));
  if (input.bench.length !== reserves.size || input.bench.some((id) => !reserves.has(id))) return refuse(RELOAD);

  try {
    return await write(teamId, round.period, input, session);
  } catch (error) {
    console.error(JSON.stringify({ event: "lineup-save", teamId, period: round.period, error: String(error) }));
    return refuse(REFUSED);
  }
}

async function write(teamId: string, period: number, plan: Plan, session: string): Promise<WriteAnswer> {
  const state = mapLineupState(await fetchLineupState(FANTRAX_LEAGUE_ID, teamId, period, session));
  if (state === null || state.period !== period) return refuse(REFUSED);
  if (!stillHeld(state, plan.held)) {
    // The page's copy is behind Fantrax: expire it so the reload shows what Fantrax now holds.
    updateTag(leagueTag(SQUADS_KEY));
    return refuse(CHANGED);
  }
  const fieldMap = fieldMapFor(state, plan.slots);
  if (typeof fieldMap === "string") return refuse(RELOAD);

  const lineup = changesLineup(state, fieldMap);
  const bench = benchToWrite(plan.bench, plan.reordered, state.autoSubOrder);
  const audit = (ok: boolean, step: string) =>
    console.info(JSON.stringify({ event: "lineup-save", teamId, period, lineup, bench: bench !== null, step, ok }));

  if (lineup) {
    const send = (dryRun: boolean) =>
      sendLineup(FANTRAX_LEAGUE_ID, { teamId, period, fieldMap, applyToFuturePeriods: state.applyToFuturePeriods, dryRun }, session);
    const dry = readLineupAnswer(await send(true));
    if (!dry.ok) {
      audit(false, "dry-run");
      return dry;
    }
    const done = readLineupAnswer(await send(false));
    audit(done.ok, "lineup");
    if (!done.ok) return done;
  }
  if (bench !== null) {
    const done = readBenchAnswer(await sendBenchOrder(FANTRAX_LEAGUE_ID, { teamId, period, order: bench }, session));
    audit(done.ok, "bench");
    if (!done.ok) {
      // The lineup above may have gone through, and the page must show it.
      if (lineup) updateTag(leagueTag(SQUADS_KEY));
      return done;
    }
  }
  updateTag(leagueTag(SQUADS_KEY));
  return { ok: true };
}
