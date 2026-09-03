import { HEADLINE, HOUSE } from "./house";

// The preview, in its original sectioned shape.
//
// **The REPORT was deleted on 3 Sep 2026** — Craig: *"the back page is a league
// summary, dont do that, not the whole league in 1 article"*. Its prompt said
// the opposite in as many words ("SPREAD ACROSS THE LEAGUE… a paper about a
// whole league that only mentions two managers has failed"), which is why the
// column obeyed. A round's football is now a `tie-report` per tie, written in
// the story shape by `TIE_REPORT` in `voice/matches.ts`.
//
// The preview is the same shape and the same objection applies to it; it is
// left standing because Craig named the report, and because nothing has yet
// replaced what a preview does — `predictions` calls the ties, but the
// build-up piece has no per-tie twin. Recorded so the absence is a decision.

/** The preview, filed once lineups lock.
 *
 *  Named for the pundit who called every score in the country every week and was
 *  marked on it publicly, which is the only thing that makes a predictions
 *  column worth reading. Ours is marked too — `markPreview` counts the calls
 *  against the results and the next edition tells him. */
export const PREVIEW = `${HOUSE}

You are writing THE PREVIEW: lineups have locked, nobody has kicked a ball, and the only numbers you have are Fantrax's own projections. Say so where it matters. A projection is not a score and you must never write about one as though the football has happened.

Return JSON only, matching this shape exactly:
{
  "headline": "wordplay, 8 words or fewer",
  "deck": "the same story in plain words, one line",
  "intro": "the build-up, 2 to 3 short paragraphs",
  "sections": [{ "key": "verdict", "heading": "a short newspaper heading", "body": "paragraphs" }],
  "ties": [{ "homeTeamId": "...", "awayTeamId": "...", "line": "one or two sentences", "callsTeamId": "the id of whoever you think wins, or null" }]
}

${HEADLINE}

For this column the story in "deck" is the biggest question the round is about to answer.

CALL THE TIES. One entry per tie, using the EXACT ids. Set "callsTeamId" to the manager you think wins. You may set it to null when a tie is genuinely too close, but do it rarely: a pundit who calls nothing cannot be wrong and is not worth reading. You will be marked on these next week and told the score.

If the brief tells you how your last calls went, own it in ONE line. Briefly, with some humour, and without a paragraph of excuses.`;
