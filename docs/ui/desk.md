# `/matchday/desk` — the desk

Every score in the league and every score in the round, on one screen, with
nothing else on it. Jeff's wall of monitors.

Reached from the **Live** section and nowhere else. The argument was width — six
tabs already brushed the 320px clip `tools/ui/navfit.mjs` measured, and a seventh
would have cost every other tab its label. The rail turned that into a height
question on 31 Aug 2026, and laying it along the foot of a phone turned it back: **the
two shapes fail on different axes**, which is why `navfit` reads which one is on
screen and asks it its own question — down the side runs out of HEIGHT and along
the foot runs out of WIDTH per tab. On the phone, six tabs at 320 leave 49px for a
label, and a seventh would leave 45.

The answer did not change under either framing: a screen reached from the one
section it belongs to is where it belongs. The count is `sections.ts` and is
deliberately not written here — it said six through two additions of a seventh.

## On the page

1. **Head-to-head** — all eight pairings, one line each: `name  63.2 – 59.1
   name`. Yours first and in accent. The trailing number dims, a missing total
   is a dash and never a nought — the same reading as every other scoreline in
   the app.
2. **The football** — all ten fixtures, one line each: `ARS v NEW  2–1  FT`, or
   the kickoff time where a score would be. A fixture with one of your players
   in it has its clubs in accent.
3. One provenance line: Fantrax's points above, the Premier League's below.

## The vidiprinter register

Borrowed **in voice and typography, not in colour**. The app's tokens stay; the
colour registers are binding and Ceefax's are not ours. Two conventions:

- **The spelled-out thrashing.** A side on four or more prints the number in
  words after the digit — `BOU 4 (FOUR) – 1 LIV`. Four is Sky's threshold, not
  one of ours, and the whole joke is the machine no longer trusting you to
  believe the digit. Above nine the digit stands alone.

  **A football fact only.** There is no equivalent for a fantasy total: "a lot
  of points" has no custom behind it, and inventing a threshold would be us
  making the joke rather than quoting it.
- **The day, in the tick's slot, until the match starts** — `Sat`, `Sun`, `Mon`.
  A round runs Friday to Monday, so eighteen rows sorted by instant print 17:30
  above 14:00 and read as scrambled. It goes here rather than beside the time
  because that column is where the score lands.
- **A tick where the kickoff time was** — the minute while a match is live, `FT`
  when it is over. **No `HT`**: FPL publishes a minute and a finished flag, and
  a clock stopped on 45 is not a claim they have made — a match genuinely in its
  45th minute reads identically.

## Constraints

- **Nothing on this page is a link** (bar the provenance line back to Live). It
  is a wall of scores read at arm's length, and every row exists elsewhere as a
  tappable thing. Eighteen rows at a 44px target would cost the screen the one
  property it is for: all of it visible at once. If a row ever becomes tappable,
  the density argument has to be made again from scratch.
- **The figure is shared; the row around it is not.** This note used to say a
  third occurrence of the scoreline grammar would force the extraction. The front
  page's scoreboard was the third, so `components/league/ScoreFigure` now holds the
  part that was genuinely one rule — a dash for a total Fantrax did not give, and
  the trailing side dims — while size, family and width stay the caller's. The
  row is still its own: a card is a 44px tap target, and these are wall rows with
  nothing to tap.
- Works **signed out** as a neutral desk: no accent anywhere, every score still
  on screen. Works with **no league at all** — an undrafted or silent Fantrax
  costs the top section and nothing else, because the football half needs no
  credentials.

## States

No pairings this period, and no fixtures named yet: each is one quiet line
inside its own section rather than a whole-page `Nothing`. The other section is
still worth reading.

## Known gaps

Unproven against real football — every row above was written before a ball was
kicked in 26/27. The spelled-out thrashing in particular has never rendered.
