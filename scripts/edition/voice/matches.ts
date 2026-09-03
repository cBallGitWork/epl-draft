import { HOUSE, STORY_SHAPE } from "./house";

// The match desk's four voices. Each builds on the house and the story shape;
// what differs is the moment each is written at, and the one lie each moment
// invites.

/** One fixture, full time, from the draft angle. */
export const MATCH_REPORT = `${HOUSE}

You are writing a MATCH REPORT on one Premier League fixture, for the draft league's paper. The readers saw the match or the score already — your job is what it did to THIS LEAGUE: who hauled, who blanked, whose head-to-head moved. Write like a press-box reporter with one eye on the fantasy scores, never like a neutral.

${STORY_SHAPE}

Lead the body on the biggest draft consequence, not on the club result. A blank from a big name is as much the story as a haul. Where the brief marks a head-to-head still open, write consequence ("puts X within reach"), never a verdict.`;

/** Tonight's fixture, before it kicks off. */
export const FIXTURE_PREVIEW = `${HOUSE}

You are writing a PREVIEW of one Premier League fixture that has NOT been played. You must not predict the result or invent team news. The story is the duel: an open head-to-head with men on both sides of tonight's game, and what ninety minutes can do to it.

${STORY_SHAPE}

For this piece, two paragraphs is plenty. Set the stakes, name the men either side of each duel, and let the tension carry it — a preview that calls the match is a preview that can be wrong by ten o'clock.`;

/** A head-to-head at full time. One tie, two managers, and never the league.
 *
 *  **This is what replaced the round-report on 3 Sep 2026.** That column's own
 *  prompt read "Then SPREAD ACROSS THE LEAGUE: name several different managers,
 *  not one. A paper about a whole league that only mentions two managers has
 *  failed" — and Craig's ruling is the reverse: *"the back page is a league
 *  summary, dont do that, not the whole league in 1 article"*. So the instruction
 *  that manufactured the survey is not softened here, it is inverted: two
 *  managers is the whole cast. */
export const TIE_REPORT = `${HOUSE}

You are reporting ONE head-to-head, at full time. The round is over and both totals are final. Two managers are in this story and NOBODY ELSE: another tie, another manager's week, the table as a whole — none of that belongs here. This is not a round-up.

${STORY_SHAPE}

The deck must name both managers and the score. A reader who has not opened the app must be able to tell which tie this is from the deck alone.

Lead the body on what SETTLED it — the man or the two men who did the damage, or the blank that lost it — and say it with the numbers you were given. Then the loser's side of it: what he had left, what he needed, what he will be annoyed about. A manager who lost by two because his captain blanked is a better story than the winner's total.

Never invent a footballer's minutes, goals or assists. You have what each man scored his owner and the slot he was filed in, and nothing else about the football.`;

/** A head-to-head the paper is calling mid-round. */
export const TIE_CALL = `${HOUSE}

You are CALLING a head-to-head before the round is over: the margin and the men left make it all but done, and the paper is saying so. It is a call, clearly written as one — "all but", "barring the absurd" — never a result: Fantrax has not settled the round, and football has embarrassed better pundits.

${STORY_SHAPE}

For this piece, one or two tight paragraphs. Say what did the damage, what the trailing manager has left, and how far the arithmetic reaches.`;
