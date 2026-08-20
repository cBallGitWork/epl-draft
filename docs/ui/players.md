# `/players` — the pool

Every player Fantrax knows, what our league has decided about him, and what
Fantrax scores him.

## On the page

- **Every row leads with a face on his club's colour** — the same 32px mark the
  fixture list uses. It carries two things at once: the photograph where there
  is one, and the club always, because the circle behind it is the kit. A man
  with no headshot is still placed by his colours and his initials rather than
  by a broken image.

  The FPL code comes **straight off the bridge**, not through a football
  snapshot: the code is the only thing a portrait needs, and joining the whole
  football layer here would give a page that is entirely Fantrax's a second
  provider it could fail on. 120 of the 688 are academy names FPL has never
  listed; the bridge records that as a settled answer, and it costs the
  photograph and nothing else.

  Fantrax's club code is translated through `toFplClubCode` before it reaches
  the palette. The two providers agree on eighteen clubs of twenty, and the
  other two would take the fallback grey on every row they appeared in — a wrong
  answer that looks exactly like a club we have no colours for.
- Filter chips by status, counted from the data: **Free agent · Waivers ·
  Rostered**. The codes are Fantrax's (`FA`, `WW`, `T`); anything we have not
  seen renders as the raw code rather than as a guess.
- A sortable table. **Sorting is a link, not a click handler** — the server does
  the ordering, the phone gets HTML, and a sort survives being shared.
- Columns the phone cannot hold are hidden above `md` rather than shrunk. A row a
  thumb can hit and eyes can read at arm's length holds four things.
- Paged at `PAGE_ROWS` with a "show all" escape.

## Provenance, which is load-bearing here

The heading says which season the numbers are **and whether they were played or
predicted**. Fantrax defaults these reads to a projection, and a column headed
FPts that silently switched between the two would be the confident wrong answer.

## States

Unavailable — ownership is the part that would go stale first, so the page shows
nothing rather than yesterday's.

## Known gaps

Still no sense of **who is worth looking at**: the order is Fantrax's rank or a
column sort, and nothing marks form, fitness or a player your own squad is short
of. The faces made it a page about footballers; they did not make it a page that
recommends one.
