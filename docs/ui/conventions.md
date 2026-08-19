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
| **Sticker** | Merlin 1994/95. **Only ever inside a sticker.** | `sticker-card`, `sticker-keyline`, `sticker-banner-*`, `sticker-backdrop-*` |
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
| `league/PitchFrame` | Hoardings + goal + turf + rows. Full-bleed. Shared by both pitches. |
| `league/PitchTurf` | The grass in perspective, as an inline SVG. |
| `league/PlayerSticker` | One player as a 1994/95 Merlin sticker. |
| `league/StickerFace` | The head panel. Client-only, and has to be — see below. |
| `football/FixtureChip` | Opponent + (H)/(A), coloured by FPL's difficulty. |
| `football/PlayerPortrait` | 32px headshot on club colour, for list rows. |

## Two mechanics worth knowing before you touch them

**Portraits are transparent cut-outs.** Anything drawn *behind* one shows
through the player — a crest across his face. `StickerFace` is a client component
so the crest fallback appears only after the image has actually failed. Do not
move it back to a layer underneath.

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
