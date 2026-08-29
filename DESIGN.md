# Design — binding

The visual contract. `CODE_RULES.md` and `PRODUCT.md` still override this file;
`docs/ui/` still describes what each page *is*. This says what the app **looks
like**, and why, in terms a change can be checked against.

Every ratio quoted here was computed, not judged. WCAG 2.1 AA is the floor in
both registers and there are no exceptions to it in the tree.

---

## 1. Two registers

The site is two things at once and stopped pretending otherwise on 29 Aug 2026.

| | **The Paper** | **The Desk** |
|---|---|---|
| Where | `/`, and everything written | League · Squads · Live · Players · FPL |
| What it is | a newspaper, printed | a management terminal |
| Ground | warm off-white stock | blue-black |
| Type | serif display and prose | one bold humanist sans |
| Colour | ink, rules, and the league's red | CM 99/00's grammar (§3) |

They share a skeleton, and the skeleton is what stops this reading as two
websites: one spacing scale, one set of nav bones, and **Archivo Narrow tabular
numerals for every figure in both registers**. A score is set the same way on
newsprint as on the desk, because a score is the one thing that is the same
object in both places.

The Paper is the front page's `.paper` scope. The Desk is the root `@theme` —
it has no class of its own, because it is the default and giving the default a
class costs thirty components a class name for nothing.

## 2. The Desk is Championship Manager 99/00

Not "retro-flavoured". The league is sixteen men in their forties who played it,
and it is the density benchmark: attribute grids, 1–20 ratings, W-D-L strings,
red and green figures, a text-commentary matchday.

Studied from the game's own screenshots (myabandonware, `championship-manager-
season-99-00-*`), not from memory of it. **One deliberate departure:** CM drew
every screen over a darkened match photograph. We keep the darkness and the
blueness and drop the photograph — it fails AA outright and no amount of scrim
fixes a ground that changes under the text.

## 3. The Desk's palette

Each colour is a **slot with one meaning**. This is CM's actual grammar and it
is more specific than a palette; it is the reason the token names in
`tokens.css` did not change when every value did.

| Slot | Token | Means | On `--bg` |
|---|---|---|---|
| Ground | `--color-bg` `surface` `raised` `line` | depth, never meaning | — |
| Ink | `--color-ink` `muted` `faint` | how loud | 17.1 · 8.7 · 5.3 |
| Yellow | `--color-accent` | **yours · selected · active · primary** | 13.1 |
| Cyan | `--color-info` | **a person** — and secondary emphasis | 11.2 |
| Amber | `--color-mid` | **a figure** | 9.8 |
| Red | `--color-bad` | **a loss, a doubt, a negative** | 5.6 |
| Live red | `--color-live` | **a match in play**, and nothing else | 5.4 |
| League red | `--color-league` | the league's own mark. Chrome only | 3.2 |
| Cream | `--color-cream` | ink on a colour plate | — |

`--color-faint` on `--color-raised` is 4.6:1. That is the tightest pair in the
set and it is what fixes where the raised step can sit; move one, re-check both.

The live red and the league red are one hue on purpose — the league is what is
live. The live red is the brand red lifted until it carries text, because
`#C8102E` is 3.2:1 on this ground.

**Retired, and why:** the Premier League's brand set (green primary, pink LIVE,
neon cyan) was the football register doing league-register work, and the
football is now one tab of six. It survives only where it is *data* rather than
dress — the fixture-difficulty scale, and club colours, which belong to the
clubs and are not ours to restyle.

## 4. The Paper

`.paper` re-points the same semantic tokens at ink on stock, rather than editing
thirty components. A component asking for `text-muted` wants "quieter than the
body", and that is a different colour on paper than on glass.

Two slots cannot be supplied by re-pointing ink, because their desk value is a
*colour* rather than a lightness: `--accent` and `--live`. Both are the league
speaking, and on stock the league speaks in its own red at 5.0:1 — where the
desk's yellow is 1.3:1 and its live red 2.6:1.

## 5. Colour plates

A paper prints colour pictures on a cream page. Two things here are that: the
**pitch**, which is a photograph rather than prose, and the **crest**, which is a
printed mark whose red and cream are the mark's and not the page's.

`.paper :is(.pitch, .crest)` restores the desk's tokens inside them. Anything
that is a plate joins that selector; anything that is page furniture does not.
The failure this prevents is silent and total — re-pointing `--color-cream` at
ink turns eleven name plates invisible and stamps the crest in red on red.

## 6. Type

Four faces, four roles.

| Face | Role | Register |
|---|---|---|
| Fraunces | masthead, display, drop caps | Paper |
| Newsreader | prose, italic decks | Paper |
| Archivo | UI | Desk |
| Archivo Narrow, `tnum` | **every figure** | both |

Fraunces and Newsreader load from `app/paperFonts.ts`, imported only by paper
routes, so the desk pays nothing for them. Georgia is the declared fallback and
is a real transitional serif on every device that will open this.

The scale is fixed rem, ratio ~1.15, product UI, no fluid clamps outside the
masthead.

## 7. Grammar that outranks the look

From `docs/ui/conventions.md`, restated because a redesign is exactly when these
get broken:

- **Absence is `—`, never `0`.** A confident wrong number is worse than a hedged
  right one.
- **Provenance at the point of use.** Every derived figure says whose it is.
  Fantrax's numbers are authoritative; ours are labelled and never sit in a
  column headed `FPts`.
- **Taps are `min-h-11`.**
- The lineup gate, the alphabetical gated order, and "no active/reserve leak"
  are product invariants. They are not visual decisions and a redesign does not
  get to renegotiate them.
- Motion: 150–250ms, ease-out. Every animation has a reduced-motion alternative
  that keeps the *information* — the live dot keeps a static presence, a changed
  figure crossfades.

## 8. Deferred, deliberately

Recorded so the next agent does not read the absence as an oversight.

- **`--color-up` / `--color-down`.** The `good`/`mid`/`bad` names carry two
  jobs between them — a *direction* (a negative score) and a *caution* (a man
  with a doubt) — and untangling that is a refactor, not a retoken. It lands
  with the league screens, which are the first surface that needs both at once.
- **`--color-link`.** CM's cyan means "a person". Nothing links a person yet;
  the token arrives with the standings table that does. `--color-info` holds the
  value until then.
- **`--text-4xl` / `--text-6xl` / `--text-3xs`.** Three sizes are in use and
  undeclared, so they silently take Tailwind's defaults and break the declared
  ratio. Declaring them changes type sizes, which is the font phase's business,
  not the palette's.
- **The 6–7px clamp floors on the pitch.** Survivable only once the pitch is
  demoted from the squad screen's default, which is Craig's call to make at
  wireframe sign-off.
- **No `--focus` token.** The ring is `--accent`: "this is where you are" and
  "this is what is selected" are one statement, and the accent slot already
  carries it correctly in both registers without the rule knowing which page it
  is on.
