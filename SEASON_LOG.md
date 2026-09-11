# Season log — the dated entries

Split out of `PLATFORM_NOTES.md` on 3 Sep 2026, in their original order with
their headings untouched. Nothing here was rewritten; the file it came from
keeps the standing half — the probes, the decisions and the recorded rule
exceptions — and points here.

**These entries describe the past and are supposed to.** A claim in here was
true on its date and is not a statement about the tree today; that is why
`docs-drift-auditor` exempts a season log, and why anything still load-bearing
belongs in `PLATFORM_NOTES.md` instead of here.

## 11 Sep 2026 — the match scoresheet folds, and three furniture rows get their size back

Craig, against the Ipswich 0-2 Liverpool Overview: *"stadium name, data, and
gameweek, referee row all way to small… owner name can go after ISAK (put in
brackets), saves a row… assist can then go under goalscorer (and show owner
name)… isak can have one row only for both goals… both assists can be one row too
if its both. if it was 2 players, just show two assists row… can make scorer and
minute font bigger… stadium name and ref row only show on overview page."* Seven
asks, and they are one argument: the screen with the fewest facts in the app was
spending the most rows on them.

**One row per SCORER.** `goalGroups` in `packages/core/.../sheetEvents.ts` folds
a side's goals by the man who got them, keyed on the pair `(scorer, own)` so an
own goal never joins his real ones — they are credited to different sides — and
on the minute for a scorer the bridge could not place, because two nulls are two
men. Six tests. Isak reads `6', 9'` on one line; Alex Scott's two Bournemouth
goals, which were the case that argued for goal-rows on 10 Sep, read `9', 35'`
with his one assister under them once.

**It is not a reversal of the 10 Sep move.** That day's change was from a list of
MEN to a list of GOALS, because a man-row gave a scorer and an assister the same
ink. They still sit on different lines, in different ink, at different sizes;
what folded is a man's own name repeated over his second goal.

**The owner moved into brackets after the name** and the assister got one, which
he never had — a league team name is a gloss on the name it follows, not a fact
with a row of its own. Two rows of chrome per scorer became none.

**Three sizes, off the reference's own proportions rather than a feeling.**
`cm0102/02.jpg` sets its scorer at about 2.2% of an 800px canvas, its dated strip
and its foot line at about 1.4%, and its ground caption at about 1.75%. On a 1440
desk that is 32, 20 and 25; ours were 24, 14 and 18. Scorer and minute
`lg:text-2xl → lg:text-3xl`, the date strip and the referee line
`lg:text-sm → lg:text-xl`, and the shared `Caption` `lg:text-lg → lg:text-2xl`.
**The phone is unchanged at all three**, because a scoresheet column is half a
390px screen and the caption's 28px band is already mostly filled — the complaint
was about a desk and the arithmetic only argues for a desk.

**The ground caption and the referee line are the Overview's alone now.** They
were under all five tabs on the argument that a fact about the match is true on
the stats board as much as on the scoresheet — which it is, and is beside the
point: the other four are TABLES, and a table pushed down by a ground it did not
ask for has paid two rows of a phone's screen for a fact already read. The
fixture detail read they come off is only made on that route now. The Player
Stats table starts two rows higher.

`sweep` clean on all 30 routes at both widths, 1274 tests green.


## A second client component, on purpose

`AutoRefresh` was the app's only `"use client"` file and its comment said so
deliberately. `LineupPlanner` is the second, and it earns it: the whole feature
is an XI you rearrange and look at before committing, so the edited shape has to
live in browser state.

It reuses `lineup()` and `Pitch` unchanged by rebuilding a `RosteredTeam` from
the edited slots, rather than growing a second renderer that can drift from the
real one. The planner never writes: it ends in an outbound link, and
`FANTRAX_APP_BASE` deliberately stops at the league path — the only URL shape
confirmed from a real browser session. A deeper guess at their roster route would
break silently the day they reorganise.

Only the fifteen squad members' eligibility crosses to the browser, not the
pool's 697.

## A third client component: the tab bar (SUPERSEDED 31 Aug 2026 — now the rail)

**`TabNav` is deleted.** `shell/Rail` replaced it on 31 Aug 2026 and the season
log carries the argument. What survives verbatim below is the part that did not
change: the reason the shell's nav is a client component, and route ownership.
What is now false: the two shapes, the flipping active edge, and the fixed
bottom bar — the rail is one shape at every width and marks its section with
`cm-tab`'s pressed bevel. Left standing rather than rewritten, because a log that
edits its own past stops being one.

`TabNav` is `"use client"` for one reason — `usePathname`. A tab bar that
cannot say which section you are in is a row of links, and the answer only exists
in the browser. Nothing else in it is interactive.

Each tab owns a set of routes rather than the single one it links to, so reading
a squad (`/squad/[teamId]`) or a past gameweek (`/gw/[n]`) keeps its section lit.
It carries its own `env(safe-area-inset-bottom)` padding: the body's padding does
nothing for a fixed element, which is positioned against the viewport.

**One component in two shapes** (13 Aug): a fixed bottom bar on a phone, a sticky
masthead row at the top from `md` up. It was `BottomNav` and is now `TabNav`,
because the name had stopped being true at half the widths we serve. Two
components would mean two copies of the route-ownership table, and the copy not
on the phone is the one that would rot. It renders *before* `<main>` so the
desktop bar can be sticky in normal flow; on a phone `fixed` takes it out of flow
and document order costs nothing. The active indicator flips edges with the bar —
`border-t` under a thumb, `border-b` under a masthead.

Two in-content links became redundant the moment it landed and one of them went:
the undrafted state's "The football, meanwhile" is now the Matchday tab. "Every
squad" on a team page stays — it is an up-link within a section, not navigation
between them.

## CI, and the hosting decision (13 Aug 2026)

`verify.yml` runs the four green checks — test, typecheck, lint, build, cheapest
failure first — on `push` and `pull_request`, which unlike `schedule` fire from
any branch. The build step prerenders against live FPL and Fantrax, so a
provider shape change reddens CI before it reaches a phone; the cost is that a
provider blip can too.

**Known trap, accepted:** the daily capture pushes with `GITHUB_TOKEN`, which by
design triggers no other workflows. Capture commits land on `main` with no
Verify run beside them. They touch only `data/snapshots/`, so this is
acceptable — but it is the same class of trap as the cron that had never fired:
automation that looks attached and is not.

**Hosting is live — Vercel, deployed 13 Aug 2026.** Production is
**`https://epl-draft-companion.vercel.app`**, building from `main`. Verified
from outside the same day: squads render players, which proves the bridge JSON
crossed the root-directory boundary — the failure the plan expected first — and
the optimizer serves PL portraits at ~25 KB from ~330 KB sources. One lag to
know rather than rediscover: production is `main`, so a feature branch's routes
404 there until it merges (`/matchup` did, on day one). The settings, recorded
for whoever revisits them:
Root Directory `apps/companion` with *include files outside the root directory*
left on, because `@epl/core` ships raw TypeScript via `transpilePackages` (so
install must run at the repo root) and `app/squad/league.ts` imports the bridge
JSON from `data/mappings/` outside the app directory — if the first build
breaks, expect it to break there. `FANTRAX_LEAGUE_ID` is set explicitly in the
dashboard (rehearsal `zbn1z3ukmsgb36sz` until 10 Oct), which makes the swap one
dashboard field — and being a dashboard value it is invisible to git, so it goes
in the ship-day runbook as a numbered step. `FANTRAX_COOKIE` is read by nothing
in the tree and must never reach Vercel. Expect a redeploy per day off the
capture commit; Ignored Build Step is the lever if that becomes noise.

### A push that deploys nothing — the commit author is a deploy credential

The merge of `feat/fantrax-league-layer` into `main` at 10:53 produced a
Production deployment that Vercel reported as **`failure — Deployment was
blocked`**, so the URL kept serving the 10:49 build and `/matchup` stayed a 404
on a commit that contains it. Nothing was wrong with the code: `verify.yml` was
green on the same commit, and the identical build passes locally.

**The cause was the commit's author email.** Vercel blocks a deployment whose
commit author cannot be matched to a GitHub account, and every commit here was
authored `craigdavidball14@gmail.com`, which is not on the `EH775` account. That
makes `user.email` a deploy credential in this repo, which is not how anyone
reads a git config. The tell is free and precise: GitHub's API returns
`author: null` for a commit it cannot attribute, so

```bash
gh api repos/EH775/epl-draft/commits/main -q '.author.login // "UNMATCHED"'
```

answers "will this deploy?" before the push does. Fixed by setting the author to
the account's own noreply address, **repo-locally** rather than globally —
`git config --local user.email 51231517+EH775@users.noreply.github.com` — so the
one repository whose pushes are deployments carries the identity that deploys
them, and Craig's other work is untouched. A fresh commit is required either
way: Vercel judges the commit it is given and does not retry an older one.

Blocked is not failed — the build never ran, which is why there was no build log
to read, only the deployment page.

Worth writing down beyond its own fix, because it is the **third** instance of
one pattern this month: the capture cron that had never fired, the capture
commits that trigger no workflow, and now a git push that deploys nothing. Every
one of them looks automated from the inside and is not. Green CI says the code
is good; it does not say the code shipped. **Before 10 Oct, the ship-day runbook
must check the deployed URL itself, not the commit that was pushed to it.**

## The squad view, for the fourteen squads that are not yours (19 Aug 2026)

`/squad/[teamId]` had two states: the pitch once a period opens, and `SquadList`
— fifteen names in a column — before it. The second is the state a rival's squad
is in every time you open it before a deadline, and a column of names is not a
squad screen.

It is now a board with two arrangements and a card over the top:

- **`squadUnarranged()` in `join/lineup.ts`**, beside `squadInLines()`. All
  fifteen in positional lines, **no bench and no active/reserve mark**, sorted by
  name within each line. The sort is load-bearing, not tidy: `squadInLines()`
  lifts the actives to the front of every line, which is the XI restated as an
  ordering. Fantrax happens to interleave actives and reserves in the payload, so
  rendering their order happens not to leak the lineup today — their
  serialisation detail, not a promise. Sorting by name makes the non-leak a
  property of the file.
- **Grouped by `slot.position`, never by eligibility.** Fantrax supports
  multi-position players ("F,M" is common), so eligibility would put the same
  footballer in two lines or make the view pick one for him. The manager already
  picked, and his choice is on the roster.
- **`oppositionByClub()` / `oppositionLabel()`** in a new `football/opposition.ts`.
  Who a club plays this round is a football fact — the fixture list is fixed for
  everyone — so it is answered in the football layer and never inferred from the
  league. A list per club rather than one fixture, because a blank gameweek gives
  a club none and a double gives it two, and `oppositionLabel()` returns null for
  the blank so each caller decides what fits its space.
- **The sticker's strip prints the fixture** while there is nothing to report,
  and minutes once he is on. The crest in the corner already says which club he
  is, so the club code that used to sit there was three characters spent twice.
- **`StickerFace` is a client component, and had to be.** The Premier League's
  portraits are cut-outs on a transparent ground, so a fallback drawn *behind*
  one shows through the player rather than behind him — a crest across his face.
  It has to appear only once the image has actually failed, and only the browser
  knows that. It fails often enough to be worth the boundary: January signings
  and academy call-ups go weeks without a headshot.
- **The player card is a dialog, not a route.** The question a tap asks is "who
  is this and is he fit" while reading somebody else's fifteen, and navigating
  away to answer it loses the squad being read. Native `<dialog>`, so Escape, the
  focus trap and the inert background are the browser's job. The subject of the
  card is the same sticker at album size — tapping a sticker to be shown a
  plainer portrait would look like a different player.
