# `/route` — what it is in plain English

*Copy this file, keep the headings you need, delete the rest and delete this
line. It is the shape every doc in this folder already had; writing it down
stops the next one being reverse-engineered from `prem.md`.*

One or two lines saying what the screen is FOR. Where there is a single ruling
that governs it, put it here in bold and in one sentence — `league-table.md`
opens "Fantrax computes the standings. **This page never adds anything up.**"
and everything below is downstream of that.

`../../DESIGN.md` is binding for colour and type and this file defers to it.
`../../CODE_RULES.md` says what may be done to the code. **This folder describes
what exists; those say what may be done to it.**

## On the page

What is there today, in reading order. Eleven of the thirteen route docs use
this exact heading — use a different one only when the screen is genuinely not
read top to bottom.

## <a named decision>

One section per decision worth defending, headed with the decision rather than
with a category. Every claim is attributed, and there are only three ways to do
it:

1. **A dated quote.** "(Craig, 2 Sep 2026: *'leave the player stats bit for
   now, that's a full section on its own'*)"
2. **A numbered screenshot**, by path the first time and bare after —
   `docs/ui/reference/cm9900/24.jpg`, then `24.jpg`. `reference/README.md`
   catalogues all forty-two. **No CM claim anywhere may cite memory**; it cites
   a shot.
3. **A pointer into the code** — `football/table.ts` carries the probe;
   `node tools/ui/pitchfit.mjs` is how this is checked.

Screenshots are referenced, never embedded: no `![]()` appears in this folder.

## States

Every empty, error and loading state the routes have, as a table. `prem.md` went
without one until 3 Sep 2026 while carrying five `Nothing` sites, which is how a
state gets built twice.

| Screen | State | What it says |
|---|---|---|

## The files

Optional, and worth it once a route is more than two files: route → file → what
it draws.

## Known gaps

What is missing and why. **A landed item is struck through in place, dated, and
kept** — `~~**The thing.**~~ **Closed 29 Aug 2026**, and not the way it was
written…` — because a dated record of a reversal is worth more than a silence,
and the next person to propose it deserves the argument that was had.

Numbers cite the instrument that produced them and carry the date they were
measured. A stale number is dated rather than deleted; `squad.md` keeps
August's figures for exactly that reason and says so.
