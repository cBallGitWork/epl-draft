# What's needed — 29 Aug 2026, the redesign day

Replaces the 27 Aug handover. State: `main`, **24 commits ahead of `origin/main`,
NOT pushed**, rebased clean onto origin (nothing behind). Working tree clean but
for `probe3.mjs` and `scripts/_probe-deals.ts`, both untracked. 669 tests ·
typecheck · lint · build were green immediately **before** the rebase; they have
not been re-run since it. Run them before pushing.

Today was a UI overhaul, run by two sessions in one tree. Thirty-four commits.
The paper became a newspaper, the desk did not become Championship Manager, and
the second of those is the whole of what is left.

---

## 1. Push first. Nothing has left the machine.

Twenty-four commits sit unpushed, which is the same shape as the fault the 27 Aug
handover opens on — production serving old code while a day's work looks done.
`origin/main` has none of today.

**Rebase, never merge**, still, and for the reason that file records: `vercel.json`
reads `git diff HEAD^ HEAD`. The rebase onto `origin/main` is already done and was
clean — the two incoming commits were cron round-state appends touching only
`data/probes/round-state/gw2.jsonl`, with zero overlap. So the push is unblocked;
it just has not happened.

## 2. The direction, and it is locked

Recorded in full at `~/.claude/plans/i-need-a-complete-parallel-cocke.md`. The
short form, all of it Craig's own calls today:

- **Two registers, one product.** `/` and the written journalism are **the
  Gazetta** — a live newspaper. The other five tabs are **the Desk** — a
  Championship Manager 99/00 management terminal. Shared skeleton: one spacing
  scale, Archivo Narrow tabular figures for every number, the same nav bones.
- **The site is an info product** — the go-to place for sixteen managers to read
  Fantrax, FPL and the Premier League in one place, on phone and desktop, fast.
- **One exception to info-only: team editing survives**, scoped to **formation
  changes and starter↔bench swaps only**. No waivers, no claims, no drops, no
  trades — ever. It must be **one tap, like an FPL pick page**, and it must
  actually write to Fantrax.
- **Players becomes a scouting desk** — heavy data, all four sources approved,
  plus heatmaps and shots from `~/ai-carling-premiership`.
- **The paper gets a banter section set** — Lawro-voice predictions, Crooks-voice
  Team of the Week captions, The Bin, The Points Dodgers, waiver roundups, AI
  press conferences. Parody personas, obviously parody.

## 3. What the CM reference actually is

Studied from real screenshots today (myabandonware, game page
`championship-manager-season-99-00-bjo`, full-size at
`/media/screenshots/c/championship-manager-season-99-00-iu6/…_{1,3,5,9,12,15,21,24}.jpg`
— note `.jpg` for full size, `.png` only for thumbs, and a `Referer` header is
required). Worth committing two or three under `docs/ui/reference/cm9900/`.

What the game is, as opposed to what it is remembered as:

- Royal-blue title bars, bold white titles; a royal-blue sidebar with yellow,
  white and cyan links; grey **bevelled** buttons.
- Tabs in indigo fills; the active one is **yellow text with a yellow border**.
- Tables are the icon: grey bevel **column-header buttons** that sort, bold white
  rows **directly on the dark ground with no card and no zebra**, greyed-out
  unavailable players, red `Inj` and yellow `Fut` state boxes, small blue leading
  index cells, **orange stat figures**, **cyan person links**, and the cut line
  drawn as a **yellow dashed rule across the table**.
- Match header: home on a blue panel, away on red, white score boxes, minute in
  yellow.

Semantics: yellow = active/yours · cyan = person links · orange = figures · red =
negative and the away side · green = positive · royal blue = chrome.

## 4. What got built today

Genuinely done, and it is the boring half that is easy to get wrong:

- **The paper is a newspaper.** Rosa stock `#f6ddd2` on `#2a2018` ink, Fraunces
  nameplate, Newsreader prose, ink rules, dateline, ruled crest plate, drop cap,
  CSS multi-columns, and a real lead-and-rail broadsheet at `@3xl`.
- **The token system is the plan's**, and it is correct: navy ramp
  `oklch(0.185 0.045 265)`, CM yellow accent `oklch(0.88 0.16 95)`, live red,
  league red, AA-verified ink ladder. `paper.css` splits the registers cleanly.
