import type { Fixture, FixtureStatus, FootballSnapshot } from "./types";

// What a round of football is *doing* — the questions that change as a Saturday
// runs, as against `selectors.ts`, which answers what a snapshot contains.
//
// They were one file until it crossed the ceiling, and the split is the one the
// file was already making in its own comments: every function here is about a
// round's position in time, and every one of them has been got wrong at least
// once by being asked in place of another. `duringGameweek` is the poll rate and
// not the LIVE dot. `gameweekStatus` is a three-state label and cannot answer a
// two-state question, which is what `gameweekStarted` exists for. And
// `roundFinished` cannot say "live", which is why `roundState` pairs it with
// `isMatchdayLive` rather than either being used alone.

/** True when any match in the snapshot is in play — the app's single source of
 *  truth for whether to show the live TREATMENT.
 *
 *  Not the poll rate, which this docblock used to claim as well and which cost
 *  the Live tab an afternoon at the idle interval: between two kickoffs nothing
 *  is in play and a score is at its most likely to have moved since you looked.
 *  `duringGameweek` is that question, and `pollSeconds` at the app edge is the
 *  one place it is asked. */
export function isMatchdayLive(snapshot: FootballSnapshot): boolean {
  return snapshot.fixtures.some((f) => f.status === "live");
}

/** Whether the round in view is under way: from its first kickoff until its last
 *  dated match is over.
 *
 *  Deliberately wider than `isMatchdayLive`. Saturday lunchtime between two
 *  kickoffs is still matchday to someone holding a phone, but nothing is in play,
 *  so the two answer different questions: this one decides whether the Matchday
 *  section exists at all AND how often to poll, while `isMatchdayLive` drives the
 *  live treatment — the dot, the clock, the present tense.
 *
 *  The window closes on `finished` rather than on FPL's `data_checked`, which
 *  settles bonus a day or two later. The section is for watching football, not
 *  for waiting on bonus points; that a score is still provisional is said on the
 *  page, where a reader can see it.
 *
 *  Undated fixtures are ignored at both ends. A TV pick with no time cannot open
 *  a window it has no place in, and a match postponed out of its slot must not
 *  hold one open for a month. A postponement FPL leaves dated does hold it open,
 *  which is the honest reading: that gameweek genuinely has not finished. */
export function duringGameweek(snapshot: FootballSnapshot, at: string): boolean {
  const now = Date.parse(at);
  if (Number.isNaN(now)) return false;

  let firstKickoff = Infinity;
  let everythingFinished = true;
  let anyDated = false;

  for (const fixture of snapshot.fixtures) {
    if (fixture.kickoff === null) continue;
    const kickoff = Date.parse(fixture.kickoff);
    if (Number.isNaN(kickoff)) continue;
    anyDated = true;
    if (kickoff < firstKickoff) firstKickoff = kickoff;
    if (fixture.status !== "finished") everythingFinished = false;
  }

  return anyDated && now >= firstKickoff && !everythingFinished;
}
/** Whether a ball has been kicked in this round yet.
 *
 *  A different question from `gameweekStatus`, and the distinction is the whole
 *  point: at six on a Saturday evening a round with nine results and a Monday
 *  night match left has no LIVE fixture and is not FINISHED, so its status is
 *  "upcoming" — correctly, because a full-time label on it would be a lie. But
 *  nine of its ten results exist, and a view that reads that status as "no
 *  football has happened" hides every one of them until Monday.
 *
 *  Asked of the fixtures rather than of the status for exactly that reason: a
 *  three-state label cannot answer a two-state question, and trying to make it
 *  is how the schedule came to blank its own scoreboard every weekend. */
export function gameweekStarted(fixtures: readonly Fixture[], gameweek: number): boolean {
  return fixtures.some(
    (fixture) => fixture.gameweek === gameweek && fixture.status !== "upcoming",
  );
}

/** How a whole round stands: in play while any match is, done once every one of
 *  them is, and upcoming until the first ball is kicked.
 *
 *  Asked of season-wide fixtures rather than of a snapshot, because the caller
 *  labelling thirty-eight rounds at once holds the season and not one round of
 *  it. A gameweek with no fixtures answers "upcoming" — "every match has ended"
 *  is vacuously true of none, and a full-time label on a week that has not been
 *  scheduled is the confident wrong answer.
 *
 *  **A half-time lead is not a win, and this is where that rule lives.** Every
 *  view that marks a winner — the results board, the schedule's season rows and
 *  tie rows, the team-stats table — gates on `"finished"` from here, and each of
 *  them once carried its own copy of the reason. They must not answer
 *  differently about the same fixture: one of them used to mark a winner the
 *  moment a score existed, so a side ahead at the break was printed as having
 *  beaten a side still playing. The score is real before the round is over; the
 *  result is not. */
