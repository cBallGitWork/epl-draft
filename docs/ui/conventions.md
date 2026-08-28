# Conventions — tokens, components, and what must not move

Everything visual is in `apps/companion/app/globals.css` (tokens) and
`apps/companion/app/components/` (markup). Tailwind v4, no config file: the
theme *is* the `@theme` block in `globals.css`.

## Three colour registers, never muddled

| Register | What it is | Tokens |
|---|---|---|
| **Surfaces** | Near-black, tinted to hue 320. Four steps. | `bg`, `surface`, `raised`, `line` |
| **Football** | The real Premier League. PL's own 2023 palette, read from their live stylesheet — not from a brand site, all of which still republish the 2016 set. | `accent` (PL green), `info` (PL cyan), `live` (PL pink, **live matches only**), `pl-purple` |
| **League** | Our competition. Tim Hortons red, plus a 1964–85 cream. | `league`, `league-dark`, `cream` |
| **Pitch** | The grass, deliberately darker than the sticker backdrop so cards lift off it. | `pitch-turf`, `pitch-mow`, `pitch-surround`, `pitch-line` |
| **FDR** | FPL's five-step fixture difficulty, rebuilt at our lightness. | `fdr-1` … `fdr-5` |
| **Data** | Duller than `accent` on purpose, so a form indicator never competes with a primary action. | `good`, `mid`, `bad` |

Colour appears almost exclusively as **state**. Surfaces stay neutral.

### Tailwind v4 trap, already paid for once

A theme variable is only emitted if its name appears **literally** in scanned
source. `` `var(--color-fdr-${n})` `` compiles to five variables that are never
emitted and five chips with no colour. `FixtureChip` writes the five names out in
a `Record` for exactly this reason — do not "tidy" it back into interpolation.

## Type

Two widths of one superfamily: Archivo for UI, Archivo Narrow (`.numeric`) for
scores, minutes and countdowns. `.numeric` is tabular so digits do not jitter as
they tick — it is the single most important typographic decision in a live view.
Fixed rem scale, ratio ~1.15, `--text-2xs` … `--text-3xl`. No fluid clamps except
inside the sticker, where the card is container-queried.

## Shared components

| Component | Job |
|---|---|
| `shell/PageHeader` | How a section opens: crest, title, one sub-line. |
| `shell/Nothing` | A page that cannot show what it exists to show, saying why — with the provider's own error code on screen. |
| `shell/Section` | A headed block with a rule under it. |
| `shell/ButtonLink` | The one way out of a page. `BUTTON` exports the classes for the single external anchor that cannot be a router link. |
| `shell/TabNav` | Bottom bar on phones, top bar above `md`. The Live tab only exists while football is on. |
| `shell/LeagueCrest` | Our crest. `mark` (no type, legible to ~24px) and `full`. |
| `shell/AutoRefresh` | Client poller. `POLL.live` during football, `POLL.idle` otherwise. |
| `league/PitchFrame` | Hoardings + goal + turf. Full-bleed. |
| `league/PitchRows` | Players in their lines on a `PitchFrame`. **Owns card width and the shrink-not-wrap policy** — all three pitches go through it. |
| `league/PitchTurf` | The grass in perspective, as an inline SVG. |
| `league/LineupPitch` | Your own XI plus the bench, one target per player: tap to pick, tap again for the rest. |
| `league/MoveDialog` | Everywhere one player can go, over the pitch. |
| `league/TeamSheet` | A live XI plus bench, or the same squad as rows, every player opening `LivePlayerCard`. Both boards that show a lineup that counts draw it. |
| `league/PitchPlayer` | One player on the pitch: cut-out, name plate, points band. |
| `league/PlayerImage` | The cut-out itself, with its fallbacks. Client-only, and has to be — see below. |
| `football/FixtureChip` | Opponent + (H)/(A), coloured by FPL's difficulty. |
| `football/PlayerPortrait` | 32px headshot on club colour, for list rows. |

