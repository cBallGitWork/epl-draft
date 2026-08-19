# `/` — the Gazetta

The front page, and the first thing sixteen people open. A first edition rather
than the full paper: the lead, the week's business, who is hurt, and when lineups
lock.

## In reading order

1. **Masthead** — the paper's name, with a line under it that changes: "Football
   is on. The scores are moving." while live, otherwise when lineups lock.
2. **A live bar**, only while football is on — a link straight to `/matchday`,
   with the pulsing live dot.
3. **Team of the week** — the best XI across the whole league, with its shape.
   Each pick shows what got him picked (`2G · CS`, or minutes if nothing else)
   and who owns him. **The best story on the page is `left him on the bench`**,
   printed when a manager left his own best player out.
4. **The week's business** — trades and claims, grouped so both halves of a trade
   read as one deal. Fantrax's timestamps, shown verbatim with their zone named
   in the heading, because they carry a US Eastern offset.
5. **Doubts** — FPL's injury news across every squad, with chance of playing.
   `no word` when FPL has no opinion, which is not the same as 0%.
6. **Next deadline** — the period boundary, with an explicit note that the
   commissioner's real lock is fifteen minutes before the first fixture and is
   not something Fantrax publishes.

Your own team is marked throughout with the left-edge accent border
(`yoursBorder`).

## States

**Sections with nothing to say do not appear.** An edition padded out with "no
transactions this week" is a worse paper than a shorter one. When there is
nothing at all, one of three `Nothing` panels renders, and which one matters:

- `unavailable` — Fantrax is not answering. The league is fine.
- `undrafted` — no teams yet. **Our real league is in this state until 10 Oct.**
- `quiet` — a drafted league with a genuinely quiet week.

Collapsing those three would tell a drafted league it has not drafted.

## Data

`edition()` assembles it from the gazette builders in
`packages/core/src/gazette/`. All pure — they are handed a snapshot and an
instant, never a clock.

## Known gaps

Visually the plainest page in the app: stacked bordered cards, no hierarchy
beyond the section rules. It is called a *paper* and does not look like one.
