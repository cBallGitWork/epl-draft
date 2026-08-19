# `/players` — the pool

Every player Fantrax knows, what our league has decided about him, and what
Fantrax scores him.

## On the page

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

It is a spreadsheet. 697 rows with no faces, no crests and no sense of who is
worth looking at — compare the squad list, which now leads every row with a
crest.
