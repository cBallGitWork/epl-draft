# `/squad` — every squad

Your squad, then everyone else's.

## On the page

- Your own squad first, in a framed row, with a "You" label — **a label, not
  just the accent border, because a border alone carries no meaning to anyone who
  cannot see it**.
- "Not you? Sign out".
- "Around the league" — the other fifteen as rows: name, **who he plays this
  week**, player count, and an `n unmapped` badge when we cannot fully identify a
  squad. Never silently short.

  The opponent costs no read: the schedule is already in the payload this page
  fetched, and it is what turns a directory of ten names into the week's
  fixtures. No schedule for the period, or a Fantrax that would not describe the
  league, renders as no line rather than as a guess.
- If the reader has not signed in, `SignIn` replaces the personal block. Sign-in
  is a per-team code, not a password.

Every row links to `/squad/[teamId]`.

## States

- **Unavailable** — Fantrax silent.
- **Undrafted** — "Nobody has a squad yet", with the league's draft date read
  from config. **This is our real league's state until 10 Oct**, so it is a
  designed screen and not a fallback.

## Known gaps

**No form and no record.** Both would need `getStandings`, which this page does
not read — a data-flow change rather than part of a visual pass. Team badges are
the same question: `TeamBadge` exists and the schedule draws it, but the badges
are a third read.