export function gameweekStatus(
  fixtures: readonly Fixture[],
  gameweek: number,
): FixtureStatus {
  const round = fixtures.filter((fixture) => fixture.gameweek === gameweek);
  if (round.length === 0) return "upcoming";
  if (round.some((fixture) => fixture.status === "live")) return "live";
  return round.every((fixture) => fixture.status === "finished") ? "finished" : "upcoming";
}
/** The round the next ball will be kicked in, and when.
 *
 *  Null once the season's football is all in the past.
 *
 *  **Not "the round in view", and the two come apart every week.** FPL keeps
 *  `is_current` on a finished round until the next deadline, which is right —
 *  people read Monday night's results on Tuesday — so `focusGameweek` answers
 *  "which round is it" and this answers "what is coming up". A caller wanting
 *  the first is asking the wrong one of these. On the last Monday of a round,
 *  with its final match in play, this already names the round after it.
 *
 *  **Ordered by kickoff, never by "the lowest gameweek with an unfinished
 *  match".** `calendar.ts` records that FPL leaves a rearranged fixture in its
 *  original `event`, so a GW20 match replayed in February stays `upcoming`
 *  under gameweek 20 — and the other reading would answer 20 from December
 *  until it was played. The next ball to be kicked is the question with an
 *  answer that survives a postponement.
 *
 *  Undated fixtures are ignored, on the same rule as `duringGameweek`: a TV pick
 *  with no time cannot name a round. So is a fixture FPL has not filed under a
 *  gameweek, because a round with no number is not one a screen can send anybody
 *  to. */
export function nextRound(
  fixtures: readonly Fixture[],
  at: string,
): { gameweek: number; kickoff: string } | null {
  const now = Date.parse(at);
  if (Number.isNaN(now)) return null;

  let soonest: { gameweek: number; kickoff: string; at: number } | null = null;
  for (const fixture of fixtures) {
    if (fixture.kickoff === null || fixture.gameweek === null) continue;
    const kickoff = Date.parse(fixture.kickoff);
    // Inclusive: the ball being kicked at this instant is the next one, not one
    // already gone. `duringGameweek` opens on the same boundary.
    if (Number.isNaN(kickoff) || kickoff < now) continue;
    if (soonest === null || kickoff < soonest.at) {
      soonest = { gameweek: fixture.gameweek, kickoff: fixture.kickoff, at: kickoff };
    }
  }

  return soonest === null ? null : { gameweek: soonest.gameweek, kickoff: soonest.kickoff };
}

/** How settled a finished round is. Three rungs, because "over" is three
 *  different claims on a Saturday night and a screen may only make the one it
 *  can stand behind. */
export type FinishedState = "bonus-settling" | "provisional" | "final";

/** Where a round is on the ladder down from the last whistle, or null while it
 *  is still going — or has not started.
 *
 *  The rungs, in the order they actually happen: the referee blows up and
 *  `finished_provisional` flips, so `status` reads finished while FPL is still
 *  adding bonus (`bonus-settling`); bonus lands (`provisional`); a day or two
 *  later FPL signs the round off (`final`).
 *
 *  **"Final" is claimed only at `data_checked`.** A Final that later moves is
 *  the confident wrong answer wearing the costume that looks most like an
 *  answer, and the whole football layer exists to refuse that trade.
 *
 *  Null covers two states a caller must not conflate with each other but may
 *  render the same way — nothing to say: a round in play, and a round nobody has
 *  kicked off yet. `isMatchdayLive` is what separates them, and callers pair the
 *  two rather than this one growing a fourth answer it would have to invent.
 *
 *  Undated fixtures are ignored, on the same rule as `duringGameweek`: a TV pick
 *  with no time cannot hold a round open, and a round of nothing but undated
 *  matches has not finished — it has not been scheduled. */
export function roundFinished(snapshot: FootballSnapshot): FinishedState | null {
  let anyDated = false;
  let allFinished = true;
  let allSettled = true;

  for (const fixture of snapshot.fixtures) {
    if (fixture.kickoff === null) continue;
    anyDated = true;
    if (fixture.status !== "finished") allFinished = false;
    if (!fixture.settled) allSettled = false;
  }

  if (!anyDated || !allFinished) return null;
  if (!allSettled) return "bonus-settling";
  return snapshot.dataChecked ? "final" : "provisional";
}

/** Where the round stands, as a screen needs to say it: in play, or somewhere on
 *  the ladder down from the last whistle, or nothing.
 *
 *  Null covers two states a caller may render alike but must not conflate — a
 *  round nobody has kicked off, and the gap between two Saturday kickoffs. Both
 *  have nothing to say, which is not the same as nothing happening.
 *
 *  This pairing was written out at four call sites before it was a function, and
 *  the pairing is the whole point: `roundFinished` cannot answer "live" and
 *  `isMatchdayLive` cannot answer "final", so either one alone is half an
 *  answer. Asking them in the wrong order is how the board came to burn a LIVE
 *  dot through a Saturday tea-time. */
export type RoundState = "live" | FinishedState | null;

export function roundState(snapshot: FootballSnapshot): RoundState {
  return isMatchdayLive(snapshot) ? "live" : roundFinished(snapshot);
}