- **`DESIGN.md`** exists at the repo root and is binding.
- **All thirteen `loading.tsx`**, a `Skeleton` primitive that self-skins per
  register, `LiveStrip`, `LiveNow`, one poller in the shell.
- **A lot of new data reached the screens** — form strings, games back, win
  percentage, per-squad prices, records, ownership trend, four scout numbers the
  live feed does not carry per match.

## 5. What did NOT get built, and it is the thing Craig is looking at

**The Desk is a recolour, not a redesign.** Commit `5a2c485` 14:58, "the other
five tabs are a management terminal", touched four files — `tokens.css`,
`globals.css`, `layout.tsx`, `FixtureChip.tsx`. Palette only. No screen
component, no table, no structure. It was then never revisited: the session ran
plan phases 1–4 and jumped to phase 8, skipping **5 (league screens), 6 (squads,
table-first), 7 (matchday)** — which are exactly the three phases that convert
the five tabs to CM. So the data those tables were meant to display arrived, and
the tables did not.

Measured against §3, still missing everywhere but `/players`:

- 26 files still wrap rows in rounded bordered cards. League, Squads and FPL are
  card stacks on a navy ground.
- No bevelled column-header buttons anywhere in the CSS.
- No orange figures, no cyan person links, no `Inj`/`Fut` state boxes.
- The playoff cut line is solid league red, not a yellow dashed rule.

`/players` is the exception and the proof it works — a genuine dense sortable
table.

**Start with the League table.** It is the smallest of the three screens and it
answers, in one screen, whether the CM direction lands before six more are built
on it.

## 6. Two changes landed this evening, after Craig saw it

- `78e9923` **the paper prints in two colours.** Every rule and column head went
  from league red to ink; the sheet is ink at an opacity plus one print red
  `#8f2318`, reached only by LIVE and "yours". `--color-league` is re-pointed at
  the print red so nothing can reach the brand colour by accident; `.crest`
  restores it, because a crest is a printed mark rather than page furniture. The
  stock moved to the reference's rosa — reversing a recorded decision, with the
  reversal recorded.
- `8a17574` **Team of the Week is a rail column.** It was a full-bleed pitch
  closing the lead column and ran most of a phone screen on its own. The lines
  survive as grouping under small-capital position labels with the shape in the
  head's aside; it leads the rail, because it is the one block there anybody
  reads for pleasure.

**Known consequence to look at:** the lead column is now thin on desktop — the
pitch was what filled it. On the rehearsal league that is partly honest (two ties,
no filed column). If it still looks thin on the real league with a column filed,
the answer is the written column and the picture, not the eleven going back.

## 7. Hazards

- **Two sessions have been committing in this one tree.** The other is
  `epl-draft-1-7c` (idle since 18:02). It does not appear in `ListAgents`, so
  `SendMessage` may not reach it. Do not both edit.
- **A dev server is running** on `localhost:3000`, started from this tree. Next 16
  keeps `.next/dev` and `.next/build` separate, so it does not fight the build
  gate, but it is still running.
- **The rebase rewrote 24 commit hashes.** Anything holding the old ones is stale.
- **`npm run dev` reads `apps/companion/.env.local`**, not the repo-root one.
  Unchanged, still true, still the thing that catches people.

## 8. Still Craig's

1. **Create a second Fantrax account owning one rehearsal team.** This is the
   critical path for the lineup write and nothing else can start it: without it
   every `adminMode` probe is a self-write and proves nothing.
2. **Choose a masthead photograph.** The crest-in-a-box ships until then and is
   not a placeholder, but a grayscale photo is what makes the reference read as
   print.
3. **The 10 Oct league swap** — `FANTRAX_LEAGUE_ID` to `ayyoh3n2mr326v2o`, *and*
   the separate environment in `.github/workflows/editions.yml`, which inherits
   nothing from Vercel.

## 9. Before every commit, still

```bash
npm test          # 669, all green
npm run typecheck
npm run lint
npm run build
```

Plus an eyeball at 390×844 and at ≥lg, and the front page after every phase — the
season is live. `node tools/ui/navfit.mjs` after any chrome change; it drives
Chrome over CDP on port 9261.
