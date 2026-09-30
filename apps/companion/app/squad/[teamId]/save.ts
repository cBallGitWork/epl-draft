"use server";

import { updateTag } from "next/cache";
import {
  FANTRAX_LEAGUE_ID,
  benchOrderMap,
  changesBenchOrder,
  changesLineup,
  eligibilityOf,
  fetchLineupState,
  fieldMapFor,
  firstKickoff,
  locksAt,
  mapLineupState,
  readBenchAnswer,
  readLineupAnswer,
  saveOpen,
  sendBenchOrder,
  sendLineup,
  violations,
  type RosterSlot,
  type WriteAnswer,
} from "@epl/core";
import { now } from "../../clock";
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
}

const SWITCHED_OFF = "Saving to Fantrax is switched off. Set this lineup in Fantrax instead.";
const RELOAD = "Your squad has changed since this page loaded. Reload and try again.";
const REFUSED = "Fantrax would not take the save. Set this lineup in Fantrax instead.";

const refuse = (message: string): WriteAnswer => ({ ok: false, messages: [message] });

function isPlan(value: unknown): value is Plan {
  const plan = value as Plan | null;
  return (
    Number.isInteger(plan?.period) &&
    Array.isArray(plan?.slots) &&
    plan.slots.every(
      (s) => typeof s?.fantraxId === "string" && typeof s.status === "string" && (s.position === null || typeof s.position === "string"),
    ) &&
    Array.isArray(plan.bench) &&
    plan.bench.every((id) => typeof id === "string")
  );
}

export async function saveLineup(input: unknown): Promise<WriteAnswer> {
  if (!isPlan(input)) return refuse(RELOAD);
  const session = commissionerSession();
  if (session === null) return refuse(SWITCHED_OFF);

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
  const fieldMap = fieldMapFor(state, plan.slots);
  if (typeof fieldMap === "string") return refuse(RELOAD);

  const lineup = changesLineup(state, fieldMap);
  const bench = changesBenchOrder(plan.bench, state.autoSubOrder);
  const audit = (ok: boolean, step: string) =>
    console.info(JSON.stringify({ event: "lineup-save", teamId, period, lineup, bench, step, ok }));

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
  if (bench) {
    const order = benchOrderMap(plan.bench, state.autoSubOrder);
    const done = readBenchAnswer(await sendBenchOrder(FANTRAX_LEAGUE_ID, { teamId, period, order }, session));
    audit(done.ok, "bench");
    if (!done.ok) return done;
  }
  updateTag(leagueTag(SQUADS_KEY));
  return { ok: true };
}
