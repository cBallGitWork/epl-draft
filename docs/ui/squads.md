# `/squad` — every squad

Your squad, then everyone else's.

## On the page

- Your own squad first, in a framed row, with a "You" label — **a label, not
  just the accent border, because a border alone carries no meaning to anyone who
  cannot see it**.
- "Not you? Sign out".
- "Around the league" — the other fifteen as rows: name, player count, and an
  `n unmapped` badge when we cannot fully identify a squad. Never silently short.
- If the reader has not signed in, `SignIn` replaces the personal block. Sign-in
  is a per-team code, not a password.

Every row links to `/squad/[teamId]`.

## States

- **Unavailable** — Fantrax silent.
- **Undrafted** — "Nobody has a squad yet", with the league's draft date read
  from config. **This is our real league's state until 10 Oct**, so it is a
  designed screen and not a fallback.

## Known gaps

The row is a name and a number. There is nothing about form, record, or who you
play — all of which exist elsewhere in the app.
