---
paths:
  - "apps/companion/app/**"
---

# Visible-surface rules (loaded because you are in the app)

`docs/rules/DESIGN.md` is binding and this is its working summary. Where they differ,
`docs/rules/DESIGN.md` wins.

## Every colour is a slot with one meaning

| Token | Means — and only this |
|---|---|
| `--color-accent` (yellow) | **yours · selected · active · primary** |
| `--color-info` (cyan) | **a derived reading** — ours rather than recorded. **A name is WHITE** (CM's own; see `docs/ui/reference/README.md`) |
| `--color-mid` (amber) | **a figure standing alone beside a name** — a fact, a ledger line, a board's one measure. **Never a column of a standings table**, where every figure is ink and only yours takes the accent |
| `--color-bad` (red) | a loss, a doubt, a negative |
| `--color-up` (green) | a gain — the other half of the direction pair |
| `--color-live` | **a match in play**, and nothing else |
| `--color-league` | the league's own mark. **Chrome only — it never says "active"** |
| `--color-league-deep` | the same red as a **ground with text on it** |
| `--color-bg` `surface` `raised` `line` | depth, never meaning |
| `--color-ink` `muted` `faint` | how loud |
| `--color-faint-plate` | the same quiet **on a blue plate** — `faint` is 2.35:1 there |
| `--color-index-free` | **a man on no roster**, anybody's to claim: the index block's green in place of its blue. **A ground, never ink** |

Two that have already caught us: **league red never fills a selected item** — the
accent slot has already answered that question, and a red "active" is three
expressions of one concept with two agreeing. And **`--color-league` carries text
only one step down**: it is 4.94:1 under cream with nothing spare, so a scoreline
whose trailing side dims needs `--color-league-deep` (6.8:1 / 4.3:1).

`--color-faint` on `--color-raised` is 4.6:1 — the tightest pair in the set. Move
one, re-check both.

## The paper is the same tokens re-pointed

`.paper` re-points the semantic tokens at ink on stock rather than editing thirty
components. Two colours on the sheet: ink at an opacity, plus one print red
`--paper-red: #8f2318` (7.4:1), which `--accent` and `--live` both take. Rank on
this sheet is set in **scale, not hue**.

**Colour plates.** A paper prints colour pictures on a cream page: the **pitch**
(a photograph) and the **crest** (a printed mark). `.paper :is(.pitch, .crest)`
restores the desk's tokens inside them. Anything that is a plate joins that
selector; page furniture does not. The failure is silent and total — re-pointing
`--color-cream` at ink turns eleven name plates invisible and stamps the crest in
red on red.

## Type

On the desk, Oxanium for chrome (bars, tabs, the rail, column heads) and Jost for
text and names; **Archivo Narrow with `tnum` for every figure**, in both
registers. Fraunces and Newsreader load from `app/paperFonts.ts` and are imported
**only by paper routes**, so the desk pays nothing for them. Archivo sets the
letterspaced small capitals on the paper too — the body serif never sets a
capital.

## Grammar that outranks the look

- **Absence is `—`, never `0`.**
- **Provenance at the point of use.** Fantrax's numbers are authoritative; ours
  are labelled and **never sit in a column headed `FPts`**.
- **Taps are `min-h-11`** — but that is a rule about a THUMB. Above `lg` the
  desk keeps its own proportions: a repeating ROW is 28px (`.cm-row` in
  `desk.css`), a CONTROL 36 (`lg:min-h-9`), a column head 28 with its strip.
  `docs/rules/PRODUCT.md`'s accessibility section is the parent and carries the three
  exceptions; `tools/ui/tapfit.mjs` measures it.
- The lineup gate, the alphabetical gated order and "no active/reserve leak" are
  product invariants, not visual decisions.
- Motion 150–250ms ease-out, and every animation has a reduced-motion
  alternative that keeps the *information*.

## The Tailwind v4 trap

**v4 drops a theme variable whose name never appears literally in scanned
source.** `var(--color-fdr-${n})` emitted nothing and shipped five colourless
chips. If a token name is composed at runtime, write the names out literally in a
`Record` — with the reason on the constant, as `FixtureChip` does.
