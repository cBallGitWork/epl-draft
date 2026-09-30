import { DRAFT_DESK, DRAFT_NEWS } from "../../config";
import type { MatchupContext } from "./brief";
import { opposedMatches } from "./state";
import { subLine, withClub } from "./stories";
import { chaseLines } from "./swing";
import { thread, type Thread } from "./thread";
import type { SlotWorth } from "./types";

// After Saturday, with the gameweek to finish: how it stands and what keeps it open. Men still to come are the fixture
// list, never a manager's choice. Pure.

export function saturdayThreads(ctx: MatchupContext, worth: SlotWorth): Thread[] {
  const { home, away, margin } = ctx.state;
  const [ahead, behind] = margin >= 0 ? [home, away] : [away, home];
  const m = Math.abs(margin);
  const out: Thread[] = [];
  const left = home.toPlay.length + away.toPlay.length;
  // The sums of what the side behind needs only once three or fewer are left (Craig, 29 Sep 2026).
  if (left > 0 && left <= DRAFT_DESK.chaseWhenLeft && margin !== 0) out.push(thread("chase", { teamId: behind.side.teamId, men: behind.toPlay, facts: chaseLines(behind, ahead, m, worth) }));
  for (const s of [home, away]) {
    const waiting = s.subs.filter((x) => x.provisional);
    if (waiting.length > 0) out.push(thread("subs-waiting", { teamId: s.side.teamId, men: waiting.map((x) => x.in), facts: waiting.map((x) => subLine(x, "saturday")) }));
    const doubles = s.toPlay.filter((x) => x.played + x.left > 1);
    if (doubles.length > 0) out.push(thread("double-to-come", { teamId: s.side.teamId, men: doubles, facts: doubles.map((x) => `${withClub(x)} has two matches this gameweek, ${x.left === 1 ? "one" : "both"} still to come`) }));
  }
  if (m <= DRAFT_NEWS.closeWithin) out.push(thread("close", { teamId: margin === 0 ? null : ahead.side.teamId, bigger: m <= 1, facts: [margin === 0 ? `${home.side.name} and ${away.side.name} are level` : `${ahead.side.name} lead by ${m}`] }));
  else out.push(thread("saturday-lead", { teamId: ahead.side.teamId, bigger: m >= DRAFT_NEWS.bigLead, facts: [`${ahead.side.name} lead by ${m}`] }));
  const [more, fewer] = home.toPlay.length >= away.toPlay.length ? [home, away] : [away, home];
  if (more.toPlay.length - fewer.toPlay.length >= DRAFT_NEWS.toPlayGap) {
    out.push(thread("to-play-gap", { teamId: more.side.teamId, facts: [`${more.side.name} have ${more.toPlay.length} still to play, ${fewer.side.name} ${fewer.toPlay.length}`] }));
  }
  const opposed = opposedMatches(home.side, away.side, false);
  if (opposed.length > 0) out.push(thread("both-to-come", { teamId: null, facts: opposed }));
  return out;
}
