# Championship Manager — the reference library

**This folder is the work base.** `DESIGN.md` §2 and the 29 Aug handover both say
the CM reference was "studied from the game's own screenshots… not from memory of
it" — and then nobody committed the screenshots. Every session since has been
building from a prose summary of pixels it could not see, which is how a bevel
gets bolted to a modern layout and the result "looks nothing like CM".

**No CM claim in a commit message, a doc or a code comment may cite memory. It
cites a numbered shot in here.**

`fetch.sh` re-downloads the set and records exactly how. Two things that cost an
afternoon each: `.jpg` is full size and `.png` under the same prefix is a
thumbnail, and a `Referer` header naming the game page is required — without it
the CDN serves a 404 body with a 404 status.

| Folder | Release | Shots |
|---|---|---|
| `cm9900/` | **Season 99/00 — the binding reference** | 21 |
| `cm3/` | Championship Manager 3 — the same engine generation | 8 |
| `cm0102/` | Season 01/02 | 12 |
| `cm0001/` | Season 00/01 | 1 |

## Measured geometry

Everything below was measured off the pixels (`cm9900/12.jpg` and `21.jpg`), not
judged by eye.

| Thing | Measured |
|---|---|
| Canvas | **800 × 600** — *not* 640×480, which earlier density arithmetic assumed |
| Sidebar width | **90px — 11.25% of the canvas** |
| Title bar | ~60px tall, full content width, bold white, centred |
| Tab strip | ~36px tall, tabs butted with no gap |
| **Table row pitch** | **~18px** — about 30 rows to a screen |
| Column-head strip | ~16px, bevelled, one continuous run |

At our 800px-equivalent widths that 18px row is why CM reads as dense and a
44px row does not. It is also why the desk target is 28px and not 44 — see
`PRODUCT.md`'s tap floor, which is ours and not CM's.

## Measured palette

Sampled from the images. Ratios computed against CM's own row ground `#4c4944`.

| Role | CM's value | Ratio | Where |
|---|---|---|---|
| Title bar | `#0030a6` royal blue | 10.64 vs its white title | `12.jpg`, `23.jpg` |
| Active tab | `#ffff03` pure yellow, text **and** border | — | `05.jpg`, `16.jpg`, `21.jpg` |
| Index cell | `#1f13a7` deep blue block | 10.75 vs its white number | `12.jpg`, `21.jpg`, `23.jpg` |
| Button / column-head plate | light grey, highlight edge `#fbf9fc` | **7.34** off the ground | `12.jpg` |
| Person link | `#6bfdfa` cyan | 7.28 | `12.jpg` names, `21.jpg` names |
| Stat figure | `#faff00` **yellow** | 8.26 | `21.jpg` stat columns |
| Unavailable | `#7d8e6c` grey | **2.54** | `16.jpg`, `21.jpg` non-playing subs |
| `Inj` box | red fill, white text | — | `12.jpg` (Billic) |
| `Fut` box | yellow fill, dark text | — | `12.jpg` (Degn, Farrelly) |
| Money / value column | white on a purple-magenta **ground** | — | `12.jpg` Value, `23.jpg` fee |

## Three corrections to `HANDOVER.md` §3

The prose summary was written from these same shots and got three things wrong.
This is the whole argument for committing the pictures.

1. **"Orange stat figures" — the figures are YELLOW, `#faff00`.** Measured across
   the stats table in `21.jpg`. Orange does exist, but it means an **event or a
   change**, not a figure: `on 71` and `Inj 7` in `16.jpg`, `to Lazio` in
   `23.jpg`. Two different jobs the summary merged into one.
2. **"Match header: home on a blue panel, away on red" — the panels are the two
   CLUBS' OWN COLOURS.** `21.jpg` is Everton blue `#073cc6` against Arsenal red
   `#fd0019`; `16.jpg` is the same Everton blue against Torquay **white**. This is
   a much better rule and it maps straight onto the `clubColours` we already hold.
3. **The canvas is 800×600**, not the 640×480 the density arithmetic assumed.

## Two things CM did that we deliberately will not

- **The darkened match photograph behind every screen.** `09.jpg` shows why: the
  disabled options over the goalmouth are barely readable. `DESIGN.md` §2 already
  recorded dropping it. The library confirms the call rather than reopening it.
- **Greying a man out to 2.54:1.** CM put unavailable players below any modern
  floor. Ours grey to `--color-faint`, which is 5.34:1 on our ground — the same
  signal, above `PRODUCT.md`'s AA floor.

## What the screenshots settle about structure

- The **left rail is permanent chrome**, ~11% of the width, carrying the date in
  yellow, arrow steppers, the manager's name in cyan, and section links in white.
- A screen is a **title bar, a tab strip, one or more bevelled panels, and a
  button row at the foot** — not a scrolling column of headings.
- The column-head strip is **one continuous bevelled run**, not separated buttons.
- Rows sit **straight on the ground**: no card, no zebra, no gap. The only
  repeating fill is the **index cell** down the left.