- **The route now knows whose squad it is serving.** `mine` gates the lineup
  planner (rearranging a rival's team is not yours to do, preview league or not)
  and changes what the gate is said *about*: on a rival's team it explains why you
  cannot see their XI, on your own why you cannot see the one you set yourself.

Second pass the same day, from design review:

- **The pitch is angled.** `PitchTurf` draws the trapezoid, the mow bands growing
  toward the reader and the markings splayed with them — penalty area, six-yard
  box, D, spot, and the centre circle at the near edge where it can never run
  through a row. The angle is in the ground and never in a CSS `perspective`: a
  transform would tilt the stickers with it, and a sticker is a flat printed
  object photographed square.
- **`PitchFrame` is shared with the matchday XI**, hoardings and all, and the
  hoardings carry the league crest — which is where a sponsor goes the day the
  league has one. They are the width of the far touchline rather than of the
  page: boards stand behind that goal line, and running them full width puts
  advertising on ground the perspective says is off the pitch. The `.album` red banding around both pitches is gone; the
  surround and the boards are the frame now, and the CSS went with it.
- **The pitch is full-bleed** and fits a 390x844 phone without scrolling. That
  cost the gate's explanation paragraph for the ordinary `not-started` case and
  the standalone provenance line. Neither claim was dropped, only moved: the
  three abnormal gate reasons still print, and the projection warning became the
  list's column heading ("Proj" rather than "FPts"), which costs no height.
- **FPL's fixture difficulty crossed into the football layer.** `Fixture` now
  carries `homeDifficulty`/`awayDifficulty` from `team_h_difficulty` /
  `team_a_difficulty` (probed live, 19 Aug), and `Opposition` carries the rating
  for the club being asked about. It is FPL's opinion and printed as such —
  unrated is drawn neutral rather than given a middle score we invented.
- **Tailwind v4 drops a theme variable whose name never appears literally in
  scanned source.** `var(--color-fdr-${n})` emitted nothing and shipped five
  colourless chips. `FixtureChip` writes the five names out in a `Record`, with
  the reason on the constant.
- **`getTeamRosterInfo` gives a whole squad's points in one public call**, so the
  list view has a real stat column. `yearToDate` and `readTeamStats` moved out of
  the player page into `app/teamStats.ts` — two `unstable_cache` calls with the
  same key are two definitions of one cache.

Two recorded rule exceptions from this work, both §3 and both deliberate:

- **The squad list spells position letters out.** "Never translate Fantrax's
  vocabulary" is the rule, and `getLeagueInfo` was probed again on 19 Aug to see
  whether it publishes long names: it does not — `rosterInfo.positionConstraints`
  and every `playerInfo[].eligiblePos` are bare letters. A readable heading can
  therefore only come from us. `POSITION_NAME` in `SquadRows` covers the four
  letters this league uses and **falls back to the raw letter**, so a
  commissioner who files wingers under W still gets "W".
- **Two touch targets below `min-h-11`.** The squad board's view toggle and the
  list row are `min-h-9`, at Craig's direction, to fit the pitch on a phone
  without scrolling and to get fifteen rows onto one screen. Everything else in
  the app keeps the 44px target.

Refactor pass over all of it the same day, against §1 and §2:

- **`squadDetail()` in `join/`, and the join moved to the server.** The pitch,
  the list and the card each ran `isResolved(x) ? map.get(x.player.clubId) : …`
  against the club map and the fixture map — the third copy is what makes it a
  rule. Worse than the duplication was where it ran: on the browser, which meant
  the RSC payload carried all 20 clubs and every fixture in the round so fifteen
  players could look two of them up. One pure, tested join now happens in the
  route and the views receive `SquadPlayerDetail`.
- **`PlayerSticker` takes the club it draws, not the directory to find it in.**
  Same reason: two callers were doing the lookup and one was doing it twice.
- **Three bugs the refactor surfaced.** A player missing from Fantrax's points
  table rendered no cell at all rather than a dash, so one row in fifteen lost
  its last column; every sticker button on the pitch carried the same
  `aria-label` ("D — open player card") so a screen reader could not tell five
  defenders apart; and a slot with no position at all printed an empty heading.
- **The pitch geometry is derived, not drawn.** `PitchTurf` was fourteen
  hand-measured path strings, and moving one line meant re-deriving the other
  four by hand. It now holds two picture decisions (`FAR_INSET`, `SPLAY_END`), a
  marking scale, and the real dimensions of a pitch in metres; every path is
  computed. The `clipPath` went with it — it needed a document-unique id and the
  component can appear twice — so the mow bands are trapezoids by construction.
- **`--pitch-boards` is one value.** The hoardings' height was written three
  times: the boards, the turf that starts under them, and the padding that keeps
  the far row clear. They had already disagreed once.
- **The board cannot render empty.** It is built exactly when the gate is closed
  and the route branches on its existence rather than re-testing the display, so
  there is no arrangement that renders a board with nothing on it — and
  `getTeamRosterInfo` is no longer requested on the two paths that never show it.

**Caught in review, before it shipped: the board was handing out the lineup.**
`SquadBoard` is a client component, so `SquadDetailLine[]` is serialised into the
page — and `SquadPlayerDetail` carried the whole `RosteredPlayer`, `slot.status`
included. A rival's squad in `squad` mode shipped **eleven ACTIVE and four
RESERVE** in its own source while the screen withheld the lineup, which is
exactly what `visibility.ts` exists to prevent and what it means by "the app is
the only place that could leak it".

The ordering was already handled — `squadUnarranged` sorts by name for this
reason — but ordering is what the *screen* shows and the payload is a separate
question. `squadDetail` now blanks `status` on the way out, with a test that
asserts neither word appears in the serialised lines. The old `SquadList` was a
server component and never had the problem: the regression came in with the
client boundary, which is where this class of bug always comes from.

## The portraits had been two years stale and nothing said so (19 Aug 2026)

Craig looked at a squad and said the shirts were wrong. They were: Isak in
Newcastle black two clubs later, João Pedro in Brighton stripes at Chelsea.

`resources.premierleague.com/premierleague/photos/players/250x250/p{code}.png`
answers **200** and serves the set as it stood on **14 Aug 2024**. That is the
whole reason it went unnoticed — there is no 404 to catch, no error to log, and
the only symptom is a footballer in last season's kit, which looks like a
photograph rather than a bug.

The current path was found by reading FPL's own production bundle rather than by
guessing at prefixes:

    …/premierleague25/photos/players/110x140/{code}.png

Three things changed at once — the prefix, the size, and the loss of the `p`
before the code — which is why every plausible guess had 403'd. `premierleague25`
is theirs and is **not a season number**: this is 26/27, `premierleague26`
answers 502, and the assets under 25 are dated Aug–Sep 2025. It is recorded in
`config.ts` with the probe date and must never be computed from the season.

Two things this exposed:

- **`next.config.ts` allow-lists image paths, not just hosts.** A pattern naming
  only `/premierleague/**` fails every portrait at our own optimizer — a 400 from
  us, which looks like a CDN problem and is not.
- **The two sets are not nested.** Of 60 players sampled: 43 have a current
  photograph, 35 an old one, 31 both, 13 neither. The old path was briefly kept
  as a second choice for the four who are only in it, Bruno Guimarães among them,
  and that was wrong: it put exactly those four back in the shirts they wore two
  clubs ago, which is the failure the move was fixing. Craig's rule, and it is
  the right one — **a player whose photograph is missing and a player whose
  photograph is out of date get the same answer: his club's crest.** A wrong
  photograph is worse than none, because only one of the two looks like an
  answer. `StickerFace` falls current → crest → initials.

  The limit of it: "out of date" is only detectable as "absent from the current
  set". A photograph taken inside the current set and overtaken by a January
  transfer looks identical to a good one, and nothing marks it.

The crest badge came off the sticker's corner in the same pass. It was there to
name the club a stale photograph contradicted, and that job is done. The crest
that stands in for a missing photograph grew to fill the card it is replacing.

Two pitch corrections the same day, both from Craig looking at it:

- **The touchlines could not stop splaying.** They ran outward in perspective and
  then went square at 38% of the depth, where the grass did. An eye still
  following the line reads that stop as the pitch turning back in. One straight
  taper over the whole depth now, and the earlier "reach full width sooner" was
  buying width the cards never needed — they are sized against the frame, not the
  turf.
- **The pitch has no surround.** Outside the taper is the page, as on FPL's.
  A second green out there reads as a second surface and turns the pitch into a
  bordered panel. `--color-pitch-surround` went with it.

Still open: the view reads the snapshot's own gameweek. Browsing a *future* round
needs a gameweek in the URL, a snapshot fetched for it, and `getTeamRosters` asked
for the matching period — the fixtures come free, the roster does not.

## `docs/ui/` — the handover to whoever does the visual pass (19 Aug 2026)

One file per route, plus `conventions.md` for the token registers and the shared
components. It describes what is on each page, every state it can reach, and
where it is weak — and it names the four things a redesign may not break: the
lineup gate, provenance at the point of use, absence modelled rather than
defaulted, and the phone-first touch targets.

It is documentation of the app as built, not a plan. When a page changes, its
file changes in the same commit or it starts lying.

## The owner's lineup screen, and the refactor after it (19 Aug 2026)

Your own team gets a planner: the XI on the grass, the bench on a dark strip
below it, a swap target and an options badge on every player. Two ways in,
because they answer different questions — tapping the card **picks** a man and
the pitch dims everyone he cannot legally change places with, while the ⇄ opens
the full list, which is the only place a move with no second player (off to the
bench, across to another position) can be offered. Every rule enforced is the
commissioner's, straight out of `moves.ts`; none of it is new logic.

Two interaction bugs found by using it. The options sheet rendered in the flow
below the bench, which on a phone is a screen and a half beneath the man you just
tapped, so tapping him looked like it had done nothing — it is a dialog now. And
a full XI made the sheet offer eight ways into midfield and then say midfield was
closed, because `eligibleSlots` reports `squad-full` for a position that
`legalMoves` is simultaneously offering swaps into.

The refactor pass afterwards:

- **`PitchRows`.** Three screens draw players in lines — a rival's XI, a rival's
  whole squad, your own lineup — and had drifted into three answers to the same
  two questions: how wide is a card, and what happens when a line will not fit.
  One of them still wrapped, with sizes from an earlier design. The cell is what
  varies, so the cell is what each caller now supplies.
- **Shrink, never wrap.** The old rule was the opposite and it was wrong: a back
  five wrapped one defender onto a row of his own, which reads as a formation
  nobody picked. With seven in a line the outer two also hung off the tapering
  grass onto the page, so row padding became a share of the width.
- **`--page-gutter` / `.bleed`.** The page's side margin was written out in three
  files, twice as its own negative.
- **The unresolved card was a different shape** from a resolved one — one box at
  its own proportions — so it left a hole in any row where the bridge had not
  settled somebody. It is built from the same three bands now.

## The extension plan is dead, and it was dead on arrival (19 Aug 2026)

"Members provide their own Fantrax session cookie via a browser extension" has
been the recorded answer to the write problem since 5 Aug. Craig killed it in one
line: **regular users won't do this, and most users are on mobile.**

Both halves are right, and the second is fatal on its own. Chrome on Android has
no extensions. Safari on iOS has them, but they are a per-user App Store install
and a permissions dance, for sixteen friends who want to move a midfielder to the
bench. Nothing about that survives contact with a group chat.

What is left, in order of how much it asks of a member:

1. **The commissioner's session plus `adminMode`.** `confirmOrExecuteTeamRosterChanges`
   takes `fantasyTeamId` and `adminMode` (CLAUDE.md, probed 3 Aug), so a
   commissioner session may be able to set *any* team's lineup. That would mean
   one cookie, held by one person who is already in the habit of refreshing it,
   and members authenticated by the team codes we already issue. A member needs
   to know nothing. **Unprobed** — whether `adminMode` actually writes another
   team's roster is the question the whole path rests on, and it is answerable
   safely against the rehearsal league, whose teams belong to nobody.
2. **A native shell with a webview login.** Open Fantrax's own login in a
   webview, let the member clear reCAPTCHA and 2FA there, keep the cookie the
   webview collects. This is how everyone else solves it. It also means we are
   shipping an app to sixteen phones, which is a different project.
3. **Deep-link and let Fantrax take it.** What we do now, but pointed at their
   app rather than their website. Costs nothing, asks nothing, and the value we
   add stays where it already is: the planning, with the commissioner's rules
   enforced and the fixtures and difficulty on screen. Submitting was never the
   hard part of a lineup.

Cookie expiry bites option 1 in a way worth naming: one stale cookie takes the
write surface down for all sixteen at once, so it needs a visible staleness
state and a path back to "open Fantrax yourself", not a spinner.

## The live head-to-head, and what a score is allowed to say (19 Aug 2026)

`docs/ui/matchday.md` named the biggest hole in the app: the live view could say
a manager was on 47 points and could show him Arsenal against Coventry, and
never once said which of his own players had done it. The score was a number
with no players behind it.

`/league/matchups/[teamId]` is the answer, and the layout is taken from the
sister repo's Duel screen (`~/worldcup-fantasy`, `app/components/MatchupBoard.tsx`):
two tabs carrying the two totals, a momentum bar under them, and the open tab's
eleven on the grass below. Two tabs rather than two pitches — thirty players on a
phone is fifteen unreadable ones, and the tab a manager is *not* looking at still
answers the question he is asking at 4pm.

**No new Fantrax read.** The board is composed entirely of calls the app already
makes and already caches: `getTeamRosters` for the elevens, `getLiveScoringStats`
for the totals, FPL's live endpoint for what each player has done.

### Per-player points, and where they actually come from

`getLiveScoringStats` does not carry them — `statsMap` and `statsMap2` are `{}`
in every capture, so what they hold once football is on is still unknown.
**`getTeamRosterInfo` does**, it is public, and **it honours `period`**: probed
live 19 Aug against periods 1 and 3, `displayedPeriod` echoes the request and
`periodOppnentTeamIds` changes to match. So the board prices the week on screen
rather than whatever week Fantrax happens to be pointing at, and `fetchTeamStats`
grew an optional `period` for it.

One read per side, cached. A refusal costs the numbers and nothing else: that
side's players fall back to their **minutes**, told apart by the apostrophe. One
table either arrives or it does not, so a side never mixes points and minutes.

The scoreline is Fantrax's, under Fantrax's scoring. What each player *did* —
goals, assists, clean sheet, minutes — is **FPL's**, joined through the bridge.
Two providers on one card, and neither is recomputed.

### The gate is per side, not per page

`teamDisplay(squads, yours)` is asked twice, once per side. Your own eleven is
yours all week; a rival's waits for his period to open. During live football both
are open by definition — but this is also the screen a manager reads on a Tuesday
to see who he plays, and then exactly one of the two is. A gated side shows one
sentence and a link to that team's squad page, which is where the reasons are
already spelled out; it does not grow a second copy of them.

### `headToHead`, and the third occurrence

`periodPairings` reports Fantrax's home and away because that is what the
schedule says. Every screen that shows a head-to-head to a *particular* manager
immediately undoes it — there is no ground, so neither side is at home, and a
manager reads his own team first. Three screens had written
`pairing.home.teamId === mine ? … : …` for themselves, which is §1's third
occurrence. `headToHead(matchups, teams, period, teamId)` answers
`{ team, opponent }` and all three now read it.

### Accent still means "you"

The leader is deliberately not accent-tinted, which is what the sister repo does.
Accent means "your team" on five other screens (`mine.ts` says so in as many
words) and marks your name on the scoreline here, so a second meaning for it
would break a reading aid rather than add one. Whoever is ahead reads at full
strength; the side behind is dimmed.

### Three things the design lost on contact with Craig, and one it gained

The first pass had two stacked tab-cards, a momentum bar under them, a count of
players still to play on each, and a provenance line. All four went:

- **The scoreline is one row.** `123 · 59.1 · v · 63.2 · test3`, read the way a
  score is said out loud. Two stacked cards made a reader compare two numbers in
  different places on the screen, which is the one thing a scoreline exists not
  to make you do.
- **The momentum bar is gone**, and `momentumShare` with it — §2 does not let an
  unused export sit in the tree, so the module and its tests were deleted rather
  than kept warm for a bar nobody wanted.
- **"n to play" is gone.** Everyone who has not kicked off is drawn back on the
  pitch instead, which names them rather than counting them, and his strip
  carries his fixture. The greying already existed (`PlayerImage` had it at
  `opacity-80`); it moved up to the whole card at `opacity-55` so it reads as a
  state rather than a rendering artefact.
- **The provenance line is gone**, which is a real cost against principle 4 and
  is recorded as one. The line still runs on `/league/matchups`, where sixteen
  cards of nothing but numbers precede it.

What it gained is a **bench** and a **Pitch/List toggle**. `Pitch` used to stand
all fifteen on the grass with reserves marked by a word; it now draws the eleven
and a bench strip, which took `squadInLines()` out of core with it — its only
consumer had stopped being one.

### What the dummy Saturday caught

The preview harness (`scratchpad/preview/`, a `fetch` shim under `NODE_OPTIONS`,
no repo code) invented a gameweek an hour into its 3pm kick-offs. Two bugs that
only exist with live data surfaced within a minute of looking at it:

- **A player's minutes printed as "9".** Three chips and a number do not fit a
  56px card, and the flexbox chose the number to cut. Chips are ranked now
  (`Chips.tsx` — RC, goal, assist, clean sheet, saves, booking), capped at two,
  and the number is `shrink-0`: a clipped chip is untidy, a clipped number is
  wrong.
- **A booking rendered as a blank box.** The `note` tone was `bg-white/15
  text-white`, written when the strip was dark. The strip is cream now and the
  same chip also renders on a dark list row, so the tone is solid — anything that
  borrows its ground is legible on exactly one of the two.

`tally()` moved out of the component into `join/contribution.ts` on the way,
where §5 puts arithmetic over football data, and picked up the tests it never
had — including the one that matters: `every()` on an empty list is true, which
would have credited fifteen players with a clean sheet apiece before a ball was
kicked.

### Where the taps go now

Tapping a team on `/league/matchups` opens the board on that team rather than
that team's squad: both sides of a card lead to the same head-to-head, and it
arrives showing whichever name the thumb landed on. `YourMatchup` on the live tab
does the same. Each squad is one further tap, from there.

## The pitch views, after a fresh-eyes pass (19 Aug 2026)

Craig asked for a UX review of the three screens that draw a pitch — the live
head-to-head, the gated squad board, and your own lineup planner — and a round of
fixes. What the review found, and what each fix cost.

### The score was the smallest thing on a live pitch

A player's points sat at eight or nine pixels beside two chips, on the same cream
plate as his name. On the one screen a manager opens *because* of the number, the
number was the hardest thing on it to find.

The fix is a band rather than a size: once he has played, the bottom band flips
to `bg-bg` with cream numerals at `clamp(9px,16cqw,13px)`, and the chips read
better against it than they ever did against cream. Until he plays, that same
band is his FDR fixture at full strength. The two never share the space.

Both states are one fixed height (`h-3.5`), and that is load-bearing: a row where
a played card and a waiting card stand at different heights stops reading as a
row. `FixtureChip` had to learn to centre its text by grid rather than by line
height, because the colour is now asked to fill a box it does not define.

**The height is a budget, not a preference.** The board is documented as fitting
390×844 without scrolling, and it did — at exactly 844. A 16px band took it to
863. The band is 14px and `PitchFrame`'s row gap went from `gap-5` to `gap-4`,
which puts it back at 844 with the bigger number. Anything added to a pitch card
comes out of that same 844.

### Dimming the whole card said the wrong thing

A player still to play was drawn back with `opacity-55` on the card, which took
the FDR colour and the name with it — the two things a waiting player still
needs. Only the photograph dims now (`opacity-80 grayscale-[35%]`, on the `<img>`
inside `PlayerImage`), and the plate and the fixture stay at full contrast. It
also freed `opacity-30` on the planner to mean one thing: blocked.

`FixtureChip`'s blank case was quietly broken by the same history. It drew light
grey ink on whatever it was sitting on, which was fine on three dark surfaces and
invisible once the band under a player turned cream. It brings its own `raised`
ground now, exactly as a rated fixture brings its FDR colour.

### The live board had no answer to a tap

Eleven faces, a score, and nothing behind either. `TeamSheet` replaced the server
`Pitch`: same eleven and bench, every card a button, and `LivePlayerCard` over
the top. The squad page's rival branch draws the same component, so "why is he on
12" has one answer wherever it is asked.

The breakdown costs **no new read**. `getTeamRosterInfo` with `view: "FPTS"` was
already being called once per side for the points column, and the same response
carries each total broken into the league's own scoring categories — they sum to
it exactly (verified 30/30 rows, 13 Aug). `league/breakdown.ts` pairs each
group's columns with each line's values, drops null and 0, and sorts largest
first. Games played falls out by being 0 in that view, which is also why their
own table leaves it out of the sum.

That file is the rule of three arriving on time: the player profile's season
table (`players/[fantraxId]/season.ts`) and its label-splitting
(`Breakdown.tsx`) were doing the same pairing and the same `" -- "` split, and
the live card would have been the third. `BreakdownLine` carries the label and
the definition apart, so no view does string surgery on provider data.

**Two player cards, deliberately.** `PlayerCard` answers "who is this and is he
fit"; `LivePlayerCard` answers "what is he scoring and why". Same dialog
skeleton, different questions, opened on different days. Folding them into one
card with a flag would make the midweek card carry an empty table and the
Saturday card carry a fitness note nobody is asking about at 4pm.

### The `+1` came off the scoreline

Pending clean sheets rode beside each total as a green `+n`. A scoreline is the
one place a reader expects a single figure, and a second one beside it — ours,
provisional, and in the colour that means "your team" on this very screen — asked
him to do arithmetic Fantrax will do for him within the hour. `pendingByTeam`
stays: the matchups list and `/matchday` still show it, on cards with room to
label it.

### Fifteen badges to offer a move most taps are not after

Every planner card carried an accent badge opening the full move list, over the
only thing on the screen worth looking at. Meanwhile the second tap on a picked
player did nothing but put him back down — which closing the dialog already does.
One target per card now: tap to pick, tap again for `MoveDialog`.

### The taper, and the number that was written down twice

`FAR_INSET` was 11 — a goal line at 78% of the near width, steeper than FPL's own
app. Two things were wrong with it and only one was taste. The row padding that
keeps a line inside the touchlines is a single figure for the whole column, so at
that angle either the near rows gave up a fifth of their width or the back row
stood off the pitch and onto the page. It stood off the pitch.

It is 5 now (90% at the goal line), and the padding *is* the inset, so the two
cannot disagree: `PitchTurf` exports `FAR_INSET`, `PitchFrame` sets it as
`--pitch-inset`, and the hoardings read the same variable instead of repeating
`11%` under a comment asking the next person to keep them in step.
`BOX_STRETCH` and `BOX_FLATTEN` moved toward 1 (1.25 / 0.85) because both were
paying for foreshortening the gentler taper no longer has.

The centre circle was on the review list for colliding with the midfield plates.
It was left: at the softened angle the halfway line and the circle pass through
the photographs and above the plates, which is what they do in FPL's own graphic
and on a Saturday. `HALFWAY_DEPTH` is where to move it if that reading changes.

### Verified

Four green, and screenshotted at a true 390×844 through CDP — `--window-size` is
not a viewport on macOS, which has a minimum window width, so a plain
`--screenshot` silently crops a wider layout and every check reads as an
overflow. Live board, breakdown card, yet-to-play card, list view, rival squad,
planner picked, planner tap-again. The breakdown's arithmetic was confirmed on
screen by seeding the recorded fixture through `squadPoints`, because the
rehearsal league's own table is all noughts: 68 + 32 + 18 + 9 − 9 − 10 = 108,
against a total of 108.

## The schedule became a gameweek, and a competition became data (20 Aug 2026)

The schedule was thirty-eight collapsed periods with the current one open
somewhere down the scroll, every row labelled `P4 · Gameweek 4`. Craig's note was
"I'm seeing period 1 and gw1, just use gw1", and it is the right call twice over:
the two numbers are the same all season (`npm run periods` confirms 38 of 38),
and printing one number under two names asks a reader to work out whether they
are the same thing.

**The page now speaks gameweeks and never periods.** Fantrax still scores in
periods and is still queried in them; the translation happens once, in
`app/league/schedule/schedule.ts`, through `periodGameweeks` — the same one-way
seam, unchanged. Nothing in the league layer learned a new word.

It opens on the round a reader came for: FPL's own current-or-next answer, taken
straight off `footballNow().gameweek` and narrowed to a gameweek the league
actually covers — a season joined at gameweek 6 has no gameweek 1. That round's
scores come with it, and because `getLiveScoringStats` honours `period`, a
gameweek that has been played comes back with the totals it finished on. **The
archive was free.** Nothing has been played in either league yet, so the
full-time treatment — a winner marked, "Full time" instead of a live dot — is
written and unwitnessed until the 21 Aug weekend.

### Custom competitions, un-parked as a placeholder

The roadmap parked custom competitions on 19 Aug. This un-parks the *shape* and
not the feature: `league/competitions.ts` declares a cup (semi-finals in gameweek
4, final in 5) and a playoff (final in 38, top two), and the page can hold ties
from more than one competition in the same gameweek — which is the thing the old
schedule had no way to express, because Fantrax's own pairings were the only
fixtures on it.

Fantrax describes exactly one competition and has no vocabulary for a second, so
the knockouts are ours and are declared as data, resolved purely, and labelled
**Placeholder draw** on screen. Two decisions inside that are worth keeping:

- **A tie side is a table place or a phrase, never an invented team.** A number
  is seeded against the standings as they stand — `1` is whoever is top when the
  round comes round — and a string is printed verbatim. That is what lets the
  cup final say "Winner, semi-final 1" instead of seeding a team into a final it
  has not reached, and what lets the real league (no teams until 10 Oct) draw a
  playoff final between "1st" and "2nd" rather than between two names we made up.
- **The score beside a cup tie is the gameweek's score.** A cup over fantasy
  points is scored by the week's points; Fantrax's total for that period is the
  same number whichever competition is being played on it. The page says so once
  at the foot rather than sixteen times in the rows.

When the commissioner settles a real cup, `PLACEHOLDER_ROUNDS` is what changes.

### Team badges are public, and the URL Fantrax publishes is broken

`getStandings` **on fxpa** — a different read from the fxea method of the same
name, which answers the table — carries `fantasyTeamInfo`, keyed by team id, with
the badge each manager picked. It needs **no cookie**: probed anonymously against
both leagues on 20 Aug, the rehearsal league answers four badges and the real one
answers `{}`. That is why a badge can appear beside a name before anyone has
signed in, and it is the reason we did not have to reach for `getMatchups`, which
carries `logoUrl128` and needs a cookie.

**Their field lies twice.** The key is `logoUrl512`; the value it holds ends
`_256.webp`; and 256 is the one size their host does not serve. Probed against
all four of the rehearsal league's badges: `_128` and `_512` answer 200, `_256`
answers 404 on every one of them. Their own site must build these paths rather
than use the field it publishes. `mapTeamBadges` rewrites the size to 128 — the
badge is drawn at 26px, so 128 covers a retina phone twice over at 4.7 KB against
24 KB — and passes through any path not shaped like theirs, because a size
guessed onto a path we have never seen is an invented asset.

`fantraximg.com` is now allow-listed in `next.config.ts`, path-scoped to
`/assets/images/icons/fantasyteams/**` like every other remote pattern there.

### A dev-server trap that cost half an hour

The running `next dev` served a **week-old `getLeagueInfo`** — periods generated
19 Aug at 06:18 EDT rather than the real 21 Aug 15:00 boundaries — while a
direct `curl` to the same URL, and the on-disk `.next/cache/fetch-cache` entry,
both had the current one. The symptom was three gameweeks quietly missing from
the dropdown and the period↔gameweek mapping shifted by three, which reads
exactly like a bug in the calendar seam and is not one. **A long-lived dev server
can hold a stale fetch response past its `revalidate`.** If a provider payload
looks wrong, `curl` it before reading any of our own code: restarting the dev
server fixed it outright.


### The scoreline is one row, and a season costs one request (20 Aug 2026)

Second pass on Craig's notes. Four of them were the design saying what it had
already said and I had missed: **a scoreline is one row** (his call, 19 Aug, and
recorded in the roadmap — I had stacked the two sides), the date should be the
**deadline** and not the first kickoff, the "To play" chip under the dropdown
said nothing a future date did not, and the provenance footer went.

**The footer's removal is a deliberate exception to principle 2** and is recorded
in `docs/ui/league-schedule.md` rather than quietly dropped. This is now the only
page whose numbers do not name their owner. The refusal line stays — that is an
error state, not provenance, and a page claiming to show points while showing
none of them is the failure that line exists to prevent.

**`getStandings?view=SCHEDULE` is the whole season's results in one anonymous
request.** Probed 20 Aug: 38 tables, one per period, each captioned by Fantrax as
"Gameweek N" and carrying one row per pairing with both team ids and both totals.
The argument is not a guess — `displayedLists.tabs` on the plain standings read
names the tab `SCHEDULE` and labels it "Results", which is CODE_RULES §3's
server-driven list doing exactly what it is for.

That is what makes a fixture list affordable: thirty-eight `getLiveScoringStats`
calls to draw one screen is not a trade worth making, and one call is. It does
**not** replace the live read on the per-gameweek view — that one carries a total
that moves during a match and a count of who is still to play. Different
questions, different screens.

`mapSeasonResults` reads rows position-independently: a cell that names a team is
followed by that team's total. The column order is theirs to change, and the two
`fpts` columns share a key, so keys alone cannot disambiguate them. The caption is
parsed as a **period** number, not a gameweek — Fantrax's word for the period is
"Gameweek" and the two are one-to-one this season, but they are not the same
claim and the mapping belongs to `periodGameweeks`.

### The lineup deadline, settled from the commissioner's own settings page

Craig corrected an earlier version of this section, and the correction was right.
The lock is **fifteen minutes before the round's first kickoff**. Read off
`createLeague.go?goto=5` with the commissioner cookie, which is the only place
Fantrax states it — no API we read carries a lock or deadline key at all:

- `lineupLockType` = `TIME_BEFORE_FIRST_GAME` — "Set amount of time before 1st
  game of period"
- `lineupLockTimeBeforeGame` = `00:15`
- `lineupPeriodType` = `GAME_WEEK`, custom periods `ALIGNED`

The other option Fantrax offers is `TIME_BEFORE_FIRST_GAME_OF_SCORER` — a
per-player rolling lock. This league does not use it, so there is one deadline a
week and it is a real thing to print.

`LINEUP_LOCK_LEAD_MINUTES = 15` in `config.ts` was already right. What was wrong
was the instant it was subtracted from.

### The period boundary is not the first kickoff, and `deadline.ts` said it was

The worst thing found this session, and it predates this work. `deadline.ts`
asserted "the period boundary it does publish is kickoff", and the paper's
masthead is built on it. Probed across the live calendar on 20 Aug:

| period | roster period opens | that gameweek's first kickoff |
|---|---|---|
| 1 | Fri 21 Aug 20:00 | Fri 21 Aug 20:00 |
| 3 | Fri 4 Sep 20:00 | Fri 4 Sep 20:00 |
| 4 | **Fri 11 Sep 11:00** | Sat 12 Sep 15:00 |
| 6 | **Fri 9 Oct 11:00** | Sat 10 Oct 12:30 |
| 20 | **Tue 5 Jan 11:00** | Wed 6 Jan 20:00 |

A gameweek with a Friday night match opens exactly at that kickoff. One without
opens at 11:00 BST on the Friday regardless — a day early. The assumption is true
for the four periods anyone has looked at and false for most of the season.

**The masthead had been announcing the wrong deadline for most of the season**,
by a day, every week whose gameweek has no Friday night match. `nextDeadline`
now takes the season's kickoffs and measures back from the first one inside the
period. It also answers a different question than it used to: the earliest lock
still in the future, rather than the next period to *open*. Those differ for a
whole day every time a period opens on the Friday for a Saturday round — at
Friday lunchtime the next period to open is next week's, while the deadline a
manager actually has to beat is tomorrow afternoon's.

`gazette/deadline.ts` now declares `GameweekKickoff` through `league/calendar`
rather than importing a `Fixture`, so the football calendar reaches it the same
one-way way it reaches the period mapping. `app/football.ts` grew
`seasonFixtures` / `seasonKickoffs` beside `footballNow`, which also removed the
schedule's own duplicate fetch of the same 380 fixtures.

**For 10 Oct: the real league's first lineup locks Sat 10 Oct at 12:15 BST**,
fifteen minutes before Saturday's first kickoff.

### A played head-to-head, and the one thing still unproven

The schedule's rows now route by what the football has done: a live or played
round opens the head-to-head board, a round still to come opens the squads. That
needed `/league/matchups/[teamId]` to stop being hard-wired to the current
period, so it takes `?gw=`, `getLeagueSquads` takes an optional round, and
`fetchTeamRosters` takes an optional period.

`getTeamRosters?period=N` is honoured and echoed for all 38 periods (probed 20
Aug), and every one of them currently returns an identical roster — which proves
nothing either way, because nobody in the rehearsal league has ever made a lineup
change. So **whether a past period returns the eleven that was actually fielded
is still unverified**, and the board says so on screen rather than implying it.
Fantrax's product is a lineup per period, so it very probably is history; "very
probably" is not something to print without a hedge. This is HANDOVER's 28 Aug
item, now with a screen depending on the answer.

Also gone, on the same pass: "Period 1 · Gameweek 1" on both matchup screens.

### A third dropdown, and no more phantom goalless draws

Craig's last two notes. **A fixture that has not been played is a fixture, not a
0–0.** Fantrax answers `totalFpts: 0` for every unplayed period, and the board
was printing it — a scoreline against a date in March, which is the confident
wrong number wearing the costume that looks most like an answer. A round still to
come now reads `test4 v test2`, and a fixture list row reads "To play".

The third dropdown is a **fixture list**: pick a team, get its whole season. It
replaces the "Your season" option that briefly lived in the gameweek select —
the reader's own team is simply first in the list and named `(you)`, which
answers the same question and fifteen more. `seasonRows` already took a team id,
so the generalisation was a prop; what changed is that its two score fields are
now `pointsFor`/`pointsAgainst` rather than `yours`/`theirs`, because they are no
longer necessarily yours.

It sits on its own row. Three selects across a phone leaves each too narrow to
read the option it is showing, and a control whose value you cannot read is not a
control.


### The refactor pass over all of it (20 Aug 2026)

Craig asked for a rule-of-2/3, debloat and de-hardcode sweep once the feature
was working. What it actually turned up:

**One latent bug, from duplication.** The schedule worked out "which round does
the reader mean" in two places — the gameweek branch and the fixture-list branch
— and the two had drifted to *different fallbacks*: one ended on the season's
last round, the other on its first. Neither is reachable today, both would be
reachable the moment the league's calendar starts after FPL's. Now one
`chooseRound`, called twice. This is the rule of 2/3 earning its keep: the
duplication was the bug, not a symptom of one.

**One wasted request per view.** The board fetched `getLiveScoringStats` for the
round on screen whether or not it had been played. Fantrax answers for any period
asked, so browsing March cost a request per gameweek for totals the board had
already decided not to print. Gated on `kickedOff` now.

**Three rule-of-3 landings, and two of them were pre-existing:**

- `kickedOff(status)` in `football/selectors.ts`. "Has any football happened in
  this round yet" is the question that decides whether a score exists at all, and
  the scoreline, the fixture-list row and the row assembler each asked it their
  own way.
- `yoursFirst(items, isYours)` in `app/mine.ts`. The paper's doubts column had
  its own copy, the matchups board had another, and the schedule's team picker
  made three. They sort different shapes — a note, a pairing, a team — so the
  question is the argument. `mine.ts` already owned the other half of the same
  reading aid (the accent border), so it was the obvious home rather than a new
  file.
- `TeamBadge` now takes the team and the badge map rather than a name and a URL,
  which deleted the same pair of null checks from both call sites.

**Deliberately NOT abstracted**, so nobody re-opens it: the nine-plus
`unstable_cache` wrappers. This session added five more and the trigger is
firing harder than ever, but HANDOVER parks `leagueCache()` until after the GW1
weekend and a refactor mid-feature is the thing CODE_RULES §7 forbids.

**Debloat.** `SeededRound`, `CompetitionGroup` and `Competition` came off
`league/index.ts` — all three are inferred at every call site and §2 does not
keep an export nothing imports. `Controls` now builds its own option labels
instead of the page assembling three `{value, label}` arrays for a component
that only printed them, which took `page.tsx` from 258 lines to 213 and put the
labels beside the control that shows them.

**A name that had stopped telling the truth.** `yours.ts` became `teamSeason.ts`
when the fixture list generalised from the reader's own team to any of the
sixteen, and its two score fields went from `yours`/`theirs` to
`pointsFor`/`pointsAgainst`. That is an explicit refactor trigger in CODE_RULES
and it fired within an hour of the rename becoming wrong.

**Hardcoding found and moved:** the route path in `Controls`, which the form
posted to and the router pushed to separately. Everything else was already a
named constant with its reasoning attached — `SIZE` in both badge files,
`PLACEHOLDER_ROUNDS`, the caption regex. The `view: "SCHEDULE"` and `view:
"FPTS"` literals stay inline beside the method that sends them, matching what
was already there.

**Checked and clean:** no Map or Error instance crosses an `unstable_cache`
boundary; no `any`, no non-null assertions, no unused imports; and the schedule
serialises no lineup to the client — `Controls` is its only client component and
it carries gameweek numbers, competition ids and team names, all public all week.
Grepped the rendered source for `ACTIVE`/`RESERVE` on all three schedule views
and on the head-to-head board at a past, present and future gameweek: zero hits
on every one.


### The adversarial pass, and the one that would have hit every weekend

An independent review of the whole changed surface. Five real defects, one of
them the worst kind — correct on every day it was tested and wrong every
Saturday.

**1. A part-played round reported "upcoming", so the board hid scores it had.**
`gameweekStatus` is a three-state label: live if any match is, finished once all
are, upcoming otherwise. At six on a Saturday evening — nine results in, a Monday
night match to come — nothing is live and it is not finished, so the round is
"upcoming". That is *right for a caption*; a full-time label on it would be a
lie. The mistake was reading the same enum as "has any football happened",
which is a two-state question a three-state label cannot answer.

The consequence: every tie printed `v` instead of its scoreline, every fixture-
list row said "To play", the rows stopped linking to the head-to-head, and
`getLiveScoringStats` was never called — then on Monday night the last match
kicked off, the round flipped to "live", and all nine results appeared at once.
Scores, then no scores, then scores, inside one gameweek.

Worse, this session had *introduced* the bug while doing the opposite of the
right thing: `kickedOff(status)` was landed as a rule-of-2/3 abstraction over
three consumers, which made one wrong answer authoritative in three places at
once. **An abstraction over the wrong fact is worse than the duplication it
replaced.** Gone, replaced by `gameweekStarted(fixtures, gameweek)` — asked of
the fixtures, where the answer actually lives — surfaced as `ScheduleRound.started`
so the three views read a fact rather than re-deriving one.

**2. The fixture list marked a winner at half-time.** The scoreline guards it
with `status === "finished"` and says why; the season row only checked that a
score existed. Live on a Saturday, `?team=X` bolded a 30–25 lead as a win while
`?gw=7` showed the same fixture unmarked. Two answers to one question.

**3. `mapSeasonResults` could pair a team with another team's score.** The
comment claimed position-independence; what it actually assumed was
team-then-score *adjacency*. A reordering to Away/Home/Pts/Pts — which the file's
own comment concedes is theirs to make — reads the second team's name as the
first's total. The NaN filter is not a net: **this league contains a team called
"123"**, which parses cleanly as a hundred and twenty-three. Now a score cell
must name no team, and there is a test with that exact reordering.

**4. Tapping a cup tie opened a different match.** The head-to-head route
resolves its pairing from Fantrax's *league* schedule and knows nothing about
competitions, so a played cup tie A v D landed on A v whoever-A-played-in-the-
league-that-week, with nothing on screen to say so. Only league ties open a
board now.

**5. A postponement would have produced duplicate rounds.** `calendar.ts` names
this divergence exactly: FPL keeps a rearranged fixture under its original
`event` while Fantrax scores it in the period it was played. So a replayed
gameweek 20 match inside period 25 puts gameweek 20 in *both* periods — two
identical entries in the dropdown sharing a React key, the second unreachable,
and a team's fixture list printing its week twice. `rounds` is deduped by
gameweek now, lowest period winning, and the fixture-list key is the period.

**Two wasted reads on the head-to-head board**, both pre-existing: `squadPoints`
was fetched for *both* sides regardless, though it is read only inside the branch
that has already decided to show a side's eleven — so the page's own main use
("who am I playing this week", read on a Tuesday) threw away one whole read, and
a signed-out reader threw away two. And `liveScores`'s refusal was dropped, so a
scoreboard outage rendered as silent dashes on the one board that did not say so.
Both fixed.

**Hardening, not a demonstrated bug:** `next/image` throws on a URL outside its
allow-list, which takes down a page rather than losing an icon — and
`getTeamRosterInfo` carries `logoUploaded`, so a manager uploading his own crest
is a state this league can reach. `FANTRAX_BADGE_BASE` is now in config and
`mapTeamBadges` drops anything not under it, which turns a 500 into an initial on
a disc. `next.config.ts` names the same prefix and says the two must move
together.

**The lineup gate held everywhere**, in both directions, on a past, present and
future gameweek — traced through the code and grepped in the rendered source.
One soft spot closed anyway: the gate keyed entirely on the period Fantrax
*echoed*, while the route already knew which period it had *asked for*. Trusting
the provider for something we already know is free to get wrong, so
`periodAsAsked` now falls the whole payload back to squad-only when the two
disagree — and `teamDisplay` honours it too, or the per-team path would have
re-opened every lineup one route at a time.

## The live tranche, built the day before the football (20 Aug 2026)

Eight commits against `we-had-ideas-for-peppy-fog.md`, all four gates green on
each. The roadmap had deferred the live-state designs until a real Saturday
could judge them; Craig chose to design the whole tranche the day before GW1
instead, which means **every state below is written and unwitnessed**. The
observation list at the foot is the point of that admission.

### The football layer learned the difference between "over" and "settled"

`fixtureStatus` collapses `finished_provisional` into `"finished"` — right for a
reader watching a score, and useless to anything asking whether the numbers have
stopped moving. `Fixture.settled` is now raw `finished` on its own, and
`FootballSnapshot.dataChecked` is FPL's `data_checked` for the round.

`roundFinished(snapshot)` reads the ladder: every dated match finished with bonus
outstanding → `bonus-settling`; bonus landed → `provisional`; FPL's sign-off →
`final`. **"Final" is claimed only at the last rung.** A manager watching his
total shift under that word would be right to stop believing the screen, so the
two rungs before it say full time and, while bonus is landing, say why.

Null while a round is in play *or* has not started — two states a caller may
render alike but must not conflate. Callers pair it with `isMatchdayLive` rather
than the selector inventing a fourth answer from the same evidence.

**It fixed the pink dot for free.** `MatchupBoard`'s `live` boolean was fed
`duringGameweek` — the window from the first kickoff to the last whistle, which
is the right question for *how often to poll* and the wrong one for *whether a
match is on*. Saturday tea-time between the 12:30 and the 15:00 pulsed LIVE with
nothing in play. The poll rate still reads `duringGameweek`; the word does not.

### The app became partisan about the football

`join/involvement.ts`: `fixtureInvolvement(team, fixtures)` and `owners(teams)`,
both pure, both keyed off **squad membership** — public all week — and neither
reading a lineup in either direction. A fixture with none of his players in it is
**absent from the map** rather than present-and-empty: the question is "is this
one mine", and an empty array is a yes-shaped answer meaning no.

On `/gw/[gameweek]` and `/matchday`, a fixture the reader has somebody in takes
the standard accent border and a counted `2 yours`; opened, it leads with
`Yours · Gabriel · Saka` above the contributions. **Counted, not tinted** —
fifteen players across ten fixtures marks most of the list, and every row marked
is no row marked. The Yours line sits *above* the contributions because it
answers a different question: `contributions` lists only the notable, and "which
of mine is in this match" has to include the man who has done nothing.

Every contributor now carries the squad holding him. A footballer nobody in the
league holds is **untagged** rather than tagged "—", which would be a label on
500 of the 697.

**Historical rounds mark from today's squad**, deliberately: "which of these
results matter to me" is asked on Monday by the man who owns those players now,
and a squad as it stood in week six needs a period read nobody has proven serves
history (still open, below).

### One scoreline grammar, on all three head-to-head surfaces

The matchups list was eight identical two-row cards; `/matchday`'s own card was a
third design for the same fact. Both are now the board's row — name · score · v ·
score · name — so the margin between two **adjacent** numbers is the answer and
no invented "close" threshold decides anything.

Only the *number* dims for trailing. A name that dimmed for losing would give
accent a second meaning, and accent means "yours" on six screens.

One real bug fell out of it: the old list hid "n to play" on **falsiness**, so a
side on a literal zero — everybody played, nothing left to come, the most
interesting state a side can be in — was the one state it never showed. It reads
`all played` now, and only while football is on: on a Wednesday every side has
nobody left and sixteen such labels state the obvious.

`RoundWord` was extracted at the third caller, and the two existing copies had
**already drifted** — the board printed the "bonus settling" caption and the
matchups list did not, so the same Saturday evening said two different things
depending on which screen you were on.

### /matchday: the board stays one tap behind (Option A, Craig's call)

Decided on design argument and recorded in `matchday.md` to re-ask with
Saturday's answer. The board's premise is that it fits a 390×844 phone, which it
cannot do stacked over a fixture list. So the card speaks the board's grammar and
the board keeps its size. The instrument for re-asking is the league chat.

New on the page: **your afternoon** — your ACTIVE players still to come, grouped
by kickoff, a live group showing the clock instead of the time. Two different
squads on the same page on purpose: the fixture markers key off membership, the
strip keys off your lineup. Your own lineup is never withheld from you, so this
withholds nothing from anybody; a reserve is excluded because he does not score.

### The Desk

`/matchday/desk`: eight head-to-heads and ten fixtures as one-line scores, yours
in accent, nothing else on the page. Reached from the Live tab and nowhere else —
six tabs already brushes the 320px clip `tools/ui/navfit.mjs` measures.

Gillette Soccer Saturday borrowed **in voice and typography, not in colour**: the
app's tokens stay, because the colour registers are binding and Ceefax's are not
ours. A side on four or more prints the number in words after the digit —
`BOU 4 (FOUR)–1 LIV` — which is Sky's threshold and not one we invented, and
which is applied to **football facts only**: "a lot of fantasy points" has no
custom behind it, and picking a number for it would be us making the joke rather
than quoting it. FT/live-minute ticks stand where the kickoff time was. **No HT**:
FPL publishes a minute and a finished flag, and a clock stopped on 45 is not a
claim they have made.

**Nothing on the Desk is a link.** Eighteen rows at a 44px touch target would
cost the screen the one property it exists for, and every row is tappable
somewhere else. Recorded in `desk.md` so the density argument has to be remade
from scratch if a row ever becomes a link.

Verified against the real league id on 20 Aug: the head-to-head half says
"Fantrax has no pairings for this period" and the football half renders all ten
fixtures, because that half needs no credentials at all.

### Two rule-of-2/3 calls, recorded so nobody reopens them

- The Desk's rows are a **copy** of `PairingCard`'s grammar, not a reuse: second
  occurrence, rendering at different sizes for different reading distances. A
  third forces the extraction.
- `leagueCache()` stays parked. This tranche added no new `unstable_cache`
  wrapper — `/gw/[gameweek]` moved onto `gameweekSnapshot`, which the schedule
  work had already added, because the new cookie read makes the route dynamic and
  without a cached reader every arrival would refetch a round of February.

### The lineup gate held

Grepped the rendered source of `/matchday`, `/matchday/desk`, `/gw/1` and
`/league/matchups` for `ACTIVE`/`RESERVE`: zero hits on every one. Everything
this tranche added is either membership (public all week) or the reader's own
lineup (never withheld from him). No new value crosses a `"use client"` boundary
— `MatchupBoard` gained a string, and every other component here is a server
component.

### What only a real Saturday can answer

The whole tranche, honestly. Specifically:

- **The Final ladder's real timing** — `finished_provisional` at the whistle →
  raw `finished` → `data_checked`; how long "bonus settling" sits on screen; and
  whether Fantrax's total moves after the last whistle at all, which is the
  assumption everything above prices in.
- **Marker density** across ten fixtures from a fifteen-man squad, and whether
  the "Yours" line is what a half-time scan wants. Opponent highlighting is
  recorded as an open question, not built.
- **`remainingEventPercent` hitting literal 0** at each full time, which is what
  drives "all played".
- **Whether finished pairings should sort below live ones** on the list.
- **The Desk's density at arm's length**, and the spelled-out thrashing, which
  has never rendered.
- **/matchday's real scroll length** with three panels, and whether managers tap
  through to the board — which re-asks Option A with data rather than argument.

## The sweep, and the UI refactor's first tranche (20 Aug 2026)

Craig's order: refactor first, then the roadmap's §1 pages. Four refactor commits
and six feature ones, four gates green on each.

### What the sweep actually turned up

**Four writings of one question.** `isMatchdayLive(s) ? "live" : roundFinished(s)`
sat at four call sites. Neither half answers alone — `roundFinished` cannot say
"live", `isMatchdayLive` cannot say "final" — so the pairing *and its order* is
the answer, and asking it the other way round is precisely how the board came to
burn a LIVE dot through a Saturday tea-time. Now `roundState`, in the football
layer, tested there.

**A clock read four times.** Each of four pages spelled out
`duringGameweek(snapshot, new Date().toISOString()) ? POLL.live : POLL.idle`.
`pollSeconds` in `app/football.ts` — the app edge, which is where a clock
belongs. The choice of `duringGameweek` over `isMatchdayLive` is now made once:
between kickoffs is exactly when a score is most likely to have moved since you
looked, which is right for a poll rate and wrong for a dot.

**The reader discovered on three screens.** Read squads, verify cookie, find
team, join — three places for the same two mistakes. `app/involvement.ts` holds
it and the distinction it exists for: `mine`/`owners` key off **squad
membership**, public all week; `afternoon` keys off the reader's **own lineup**,
because a reserve does not score. Nothing in that file can say anything about a
rival's arrangement.

**A predicate written twice under two names.** `involves` was exported from a
card component and copied into the desk as `isYours`. It is a league-layer
question about a pairing, so it is `pairingInvolves` in `league/selectors.ts`
now, with the test neither copy had.

**Fantrax's raw word, compared in two places.** `rosterStatus.ts` exists so
`"ACTIVE"` appears once and its own comment says so — then the gazette's team of
the week and the new involvement reader both wrote it out again. A third status
reads as "not active" through `isActive`, which is the safe answer; a string
comparison would have read it as neither.

**Two widths written twice each.** `PlayerPortrait` and the profile masthead each
spelled their pixel size into a class and again into `sizes`, which is what tells
the optimizer how small an asset it may serve. The tell for that bug is a soft
photograph, and nobody thinks to blame a class name.

### The pages

`/players` leads every one of 697 rows with the 32px face. The FPL code comes
**straight off the bridge** rather than through a football snapshot — the code is
all a portrait needs, and joining the football layer would give a page that is
entirely Fantrax's a second provider to fail on. `toFplClubCode` left the
identity barrel for it: without the translation Brentford and Forest take the
fallback grey on every row, which is a wrong answer that looks exactly like a
club we have no colours for.

`/players/[fantraxId]` opens with the cut-out at 112px on his club's colour. On
the colour rather than on nothing: everywhere else it stands on grass, and there
is no pitch here.

**The Gazetta is the one that mattered.** It was called a paper and looked like a
settings screen. A masthead now — centred, allowed to wrap, between red rules,
with a **dateline** under it, which is the whole difference between a masthead
and an `<h1>`. The date is the *edition's* instant, not the reader's clock: two
managers opening the same cached edition either side of midnight must not be
shown two different days. Columns sit on `Column` — heads in cream on a red
rule, items on hairlines, no cards. `shell/Section` is untouched and still right
on the four screens using it.

`yoursBorder` survived all of it unchanged, which is worth recording: the class
it returns sets a border *colour* plus an explicit left width, so on a ruled row
with no `border` utility it draws the accent bar alone. One treatment, two
grounds, and `mine.ts` stays the only thing that knows what "yours" looks like.

### Two roadmap claims that were wrong

- **`PitchFrame` is not free on `/fpl`.** A pitch needs positional lines and the
  football layer deliberately carries no position — `element_type` is FPL's
  fantasy classification, which is why it was removed. An FPL pitch needs that
  classification carried by `fpl-entry`, the FPL league layer. A data change, not
  a rendering one. What landed instead is the XI/bench split, which FPL's own
  1–15 ordering gives for nothing; carried as `slot`, never `position`, because
  `position` here means the letter a league files a player under.
- **`/league` and `/squad` cannot show record or badges as a visual pass.** Both
  need reads those pages do not make. The squad row's *opponent* was free — the
  schedule was already in the payload — and that is what landed.

### The bug the preview caught, on its first day

`/squad/[teamId]` shows `SquadBoard` all week, which owns a Pitch/List control,
then switches to `TeamSheet` with `mode="pitch"` hardcoded the moment a period
opens — and `TeamSheet` deliberately owns no toggle, because the head-to-head
board owns one for two sides. Sound where it was written; it never held on a
route with one side and no control of its own. So the view answering "who
exactly is in it" vanished exactly when managers start checking, and it was
invisible because no period has ever opened. The faked-Saturday harness opened
period 1 and it fell out immediately.

## The shape-diff script, and what it found on its first run (20 Aug 2026)

ROADMAP §6's shape-diff did not exist and is the 11:00 item on the ship-day
runbook. `npm run shape-diff` now compares the real league's live payloads
against the rehearsal league's, read for read.

The rehearsal league is the **reference**, because it is what every mapper here
was written against. The real league is the **subject**. The dangerous direction
is a path the reference has and the subject does not — that is a mapper reading
`undefined` and a screen quietly showing nothing.

`shapeOf`/`diffShapes` are pure and in `league/fantrax/shape.ts` with 16 tests;
the script does the I/O. Two things the first runs forced into the design, both
pinned by tests:

- **A dictionary of one.** Live scoring for a league with no teams answers with a
  single sentinel id, `-3` (the league average, alongside `LG_AVG`). The first
  heuristic needed two keys to recognise an id-keyed map, so it read `-3` as a
  field name and reported every path beneath it twice — once missing, once
  added. 158 lines of noise.
- **Empty is not absent.** Our real league answers every table with `[]` until
  draft night, and calling that 142 missing fields is the loudest possible way to
  say "no teams yet". Paths inside a collection the subject reported empty are
  counted as `emptied` and never listed. 142 → 22, and the 22 are real.

### What it found, and two of them matter

**1. The real league has a playoff, and Fantrax publishes it.**

```json
{"lastRegularSeasonPeriod":34,"numPlayoffTeams":4,"firstPlayoffPeriod":35,
 "mergePlayoffPeriods":false,"used":true}
```

The rehearsal league answers `{"used":false}`, which is why nobody had seen this.

Regular season is periods 1–34; the playoff is periods 35–38 between the **top
four**. `league/competitions.ts` currently declares a placeholder final in
gameweek 38 between the top two, and the roadmap says `PLACEHOLDER_ROUNDS` waits
on Craig settling a real cup. **The playoff is not waiting on anybody — it is
already data**, and reading it is the same one-way seam as the rest of
`getLeagueInfo`. The cup is still ours to invent; the playoff never was.

**2. The two leagues score different games.** Seventeen outfield categories
against ten:

| | real | rehearsal |
|---|---|---|
| assists | `AT` | `A` |
| keeper saves | `GKP` | `Sv` |
| minutes | `range0\|0\|0` — **nothing** | scored in two bands |
| keeper's goal | 10 | 6 |
| also in real | `CLRA` clearances, `DFP` defensive points, `SBON`/`SBOF` blocks, `KP` key passes, `MP`, `GS`, `GAO` | — |

So the real league is a defensive-stat-heavy system and the rehearsal one is
close to a default. **Every category code differs enough that anything keyed to a
rehearsal code would be wrong on 10 Oct** — which is exactly why the stat mappers
read categories per response and list none of them (`fantrax/stats.ts`). That
decision is now paid for.

**3. The one piece of scoring the app does survives the swap.** The clean-sheet
preview looks up the literal `"CS"` (`join/cleanSheets.ts`), and `CS` is present
in both leagues with the same values — `D: points4`, `Default: points0`, and
`points4` for a keeper. It is the only hardcoded category code in the tree and it
is safe. Checked rather than assumed, which is the whole point of running this
now rather than on ship day.

Also: the real league's `draftType` is `snake`; the rehearsal sends none.

### The 22 that remain, and why they are not alarming

Almost all are `table.header.cells[]` and `table.caption` on the transaction and
standings reads. Fantrax sends **no header at all** for an empty table — it sends
`emptyTableMsg` instead. So these resolve at draft night, and the script will say
so. Worth knowing that they exist now rather than reading them cold at 11:00 on
10 Oct.

## CI walks both leagues, and the build stops redeploying for data (20 Aug 2026)

ROADMAP §6's other two. Both are small; both close gaps that had been noticed and
left.

### `npm run smoke` — every view, against whichever league it is pointed at

The four gates never once asked what the app does when Fantrax says `NO_TEAMS`.
That is what our real league says to almost everything until 10 Oct, and those
views had been walked by hand exactly twice — once on 19 Aug and once this
session. `verify.yml` now walks them on every push, both leagues, off the one
build (every route is dynamic, so the league id is a runtime choice).

The script asks Fantrax whether the served league has teams and asserts the
matching half, so it needs no editing on draft night — it simply starts
asserting the other half. When there are teams it derives one team id and adds
`/squad/[teamId]` and `/league/matchups/[teamId]`, which are the two biggest
screens in the app and would otherwise never be walked.

**The inverse half is the one worth having.** A drafted league that renders
"nobody has drafted" is a bug this repo has already shipped — `edition.ts`
collapsed an outage into an undrafted league, and a drafted league having a quiet
week was told it had not drafted. A check that only asserted the empty states
would have passed that happily, so the drafted walk asserts that none of those
five sentences appears.

Three things the first runs taught, all now in the script:

- **Assert absence, not presence, for rendered copy.** `/gw/1` failed on
  `"Gameweek 1"` because React splits `Gameweek {n}` into separate text nodes —
  the same thing that made `(FOUR)` un-greppable on the desk. It asserts the
  *absence* of "No fixtures scheduled for this gameweek yet." instead, which is
  one fixed string and also the better question.
- **`kill %1` does not work in CI.** Job control is off in a non-interactive
  shell, and the step would have failed on a line that is only tidying up. The
  pid is captured instead.
- **A connection refusal has to be legible.** A CI reader handed a raw
  `ECONNREFUSED` stack has to work out that the server never came up, and they
  will work it out slowly and at a bad moment. It says so in one line now.

Caveat worth stating: the empty-state fragments are copy, and copy moves. That
is the intended cost — the list is edited in the same commit as the sentence,
exactly as `docs/ui/` is.

### The Ignored Build Step, pulled at last

`apps/companion/vercel.json`:

```
git diff --quiet HEAD^ HEAD -- ':(top)' ':(exclude,top)data/snapshots'
```

Exit 0 skips the build, exit 1 proceeds — so a commit touching nothing but
`data/snapshots` no longer redeploys production. That is six redeploys in six
days, which is what this file complained about on 13 Aug and again on 19 Aug.

Two details that are load-bearing:

- **The pathspecs are `:(top)`-prefixed** because Vercel's Root Directory is
  `apps/companion`, so the command runs from there and a bare `data/snapshots`
  would resolve to `apps/companion/data/snapshots`, which does not exist — and
  the ignore would then match nothing and quietly never fire. Verified from
  `apps/companion` against a real capture commit (skips) and a real code commit
  (builds).
- **It fails toward building.** A shallow clone with no `HEAD^` exits 128, which
  is non-zero, which means deploy. The wrong answer in that direction costs a
  build; the other direction costs a shipped commit that never went live.

## The bridge gate, and why `npm run bridge` was not re-run (20 Aug 2026)

ROADMAP §6's last item, in two halves — and only one of them turned out to be
worth doing.

**The gate: `npm run bridge:check`.** `npm run bridge` reports totals — 688
players, 568 mapped, 120 with no FPL counterpart — and has never answered the
question that actually matters. 78% coverage says nothing about whether any of
the missing 22% is *on somebody's team*, and each one that is is a hole in a
squad view. This walks every rostered slot in both leagues against the
checked-in bridge and fails on a hole.

What fails and what does not is the identity layer's own distinction, reused
rather than re-derived:

- **Unbridged** — the bridge has never seen the id. Somebody joined the pool
  since the last run. Always a fault, always fixed by running it.
- **Assumed unmapped** — the matcher looked and found nobody. Revisable by
  construction (`isAssumed`), and FPL adds players all window: three of the first
  residue recorded were in FPL a week later. On a rostered player this fails,
  because a manager is looking at the hole.
- **A person's verdict** — `unmappedBy: "manual"`, or any row carrying
  `auditedAt`. Passes, and is counted so the number stays visible. A person
  looked and the script did not; this gate has no standing to reopen that.

`isAssumed` left the identity barrel to make that possible, and travels with
`isUnmapped` for the same reason it does: a caller re-deriving "did a person
decide this" from `unmappedBy` and `auditedAt` is a caller that will one day get
it wrong and silently reopen somebody's verdict.

First run, on every push from now on:

```
~ real: NO_TEAMS — no squads to check
  rehearsal: 4 squads
60 rostered slots checked.
No holes: every player anybody holds resolves to a footballer.
```

**The re-run: deliberately not done.** The roadmap says to re-run `npm run
bridge` after the rehearsal league's waiver churn. The gate says the bridge
already covers everyone rostered, so a regeneration would change nothing that
matters — and it is not free: it rewrites `data/mappings/fantrax.json` and
`review/proposals.json` wholesale, deletes rows it did not re-derive, and
`proposals.json` currently holds three rows waiting on Craig's own call
(`Fred Heath`, `Enzo Kana Biyik`, `Lucas Pitt`). Churning a file with a person's
pending decisions in it, to fix nothing, is the wrong trade.

The gate is the better answer to the same worry: it is what will *say* when a
re-run is needed, on the push that needs it, instead of on a schedule.

## The first real matchday, witnessed (22 Aug 2026)

GW1 opened Fri 21 Aug 19:00Z with COV 0 @ ARS 3 and the other nine fixtures
spread across Sat/Sun/Mon. Everything in the live tranche had been written
against a season that had never kicked a ball; this is the first entry written
with football in the data. Observed at ~10:45–11:00Z on the Saturday, with one
match played and nine still to come — which turned out to be the single most
useful state to be caught in, because it is the one where "played" and "not
played" are both on screen at once.

### The state nobody had seen: finished, but not finished

Fixture 1 sat at `started=true, finished=FALSE, finished_provisional=true,
minutes=90` for **more than fourteen hours** after the whistle. That is the
`bonus-settling` rung, and its real dwell time is now a measured lower bound
rather than a guess: overnight, not minutes.

### `remainingEventPercent` does hit literal zero

The open question at the top of this file's live-tranche section. Answered: the
values are exactly `{0.0, 1.0}`, so "all played" is reachable and `countToPlay`
is counting the right thing.

### Fantrax's totals move

Also an open question — the 13 Aug note said in terms that `totalFpts` filling in
was "an expectation, not an observation". It is an observation now: 5.0 / 9.0 /
0.0 / 16.0 across the four rehearsal teams off a single fixture.

### `playerGameInfo` is decoded

Five ints that this file recorded as deliberately unmodelled, because they had
only ever been seen at rest. With one match played they resolve:

```
[0] players who APPEARED and whose match is over
[1] players currently in a match in progress
[2] players with a match still to come
[3] = [0] * 90   nominal minutes played
[4] = [2] * 90   nominal minutes remaining
```

`[3]` and `[4]` are **nominal, not real**: team `j9zadacn` reads `180` for Saka
(67') and Ødegaard (75'), whose real total is 142. So they are `count * 90` and
carry no information the counts do not.

The useful part is what the counts do **not** add up to. `[0]+[1]+[2] < 11`
exactly when a player's match has ended without him appearing: team `8enbgqo5`
reads `[1,0,9,…]` though two of its players' match is over, because Bruno
Guimarães never came on. Three such players existed across four teams in one
fixture (Bruno Guimarães, Gyökeres, Timber — all ACTIVE in somebody's eleven).
**`[1]` has still not been witnessed**; nothing was in play at the time.

### `gameStatusMap`, `statsMap` and the projections

- `gameStatusMap` is `"{OPP}~{kickoffEpochMs}|{gameId}|{state}"` before kickoff
  and `"COV 0 @ ARS 3 F|{gameId}|{state}"` after. State `1` upcoming, `3`
  finished; `2` is presumed in-play and **not witnessed**.
- `statsMap` fills in — this file recorded it as `{}` "in every section, so what
  they will hold is unknown". It holds `object1` (his total) and `object2`, a row
  per category: `{scipId: "5010#<categoryId>#<positionId>", sv, av, fpts}`. The
  category ids resolve against `getLeagueInfo.scoringSystem.scoringCategorySettings`:
  `6000 A · 6090 G · 6101 GAO · 6105 OG · 6112 GA · 6120 Min · 6170 PKS ·
  6190 RC · 6200 Sv · 6249 CS · 6280 YC · 6283 AF · 6332 PKM`.
  `statsMap2` is still `{}`.
- `projectedTotalsMap` and `calculatedProjectedTotalsMap` were "identical to each
  other today". They diverge the moment football is played: for a player whose
  match is done, `calculated` is his actual score and `projected` stays the
  pre-game number. So `calculated` is a live projected-finish.
- `allEventsFinished` is a top-level boolean on the same payload. Nothing reads it;
  the football layer already answers the same question from FPL.

### Fantrax scores the SLOT, not the player

The finding with product consequences. Fantrax's scoring is position-dependent
(`G: {D:6, M:5, F:4}`, `CS: {D:4, M:1, Default:0}`), and the position it applies
is **the slot his owner has him in**, not his position in the global pool.

> Saka, `04y92`, is **a midfielder and a forward** — `getLeagueInfo.playerInfo`
> gives his `eligiblePos` as `"F,M"`. **His manager has chosen M.**
> `getLiveScoringStats` scores him 8 — `Min 2 + G 5 + CS 1`, midfield rates.
> `getPlayerStats` scores him 6 — `Min 2 + G 4 + CS 0`, forward rates.

**There is no single right position for a dual-eligible player, which is the whole
point.** An earlier draft of this note said Saka "is listed F", which is the trap
rather than the fact: `F` is only what `getPlayerIds` prints, and that endpoint
carries one letter per man because it describes the global pool and not a league.
The league's own answer is `F,M`, and the answer that decides his points is the
one a manager made when he filled in his eleven. `/players` already shows `F/M`
correctly, and its comment already says why — "the league's eligibility, not the
pool's single position".

Seven of sixty rehearsal roster slots differ from `defaultPosId`, every one of
them a dual-eligible man his manager has filed deeper. So the pool table's `FPts`
is **not** what a player scored for his owner, and on this league it differs for
roughly one rostered player in eight.

**The splitting field is `defaultPosId`**, and it rides in payloads we already
read. Fantrax's *stat tables* — `getPlayerStats`, `getTeamRosterInfo`,
`getPlayerProfile` — price a man at his `defaultPosId`, which for a dual-eligible
player is one of his two and not a fact about him. Fantrax's *live, matchup and
standings engine* prices him at the slot on the roster, which is a decision his
manager made. With only one off-slot man having played, "the slot he is in" cannot
yet be told apart from "the first of his eligible positions" — both predict M for
Saka. Semenyo (`068y0`, eligible `M,F`, filed at F) settles it the first time he
plays, and neither reading changes the shape of the problem.

**Which number decides the match.** `getStandings?view=SCHEDULE` — their settled
table — reports Gameweek 1 as `123 5 — test3 16`. Sixteen is the slot-priced
figure. So the engine is authoritative and the stat tables are the outlier, which
is the opposite of the way round you would guess from which one looks like a
database.

**Four surfaces carry the wrong number, and one contradicts itself on screen.**
`squadPoints()` reads `getTeamRosterInfo`, so it inherits the same default-position
pricing and feeds exactly the places that mean "what he scored for his owner":

| Surface | What it shows |
|---|---|
| `/players` | Saka 6 at rank 8, sorted below Havertz. At his real 8 he ties Ødegaard at 3. |
| `/squad/[teamId]` | `Saka G CS 6` — the FPL chips say he kept a clean sheet, the Fantrax number beside them prices that clean sheet at 0. |
| `/league/matchups/[teamId]` | **Header `test3 16`; the eleven reads Ødegaard 8, Saka 6 and thirteen noughts — the players sum to 14 under a total of 16.** The total comes from `getLiveScoringStats` and the column from `getTeamRosterInfo`. |
| `/players/[fantraxId]` | `6 FPts · Goals +4 · Minutes Played +2`, with the clean sheet missing entirely — under a comment promising the parts add up to the whole. |

Correct and unaffected: the standings, the schedule, the matchups list and
`/matchday/desk`, all of which take team totals from the engine; and the team of
the week, which reads `rostered.slot.position` and prints no fantasy points.
`join/cleanSheets.ts` already prices its preview off the slot, so the codebase
does model position-dependent scoring — it simply never knew the stat tables
disagree.

**It is systematic, not an edge case, and it gets worse with a good manager.**
48 of 607 players in the pool are multi-eligible: 38 `F,M`, 9 `M,D`, 1 `F,D`.
Under this league's scoring the deeper slot pays strictly more — goals D 6 / M 5
/ F 4, clean sheets D 4 / M 1 / F 0, everything else flat — so the optimal lineup
*always* files a multi-eligible man at his deepest eligible position. That is why
all seven of today's off-slot cases are the same shape (`F,M` slotted M), and why
the stat tables will systematically **under**-price precisely the players managers
have thought hardest about. On sixteen teams and 240 slots from 10 Oct this is
routine.

**Not fixed, and deliberately.** The fix is available and cheap — the slot-priced
per-player total and its category breakdown are already in the
`getLiveScoringStats` payload the board fetches anyway, as `statsMap[id].object1`
and `.object2`, so the board could stop making two `getTeamRosterInfo` calls and
become internally consistent at the same time. Three things argue for Craig
deciding rather than a Saturday commit: it changes what four screens show; players
who have not played are absent from `statsMap` rather than nought, so they would
move from `0` to a dash; and `statsMap` has been non-empty for exactly one day, in
one state. The season table on `/players` and `/players/[fantraxId]` needs a
different answer again, because `statsMap` is per period and those are season
totals — and while the season is one gameweek old the two cannot be told apart.

### `getPlayerStats` flipped its default

The 13 Aug sweep tried fourteen spellings and got a projection every time, and
left the question open: "whether it flips to real numbers once games exist is
unknown and resolves itself on 21 Aug". It resolved. The default is now
`SEASON_926_YEAR_TO_DATE` with real numbers. The lesson from 13 Aug still stands
and is now load-bearing for the opposite reason: read the season off
`displayedSeasonOrProjection` rather than assuming either answer.

### FPL, three things

- **`GET /api/event-status/`** is the authoritative answer to "has bonus been
  confirmed", one row per match date: `{"bonus_added": false, "date":
  "2026-08-21", "event": 1, "points": "p"}`. It matters because the live feed
  carries *provisional* bonus long before that flag turns: Ødegaard 3, White 2,
  Saka 1 were in `element.stats.bonus` and folded into `total_points` while
  `bonus_added` was still false. **Agreement with the BPS order is not evidence
  of finality — provisional bonus is by construction the current BPS order.** The
  `settled`/`dataChecked` ladder derives the same rungs from reads we already
  make, so this is recorded as a fact, not as a fourth request to add.
- **The live endpoint returns a row for every player in the league**, not only
  those who appeared: 600 elements, 600 with an `explain` block, 569 of them on
  zero minutes, including players whose fixture is three days away. Before a
  round's first kickoff it is `{"elements": []}` (verified against event 2).
  This is what broke `contribution.played` — see below.
- `influence`, `creativity`, `threat` and `ict_index` are the string `"0.0"` for
  every player in the live feed even after 90 minutes. We map none of them; do not
  start. `defensive_contribution` **is** live and is a count — CBI+tackles for
  defenders, CBI+tackles+recoveries for mid and forwards, 0 for keepers, verified
  against all 31 players with minutes.

### The clean-sheet preview was watched through a whistle, and it was right

The roadmap's Lane B item, closed properly on the 15:00 kickoffs. `/matchday`
rendered `7 to play +4` for test3 and `9 to play +1` for 123 — the first time
`pendingCleanSheets` has ever produced a number.

Traced to the men behind it rather than trusting the totals: test3's +4 was
**Pickford, slotted G**, in a match Everton led 2–0 at 68'; 123's +1 was Wilson,
slotted M. Both are the right per-position prices (`GOALIE` CS 4, `M` CS 1), and
both come off `slot.position`, which is the correct side of the slot-vs-default
split above.

At the whistle Fantrax settled Pickford at `Min 90 → 2.0, CS 1 → 4.0, Sv 4 → 1.0`,
total 7.0, and the team went 20 → 27. **Our +4 became their +4 exactly.**

Two refinements to what this file already said. Fantrax does not simply withhold
clean sheets until full time — at 90' with the match still in added time,
Pickford's row carried `Sv 4 → 1.0` and **neither `Min` nor `CS`**. So saves are
credited in play and minutes are not, which means the "one exception" note in
`join/cleanSheets.ts` is two exceptions. And the divergence case is still
untested: theirs is "on field", ours is FPL's team clean sheet, so a defender
subbed off before his side concedes remains the one we would over-count.

### Pool sizes have drifted and CLAUDE.md is stale on both

FPL bootstrap now carries **600** elements against the 564 recorded on 3 Aug.
Fantrax `getPlayerIds` now returns **671** entries — 611 players plus 60 synthetic
club entities (20 each of `Tm`, `TmG`, `TmOF`) — against "759 entries of which
~699 are players". Both numbers in CLAUDE.md are now wrong.

### The real league answers live scoring with a team that does not exist

`getLiveScoringStats` on `ayyoh3n2mr326v2o` returns one team, id **`-3`**, on
`totalFpts: 0.0`, while `getTeamRosters` on the same league answers `NO_TEAMS`.
`mapLiveScores` maps it faithfully to a `LiveTeamScore`. It is inert — every
consumer looks the map up by a real team id and `-3` matches none of them — but
it is a negative sentinel id in a `Record<string, …>` keyed by team, and anything
that ever *iterates* that map instead of indexing it would print a phantom team.
Recorded rather than filtered: the filter would be a guard for a caller that does
not exist.

## Between two rounds, and what the first one taught (27 Aug 2026)

Gameweek 1 is over — `finished`, `data_checked`, and still `is_current`, because
FPL holds its pointer on a finished round until the next deadline. Gameweek 2
kicks off 28 Aug 19:00Z behind a 17:30Z FPL deadline. So the app spent four days
in the **between-rounds** state, which it re-enters every week and which nobody
had ever looked at. Most of what follows came from looking at it.

### `main` and `origin/main` had diverged, and production was five weeks behind

Not a code bug, and it outranked every code bug. Local `main` held 79 unpushed
commits on top of `3a9c56f` (19 Aug); `origin/main` held the same base plus eight
daily capture commits from the CI bot (20, 21, 23–27 Aug). Neither contained the
other.

Consequences, in order:

- **Vercel builds `origin/main`, so production was serving 19 Aug code.** Every
  fix the first matchday taught was undeployed — `kickedOff()`, the live dot that
  burned for sixty-one of GW1's seventy-four hours, FPL's deadline printed under
  the bare word "Deadline". Gameweek 2 would have kicked off on all of it.
- **`--force` would have destroyed eight days of capture history**, which
  `capture.yml`'s own header says cannot be recreated from anywhere.
- **A merge would have been silently worse than a rebase.** `vercel.json`'s
  ignore command is `git diff --quiet HEAD^ HEAD -- ':(top)' ':(exclude,top)data/snapshots'`,
  and a merge commit's `HEAD^` is our own tip — so the diff Vercel evaluated
  would have been the eight captures' files and nothing else, skipping the build
  and leaving 79 commits undeployed a second time. The 22 Aug handover predicted
  this shape as "never let a capture be the last commit in a push"; a merge is
  the same trap wearing a different hat. **Rebase.**
- **`npm run capture:status` reported `rehearsal: OVERDUE` and exited non-zero,
  and the cron was innocent.** The captures existed, on origin. The watchdog
  reads the working tree and cannot tell "captures stopped" from "you have not
  pulled" — which was the one state it was actually in. Worth knowing before
  anyone reacts to it by running `npm run capture`, which would have written a
  second, conflicting `2026-08-27` directory.

The rebase hit exactly one conflict: both sides captured 2026-08-22, the CI at
05:18Z and a manual run at 11:07Z. Thirteen of the seventeen files were
byte-identical; the difference was that ~530 players had flipped `FA` → `WW` as
waivers opened. **Neither version held unique information** — the 23 Aug capture
records 553 `WW` regardless — so the manual commit was dropped and the CI's
unbroken ~05:1xZ series kept, which also preserves the only capture in the series
that catches the flip mid-transition (15 `WW` / 532 `FA`).

### The two calendars had drifted, and every ordinary squad read was crossing them

The biggest on-screen defect of the day, and it was found by rendering the page
rather than by reading the code.

`getLeagueSquads` with no round asked FPL which gameweek it is and asked Fantrax
**nothing**, taking whichever period Fantrax considered open. On 27 Aug those
disagreed: Fantrax was already serving **period 2** while FPL still pointed at
**gameweek 1**. So the desk read "Gameweek 1 · head-to-head" over `0 – 0` and
`0 – 0`, because period 2 has had no football; the head-to-head board showed next
week's opponent; and `/squad` printed "Period 2 · Gameweek 1", reporting its own
mismatch to anyone who read the line.

**There was no week where this was right.** The two calendars turn over at
different instants by construction — FPL at its own deadline, Fantrax at the
period's first kickoff — which is ninety minutes apart on a Friday-night round
and a day and a half apart on the rest. The period is now derived from the round
in view, so the whole page is one week's.

A second thing fell out of it: `periodAsAsked` was true by construction whenever
nothing was asked for, which is the read nearly everyone makes. The check that
stops a future roster opening the gate under an open period's number was running
only on the pages that named a gameweek. It now runs on all of them.

### `getLiveScoringStats` honours the period. `getTeamRosterInfo` does not.

The 22 Aug handover called this "the one I would take next", and it is settled.

Probed today against the rehearsal league:

| period | `allEventsFinished` | ACTIVE `totalFpts` | `statsMap` men | still to play |
|---|---|---|---|---|
| 1 | `true` | 31 | 8 | 0 |
| 2 | `false` | 0 | 0 | 11 |

Against `getTeamRosterInfo`, periods 1, 2 and 3 answer **byte-identical points**.
Only the opponent column moves — `@BOU Sat 10:00AM` against `CRY 0 @EVE 2 F` —
which is why the 19 Aug probe recorded the parameter as honoured. It is honoured
for the fixture and inert for the number, and a card headed "This period" was
showing a running season total for a week.

`statsMap` is the fix and also fixes the other one: it is the **only per-player
number Fantrax publishes priced at the roster slot**, so the eleven adds up to
the header over it. Rendered proof against period 1: test3 reads **45** over
7 + 0 + 8 + 8 + 8 + 7 + 3 + 2 + 2 = **45**, and Saka reads **8** where the season
table pays him 6.

It costs nothing — the same `getLiveScoringStats` was already fetched for the
scoreboard — and **deletes three `getTeamRosterInfo` POSTs** per cache window.

Three things about the payload that only reading it could have taught:

- **Not every `statsMap` key is a man.** `_5010` and `_5020` are the outfield and
  goalie group subtotals — the same group ids `scoringCategorySettings` uses —
  and the two of them sum to `totalFpts` exactly, as the men do. Mapped as
  players they are two phantoms, one carrying most of the team's score.
- **The position segment in `scipId` is a trap.** `object2` always says `#-1`,
  while `getLeagueInfo` lists a category once per position it prices it for.
  Outfield Goals and Clean Sheets have **no `-1` row at all** in the rehearsal
  league (`5010#6090` is 701/702/703; `5010#6249` is 702/703), and the real
  league has none for `6014`, `6101`, `6181`, `6249`, `6696`. Keying a label
  table on the whole `scipId` resolves Minutes and Assists and silently drops
  exactly the categories a reader is looking for — which reads as "he did not
  score", not as a bug. Key on `{groupId}#{categoryId}`.
- **The two leagues answer different vocabularies.** Ours scores Key Passes
  (`6002`), Midfielder Points (`6181`), Keeper Points (`6689`) and Defensive
  Points (`6696`), and has **no Minutes category at all**; the rehearsal league
  scores Minutes and Saves and neither of ours. A mapper tested against one
  proves nothing about the other, so both are recorded as fixtures.

**Still wrong, deliberately:** `/players` and `/players/[fantraxId]` remain
priced at a man's default position. `statsMap` cannot help them — it is per
period and those are season totals. `/squad/[teamId]` with the gate **closed**
also keeps the season table, and that one is a rule rather than a gap: the keys
of `statsMap` **are the eleven**, so reading it there would rebuild the
arrangement that branch exists to withhold.

**And one loss worth naming.** `getTeamRosterInfo`'s header carries Fantrax's own
prose — "Clean Sheets On Field -- Awarded to a player who played at least 60
minutes…" — and that is where this league's rules are published. `getLeagueInfo`
carries the label alone. So the live card's tooltip is empty where the season
table's is not. Accepted rather than keeping a request alive for a tooltip; the
sentence still reaches a reader on the player's own page.

### The playoff was published data and we were drawing an invented one

`getLeagueInfo` answers, for the real league:

```json
"playoffs": { "used": true, "numPlayoffTeams": 4, "firstPlayoffPeriod": 35,
              "lastRegularSeasonPeriod": 34, "mergePlayoffPeriods": false }
```

`raw.ts` did not mirror the field, so nothing in the code could see it, and the
table drew its cut from `PLACEHOLDER_ROUNDS` — an invented final between first
and second, which is a top **two**. Sixteen managers would have read the wrong
line all season.

The rehearsal league answers `{"used": false}`, so both states are live and both
are tested. Null is an answer: a league with no playoff has no line to draw
rather than a line at zero, and the rehearsal table correctly stopped drawing
one.

Same shape as `0e4dd6b`: a field the provider was already sending, absent from
`raw.ts`, with a docblock explaining the workaround as though it were a
constraint. A placeholder may stand in for a fixture nobody has settled. It may
not stand in for a setting the provider already answered.

### A cached domain object can predate a field on it

Adding `scoringCategories` to `LeagueInfo` threw the page on first render, off a
`league-info` cache entry written before the field existed. It is a dev artefact
today and a **deploy artefact** in general: any new field on a cached object can
be missing from an entry the previous deploy wrote. Handled where it belonged —
a breakdown is the one thing on that card that may go missing without lying, so
it degrades to no rows rather than throwing the page away.

Worth remembering the next time a field is added to anything behind `leagueCache`.

### Smaller, and both the same shape: code asking the URL about the round

- **`Season.tsx` dropped the gameweek from its squad links.** `Tie.tsx` carries
  `?gw=`; `Season.tsx` did not, so every row of a team's whole season opened this
  week's fifteen. The 22 Aug handover records this as fixed, and it was — on one
  of the two views. The repro was "Schedule → week 2 → tap a team", which is the
  gameweek branch rendering `Tie`; `Season` is the team branch behind `?team=`.
  What hid it: `Tie`'s `Side` already had its round in scope, so there the fix
  was a query string on an existing href, while `Season`'s `Opponent` needed a
  prop threaded — enough friction that a grep finds it and a memory of having
  fixed it does not.
- **The provenance line vanished without `?gw=`.** `settled` compared the URL's
  gameweek to FPL's, so it could only be true on a page reached with one.
  Arriving from the live board on a finished round silently withheld the line the
  page exists to print. It asks `roundState` now.

### `/matchday` could not name the round coming up

`BetweenGameweeks` looked for the next kickoff on `snapshot.fixtures`, and
`getFootballSnapshot` fetches **one round's** fixtures. With every fixture in it
finished, "no kickoff left" read as "no football left", and the front of the app
printed *"The next one appears here once FPL names its fixtures"* — which FPL had
done weeks earlier — with both buttons pointing at the round just played.

`nextRound(fixtures, at)` asks the season instead, off `seasonFixtures`, which is
already cached and already warm on that path. Ordered **by kickoff and never by
"the lowest gameweek with an unfinished match"**: FPL leaves a rearranged fixture
in its original `event`, so the other reading answers 20 from December until a
February replay is played.

`focusGameweek` was deliberately left alone. Making it prefer `is_next` at the
last whistle would take Monday night's results off the front page on Tuesday and
push the finished round onto the cold snapshot cache — the one that served a
68-minute-old "Live 45′" on 22 Aug.

The schedule had the same root: `chooseRound` fell back to `gameweek >= now`, and
with `now` pinned to a finished gameweek 1 the `>=` let it win for four days. It
now takes FPL's round only while that round still has football left in it.

### FIXED the same evening: the lineup gate was anchored on the wrong instant

**The most serious thing found today, and it was not a gameweek 2 problem.**

`visibility.ts` gates on `periodStarted` — `now >= period.start`, the **roster
period boundary**. The rule the same file states at its top is about the
**deadline**: *"Sixteen managers who can see each other's XI before the deadline
are playing a different game from the one they agreed to."* `gazette/deadline.ts`
already corrected exactly this belief for the *displayed* deadline — "it is not
fifteen minutes before the period boundary, and this file used to compute it that
way" — and `visibility.ts` never got the correction.

Counted off the real league's own published calendar: **33 of 38 roster periods
open at 06:00-0400 (10:00Z) on the Friday.** Only five open at 15:00-0400.

| | roster period opens | first kickoff | our lock | gate open early by |
|---|---|---|---|---|
| Period 4 | Fri 11 Sep 10:00Z | Sat 12 Sep 14:00Z | 13:45Z | **27 h 45 m** |
| Period 6 — the real league's first | Fri 9 Oct 10:00Z | Sat 10 Oct 11:30Z | 11:15Z | **25 h 15 m** |

**It has not bitten yet by accident.** Periods 1, 2 and 3 are three of the five
that open at 19:00Z, where the boundary falls *after* the 18:45Z lock — so
gameweek 2 is safe, and period 4 on 11 Sep is the first one that is not. Period 6
is the day before this app goes to sixteen people.

Reached two ways, and the second needs no assumption about Fantrax's rollover:
any tap on a gameweek-4 row in the schedule → `/squad/{rival}?gw=4` → `roundOf(4)`
→ `fetchTeamRosters(league, 4)` → echoed 4 → `periodAsAsked` true → gate open.

**Honest bound:** this is a leak only if `getTeamRosters` serves the live,
editable arrangement rather than a locked one. Today's identical-bytes result
across periods 1–3 strongly suggests it does, and **the probe below settles it.**

**Shape of the fix, two commits:** gate on `locksAt(firstKickoff(period, kickoffs))`
instead of `period.start`. Both need to be reachable from `league/visibility.ts`
without league→gazette, so first move them from `gazette/deadline.ts` into
`league/calendar.ts` — which already declares `GameweekKickoff`, already imports
`LeaguePeriod`, and is the declared seam. Three consumers then, so the move is
earned; per CODE_RULES it lands as its own commit, and the gate change follows.

**Landed 27 Aug**, as two commits: the move, behaviour-neutral with 534 tests
before and after; then the gate, starting from the failing test (period 4 at
2026-09-11T10:00:00Z returned `lineup` and must return `squad`).

Three independent skeptics were asked to REFUTE it and all three upheld it. The
lens that attacked the honest bound above found the opposite of what it looked
for, from the repo's own captures: rehearsal `getTeamRosters` carries `period: 1`
through the 24 Aug capture and `period: 2` from the 25th — **three days before
period 2 begins on 28 Aug 19:00Z.** Fantrax's editable period runs AHEAD of the
roster-period boundary, so the arrangement served in the Friday-to-Saturday
window is live and still changeable. The bound closes against the gate.

**Two numbers, and the difference is the point.** 33 of 38 against live FPL
fixtures; 34 of 38 against `packages/core/src/league/__fixtures__/periodAlignment.json`,
recorded 6 Aug. Gameweek 8's first kickoff has moved onto a Friday since, which
flips period 8 from unsafe to safe. **Which weeks are safe is a television
schedule, not a fact** — so the rule is computed and the test fixture declares its
own kickoffs rather than reading FPL.

**Why every test passed for a week.** `visibility.test.ts` built its fixture from
periods 1 and 2, both Friday-night kickoffs, two of the four weeks where boundary
and lock agree. A fixture drawn only from the exceptional case cannot see the
rule. It now spans 1, 2, 3, 4 and 6.

**Not monotone.** On those four Friday-night weeks the old gate was fifteen
minutes conservative, so the fix opens them fifteen minutes EARLIER — correctly,
since the schedule and the masthead already print that instant as the deadline.

**What it does not close.** `getTeamRosters` echoes the period it is asked for,
so `periodAsAsked` compares our number against our own and is vacuous by
construction. If the parameter is inert for the roster BODY, a tap on any past
round still shows today's arrangement, and the fix has closed the window on the
round in view rather than the leak entire. The probe below decides it — and note
the rehearsal league is dormant (`LINEUP_CHANGE` = 0 transactions), which is
exactly why every period returns byte-identical bodies and why no probe so far
can separate the two storage models. Breaking the tie needs one XI rearranged
with the commissioner's cookie, then `?period=1` diffed against `?period=2`.

**And one assumption the whole design rests on.** `lineupLockType` is "set amount
of time before 1st game of period", read off the settings page on 20 Aug. If the
commissioner's lock is really the period boundary, this fix is wrong and the old
code was right. The lead's VALUE is irrelevant — any lead under about eighteen
hours leaves a window — but its TYPE is not. One look, before 11 Sep.

### Two observations to make while gameweek 2 is on

- **`getTeamRosters?period=1` after 28 Aug 18:59:58Z**, when period 1 has actually
  closed. Does it serve period 1's locked arrangement, or always the live editable
  one? Half-answered already — identical bytes for periods 1, 2 and 3 *while
  period 1 is still open*, which is suggestive and not decisive. This is a clean
  experiment for about one day, and its answer sets the severity of the section
  above.
- **The flip-order sample, Mon 31 Aug from ~21:00Z.** Gameweek 1's chance was
  missed: the question of whether the `bonus-settling` rung is reachable needed
  `/api/event-status/`, `/api/fixtures/?event=N` and bootstrap `data_checked`
  sampled together from Mon 24 Aug ~21:00Z, and by today all four GW1 dates read
  `bonus_added: true` with the round `data_checked`. Gameweek 2's window is the
  second and last easy chance this month.

### Reviewing the day's own commits, and the regression it caught (27 Aug 2026)

Forty candidate findings over the day's work, each handed to a separate agent
told to refute it. **Twenty survived**, collapsing to twelve once three lenses
that had found the same thing were merged. The refuted half is as useful: it
included several rule-of-2/3 "abstractions" that CODE_RULES explicitly says to
leave duplicated at two occurrences.

**The one that mattered was a regression I had shipped four hours earlier.**

The 4a57141 commit made every squad read ask Fantrax for the period the round in
view is scored in, so a page would be one week's throughout. Right about the
scores, the pairings and the headings. Wrong about the rosters, because the
period parameter is **inert for the roster body and live for its label**:

    getTeamRosters             → period 2, rosters 3183 bytes
    getTeamRosters?period=1    → period 1, rosters 3183 bytes
    rosters identical: true

So asking for period 1 does not fetch period 1. It returns the arrangement
sixteen managers are editing for period 2, relabelled — and a label is exactly
what the lineup gate reads. It found period 1, whose lock passed on 21 August,
and opened. Every rival's currently-editable eleven, published, on the default
path with no query string.

I had verified that page by hand the same evening and read the open lineup as
period 1's history. It was this week's team sheet. **Reading a screen is not
verification when the thing under test is which week the bytes are from.**

The fix separates the two numbers rather than lying to the gate about one:
`getTeamRosters` is asked for nothing, so the payload carries Fantrax's own open
period and the gate judges the arrangement it is actually holding; `roundPeriod`
carries the round in view to the six reads that genuinely want it.
`periodAsAsked` is deleted — it compared our number against Fantrax's echo of our
number, true by construction, protecting nothing.

**The cost, which is not a loss.** A completed round's elevens are withheld once
Fantrax rolls its period, which the captures show it doing days early — 25 August
for a period beginning the 28th. Those elevens were never that round's. The app
had been captioning this week's arrangement with last week's heading; withholding
is the honest version of the same fact.

#### The rest, worth keeping because they name recurring shapes

- **Absence with two causes.** `statsMap` names the ACTIVE eleven, and the map was
  joined against all fifteen — so every reserve rendered "Nothing has scored for
  him yet — his minutes have not registered either" eleven lines above "FPL
  records 90'". A card contradicting itself in one render, for three or four men
  per squad per week. The sentence had collapsed four different claims.
- **A fallback tied to the wrong condition.** `/squad` read the season table when
  the LIVE read was absent, rather than when the branch that LABELS it a season
  total was taken — so with `getLeagueInfo` refused, your own lineup showed
  season totals priced at each man's default position under a card headed "This
  period".
- **A boolean spanning three rungs asserting the top one.** `settled` was true at
  `bonus-settling`, `provisional` and `final`, and the banner said "Fantrax's
  final ones" beside a `RoundWord` that withholds that word until `data_checked`.
- **`raw.ts` disagreeing with its own recorded fixture.** `delta`/`refresh` were
  declared at the root of `RawLiveScoring`; the wire and the fixture both put
  them inside `statsPerTeam`. Neither noticed, because nothing reads either.
- **Unread fields vetoing a read one.** `mapPlayoffs` required all three fields,
  so a league stating `numPlayoffTeams` without the period bounds drew no cut —
  two numbers nothing reads deciding the one number the table draws.
- **A ceiling breached by the seventh copy.** `round.test.ts` had seven local
  constructions of one `Fixture`, three pairs byte-identical, and crossed 300
  lines adding the last. Split on the seam `round.ts` already draws in its
  signatures — the season-shaped functions from the snapshot-shaped ones — which
  landed both halves under the *soft* ceiling, the sign the seam was real.
- **And the gate that skipped itself in silence.** The served-league check added
  hours earlier simply did not run when Fantrax would not name the league, and
  the walk reported every route clean regardless. The defect it was written to
  catch, in the check itself.

## The paper got a lead, and the roster echo runs ahead of its own calendar (28 Aug 2026)

The Gazetta had four columns of equal weight and no front-page story, which
`docs/ui/gazetta.md` had recorded as its one known gap: *"the best story on it is
`left him on the bench`, and it is printed as a footnote on a row rather than as
a headline."* Craig chose the shape — an editor picks the lead each week rather
than one story always holding it — and building it turned up a Fantrax fact that
matters well beyond the front page.

### The lead is a running order, not a score

`gazette/lead.ts` ranks four kinds of story and returns the strongest, or null.
*(Renamed `gazette/stories.ts` later the same day, and it now returns the whole
running order rather than the strongest alone — which was the point of the
change. The ordering argument below is unaffected.)*
The order is an argument and is written down where it can be argued with, in the
same spirit as the ranking `teamOfTheWeek` already keeps for a defender against a
forward:

1. **A match decided by nothing.** Two of sixteen spent Sunday night on a knife
   edge, and nothing else on the page is that.
2. **A manager left the week's best player out.** The story nobody else can
   tell — Fantrax holds both halves and never puts them together.
3. **A hammering.**
4. **A trade.** Rare in a draft league, and the only story an international break
   can produce.

A cross-kind numeric weight was considered and rejected. There is no currency
that converts a one-point finish into a benched keeper, so a number claiming to
would have been arbitrary wearing the costume of an answer — and it would have
been the kind of arbitrary nobody could argue with, because it would have looked
computed.

**Both result thresholds are shares of the winning total, never numbers of
points**, and that is a §3 point rather than a taste one: the points are a
commissioner setting. This league's weeks come out in the tens; a league paying
for every touch comes out in the hundreds, and a threshold written in points
would read every week of one of them as a thriller. A twentieth of the winner's
total is a squeaker; half of it is a hammering, which is the same sentence read
the other way — the loser did not reach half.

Nothing manufactures a lead. Most of the week there is not one, and the next
deadline — which the masthead already states — is deliberately not a story. Nor
is there one while football is on: the live bar leads then, and a headline is the
one place on the page a provisional claim cannot go.

First run, against period 1 of the rehearsal league: **"No contest — test2 took
test4 apart. 41–19. 22 points between them."** The other pairing, 45–31, is an
ordinary win and correctly leads on nothing.

### The finding: the roster echo runs ahead of Fantrax's own calendar

Probed at 08:29Z on 28 Aug, against Fantrax's own published dates in the same
payload:

```
rosterPeriod 1: 2026-08-21T15:00-0400 → 2026-08-28T14:59:58-0400   (18:59:58Z)
getTeamRosters (no period argument) echoes:  2
```

**Ten and a half hours inside roster period 1, `getTeamRosters` answers 2.** The
likely reading is that it labels the arrangement a manager may currently *edit*,
which is period 2's — period 1's lineups locked on 21 Aug — rather than the one
the calendar is in. Either way the operational fact is the one that bites: the
arrangement on hand is not always the arrangement that was played.

`teamOfTheWeek` reads `slot.status` off exactly that arrangement to say `left him
on the bench`. Joined against the round FPL is showing — gameweek 1 all day
today — that footnote was a claim about a lineup nobody had fielded: *this*
week's football with *next* week's team sheet. It never printed a wrong name,
because the rehearsal league's four teams are auto-drafted and nobody moves them;
on 10 Oct, with sixteen managers editing on a Wednesday, it would have.

`Edition.fielded` is the check — Fantrax's own label against the period the round
in view is scored in — and when it is false **every claim about who was STARTED
is withheld**, from the lead and from the eleven's rows alike. What the players
did is football and stands either way, which is why the eleven itself still
prints. Today it is false, so the front page leads on the result and the
bench footnote is absent, which is the honest answer.

This partially answers the standing question about `getTeamRosters`' ARRANGEMENT
below. It does not answer the other half — whether `?period=N` *serves* a past
arrangement — which is still only askable after 18:59:58Z tonight.

### One thing looked at and deliberately left

**The gazette does not consult `rosterDisplay`.** `teamOfTheWeek` reads ACTIVE /
RESERVE for all sixteen teams directly, so in principle the front page could
publish who is in a rival's XI before the lock. It cannot in practice, and the
reason is arithmetic rather than a gate: a pick needs `minutes > 0`, and before a
round's first kickoff nobody in the league has any. The window between the FPL
deadline and our own lock — 17:30Z to 18:45Z tonight — is exactly the slice where
the two could disagree, and it is empty because no football has been played in
it. Recorded rather than fixed: the fix belongs with the lineup-gate work already
booked below, which is about the lock rather than the boundary.

## The paper stopped being a list (28 Aug 2026)

Craig, on the first proofs of the lead: *"this is a list, we wanted a news site,
this is boring and shit."* He was right, and the diagnosis was not styling.

**No photograph anywhere.** The app ships a four-rung cut-out system
(`PlayerImage` — this season's portrait, one of ours, the club kit, his
initials), club crests, kits and Fantrax team badges, and the front page used
none of them. A newspaper without a picture is a memo.

**And the biggest block on the page was a table.** Team of the week was eleven
identical hairline rows, which is what a reader actually saw when they said
"list". It now stands on `PitchRows` — the component already drawing the three
other elevens in the app — so the front page costs nothing it was not already
shipping. `TeamOfTheWeek` gained `lines` beside `picks`: the same men in a second
order, one being how they rank and the other where they stand, with `shape`
counted off the lines so the formation printed and the formation drawn cannot
disagree. `picks` stays score-ordered because the lead reads the first man his
manager left out, and that claim only means anything on a ranked list. `Pick`
gained `clubId` for the cut-out's kit and crest fallbacks.

**The lead got a picture band**, and which picture is a question about honesty
rather than layout. Only the bench story has a photograph in it — a man his own
manager left out is a man, and we have his face. A result is not a face, so there
the picture is the scoreline itself at 6xl, which is what a paper does with a
score. Nothing is borrowed to fill the band: a portrait of the winner's best
player would be a picture of a story we are not telling. The standfirst stops
repeating the scoreline once the band carries it — a line that says it again is a
caption.

## `?period=N` is history, and it took a claim to prove it (28 Aug 2026)

The question two files called open — does `getTeamRosters?period=N` serve a past
arrangement, or today's relabelled — is answered, and the answer is history.

**It could not have been answered by looking harder.** Every read of the
rehearsal league agreed with every other because nothing in that league had moved
since 12 Aug: the arrangement is identical across all seventeen captures from
12 to 28 Aug. Two hypotheses that predict the same bytes stay indistinguishable
however many times you fetch them, and eight days of captures bought nothing on
this question. What settled it was Craig **changing something** — he dropped a
forward and claimed another on `test2` this morning, after the 07:48Z capture.

Read at 11:15Z, with the claim about four hours old:

| asked | echoed | test2's forward |
| --- | --- | --- |
| `?period=1` | 1 | Osula (`05t6x`) — the man dropped |
| `?period=2` | 2 | Garcia (`07898`) — the man claimed |
| `?period=3` | 3 | Garcia |
| no parameter | 2 | Garcia |

Period 1's answer matches the 07:48Z capture exactly, and every capture back to
12 Aug. So the parameter **selects**, and it selects squad MEMBERSHIP and not
merely the arrangement — two reads of one league seconds apart disagree about who
is rostered at all. That is more than the question asked for: a lineup is
per-period in every fantasy product, but a squad is usually a fact about now, and
Fantrax versions that too.

The echo is still not the evidence and never was; `periodAsAsked` compares our
number against our own and stays vacuous by construction. The divergence is the
evidence.

**Fantrax's own log corroborates**, which is what the 12 Aug transactions
decision looks like when it works: `CLAIM_DROP` reads `totalNumResults: 1` in
both the 27 and 28 Aug captures and 2 live. Native feed and capture diff agree.

### The half that is still open, and it is the half that decides the fix

**When does a period stop tracking the live one?** At its own lineup lock, or
later, when Fantrax's editable period moves past it. For gameweek 1 those are
about three days apart — period 1 locked 21 Aug 18:45Z, and the captures put the
label rolling from 1 to 2 somewhere between 24 Aug 05:25Z and 25 Aug 05:20Z. No
roster changed inside that window, so this probe cannot see which instant it was.

It matters in exactly one place. `squads.ts` does not send the period, and the
reason recorded there was that the parameter is inert — now false. What replaces
it is narrower and still real: if a period freezes at ROLLOVER rather than at
LOCK, then for those three days `?period=N` answers with a live, still-editable
arrangement under a label whose lock has passed, and `visibility.ts` would
publish sixteen managers' unlocked elevens. That compounds with the open
`lineupLockType` reading, which is the other thing standing between us and
knowing whether edits are even possible in that window. The gate is the one
surface where being approximately right costs sixteen people the game they agreed
to play, so it goes on reading the label Fantrax volunteers about the arrangement
it is actually holding — sound whichever way the freeze lands.

The price is a wrong answer on `/league/matchups/[teamId]` for any round already
played: today's squad under last week's heading, which as of this morning means
Garcia standing in a gameweek 1 eleven he was not signed for. It is a wrong
answer and not an unsafe one, and the board says so on screen.

**The experiment is one roster change made after a period has locked, then that
period re-read.** Period 2 locks tonight at 18:45Z. A change made tomorrow and a
read of `?period=2` settles it — and unlike this morning's it has to be
deliberate, because the whole value of this league is that nothing else in it
moves.

## The paper got a voice, and it is not a template (28 Aug 2026)

Craig, on the lead's four templated sentences: *"look at the gazetta in world cup
fantasy, it has a real voice."* Reading `~/worldcup-fantasy/lib/gazzetta/` settled
what the difference actually is, and it is not styling or copy: **that paper is
written by Claude from a facts-only brief.** Ours had four hardcoded sentence
shapes, and no amount of rewriting them gets past that ceiling — "22 points
between them" is a template and reads like one.

**The architecture that reconciles a live paper with a written one: facts are
live, prose is published.** Everything countable on the front page updates on the
thirty-second poll through the pure builders. The column is written twice a week
by a GitHub Actions job, committed as `data/editions/latest.json`, and baked into
the build. A column regenerating every thirty seconds is not a column; a sentence
about a score that has since moved is worse than no sentence.

Deliberately NOT the sibling's design, which caches per day in Upstash KV behind
two authenticated routes and an off-Vercel generator. We have no KV and want
none: the repo already commits data from CI every day, `vercel.json` already
excludes exactly the two directories that must not trigger a build, and the app
already static-imports a checked-in JSON file (the identity bridge). So an
edition is a commit, and the commit that writes it is the commit that deploys it.
No SDK either — one `fetch`, twenty lines, per CODE_RULES §2.

### The brief is a list of lies it prevents

`gazette/brief.ts` is the facts the writer may use and nothing else, and almost
every line of it exists because a model would otherwise write a sentence that
reads perfectly and is false. Handed a scoreline it narrates who scored first and
in what minute. Handed a squad it invents a centre-back. Handed "L. Díaz" it
substitutes the famous one. None of that is catchable downstream.

Two decisions worth keeping:

- **The instruction lives with the data, not in the voice.** A rule about
  `toPlay` written three hundred words above the number it governs is a rule
  about nothing, so each block carries its own guardrail: a dash is not a nought,
  beside the dash; IN PLAY is not a result, beside the tie.
- **Withhold, do not just forbid.** The first draft told the writer not to
  mention benching when `fielded` was false and still handed him rows marked
  BENCHED — an instruction against a temptation we put there ourselves. A test
  caught it. The flag is what has to go.

Its tests assert what it refuses to allow, which for a component whose output is
English is most of what can be tested at all.

### Marked homework

`markPreview` counts last week's calls against the results. A pundit nobody marks
is a pundit who never has to be right, and it is pure comparison rather than a
claim the column makes about itself. Declining to call a tie is not counted as
wrong: otherwise silence is the cheapest way to look right.

### Pedigree, a little

`getDraftResults` had been captured daily since 6 Aug and never read — `raw.ts`
said so in a comment about it being unmodelled by decision. The paper is the
reason to read it: a draft league's whole conversation is the gap between what a
pick cost and what he did, and no other fantasy format has it.

It needs **no bridge**. `draftPicks[].playerId` is a Fantrax pool id, the same one
the rosters and the transaction log carry, so pedigree meets a squad entirely
inside the league layer. First read of the rehearsal draft: Saka went pick 3,
Gakpo went in round 14, and the eleven's one wire pickup is the claim that shows
up in the same brief's business block.

Craig's steer was "a little — world cup leaned on it too much at times", so it is
in the brief and NOT on the page: the pitch cards already carry a name, what he
did and his owner, and a fourth line is clutter. The brief carries the rule with
the data — *use it only when it is the story, a paper that mentions every
player's draft round is a spreadsheet.*

Two absences kept apart, which a test caught: a draft still running returns a
PARTIAL list, and mapping it would file everyone not yet taken as undrafted — so
an incomplete draft maps to nothing at all. And an empty pedigree map makes the
brief say nothing about pedigree rather than calling every man a wire pickup.
Absence is not a wire pickup, on the same rule that a dash is not a nought. The
real league is in exactly that state until 10 Oct.

### Two things recorded rather than guessed

- **Bylines are house names, not real people.** Craig named Mark Lawrenson and
  Garth Crooks as the register he wants, and the register is what shipped — a
  predictions column that gets marked, and a team-of-the-week written by somebody
  with opinions about who is unlucky to miss out. The bylines themselves are "The
  Form Guide" and "The Back Page", because putting a real broadcaster's name on
  AI-written copy presents fabricated writing as theirs. They are strings in
  `scripts/edition/voice.ts` and Craig's to change.
- **`capture.yml` pushed blind.** Only `round-state.yml` rebased before pushing.
  A third writer to the branch made that a real race, and capture is the one
  workflow whose history cannot be recreated — so it must not be the one that
  loses. Fixed in the same tranche.

## Reading the paper back, and what it was actually saying (28 Aug 2026)

A quality pass over the day's own work. The two that mattered were found by
reading the brief the columnist would receive, not by a test — which is the
lesson: a prompt is a component whose output nobody can assert on, so the only
review available is to print it and read it.

**The preview had no projections in it.** The brief said *"these are Fantrax's
projections"* and passed `totalFpts`, which is what a squad has ACTUALLY scored
and reads a truthful nought until a ball is kicked. Probed against period 3:

```
mapLiveScores        →  points 0, toPlay 11   (all four teams)
projectedTotalsMap   →  41.7 and 40.0
```

So the first predictions column would have called eight ties off nought against
nought. `mapProjectedTotals` reads the real thing, summing per-player because
Fantrax publishes no team projection — ACTIVE only, `_5010`/`_5020` skipped,
absence null rather than nought. The two stay separate types: a projection is a
different claim from a score.

`calculatedProjectedTotalsMap` — the guess updated for what has already happened
— stays deliberately unread. It would quietly improve the column's odds every
hour the workflow ran late, which is marking your own homework with the answers.

**The preview's window never closed.** `locked` is true from the lock right
through the round, so a run firing mid-match would have filed a preview saying
nobody had kicked a ball. The lock-time run being skipped is the ORDINARY case —
GitHub skips schedules — so this was not a rare path. It closes at the first
whistle now, and a missed preview is simply not written.

**`markPreview` was dead.** Exported, tested, wired to nothing — and it was the
half of the feature that matters. Wiring it needed `decided` exported, because a
pundit is marked on all eight calls and the running order only surfaces two.

*It was not in fact wired. What landed was `mark()` in `write-edition.ts`, which
reads the archive and calls `markPreview` — and which nothing calls, twelve lines
under a comment saying the wiring had been "left out deliberately rather than
half-built". Both came out on 28 Aug; the feature is still unbuilt and the tree
now says so. The gates could not have caught it: root `lint` runs eslint only in
the `apps/companion` workspace, and the tsconfig `scripts/` extends sets no
`noUnusedLocals`, so dead code in `scripts/` is checked by nothing.*

### The rest of the pass

- **Eight barrel exports nothing outside core names**, trimmed, with a line in
  the barrel saying which nested types are deliberately absent so they are not
  re-added by reflex — the courtesy `football/index.ts` already pays
  `roundFinished`.
- **`mapping as never`** in the writer erased the bridge's type on provider data
  (§5). `as Bridge`, asserted as `squads.ts` asserts it.
- **The model's output is deduped, not just filtered.** Two sections keyed
  `verdict`, or one tie written up twice, are a React key collision — and the
  edge that already refuses a malformed row is where to refuse a repeated one.
- Two parameters reaching for `LeagueInfo` and `FootballSnapshot` through
  `ReturnType<typeof …>` now say so; one `React.ReactNode` on the UMD namespace
  now imports the type like every sibling file.

## The withheld panel named a deadline a week gone (28 Aug 2026)

Craig, between rounds: *"if i go to matchup tabs and see last weeks game —
'test2's eleven is not public until lineups lock for period 1' — once a matchweek
1 is done, it should be LOCKED, fantrax shows this."*

He is reading a page about gameweek 1 and being told to wait for a lock that
passed on 21 August. **Two different period numbers were on that screen and they
were allowed to disagree.** The gate judged Fantrax's own label — period 2, whose
lock is tonight — and was right to withhold. The sentence printed `roundPeriod`,
the round in view, because that was the nearest number in scope.

Reproduced exactly, live:

```
Fantrax's open period (no-parameter read): 2
rosterDisplay(fetchedPeriod=1) -> {"show":"lineup","period":1}
rosterDisplay(fetchedPeriod=2) -> {"show":"squad","because":"not-locked"}
```

**The structural cause is that the decision did not carry its own subject.**
`RosterDisplay`'s `squad` arm held a reason and no period, so a caller wanting to
name one had to find it elsewhere, and the only number to hand was the wrong one.
`not-locked` now carries the period it judged and the other three reasons still
carry none, because they fell back before any lock was consulted and there is no
period they could honestly name. The window where the two numbers disagree opens
when Fantrax rolls its label — right after a round's last fixture — and closes at
the next lock: roughly four days in seven, which is exactly the days somebody
reviews last week's matchup.

### The rule that would have shown him the real eleven is REFUTED

This morning's probe licensed an obvious repair: send `?period=N` whenever
Fantrax's own open label is strictly greater than N, on the reasoning that you
can only edit the open period, so anything behind it is frozen — which would make
the freeze-instant question irrelevant. **It does not survive.** It does not
remove that unknown; it trades it for a second one, *when does the label roll?*,
observed exactly once, in a 24-hour bracket, in a week where the safe and unsafe
explanations are indistinguishable.

Two mechanisms fit the one observation to the minute: the label rolls at a
period's last kickoff (safe), or it rolls on a fixed lead of about four days
before the next period opens (unsafe). Run the second over the alignment fixture
and **seven periods leak** — 12, 13, 17, 18, 19, 24 and 27. Period 13 is the one
to remember: it runs 1–4 Dec and locks 2 Dec 19:45Z, but the label would roll to
14 on 30 November, *before period 13 begins*, publishing sixteen rivals' midweek
XIs for nearly three days. The rule holds only while every period is longer than
the roll lead, and eight of this season's are three or four days.

Two further gaps, and the first is the sharper. **This morning proved versioning
of MEMBERSHIP — Osula out, Garcia in — and never of `status`**, the ACTIVE /
RESERVE field, which is the only thing the gate actually withholds. A per-period
squad list does not entail a per-period arrangement. And `?period=3` answered a
full roster for a period that can have no stored state, so "stored where it
exists, live where it does not" is a behaviour we have observed with nothing in
the payload to tell the two apart.

*Both were done the same afternoon, and both held — see the section below. The
history read shipped.*

## A portrait we did not have was asking Fantrax about a player who is not one (28 Aug 2026)

`PlayerImage`'s second rung is a portrait of our own, for the roughly one player
in four the Premier League's current set has no photograph of. It read
`/players/{code}.png` — and `app/players/[fantraxId]` is a real route on this
app. There has never been a `public/` directory, so a miss did not 404. It
matched the route with `fantraxId = "123456.png"`, and that route deliberately
does not 404 on an unknown id: it asks Fantrax for the profile and renders the
refusal. Measured:

```
/players/123456.png               -> 200, 24312 bytes of HTML, "Fantrax WARNING"
/_next/image?url=/players/...     -> 400 from our own optimizer
/portraits/123456.png  (after)    -> 404, no Fantrax call
```

So a pitch of fifteen was making several unsolicited `getPlayerProfile` POSTs per
render, for ids that are not players, against the provider whose politeness
policy is written down in the route's own header — "one profile per tap, never a
sweep of the 697". Nothing surfaced it: every rung failed downward exactly as
designed, the picture was right, and the only symptom was traffic.

**The general shape, and it is the part worth keeping.** A local asset path that
shares a prefix with a dynamic route is not a 404 waiting to happen — it is a
page render waiting to happen, and if that page has a side effect the side effect
is now on the fallback path of every image that is missing. `next/image` sends
local sources through the optimizer, so this happens server-side, at our expense,
invisibly. Any future `public/` path has to be checked against `app/`'s segments
before it is used. `/portraits/` is clear; `/players/`, `/squad/`, `/league/`,
`/matchday/`, `/gw/` and `/fpl/` are not.

Also fixed in the same pass: the fourth rung was unreachable for anybody whose
club we know. The `source` ternary ended `: club && shirtUrl(club, keeper)`,
which answers the shirt's URL at the `initials` rung as well as at `shirt`, so a
known club whose kit would not load retried the identical src, `onError` set
`initials` over `initials`, the `key` did not change, nothing remounted, and the
card stayed a broken image — an empty box on the grass, for exactly the player
the floor exists to catch. The file said "four rungs"; it was three and a hole.

## The arrangement is versioned too, so a played round shows its own eleven (28 Aug 2026)

The morning's claim proved Fantrax versions squad MEMBERSHIP per period. That was
never enough to act on: `status` — the ACTIVE/RESERVE split — is the only field
`visibility.ts` withholds, and a per-period squad list does not entail a
per-period arrangement. Craig moved test2's lineup in the afternoon, which is the
first lineup change the league has ever had — `LINEUP_CHANGE` went from 0 rows to
1 — and it answered:

```
?period=1   Osula (F), B.Fernandes (M) starting    the men who played gameweek 1
?period=2   Garcia (F), Cherki (M) starting        both of the day's changes
123 / test3 / test4                                identical
```

**Membership and arrangement are both versioned.** Nothing else in that league
has moved since 12 August, which is precisely why no read before this could tell
the two hypotheses apart — the same shape as the morning's problem, one level
down.

### The rule that shipped, and the one that did not

Refuted in the morning: *send `?period=N` whenever Fantrax's open label is past
N*. The label rolls on Fantrax's schedule, not ours. Recomputed against the real
league's live calendar rather than the stale alignment fixture, two of the 38
periods see the label roll as much as **19 hours before their own lock** — in
that window the label says "past" while sixteen managers can still edit. (The
morning's skeptic said seven periods and three days; it was reading
`periodAlignment.json`, which the tree itself marks stale. Fewer and shorter, and
it changes nothing: one window is enough.)

Shipped: the **conjunction**. `frozenPeriod` asks for a past period only when
Fantrax's open label is past it **and** our own calendar says its lineups locked.
The second condition is false throughout every early-roll window by construction,
so the rule is safe whichever way the roll actually works — which matters, because
we still do not know, and now do not need to.

`visibility.ts`'s gate is untouched. It still judges whatever period the payload
declares; what changed is that for a played round the payload now declares the
round in view. Null from `frozenPeriod` means "read the open period", which is
what the app did before any of this existed, so the failure direction is the old
behaviour rather than a new one.

Costs one extra request, sequential, and only on a past round: Fantrax's open
label is not knowable without asking, so the unparameterised read has to happen
first.

Verified against the running app in both directions — `?gw=1` renders
B.Fernandes and Osula with Garcia absent entirely; `?gw=2` renders the withheld
panel and not one player name anywhere in the payload.

**What is still unknown, and no longer blocks anything:** the instant a period
freezes — at its own lock, or when the label rolls past it. The conjunction is
insensitive to the answer.

## A merge commit skipped the deploy, and took nine commits with it (29 Aug 2026)

`vercel.json`'s `ignoreCommand` asks one question — did this commit touch
anything outside `data/snapshots` and `data/probes`? — and asks it of
`HEAD^..HEAD`. **On a merge commit that is the wrong diff.** `HEAD^` is the
first parent, so what it sees is only what the OTHER branch brought in, and
everything on the branch being merged from is invisible to it.

Pushed 9dbb367 on 29 Aug: nine commits of app work, merged with the cron's
round-state append. Its first-parent diff was one line of
`data/probes/round-state/gw2.jsonl`, the command exited 0, and Vercel skipped
the build. `gh run list` was green, the commit was on `main`, and production
went on serving the build from before any of it. This is the trap the 22 Aug
handover named — **verify the deployed URL, not the commit** — arriving through
a door nobody had checked.

A merge commit now always builds:

```
if git rev-parse -q --verify HEAD^2 >/dev/null; then exit 1; fi; git diff --quiet HEAD^ HEAD -- …
```

`HEAD^2` resolves only on a merge, and `exit 1` is Vercel's "build it". The
data-only skip is unchanged for every ordinary commit, which is the case it was
written for. Preferring a rebase to a merge on `main` would also have avoided
it, but a rule nobody can enforce is not a fix — the cron pushes on its own
schedule and a merge will happen again.

## The two bugs the first live weekend showed (29 Aug 2026)

Craig read the deployed app mid-gameweek 2 and found two, both of which had been
invisible until a round was actually being played.

**Squads was drawing a week nobody could change.** `getTeamRosters` with no
`period` answers whatever Fantrax currently has open, and that stays the LIVE
period all weekend — so from Friday teatime the squad screens showed a locked
eleven under a running score, when the eleven a manager opens Squads for is next
week's. `planningPeriod` (core, pure) now answers the first period whose lineups
have not locked, `planningRound` resolves it to a gameweek through the calendar
seam, and the two `/squad` routes ask for that instead of taking what they are
given. Every other caller of `getLeagueSquads()` — the matchday board, the
matchups board, the paper — still wants the round being PLAYED and still gets it
unasked, which is why this is a second question rather than a new default.

`frozenPeriod` became `periodToRead`, because it now answers both directions:
ahead of Fantrax's own label it asks outright, behind it the old conjunction
still holds. Reading a future period leaks nothing — an unlocked period fails
`rosterDisplay` for every team but the reader's own, exactly as this week's did
before it locked — and the live scores disappear from the squad screen on their
own, because `getLiveScoringStats` has no per-player rows for a round that has
not kicked off.

**The table had no points column, and its record was mislabelled.** fxea's
`getStandings` carries `points` as a three-part STRING and no league points at
all; the app printed that string under a heading reading `W-L-T`. Every sample
we had held was `0-0-0`, which is the one table where W-L-T and W-D-L cannot be
told apart. The 29 Aug read settled it: a beaten side shows `0-0-1`, so the order
is **W-D-L** and always was.

The points themselves are on the fxpa standings page and nowhere else, under
their own header keys — `win`, `draw`, `loss`, `points`, `winpc`, `wwOrder`,
`pointsFor`, `pointsAgainst`, `streak` — with `tableType: "H2hPointsBased1"` and
three for a win. Anonymous, both leagues, same as the badge read. So `mapStandings`
now reads THAT page, by header key and never by column position, and the fxea
array is left to the snapshots. Three for a win is a commissioner setting (§3):
we print Fantrax's number rather than counting it, and the order stays their
`rank` — a league that pays two for a win gets two.

That also collapsed a duplicate request. `/league` was asking Fantrax for its
standings twice per window — the array for the table, the page for the badges —
and `app/standings.ts` now reads the page once and hands out both.

## The paper starts rolling — the probes that gate it (31 Aug 2026)

The Gazetta is becoming a rolling paper (the approved plan is
`planning-for-gazetta-features-quiet-lovelace.md`): prose accumulates as
stories in `data/editions/paper.json` instead of one column a round replacing
`latest.json`. Doctrine amendment: **facts are live, prose is published — and
published prose now accumulates.** Still commit-based, still guard-driven,
still validated before commit. Four probes ran before any design landed on a
field, and each one moved the design:

- **A top-scorers page may not read `fetchTeamStats` or pool `FPts`.** Both
  price a man at his `defaultPosId` — the shallower of his eligible positions —
  never the roster slot. Live today: Saka season FPts 6 on both surfaces while
  `getLiveScoringStats.statsMap["04y92"].object1` paid his owner 8 at midfield
  rates, and 7 of 60 rehearsal roster slots differ from the pool's default. The
  only slot-priced per-player number Fantrax publishes is the live-scoring
  statsMap, so player charts read that, per period.
- **`projectedTotalsMap` is populated days before lock** (11/11 active entries,
  period 3, four days out) and is entry-identical to
  `calculatedProjectedTotalsMap` until kickoff. The predictions column reads it
  at the lock window — never `calculatedProjectedTotalsMap`, which improves
  itself mid-round and would mark its own homework — and treats a pre-lock read
  as movable, since it reflects whatever lineup is currently set.
- **No API read carries the waiver-processing schedule.** Full-text grep of
  both leagues' `getLeagueInfo` for waiver/claim/process: zero keys. Same
  precedent as the lineup lock, which lives only on the commissioner's settings
  page. So the Mercato Wire's trigger is DETECTION — a fresh claim batch in the
  transactions feed since the last covered key — and the cron merely sweeps
  Thursday morning because Craig says waivers process Wednesday evening. The
  day is when we look; the feed is what decides.
- **Only `EXECUTED` transactions are visible.** Every TRADE and CLAIM_DROP row
  across 20 daily captures carries `resultCode: "EXECUTED"`, and Fantrax's own
  tab vocabulary has nowhere to put a pending or declined view. Trade coverage
  reports completed deals; offer-and-decline gossip has no data and is not
  attempted. (Gap noted: `resultCode` is on the wire and `raw.ts` does not
  mirror it — add the optional key when trade coverage lands.)
- **FPL's own league table is a dead field.** `bootstrap-static`'s `teams[]`
  carry `played`, `win`, `draw`, `loss`, `points` and `position`, and on
  31 Aug — with a gameweek already finished — **0 of 20 clubs had `played > 0`
  and the whole column summed to zero**. Same shape as `squad_number`: present
  as a key, never as a value. So the paper's Premier League table is COMPUTED
  from finished fixtures (`packages/core/src/football/table.ts`), which the
  layer split permits precisely here — three-for-a-win and goal difference are
  the competition's own fixed rules, and the football layer is where fixed
  rules may be constants. A running score on a fixture in play is not counted:
  FPL writes those, and a table built on them moves a club up for leading at
  half time.
- **BBC RSS guids double-cover.** The feed re-lists the same article under
  positional fragments (`…/cn5d7k4nkyvo#0`, `#1`), five duplicates in one
  77-item fixture (`packages/core/src/news/__fixtures__/bbc-football.xml`).
  The ledger's news key is the article URL with the fragment stripped, never
  the raw guid.

## The columns, and what each one may say (31 Aug 2026)

Seven opinion columns landed with the rolling paper, and the rules that keep
them honest are worth having in one place:

- **The dodgers say what a man DID, never what he would have scored.** Fantrax
  prices only the ACTIVE section, so a benched player has no points anywhere in
  any payload; "he'd have got you 11" would be a number we invented. Goals,
  assists and clean sheets are countable football and stand alone. The column
  filters the same `rosteredPicks` the eleven is selected from, so the two can
  never disagree about what a player did.
- **The power rankings are not the table and are told so in the brief.** The
  table prints on the same page and is Fantrax's arithmetic; a second ordering
  claiming the same authority would be the paper disagreeing with itself. The
  column exists to say a side is flattered by its record.
- **The Bin reports trends and never tips.** The week's business already lists
  every deal on the front page, so a list is the one thing the column must not
  be. `wireFacts` walks the feed OLDEST-first, because the feed arrives
  newest-first and the last thing recorded about a man is what became of him —
  walked the other way, a player dropped last week and reclaimed today reads as
  binned. A trade counts as a sale rather than an obituary: he was wanted.
- **The two sketches are the paper's only licensed invented quotes.** Every
  other voice forbids them outright, because a made-up reaction reads exactly
  like a real one and sixteen friends who talk to each other would eventually
  find their own name over a sentence they never said. The press room and the
  studio are exempt because the form announces itself, both prompts say so, and
  the page prints a label above them. The facts under a sketch are not part of
  the licence.
- **Each column files on its own covered-key**, so the two-call cap spreads the
  Monday set across firings rather than buying six columns at once, and a
  column whose facts cannot support it returns null and spends nothing — a
  quiet week files no wire, an unfielded lineup files no eleven.

## The news wire, and the one rule it bends (31 Aug 2026)

`newsTriage.affectedBy` matches player surnames against wire copy at runtime,
which `fantrax-adapter.md` forbids. Recorded as an exception, with its
boundary: every player reaching it is ALREADY resolved through the audited
bridge, and nothing the match decides is persisted — the story's key is the
article's URL. A wrong match costs a dull story; a wrong identity through the
bridge tells sixteen people the wrong man is injured. Surnames under four
characters are skipped, because "Son" hits "season" on most of the feed.

## Season log

- 2026-08-31: **Decision — the desk and the phone get different layouts, not one
  layout at two sizes** (Craig). The evidence had been accumulating all day and
  nobody had named it: **46 `lg:` utilities across 14 files**, and `SquadRows`
  alone carries nine. That is not responsive design, it is two layouts wearing
  one component and hoping.
  Every compromise today was a symptom. The rail is one shape at both widths and
  had to be bottom-aligned on a phone for the thumb and top-aligned on a desk for
  the game — a position argument that only exists because one component is
  serving two devices. The squad list needs ~670px and hides eight columns below
  `lg`. The pitch fits eleven and not fifteen. Two-line rows stack on a phone and
  go inline on a desk. `.cm-row` is 44px under a thumb and 28 under a mouse.
  **Championship Manager is an 800×600 artefact.** Its squad screen is two
  columns of players side by side (`cm9900/25.jpg`); its rail is a 90px column
  down the left. Neither is a phone layout and no amount of `lg:` makes them one.
  A phone wants one column, a thumb-reachable bar at the foot, and the four
  figures that matter. They are two designs, and PRODUCT.md already says so in
  two places without drawing the conclusion — "phone-first, one column,
  thumb-reachable" and "the Desk is Championship Manager 99/00".
  **Two rules, or this becomes two apps that disagree.**
  1. The split is in ARRANGEMENT only. One data join, one set of domain rules,
     one `docs/ui/*.md` per screen. A layout may not decide what a number means,
     what absence prints as, or what the gate withholds. If a rule needs saying
     twice it belongs in core or in `desk.css`, not in either layout.
  2. The switch is CSS, never a user-agent read. Every route on this app is
     cached and `unstable_cache` is keyed on nothing about the caller; sniffing
     a device would fragment that and put a phone's HTML in a desk's cache.
     Both arrangements render and one is hidden — the cost is server HTML on the
     handful of blocks that split, not JavaScript and not a layout shift. Prefer
     `@container` where the constraint is really SPACE rather than device: the
     squad list broke this afternoon because its COLUMN was 554px, which no
     viewport breakpoint could have known.
  What it settles immediately: the rail stops compromising. The desk gets
  Championship Manager's rail, top-aligned and outlined, and the phone gets a bar
  at the foot where a thumb is — which is what `TabNav` was before it was deleted
  this morning, and deleting it was right for the wrong reason. The squad list
  becomes CM's two-column table on the desk and a one-column list on the phone.

- 2026-08-31: **Every control on the desk became a Championship Manager plate,
  and the foot button row landed without anybody inventing one.** The plan's L4
  proposed a global foot bar in `layout.tsx` and never said what would be in it —
  CM's foot strip is always a set of RELATED SCREENS, and ours is already
  `SectionNav` at the top, so a global bar would have been furniture. What the
  screens actually lacked was not a row but a look: `/matchday` and `/gw/[n]`
  already end in a pair of ways out, and drawing them the game's way is the whole
  of L4. `ButtonLink`'s `BUTTON` — which the plan asserted was already
  `cm-bevel` and was in fact a 1px `--line` border — now is one, and ten
  hand-written copies of that border went with it.
  **Three surfaces, one grammar**, now written into DESIGN §2: raised
  (`cm-bevel`) is something you press, pressed (`cm-bevel-pressed`) is the same
  thing held down, sunken (`cm-panel`) is a well — a panel, and a text field,
  which is a panel one line tall. So the FPL entry form is a sunken panel holding
  a sunken field and a raised button, which is `cm9900/03.jpg`'s settings dialog
  exactly. The schedule's three `<select>`s are CM's control strip; only the
  closed control is ours, which is why they are still `<select>`s.
  **The pool's filters were a tab strip pretending to be chips.** Bordered boxes
  with an accent EDGE when active — a modern web chip, and a second way of saying
  "selected" beside the pressed-and-yellow one the rest of the desk uses. They
  are `cm-tab` now, like `league/SectionNav` and the rail, with `aria-current`
  doing the work. Their counts lost `text-faint`: on `--color-chrome` that is
  3.55:1 and fails, and CM prints its own count in the label's colour —
  "Fitness (40)".
  `.cm-tab` took the tab height with it, 44px under a thumb and 36 above `lg`,
  because three call sites wanted the same pair and a strip whose plates disagree
  about their height is not a strip. That let the pool's loading skeleton wear
  the real plate with a bar inside it rather than a `2.75rem` copied off it —
  and an empty bevelled tab is the game's own idiom for one with nothing in it
  yet (`cm9900/12.jpg`'s greyed "Unused" pair).
  `ViewToggle` is a raised plate and a pressed one instead of a box with a filled
  half; the `min-h-9` exception `ROADMAP` records as Craig's is untouched.
  The one control deliberately left alone is the sign-in submit, which is
  `--color-league`: that is a brand decision rather than a CM one.
  Sweep, tapfit, navfit and the dialog cycle all clean.

- 2026-08-31: **The two-line rows now stack on a phone and go inline above `lg`,
  which is what finally took the desk to 28.** `.cm-row`'s `min-height` is a
  floor, so a row carrying two lines ignored it: `/players` sat at 45px and
  `/squad` at 43 after the tap rule relaxed everything else. Four rows changed —
  the pool's name over his position and club, the schedule's competition under
  the tie, the squad list's opponent under the team, and the scorer's owner under
  his name — with `flex-col lg:flex-row lg:items-baseline lg:gap-2` and
  `min-w-0 truncate` / `shrink-0` so the name gives way and the meta stays whole.
  Measured: **`/players` 53 → 29px at 1440 and `/league/squad` 43 → 29**, with
  every phone row unchanged at 53, 59 and 57.
  One `lg:py-0` was needed beyond that, on `PlayerTable`'s `<td>`: the cell pads
  the row from OUTSIDE it and `.cm-row` cannot reach a `<td>`, so 8px there plus
  the 28 inside was a 37px row on a desk that had asked for 28. The phone keeps
  the padding and keeps its 53.
  `SquadRows` had recorded the same finding from the other side in August — two
  short strings that sit happily beside each other had doubled the height of a
  fifteen-row list to stack them — and the resolution is that both are true at
  different widths. A phone has no room to put them side by side and a desk has
  nothing but.

- 2026-08-31: **The formation is on screen, and it was already being counted.**
  `lineup()` has always returned `shape` — "1-3-4-3" — and `lineupDetail` dropped
  it on the floor, so no screen could name an eleven the first way Championship
  Manager names one. It now travels on `LineupDetail` and appears in three
  places, each of which had the fact already: `/squad/[teamId]`'s rival sheet
  (beside the player count, so it costs no height), the lineup planner (its own
  line above the grass, and **live** — the planner recomputes `lineup()` on every
  move, so a 1-3-4-3 becomes a 1-3-5-2 under the reader's thumb, which is the
  whole reason to name it on the screen where the moving happens), and the
  head-to-head board (beside the round word, changing with the side you open).
  On the board it is `string | null` and never an empty string: a shape IS the
  arrangement, so naming one for a withheld side is the leak the gate exists to
  stop. It is gated on exactly the condition that draws the withheld panel.
  **`pendingCleanSheets` reached the squad page**, which is the third screen to
  print it and the one a manager is actually on when he wonders why his defenders
  are worth nothing. Gated on the page's own `display` and not the league's:
  only ACTIVE players are owed one, so a `+8` says a defender is in the eleven,
  and your XI is yours all week where a rival's waits for his period. A squad
  owed nothing prints nothing — a `+0` would read as a claim the clean sheets had
  been counted. Cost 20px of the pitch's headroom on the phone (86 → 66) and 20
  above `md` (72 → 52); everything still draws inside the screen.
  **Not done, and the plan was wrong about it being free:** `live.breakdown`
  reaching `LineupPlanner`. There is no card on that branch to put it in — the
  planner's tap is a MOVE and opens `MoveDialog`, not `LivePlayerCard` — so
  wiring the data through would need a second gesture to inspect a man, which is
  a design change and not a wiring. Worth doing: on a rival's XI you can ask "why
  is he on 12" and on your own you cannot. The natural home is `MoveDialog`,
  since his points are exactly the input to whether you bench him, and that makes
  a breakdown list its third rendering — so it is an extraction as well as a
  feature.

- 2026-08-31: **The desk stopped letterspacing.** 57 sites were adding 0.1em to a
  9 or 11px small capital, and Championship Manager does none of it — its column
  heads, tab labels, rail entries and title bars are all at normal spacing,
  checked in `cm9900/12.jpg` and `21.jpg` rather than remembered. A register rule
  and not a global one: **the paper keeps its 15**, because DESIGN §6 gives
  Archivo's letterspaced small capitals a real job on newsprint, where a standing
  head, a kicker, a dateline and a byline are furniture rather than prose. Every
  arbitrary-value `tracking-[0.1…em]` in the tree turned out to be on the paper
  already, which is a good sign the seam was in the right place. Negative
  tracking is untouched: the eleven `tracking-tight` are condensed, which is the
  desk's own register. The one surviving positive on the desk is the sign-in
  field, and it is commented.

- 2026-08-31: **The 44px tap rule stopped being one number, and the rule that
  replaced it caught a bug in the same hour.** Craig's call: the phone keeps 44,
  the desk goes to 28. WCAG 2.1 AA has no tap-target requirement at all, so it
  was always a house rule, and it was a rule about a THUMB written as if it were
  about a screen. Above `lg` the desk now keeps its own proportions instead — a
  repeating ROW 28px, a CONTROL 36, a column head 28 with the strip it is cut
  from. Measured after: `/league` 37 → **29px**, `/league/schedule` 57 → 29,
  `/players` 53 → 45 and `/squad` 59 → 43 (both content-bound two-line rows, which
  the plan predicted). **Every phone row is unchanged**, and that is by
  construction: `.cm-row` declares nothing below `lg`, so adding it to a row
  cannot move a phone. Unlayered CSS beats `@layer utilities`, which is why the
  class overrides the `min-h-*` and `py-*` already on the element without either
  being removed.
  **The two marks inside a row were JS constants in inline styles** — `TeamBadge`
  at 26 and `PlayerPortrait` at 32 — so no `lg:` utility could reach them and a
  26px badge with 4px round it cannot fit a 28px row. Both read `--row-badge` /
  `--row-portrait` from `desk.css` now, and both keep asking `next/image` for the
  LARGER of their two sizes so a phone never gets a picture scaled up from the
  desk's.
  **The four guards carrying this rule were prose checklists** — "are taps
  `min-h-11`?" — and a prose checklist cannot measure. `tools/ui/tapfit.mjs` is
  the fifth instrument in the drawer, and its first run found **the front page's
  new contents strip shipping 12px targets**, on the one screen in the app with
  no other way out of it. It also found a second undocumented exception beside
  the view toggle's: `SquadRows` had fifteen `min-h-9` buttons on a phone, which
  is exactly the case the floor exists for. Both fixed. Its three surviving
  exceptions are read out on every run rather than filtered away, and the
  inline-prose one is detected structurally — a link inside a `<p>` with text
  beside it — because a list of strings goes stale the first time somebody
  rewrites a sentence, which is the trap `navfit`'s old copy of the tab labels
  fell into.
  Two skeletons were re-cut so they cannot desync again: the pool's now draws the
  real row's SHAPE, two bars for a name over a club, instead of a
  `min-h-[3.25rem]` tuned to the row's old 52px, and both take their circle from
  the mark's own variable. `matchday/desk/loading` padded `py-1.5` where its row
  pads `py-1` — a desync that predated today.
  Amended in the same commit, because the guards reject the work otherwise:
  `PRODUCT.md` (the parent, and it now carries the table and the three
  exceptions), `DESIGN.md` §7, `docs/ui/README.md`, `ROADMAP.md`,
  `.claude/rules/register-palette.md`, `register-warden`, `ui-verifier`,
  `/shoot` and `/audit-ui`. `DESIGN.md` §7 also stopped attributing the tap rule
  to `docs/ui/conventions.md`, which has never carried one.

- 2026-08-31: **The type scale had no leading of its own, and the plan's account
  of that was half right in a way worth recording.** The claim was that
  `tokens.css` declares no `--text-*--line-height` pairs at all, so every step
  inherits Preflight's 1.5. Checked in the emitted CSS instead of reasoned about:
  v4 writes `.text-sm{font-size:…;line-height:var(--tw-leading,
  var(--text-sm--line-height))}` for every step whose NAME it already ships, so
  nine of our eleven were quietly borrowing v4's ratios — computed against v4's
  sizes, not ours. `--text-xl` is 21px here and 20px there, so our xl sat in a
  29.4px box built for a 20px face.
  **The two that really had nothing are `--text-3xs` and `--text-2xs`, which are
  ours alone** — v4 has no default to lend them, so they emitted font-size and
  fell through to 1.5. That is **168 of the app's 306 type sites, and `text-2xs`
  alone is 141**: the step the whole desk is built out of, an 11px label in a
  16.5px line box. So the lever was real and sharper than described, and the
  general claim was false. All eleven steps now declare `calc(box / size)`:
  9/12 · 11/14 · 12/16 · 14/18 · 16/22 · 18/24 · 21/26 · 24/28 · 30/34 · 34/38 ·
  45/46. The paper was safe to tighten because its prose already asks for air at
  the point of use — `leading-relaxed` on the columns, `leading-snug` on the
  decks.
  **Ten sites were letterspacing tabular figures against the class that exists to
  tighten them** — `.numeric` sets `-0.01em` and `tracking-widest` sets `+0.1em`.
  All ten are fixed. The eleventh stays and is now commented: the sign-in field,
  where a code is transcribed one character at a time and the space between
  characters is what a reader checks his typing against. Two `text-[0.5625rem]`
  literals went to `text-3xs`, which is the same 9px written as the step it is.
  Still off-scale and not touched today: `text-[0.5rem]` (8px, under the scale's
  floor) at `PlayerTable:178`, `Columns:100` and `SquadRows:157`, and
  `text-[0.625rem]` (10px, between two steps) at `SquadRows:182,187`,
  `LivePlayerCard:140` and `FplPitch:69`.
  What this did NOT move is the thing the density argument is really about:
  `/league`'s rows are 45px at 390 and 37 at 1440, `/players`' 53. Those are
  `min-h-11` and `min-h-9` and two-line rows, not leading. The tap rule is the
  next lever and it is a documentation change as much as a code one — 17 markdown
  lines across 12 files plus 8 source comments.

- 2026-08-31: **The two squad panels stand beside each other above `lg`, and the
  fixture chip stopped being guillotined.** Championship Manager's content area
  is 710px of an 800px canvas; a 1440 screen less the rail is 1310. One panel up
  there is not a CM screen scaled up, it is a CM screen with half of it missing,
  so `/squad/[teamId]` splits into two columns at `lg` and stacks below it. Both
  panels are on one 1440×900 screen with 145px in hand, and the pitch still ends
  above the fold at every width (553px of 844 on a phone, the grid starting at
  565).
  **Two traps, both measured rather than argued.** A grid item's default
  `min-width: auto` is its content's min-content width, so the season grid's
  seventeen columns widened the whole page instead of scrolling inside their own
  panel — a 390 phone laid out at **627**, with the `overflow-x-auto` around the
  table powerless because the column it sat in was free to grow. `minmax(0,1fr)`
  on the single column below `lg` as well as on the pair above it.
  And `FixtureChip` had no `whitespace-nowrap`. The band under a sticker is a
  fixed 20px with `overflow-hidden`, so "MUN (H)" took a second line and was cut
  through the middle of the glyphs. **The rail is what tipped it over**: a
  seven-across gated pitch had ~38px cells before and 31 after, against a 37px
  label. Fixed with `whitespace-nowrap` and `px-1` → `px-0.5`, which brings the
  label to 33px and puts every fixture on one line at 390, 430 and 768. At 320 it
  clips 7px off the right edge, which is the graceful end of the rule: a label
  clipped at its edge can be read and one cut in half cannot.
  Worth keeping: the first measurement of this was **wrong by a factor of two**,
  because the probe copied `getComputedStyle().font` and Chrome returns an empty
  shorthand when the font is set through longhands — so it measured 9px type at
  the body's 16px and reported a 72px label. Copy the longhands.

- 2026-08-31: **The squad page got its second panel, and it was already paid
  for.** A CM screen is two to four bevelled panels laid out together rather than
  one column that scrolls, and `/squad/[teamId]` was one column. `squadPoints`
  read the whole `TeamStats` to build a `fantraxId → points` index and dropped
  everything else: **thirteen goalkeeper columns and eleven outfield ones**, the
  per-game figure, Fantrax's own name for the season, and their prose definition
  of every category. It is now `squadSeason` and returns both shapes off the one
  read, so the index cannot disagree with the table it came from.
  `SeasonGrid` draws it as CM's attribute grid: a `cm-panel` per scoring group
  with its own title bar, a bevelled column-head strip, an index block down the
  left, cyan names and amber figures with negatives in red. Rows are ~25px
  against the list's 37, and legitimately: nothing in the table is a control, and
  `min-h-11` is a rule about what a thumb has to hit.
  **Probed before it was designed** (rehearsal league, 31 Aug): 13 keeper columns
  `GP Min CS GA Sv YC RC PKS PKM G A AF OG`, 11 outfield
  `GP Min G A AF YC RC PKM OG GAO CS`, **not one null value in either group**,
  `GP` renders 0 for everyone because a count of appearances is not a score, and
  `Min` renders a real 2 because minutes are scored here. Eight of the thirteen
  keeper columns carry Fantrax's prose rule after a ` -- ` sentinel, which is the
  only place in the whole payload this league's scoring rules are published — so
  `split` in `breakdown.ts` became the exported `columnLabel` and now hangs their
  sentence off each column head. The real league scores five categories the
  rehearsal league does not, which is why the header is read and never listed.
  **Stacked under the board rather than beside it**, and that is a measurement
  and not a preference: seventeen columns and a pitch both want the width, so
  side by side gives neither enough. CM stacks its own panels for the same reason
  (`cm9900/05.jpg`, a list panel over a detail panel). The one placement ruled out
  is a band ABOVE the pitch, which would come out of the pitch's screen budget.
  What is still open at desk width: the pitch takes 684px of a 900px screen at
  1440, so the grid is below the fold there. Narrowing the pitch at `lg` would put
  the two panels beside each other and is the next step, not this one.

- 2026-08-31: **The tab bar became Championship Manager's left rail, and it is one
  shape at every width.** Craig's verdict on Sunday's foundations was "it's still
  not CM really, just some columns", and the diagnosis was layout: CM is a 90px
  rail (11.25% of an 800×600 canvas — `docs/ui/reference/README.md`) with panels
  beside it, and we had a top bar and one scrolling column. `TabNav` is deleted
  rather than branched; `shell/Rail` replaces it.
  **One shape, because the labels are short enough to be one.** At 9px bold
  uppercase the widest is "Gazetta" at 45px, so a **64px** rail carries real words
  on a 390 phone — 16% of the screen against CM's 11.25% — and 130px above `lg`.
  That buys no icon set (there is none, and inventing one to save 20px is a whole
  visual language) and no third active-state case: `cm-tab`'s pressed bevel, which
  `league/SectionNav` already wore, marks the current section, where the bar's
  border edge flipped sides between its two shapes.
  **The plates sit at the FOOT of the rail below `lg`.** CM's own rail is
  top-aligned and on an 844px phone that puts the first section 800px from the
  thumb. PRODUCT.md's one-handed reference condition outranks the look, and
  DESIGN.md's preamble says so itself.
  **The rail is not on `/`, so the paper prints its own index.** A 64px navy
  column beside a broadsheet is a seam, and it would narrow the `@container` the
  front page's two-column layout keys off. `gazette/Index` sets the same six
  sections as letterspaced small capitals between two hairlines. The six live in
  `shell/sections.ts` — one table, two registers, which is what DESIGN §1's "one
  set of nav bones" now literally means. Without it the front page had two links
  off it and was a dead end.
  **Four couplings moved with the bar, and each was a stated reason that had
  died.** `--page-foot` was the bar's height plus the safe area, dropping to 2rem
  above `md`; it is 2rem everywhere now and the inset moved to `body`, where it is
  the phone's rather than the bar's. `--page-frame` had two readers and has one.
  `LiveStrip` was `md:static` only because two stuck bars would have been a
  header, and is sticky at every width again. And `--pitch-page` rose at `md` on
  two premises — the bar going overhead, and "the bands stand further apart up
  there" — the first dead by construction and **the second simply untrue when
  measured**: `/squad/[teamId]` with a bench spent 290px on furniture at 390, 768,
  1024 and 1440 alike. One value at every width, 2rem off each budget for the room
  the bar stopped asking for. After: the XI takes 460px at 390×844 with 86px in
  hand and 516 above `md` with 72; the gated pitch 426 with 259, and 684 with 57.
  **`navfit.mjs` was rewritten in the same commit**, because the tool that guards
  this change was the thing the change breaks — it queried the bar's equal grid
  columns. A rail fails in two other axes, so it now asks three questions: do the
  labels fit the rail's width, does the plate stack fit the screen's height (now,
  and with one more section), and what the rail leaves the content column. Its
  first bug was mine: `rail.scrollHeight` on a full-height frame reports the frame
  back whenever the stack is shorter, so every passing case read as a failure.
  Sweep is clean at 18 route×width pairs, and `navfit` clean at 320/360/390/430.

- 2026-08-29: **The card needed a bound in the other direction too, and the miss
  was instructive.** Giving the figure the portrait's upright shape (below) tied
  its height to the card's width — and card width is `f(widestLine)`, so *fewer*
  men in a line make a *wider* card and therefore a *taller* one. The inversion
  bites where nobody looks: the seven-across gated squad, which looks like the
  hard case, was fine at 468px, while the **1-3-4-3 XI on the owner's own team**
  — four to a line, the slackest squad in the league, and the most visited screen
  in the app — drew a 104px figure and overflowed a 390×844 phone by 199px. The
  old `1.32` crop had hidden it because height barely tracked width there.
  Fixed by capping the figure at the room one row has:
  `(100svh - --pitch-page) / --pitch-rows`, less the two bands, in
  `.pitch-figure`. `--pitch-rows` comes from the formation and is set by
  `PitchRows` and by both bench strips, so a reserve matches the man he would
  replace in height as well as width; `--pitch-page` is what a pitch page spends
  on everything that is not grass, and it sits beside `--page-foot` and changes
  at the same breakpoint, because above `md` the tab bar moves overhead.
  Where the cap binds the pitch is `100svh - --pitch-page` plus its own chrome
  whatever the formation, which is the property worth having: a 1-3-4-3 and a
  1-3-7-4 cannot disagree about how much screen a pitch is allowed.
  **Two budgets, not one.** The gated view spends 232px on page furniture and the
  XI view 382, because the XI carries a bench strip and a footer. Held to one
  number the fifteen-man pitch gave up a third of its photograph to pay for a
  page it is not on, so `TeamSheet` and `LineupPitch` carry `.pitch-with-bench`
  and the gated pitch keeps the base.
  All four rehearsal squads now draw inside 844, gated and ungated, and 1440×900,
  1440×1024 and 768×1024 fit too. **Two lessons for the next geometry change.**
  Measure the SLACKEST formation, not the tightest — the crowded line looks
  dangerous and the loose one is what overflows. And measure LAST: a 44px live
  strip landed above `<main>` from another session between the fix and its
  verification and ate the whole margin, which is why the headroom is now 53px on
  the XI and 100–144px on the gated views rather than single digits.
- 2026-08-29: `/league/matchups/[teamId]` does **not** fit 390×844 and had
  stopped before this week — 899px now, ~902 before the card was rebuilt, against
  a `docs/ui/matchup.md` claim of no scrolling at all. So the rebuild is not what
  broke it, and the card is not the problem: the same eleven fits at
  `/squad/[teamId]` with 53px to spare. That board spends 471px on furniture where
  the gated squad page spends 232 — header, section nav, scoreline and a
  Pitch/List control above the same pitch — so the 55px has to come out of the
  board. Recorded in `matchup.md`, not fixed here.
- 2026-08-29: The pitch card's type was inverted. It sized the NAME from the card
  (`clamp(7px, 13cqw, 11px)`), so a line of seven took its width out of the type
  and printed a 7px name — the defect DESIGN.md §8 carried as its one live
  exception, and Craig's reason for calling the squad view terrible. The card now
  shrinks and the type does not: name `--text-2xs`, figure `--text-xs`, fixture
  and chips `--text-3xs`, all declared steps, so §8's exception is closed and
  `--text-3xs` is a floor on the pitch rather than merely its last step. Two
  things went with it. `MAX_CARD` 4.35rem → 110px, the width of the Premier
  League's own portrait file, because the old ceiling pinned every screen above
  about 768px at 69.6px and a 9px name — the desktop was cap-starved where the
  phone is width-starved. And the figure's box, which was `1.32` (wider than
  tall) against two portrait assets — the photograph is 110×140 and FPL's kit
  fallback 110×145 — so it was cropping three fifths off both and leaving a 33px
  face on a phone while a quarter of the screen under the pitch went unused. It is
  now the file's own shape, set on the card through `--pitch-figure` so the FPL
  tab's pitch and the paper's team of the week keep the head-only crop.
  **Wrapping was offered and rejected** (Craig, 29 Aug): one row per position
  block, and the row count keeps coming from `widestLine()` off the real roster —
  never a constant, because `positionConstraints.maxActive` caps the XI and not
  the squad, and two of four rehearsal teams hold seven midfielders.
  Measured at 390×844 on the seven-wide squad: name 7px → 11px, pitch 349px →
  468px of the 625 it is allowed, still no scroll. At 1440 the card goes 69.6px →
  110px and the name 9.05px → 11px.
- 2026-08-29: **FPL's `squad_number` is null for every player.** The key is on all
  622 elements of `bootstrap-static` and the value never is, so a plate too narrow
  to hold a name has no number to fall back to and truncates instead. This killed
  the drawn design's squad-number fallback outright. `CLAUDE.md` listed the field
  among the ones bootstrap "carries", which is true of the key and false of the
  value; corrected the same day.
- 2026-08-29: A merge commit turned out to skip the Vercel build entirely —
  `ignoreCommand` reads `HEAD^..HEAD`, which on a merge is the other branch's
  diff — and nine commits sat on `main` undeployed with every check green. Merge
  commits now always build. See the section above.
- 2026-08-29: Squads moved to the round a manager can still change, and the
  table gained the league's own points. Both bugs were only visible with a
  gameweek in flight; see the section above. `mapStandings` moved onto the fxpa
  standings page, `frozenPeriod` became `periodToRead`, `app/badges.ts` became
  `app/standings.ts` with one read behind both the table and the badges, and the
  table's column heads moved into `league/Columns.tsx` — the skeleton had its own
  copy, and only one of the two would have been corrected.
- 2026-08-28: The Gazetta got a front page. `lead()` picks one story a week out
  of four kinds — a match decided by nothing, a manager who left the week's best
  player out, a hammering, a trade — and prints nothing when none of them
  qualifies, because a paper does not manufacture a lead. Both result thresholds
  are shares of the winning total rather than numbers of points, so a
  commissioner who rewrites the scoring does not get a paper calling every week a
  thriller. Building it found that `getTeamRosters` labels its answer with a
  period the calendar has not reached — 2, ten and a half hours inside roster
  period 1 — which had `left him on the bench` describing a lineup nobody
  fielded. `Edition.fielded` now withholds every started-claim when the
  arrangement is not the round's.
- 2026-08-13 (evening): the app became the app in the vision. Six tabs
  (Gazetta, League, Squads, Live, Players, FPL), all fifteen on the pitch
  instead of eleven and a bench strip, and — the piece everything else was
  waiting on — it now knows whose team you are. Sign-in is one code per manager,
  HMACs only in the environment, signed httpOnly session, and reading stays open
  to everyone. Your head-to-head leads the live centre and sorts to the top of
  the matchups; your row is marked in the table. The Gazetta shipped its first
  edition off two readers that had sat unused in core for a week — the
  transaction feed and FPL's injury news — and Team of the Week names whose
  player it was and which manager benched him. The FPL tab landed small, as
  planned. Caching moved from pages to the shared provider reads, which is what
  made a cookie affordable.
- 2026-08-13: Craig's cookie went into `.env.local`, every fxpa method was
  probed twice, and the scoring engine died before it was written. Fantrax
  serves its own points publicly — typed team totals on `getLiveScoringStats`,
  per-player points and an exact category breakdown on `getTeamRosterInfo` —
  while the one login-walled method turned out to hold nothing but the schedule
  we already read. The head-to-head now shows their real numbers. Also today:
  the app grew its six-tab shape (League owns a prefix, /team became /squad, the
  tab bar became one component in two shapes, a Matchday section that exists
  only when there is football), the season's schedule landed as the first
  consumer of `periodGameweeks`, and both providers are asked politely now.
- 2026-08-13: The companion has somewhere to live. Craig ran the Vercel
  import in the evening: `https://epl-draft-companion.vercel.app`, root
  directory `apps/companion`, rehearsal league id set as a production env var.
  Verified from outside — the bridge crossed the boundary, portraits come back
  optimized, and `/matchup` 404s on production because `main` has not taken the
  branch yet, which is the merge's argument, not a bug.
- 2026-08-13: Head-to-head landed eight days before the league first needs it —
  `periodPairings` in core, `/matchup` under the League tab, and "vs" on every
  squad page. The probe that shaped it: `getMatchups` is login-walled, so the
  page shows pairings and countable events and no number it calls points. CI
  arrived the same day (`verify.yml`, four checks on every push); the Vercel
  deploy is decided but deliberately not executed — deferred to a day with eyes
  on it. Verified against both leagues: the rehearsal renders its pairings with
  the gate closed, the real league answers `NO_TEAMS` as a panel.
- 2026-08-12: Player profiles landed — one `getPlayerProfile` per tap from the
  pool, typed against a live probe. Refactor pass with it: the status strings, the
  violation check and the planner's move sheet each moved to the file that answers
  their own question, and the four routes that had each hand-rolled "a Fantrax
  refusal is a state, not a crash" now share one.
- 2026-08-12: The app got navigation and two more sections — `/players` (the pool
  as our league sees it) and `/standings` (Fantrax's table, never recomputed) —
  behind a four-tab bar. `violations()` landed with the planner as its consumer.
  Five empty states became one panel, which is what the rule of 2/3 asked for the
  moment the third appeared.
- 2026-08-12: Refactor pass over the day's work — five visibility exports down to
  one, the fxpa batch transport and its unused cookie parameter deleted, and
  SquadList's duplicate copy of the pitch order removed in favour of the one
  `positionDepth` core already owned. Lineup planner shipped behind a
  league-gated preview.
- 2026-08-12: Merged to `main` — the capture cron had never fired, because
  workflows only run from the default branch. Six days of history (7–11 Aug) are
  gone permanently. Dispatched the workflow by hand to prove it works rather
  than trusting 05:10. Craig executed the first rehearsal trade and free-agent
  claim, which settled the transactions design: the native feed wins, capture
  diffs corroborate. Lineup visibility gate shipped — squads all week, XI only
  once the period opens.
- 2026-08-05: Created `PLATFORM_NOTES.md` and improved `CLAUDE.md`.
- 2026-08-05: Probed Fantrax live and recorded the facts above. Added the
  read-only league layer, the dated snapshot capture, and the identity bridge
  (542/699 settled). Config module added; `npm run typecheck` made to pass for
  the first time.
- 2026-08-05: Removed position from the football layer. Added
  `MappedEntry.agreement` so the fuzzy audit can be ranked by risk rather than by
  a score that is always 100 — 13 of 66 rows need eyes, two of them genuinely.
  Established that the bridge covers 223 of the 224 players who can ever be
  rostered, which is the number that matters rather than 78%.
- 2026-08-06: The rehearsal league auto-drafted — 4 teams, 60 picks — and every
  read that had only ever returned an error or `[]` returned data. Captures are
  now filed per league with the pool outside them, and both leagues are captured
  on every run. Modelled rosters, standings, teams and matchups from real
  payloads; fixed `draftType` defaulting to `""` for a key the rehearsal league
  does not send. Settled the period↔gameweek question: aligned by **kickoff**, all
  38 periods and all 380 fixtures, with `npm run periods` re-checking against live
  FPL. The bridge resolved all 60 drafted players with zero misses.

## 2 Sep 2026 — the squad week, and two refactor passes

**A team became five screens.** `/squad/[teamId]` gained `Transfers · Match ·
Fixtures · Stats` beside the squad itself, on Championship Manager's own club
spine — `cm9900/25.jpg` and `cm0102/07.jpg` run the identical set two releases
apart. Three of the four cost no new request: the reads were already being made
and thrown away. `readDeals` in particular had been mapped, tested and cached
since the paper's business column and had exactly one consumer, though
`league/types.ts` had always said the rows were kept flat so that a team's
history could be a filter over the same read.

**Which round a squad screen opens on is not one question, and getting it wrong
hid the pitch for a week.** `planningPeriod` returns the first week still taking
changes, which is right for your own planner and is precisely the week the gate
withholds from everyone else — so tapping a rival from the league table landed
on a list and never on a pitch. `lastLockedPeriod` is the counterpart: the most
recent week with a visible arrangement, which mid-round is the live one.

**The pitch was rebuilt against the reference and got most of the way there by
being measured rather than adjusted.** Three attempts at the disc's crop failed
because the fault was the FRAME: `PlayerImage` wraps itself in `.pitch-figure`,
which forces a 1.32 landscape ratio, so inside a circle the image box was 46x35
in a 46x46 disc and the bottom quarter was gone before any cropping was
considered. Probing the rendered box would have found it on the first report
rather than the fifth. The same lesson landed twice more: a `min-height: 122cqw`
produced a pitch of ratio 3.17 because the element was its own query container,
and the two-column balance was only settled by measuring both columns (527
against 676) rather than by looking.

**The layer split holds.** Checked directly during the tree-wide audit:
`packages/core/src/league` imports nothing from `football/` in source and the
reverse is also zero. Purity holds too — no clocks, randomness or environment
reads in any mapper, scorer or selector. Worth recording, because CLAUDE.md
leans on both claims and neither had been verified since they were written.

**Three provider-shaped bugs, all of the same kind.** An absent roster cap became
`0` via `?? 0`, so a league that has not published its limits — the real
league's state until draft night — reported every squad as breaking three rules
nobody had stated. A bare drop was labelled "Waiver" because `deals()` maps
`kind:"drop"` to "claim". A three-way trade named one partner because
`movement` used `.find()`. All three are absence or multiplicity being flattened
into a single confident answer.

**`apps/` was unreachable by any test, and the config comment said otherwise.**
It claimed the pure logic "lives in packages/*, which is exactly where it
belongs" — an aspiration written as a fact, while nine files and ~540 lines of
pure logic sat in `apps/companion/app`. The glob widened on 2 Sep; the first
test it allowed found `londonTime("")` throwing `RangeError`, because one of
four sibling formatters guarded a malformed date and three did not.

**`revalidate` had 21 hand-written copies and nothing checking them.**
`PAGE_REVALIDATE` says every route segment must repeat it as a literal, because
Next analyses it statically — a real constraint whose cost is 21 chances to
drift. `scripts/revalidate.test.ts` now walks `app/` and asserts each equals the
constant. It reads `layout.tsx` as well as `page.tsx`, because `(paper)/layout.tsx`
carries one of the copies and a page-only glob would have passed while missing it.

**`FANTRAX_LEAGUE_ID` defaults to DUMMY, not rehearsal.** Three documents said
rehearsal and none was ever right, including `.claude/rules/fantrax-adapter.md`,
which loads at the start of every session — so every session began by being told
the wrong thing about which league it was serving.

**Declined at two, so they are not re-opened:** the two-column desk grid, the
no-script `Show` button, the glossary strip (one), and `const DASH = "—"` — four
declarations against SIXTY inline uses of the glyph, which is the DASH lesson by
name and the reason it stays duplicated.

## 2 Sep 2026 — the Premiership section, and what it cost the layers

**`/prem` exists, and it is the inverse of `/league`.** Fantrax says almost
nothing about the actual Premier League, so the app had no screen for it: the
only place the real table had ever been printed was six lines on the back page of
the paper. Five routes now — the table, results, fixtures, a team-stats board and
a club stub — under "FA Barclays Premiership", which is the period name the
reference heads its own table screen with.

The two tables are the layer split made visible. `/league` **quotes** Fantrax's
arithmetic and may never compute a table, because three-for-a-win is a
commissioner setting. `/prem` **must** compute one, because three-for-a-win is a
rule of the competition. `docs/ui/prem.md` carries the whole argument.

### `bootstrap-static` re-probed, 2 Sep 2026

1,730,358 bytes. 651 elements, 20 teams, 38 events; GW2 current, finished and
`data_checked`.

- `goals_scored`, `assists`, `clean_sheets`: **651/651 present and non-null** on
  every element. This is what let the football layer carry them (below).
- `squad_number`: still **null on all 651**. The standing note holds.
- `teams[]`: `played`, `win`, `draw`, `loss`, `points` are **nought on all 20**
  with two rounds signed off. `form`, `strength` and `team_division` are **null
  on all 20**.
- **`position` is NOT nought** — it is 1–20 and distinct on all twenty.
  `football/table.ts` and this file both used to say it was, which was wrong
  about the field and right about the conclusion: it sits beside a `played` of
  nought on every club, so whatever it orders is not a record anybody has played.
  Corrected in both places. Do not print it, and do not carry it into the domain
  — an unused field is bloat.

### The `SeasonTotals` reversal, and the bound that travels with it

`SeasonTotals` refused goals, assists and clean sheets on the rule that Fantrax
is the authority on what Fantrax pays for. **That rule is unchanged.** It is a
rule about a SCREEN and it forbids the two providers' counts of one fact SIDE BY
SIDE — which is what DESIGN §7 actually guards against. The Premiership section
carries no Fantrax number at all, and there FPL's count of a Premier League goal
simply is the Premier League's count.

So the three are now on the type, with the bound in the docblock: **they may not
appear on a fantasy screen beside a Fantrax figure.** `/prem` is theirs;
`/players`, `/squad/[teamId]` and the matchup boards are not. A reviewer should
treat a `season.goals` in the league register as a defect.

### Two bugs found while building it

**A sort key from the URL could reach the prototype chain.** `isSortKey` guarded
with `value in COLUMN`, and `in` walks the prototype. `toString`, `constructor`,
`valueOf` and `__proto__` all passed; `COLUMN[key].of` was then undefined and
`sortRows` called it. `/league?sort=toString` was a 500 anybody could type.
`Object.hasOwn` now, in both order modules, with the four names in the tests.
Found by writing the football table's own module and testing the guard the copy
had inherited.

**An unpublished roster cap was left to two callers.** `f62a1f3` made
`RosterLimits.maxActivePlayers` nullable — correctly — and `teamOfTheWeek` and
`LineupPlanner` were not given the decision the type's docblock demands.
Typecheck was red on main. A team of the week now names nobody without a stated
size (the position caps sum to fourteen, so eleven and fourteen are both
inventions), and the empty-places notice does not appear.

### Open, and not mine to close

**`notFound()` answers 200.** `/prem/club/abc`, `/gw/999` and
`/players/nosuchplayer` all render the 404 page with an HTTP **200**; a route
that does not exist at all (`/nosuchroute`) correctly answers 404. It is
app-wide and predates this section — measured on the pre-existing routes, not
just the new one — so it is recorded rather than fixed here. Worth settling
before launch: a soft 404 is a page search engines and link checkers believe.

### Instruments

`tools/ui/sweep.mjs` and `tapfit.mjs` carry their own route lists, so a new
section is invisible to them until it is added. `/prem` is in both. It clears AA
at 390 and 1440 with no sideways page scroll, and passes tapfit with nine
recorded exceptions — the sortable column heads, the same class `/league`
records eight of.

`shot.mjs` could not capture against Chrome 152 headless while a second session
drove the same browser: it sets the viewport BEFORE navigating, and
`Page.captureScreenshot` then never returns. Enabling `Page`, navigating,
settling and overriding the metrics LAST works. Not changed — the instrument is
shared and the failure was not reproduced on a browser with one client — but
recorded, because it cost an hour.

## 3 Sep 2026 — the push, and what the push explained

The 73 commits went to `origin/main`. Two things only became visible once they
had.

### `dummy` was never OVERDUE; CI could not see it

`capture:status` had been reporting `dummy: no captures yet` and exiting
non-zero, while `capture-status.yml` — the watchdog whose entire job is to make
that noise reach a human — stayed green every day. Both run the same script over
the same `FANTRAX_LEAGUES`, so one of them was reading a different list.

It was. `dummy` entered `FANTRAX_LEAGUES` on 1 Sep in `81437fc`, and that commit
was inside the unpushed 73. CI checks out `origin/main`, which knew two leagues,
so it captured two and checked two and was honestly green about the two it knew.
The local tree knew three. **A watchdog checks out the code, and unpushed code is
a watchdog with a shorter list** — the failure is invisible from the CI side by
construction, because the missing league is missing from the question as well as
the answer.

1 and 2 Sep are gone for `dummy` and cannot be backfilled. The 3 Sep capture is
its first day. From the 05:10 UTC run CI picks it up unaided, the list being the
same one.

### Both non-real leagues are ten now, and the docs said otherwise

Counted off the capture history, which is what makes it checkable:

```
rehearsal/getTeamRosters — 4 teams every day 2026-08-06 … 2026-09-01
                           10 teams from 2026-09-02
```

`getLeagueInfo` gives both leagues the *same ten team names* — `123`, `test2`,
`test1`, `test3331`, `test31121`, `test211`, `test31`, `testf`, `test3`, `test4`
— in a different order. So the rehearsal league was expanded to ten on 2 Sep and
`dummy`, made on 1 Sep expressly as "its ten-team replacement", replaced a
problem that stopped existing the following day.

Three present-tense claims were false and are corrected: `config.ts`'s
`FANTRAX_LEAGUES` docblock, `demo.ts`'s reason for existing (reframed to the past
tense it was always describing), and `league/page.tsx`'s `cut()` note, whose "the
rehearsal league is four teams away from it" was arithmetic about a count that
had changed. The test-fixture comments in `roster.test.ts`, `map.test.ts`,
`rosters.test.ts` and `draft.test.ts` say four and are **left alone** — they
describe a payload captured on 6 Aug, and that payload still has four teams in
it.

**Not collapsed to one league, deliberately.** Two near-identical ten-team
leagues cost a capture each and confuse the next reader, so it is worth doing —
but not before 10 Oct. `shape-diff` reads `rehearsal` as its reference against
`real`, and a league key is a directory of a month's history under
`data/snapshots/` that a rename would strand.

### `shape-diff` exits 1, and it is the baseline that is behind

Two paths missing on the real league's `fxpa getStandings`:
`tableList[].header.cells[].align` and `tableList[].subCaption`. The real league
is `NO_TEAMS`, so its standings page has no rows to carry a header cell or a
sub-caption. `results.ts` already types `subCaption?: string`. Everything else
in the report is `+` — the real league carrying *more* than the rehearsal
reference, which is the documented between-league variance. The baseline at
`data/shape/baseline.json` wants the sentence; no code wants a change.

## 3 Sep 2026 — the club became a spine, and two rules were counted rather than quoted

### The refactors, and the two the plan asked for that were not owed

The plan for this session listed seven extractions as "owed at three or more
under §1". Counted rather than taken on trust, two of them were not:

- **The sort-href builder.** `league/sort.ts` and `prem/sort.ts` are the same
  function, and that is TWO. `players/query.ts` only looks like a third — it
  preserves the filter and search state through its own `href()` — and Team
  Stats uses different parameter names entirely. An earlier draft of the commit
  merged them and was wrong to. `SortHead` takes the href as a **prop** instead,
  which is why the two `sort.ts` files are still there.
- **`ClubBadge`.** Reads as five occurrences and is two: `prem/ClubRow` and
  `prem/team-stats` draw the same 26px badge, while `Match` draws 22 with a
  spacer for a club the snapshot lacks, the club page draws 56 in a heading,
  `players/[fantraxId]` puts one on a portrait and `MatchList` draws 24 with a
  round grey fallback. One component across those takes a size, a fallback and
  an alignment — the generic mechanism §1 forbids.

What *was* owed: the sortable head at three (both `Columns` files plus Team
Stats, which had hand-rolled the plate with character-identical class strings),
and `IndexCell` and `ROW_LINK` at three each. Extracting the head also took
`league/team-stats/page.tsx` from 314 lines to 281 — back under the hard
ceiling it had been over.

**The refactor was verified against the deployed build rather than by eye.**
Production was still running the pre-refactor code, so every `<th>` on `/league`
and `/prem` could be diffed against it: byte-identical, sorted and unsorted. The
Team Stats heads differ by one inert class — `gap-0.5`, which needs two flex
children to draw anything and those heads have one. That is a stronger claim
than a screenshot can make, and it took one script.

### The club page, and three faults only the screen showed

Four tabs on `cm9900/25.jpg`'s shape. `ClubShell` is a deliberate copy of
`squad/[teamId]/Shell` — two spines are a coincidence, and the trigger for a
shared `PlateShell` is named in its docblock as the third plated subject.

Three things went wrong in ways the diff could not show:

1. **The position slot in an `IndexCell` was twenty rows of Arsenal red.**
   `ClubShell` scopes `--cm-index` to the club, and CM's own slot plate earns
   that colour by carrying `GK`/`DR`/`DC` where ours carried a dash.
2. **Seven columns do not fit 326px.** Names truncated to "Mosqu…", "Ødega…".
   `St` and `A` joined `Pos` at `lg` only.
3. **The round block at `w-12` truncated "ARS" to "A…".** `Match` splits what is
   left of the row between two club names either side of a fixed score column,
   so every pixel the block takes comes out of both names at once — 41px each at
   `w-12`, 49 at `w-9`. Narrowing `Match`'s score column instead would have
   changed two shipped screens to fix a third.

And one the instrument found: **`.cm-out` on a row repainted the badge that says
why the row is greyed.** It is `.cm-out, .cm-out *`, and the badge is
`--color-bad` behind `--color-bg`, so forcing its ink to `--color-faint` put
"Inj" at **1.04:1**. `sweep` measured it six times on Man City. The dimming is
per-cell now and the badge is left alone. `cm-out` has one other caller —
`TabStrip`'s dimmed tabs, which hold plain text and are fine — so the fix is
local rather than a `.cm-out .cm-state` guard for a caller that does not exist.

### The two position columns, and the layer crossing they are

Craig, 3 Sep: *"we kinda need the fantrax positions"* … *"for players"* … *"we
can have both tbh"*. So the squad list carries **two** columns: `Pos`, the
real-life position, empty until the sister repo's feed lands, and `Elig`, what
our Fantrax league is willing to field him as, headed as Fantrax's.

**They may never become one column.** `MID` against Saka's name would claim
Arsenal play him in midfield, when what is true is that *this league* files him
there — and which of his `F,M` actually scores is the roster slot his manager
picked, a fact about a team rather than about a man.

This is the only place the two layers meet on a Premiership screen. It goes
through the audited bridge, never a name match, and `leagueInfo` was already
failure-tolerant so the column empties to dashes rather than taking the squad
down with it. The join works: Saka reads `M/F`, Lewis-Skelly `D/M`, Raya `GK`.

**What it costs is a dependency, not a request.** `leagueInfo` is one
`leagueCache` entry shared with `/league` and every squad page, so a reader who
has been anywhere else pays a cache hit. But the layout does not warm it — it
reads `footballNow` and `offerLive` only — so a club page reached cold makes a
Fantrax request no `/prem` page used to, and Fantrax being unreachable now costs
a column where it used to cost this section nothing at all.

### Fixtures is one competition, and the parquet is the named answer

FPL publishes the Premier League and nothing else, so there is no cup or
European tie to show. The page says so under the list rather than presenting a
partial season as a whole one. Craig named the source for the rest: *"that's
what the team log parquet is for"* — the sister repo's
`team_match_log.parquet`, whose `competition` column sits beside the round,
which is exactly the pair the index block down the left already draws. It is the
same export that fills `Pos`, so it is one crossing rather than two.

### What the docs were saying that was not true

`docs/ui/league-table.md` had been wrong since 31 Aug in about twenty lines: a
"three-way section nav (Table · Schedule · Matchups)" for a strip that gained
Results and both stats boards and lost Matchups that day; a two-line row that is
now one; and three columns — `FP`, `Win%`, `GB` — that were deleted. The column
paragraphs are struck through in place with the date, because a dated record of
a removed column is worth more than a silence.

`docs/ui/conventions.md` named 31 of the 78 files under `components/`, which is
how a shared file lands undocumented: nothing ever said to add the row.
CODE_RULES §4 now does, along with which directory a shared component belongs in
— and the table covers every `shell/`, `league/` and `football/` file.

`docs/ui/TEMPLATE.md` is new, and it is only the shape these files already had.

### PLATFORM_NOTES was five files in one

4,784 lines, and the two hundred an agent actually needs — `Current priorities`,
`Known constraints`, `Recorded rule exceptions` — sat behind about 3,400 lines
of diary. Split on a stated rule: a standing fact, a probe result, a decision or
a rule stays; an account of a day's work moves. 61 sections in, 26 stayed.

**The reason it was worth doing is `docs-drift-auditor`.** It skipped
PLATFORM_NOTES wholesale because a season log's dated entries are supposed to
describe the past — which also exempted every present-tense probe, decision and
constraint buried in it. The exemption moved with the diary; what is left is
checkable, and it was checked in this session for the first time.

## The pitch went back to kits, and the side kicks the other way (10 Sep 2026)

Craig, in one message: *"potraits dont work — lets go back to classic shirts for
the pitch view that all sites work… currently we go strikers at top, keeper
bottom, lets reverse this… there is one exception, the REAL squad page (which has
a list too) and the match line up page, its all the same team, so 11 shirts looks
bad. Instead, we put the shirt number on the design too."*

Three changes, and the third is the one that makes the first work.

**The portraits were fine and that was the point.** Counted before designing
anything: 51 of 60 random players have a `110x140` and 49 have a `500x500`. The
defect is the ladder, not the assets — nine faces, a shirt and a set of initials
in one line of eleven is three kinds of object pretending to be a team. Recorded
in PLATFORM_NOTES with the kit counts beside it.

**The number is what makes eleven identical kits legible**, and the two screens
that need one are exactly the two where a real club publishes one. That symmetry
was not designed; it fell out of asking where a number could honestly come from.

**Four things this cost that were not in the plan**, each found by looking at a
screenshot rather than by reading a diff:

- `PitchMarker` never declared `--pitch-figure`, so the kit letterboxed inside
  `.pitch-figure`'s `1.32` landscape default at 63px in a 110px card. The shape
  moved onto `PlayerShirt`'s own root, where no caller can forget it.
- The card's height cap and its aspect-ratio disagree on a short viewport, so a
  numeral pinned to the card slid down the kit and out below the hem. The kit and
  its number share an inner box now.
- 40% down the shirt is the sponsor. "FLY BE4ER" shipped to one screenshot.
- `Eleven.tsx` had `keeper={false}` hardcoded, so twenty clubs' predicted elevens
  drew their keeper in an outfield shirt. Invisible while the kit was a fallback
  that fired for one man in eight; the first thing you see once it is the whole
  pitch.

**And one thing a screenshot lied about.** The forward line looked clipped, so
the first read was that the taller kit had broken the fold budget. It had not:
the shot was taken at a 1900px viewport, which inflates `100svh` and with it
`.pitch-figure`'s own height cap, so the picture was of a card size no phone will
ever draw. Measured at real viewports the overflow is 0px on the match page and
1–6px of rounding on the planner. A tall screenshot is not a long screenshot —
scroll to the pitch instead.

**A peer session committed mid-flight and swept this work into `e15c8ab`**,
taking every file but the two that were still untracked — so `PitchMarker`
shipped importing a `PlayerShirt` that was not in the repo and HEAD did not
compile for one commit. Nothing had been pushed. The same session had already
built `Formation.tsx`, the match page's pitch, which is why this one adapted to
it rather than building the second one the plan called for.

## The pitch card, sketched and settled (10 Sep 2026, evening)

Craig, with two other sites' pitches beside ours: *"we now need the opponent and
name box. the other sites have a opaque box surrounding the shirt too… then maybe
a CM style label under the shirt? sketch up some designs."*

Six sketches, built on the desk's real tokens and real kits rather than described
— then three, then his pick: the bevelled CM plate for the name over a band in
the opponent's own colour. Published as an artifact in the end, because the
screenshot cards were not reaching his device.

**Three corrections in the round trip, all mine:**

- *"make the background a little more opaque for the cards"* — I darkened it,
  twice, and he meant transparent. *"MORE Transparent, you made it darker,
  christ."* Read the word, not the guess about the word.
- *"it doesnt scale well to mobile"* — true, and measurable: a 58px card on a
  five-man line was spending 10px on chrome before a letter, so the card lost its
  border and padding and the plates went edge-to-edge with the shirt inset
  instead.
- *"ditch the number actually"* — which retired `squadNumbers`, the collision
  helper written four hours earlier. Dead code goes; the counts and the reasoning
  stayed in `IntelPlayer.squadNumber`'s docblock for whoever needs it back.

**And one thing the sketches earned.** Putting six real options on real grass
settled in one pass what prose had been circling for three: the CM title bar is
handsome and the blue is identical on all eleven cards, so its second line
carries no information. That is not an argument anyone wins in a paragraph.

## A ground per club, and the black frame it introduced (11 Sep 2026)

Craig: *"i like the deafult we have of people outside a stadium. lets get an
image for each team in the league, that can be used for their club page and a
prem match for the home team."*

Twenty photographs hunted off Wikimedia Commons, picked from contact sheets, and
wired so a club screen wears its own ground and a match wears the HOME club's.
`PLATFORM_NOTES.md` carries what is standing — the three category traps, the rate
limits, the licence counts, the two rugby fixtures.

The wiring is `drawsOwnGround` in `sections.ts`: the app shell renders above every
route and a fixture id says nothing about who is at home, so the two Shells that
DO know draw the ground and the shell's standing one stands down. Cheap, no
parallel route, no client store — and it moved the ground into the page tree,
where it unmounts on every navigation.

Which Craig saw within minutes: *"loading between pages looks weird (you can the
screen go black when going between iamges)"*. Fixed with a 16px inline JPEG per
row and `placeholder="blur"`. Measured rather than asserted: with the image
request held open, the bare gutter reads rgb(70, 46, 53) against the loaded
photograph's rgb(70, 48, 55), where `--color-bg` is a near-black navy.

**Worth recording how the first measurement lied.** Blocking `*/_next/image*`
looked like the obvious test and is the wrong one — a blocked image ERRORS, and
Next clears the placeholder on error by design, so the capture showed exactly the
black it was meant to disprove. Holding the request open with `Fetch.enable` and
never continuing it is what a slow connection actually does.

`/credits` is new, and it is a licence condition rather than a courtesy: CC BY and
CC BY-SA both require naming the photographer and linking the terms. The rail's
foot and the phone's More drawer both link it.

Half this session's build failures were another session's in-flight work on
`league/matchups` — `sides.tsx` landed before its `FootballTab` export. Cleared by
the time the gates ran green.

**Three re-picked on Craig's read of the first set.** *"everton leeds dont share
rugby stadiums"* — right, and the reason the rugby shots were wrong is not that
they are rugby but that they imply a shared ground. Elland Road and Hill Dickinson
are now football; the Emirates is the mural facade in daylight rather than the
night exterior, which was the darkest of the twenty. Sunderland stays as it was,
on his word, empty stand and all. The shortlist was judged at `brightness(0.55)`
rather than at full strength, which is the only view that answers the question.