**Rows shrink, they never wrap — and every card is the same size.** A back five
does not fit five cards at full width on a phone, and wrapping put one defender
on a row of his own below the other four, which reads as a formation nobody
picked. `PitchRows` used to give each cell `flex-1` under a `max-w`, which shrank
a crowded line and left an uncrowded one wide — so one XI stood at three sizes
down the pitch. The basis now comes from the FULLEST line in the set and is given
to every card, so a shorter line centres in the space instead. The name inside is
one size in container-query units and truncates. Row padding is
the taper's **own** inset — `FAR_INSET`, exported by `PitchTurf` and set on the
frame as `--pitch-inset`, which the hoardings read too. One number, three
readers: it used to be written out twice with a comment asking the next person to
keep the two in step.

**`--page-gutter` and `.bleed`.** `<main>` sets the side margin from the token;
the two things wide enough to break out of it — the pitch and the bench strip —
use `.bleed`, which is the negative of the same value. Three files used to write
`px-3 sm:px-4` and `-mx-3 sm:-mx-4` by hand.

## Four mechanics worth knowing before you touch them

**Portraits are transparent cut-outs, and nothing is drawn behind them.** That is
now the whole look: no card, no keyline, no studio backdrop — the pitch is the
background. It replaced a 1994/95 Merlin sticker, which was handsome on its own
and wrong at fifteen-up, because every border and backdrop sat between the reader
and the only two things he came for: the face and the fixture.

`PlayerImage` is a client component and has to be. A transparent PNG cannot be
layered over a fallback and left to cover it, so a fallback can only appear once
an image has actually failed to load — and only the browser knows that.

Four rungs: **this season's photograph → one of ours → the club's kit →
initials.**

- About 17 in 60 players have no photograph in the Premier League's current set.
- **Ours** live in `apps/companion/public/portraits/{code}.png`, keyed on the FPL
  season-stable player code, dropped in by hand. A missing one costs a local 404.
  **Not `public/players/`** — that path is the player-profile route, so a miss
  there resolves to a page rather than a 404 and asks Fantrax about an id that is
  not a player.
- **The kit** is the floor and a solid one: `shirtUrl(club, keeper)` picks by club
  code rather than by a photograph of a man, so it is right the day he signs.
  Keeper kits are the `_1` variant, chosen by `isGoalkeeper(slot.position)` —
  which reads the same single declaration the pitch order rests on, so a league
  that files keepers under "GK" needs one edit and not two.
- The set *before* the current one still answers and is deliberately never used:
  it would put those players back in the shirts they wore two clubs ago, and a
  wrong photograph is worse than none because only one of the two looks like an
  answer.

The case that still slips through is a photograph taken *within* the current set
and overtaken by a January transfer — undetectable from the asset, and nothing
marks it. A file in `public/portraits/` overrides it.

**The points band, and the one rule under it: a card says one thing at a time.**
The third band of a player on the grass is his fixture until he kicks off and his
score after it, and the two never share the space. Played, it flips to a dark
ground with cream numerals so the figure a manager came for is the loudest thing
on the card; waiting, it is the FDR colour at full strength. Both are the same
fixed height — a line whose cards stand at different heights stops reading as a
line — and "he has not played" is said by dimming the **photograph** alone.
Dimming the whole card said it too, and took the fixture colour and the name with
it.

**Two player cards, and they are not one card with a flag.** `PlayerCard` answers
*who is this and is he fit* — read midweek, going through somebody's fifteen: the
fixture, the kickoff, FPL's fitness note, why a slot is unresolved.
`LivePlayerCard` answers *what is he scoring and why* — read at ten past four:
Fantrax's own category breakdown, summing to the total exactly, with FPL's record
on a line of its own and labelled as FPL's. Same dialog skeleton, different
questions, opened on different days. A third card is a sign one of these two has
lost its question.

**The pitch angle is in the ground, never in a transform.** A CSS `perspective`
on the container would tilt the stickers with it, and a sticker is a flat printed
object photographed square. The trapezoid, the growing mow bands and the splayed
markings are drawn in `PitchTurf`.

## Motion and access

150–250ms, ease-out only; users are in flow. The live dot is the one place
motion carries meaning, and it is always paired with the word LIVE so it never
relies on colour or movement alone. `prefers-reduced-motion` has a real
alternative for every animation. One focus treatment everywhere, never removed.

## Times

Every time in the app is UK time wherever the reader is (`londonTime.ts`), and
"15:00" has to mean the same thing in Toronto as in Leeds. Fantrax's own
timestamps carry a US Eastern offset and are shown **verbatim with their zone
named**, never silently converted.