## Index

All 42 have been read. The table below is the 36 indexed by the cataloguing pass;
the six read by hand are detailed under it. Twelve carry a dense data table, and
those are the ones to build from.

| Shot | Screen | Dense table | Column heads read off the image |
|---|---|---|---|
| `cm0001/01.jpg` | Setup Game main menu |  | — |
| `cm0102/01.jpg` | Setup Game main menu |  | — |
| `cm0102/02.jpg` | Live match - Match Overview |  | — |
| `cm0102/03.jpg` | Game Settings modal dialog |  | — |
| `cm0102/04.jpg` | Setup Game main menu |  | — |
| `cm0102/05.jpg` | Save Game Info modal dialog |  | — |
| `cm0102/06.jpg` | Enter Name - manager details form |  | — |
| `cm0102/07.jpg` | Club squad list | **✔** | Position(s) |
| `cm0102/08.jpg` | Player profile - attributes | **✔** | Apps, Con, Asts, MoM, Pass, Tck, Drb, Sh Tar, Av R |
| `cm0102/09.jpg` | Player news inbox |  | — |
| `cm0102/10.jpg` | News inbox with Game Options menu |  | — |
| `cm0102/11.jpg` | News inbox - transfer bid item |  | — |
| `cm0102/12.jpg` | Save game file dialog |  | — |
| `cm3/01.jpg` | Setup Game main menu |  | — |
| `cm3/02.jpg` | Select League(s) — nation picker | **✔** | none drawn — the table has no header row; the three unlabelled columns are nation name, then a SELECTED cell, … |
| `cm3/03.jpg` | Manager news inbox — article reader |  | news list is 2 columns, unheaded: date/time cell, then headline |
| `cm3/04.jpg` | Club squad list - Position(s) view | **✔** | Green slot header row: GK, DL, DR, DC, DC, ML, MR, MC, MC, FC, FC, SB1, SB2, SB3, SB4, SB5 (plus 3 unlabelled … |
| `cm3/05.jpg` | In-match Match Overview - commentary |  | — |
| `cm3/06.jpg` | In-match Player Ratings - both teams | **✔** | No printed headers. Three unlabelled columns per team: squad number (on a blue ground), player name, rating |
| `cm3/07.jpg` | Tactics — formation and pitch |  | — |
| `cm3/08.jpg` | In-match player stats table | **✔** | Pas, Cmp, Key, Tck, Won, Key, Hea, Won, Key, Ast, Sho, On, Con, plus one unlabelled rating column at the far r… |
| `cm9900/01.jpg` | Setup Game main menu |  | — |
| `cm9900/02.jpg` | Match report - player ratings | **✔** | none drawn - the list has no header row; columns are positional (squad no. / card / name / sub note / rating /… |
| `cm9900/03.jpg` | Game Settings modal dialog |  | — |
| `cm9900/04.jpg` | Select Team (club picker) | **✔** | — |
| `cm9900/06.jpg` | Club screen - Finances & Info |  | — |
| `cm9900/08.jpg` | Manager news inbox |  | Date/time (unlabelled), Headline (unlabelled) |
| `cm9900/10.jpg` | Club squad list | **✔** | GK, DL, DR, DC, DC, ML, MR, MC, MC, FC, FC, SB1, SB2, SB3, SB4, SB5, SB6, SB7, SB8, SB9 (position/selection sl… |
| `cm9900/11.jpg` | Player profile - attributes | **✔** | Apps, Gls, Con, Pens, Asts, Yel, Red, MoM, Av R |
| `cm9900/13.jpg` | Transfer bid dialog |  | — |
| `cm9900/14.jpg` | Set Role At Club dialog |  | — |
| `cm9900/15.jpg` | Offer Contract - Basic terms |  | — |
| `cm9900/19.jpg` | Tactics - team formation | **✔** | (none drawn - unheaded 3-column list: shirt number / player name / condition %) |
| `cm9900/22.jpg` | Match Stats (in-match) |  | — |
| `cm9900/24.jpg` | League table - English Premier Division | **✔** | Pld, Won, Drn, Lst, For, Ag, Pts |
| `cm9900/25.jpg` | Squad list - Everton |  | — |

### The six read first, in more detail

| Shot | Why it matters |
|---|---|
| `cm9900/12.jpg` | **The reference table.** Bevelled heads, blue index cells, cyan names, yellow figures, red `Inj`, yellow `Fut`, purple value column |
| `cm9900/21.jpg` | **The densest table in the set** — 13 abbreviated stat columns, club-coloured header panels |
| `cm9900/16.jpg` | Player ratings — greyed non-playing subs, cyan ratings, yellow card boxes |
| `cm9900/23.jpg` | Transfers — blue date index, yellow clubs, orange destinations, purple fee column |
| `cm9900/05.jpg` | News — tab strip, selected row on a red ground |
| `cm9900/09.jpg` | Meet with Board — the clearest look at the rail, and at why the photograph had to go |
