# Live reporting — every read this app can make on a Saturday afternoon

Craig, 5 Sep 2026: *"print me a doc of what apis we have access to for the live
reporting/info."*

This is the catalogue. `premier-league-api.md` is the depth on one of the three
providers; this is the map of all of them, written from the question a manager is
actually asking at ten to four rather than from the provider's own shape.

Everything with a number in it was **probed live** — 3 Aug, 4 Sep and 5 Sep 2026.
A count is a count. Nothing here is estimated, and nothing should be re-derived:
add to it instead.

---

## The three providers, in one table

| | FPL | The Premier League (Pulselive) | Fantrax |
|---|---|---|---|
| Host | `fantasy.premierleague.com/api` | `footballapi.pulselive.com/football` | `fantrax.com/fxea` and `/fxpa` |
| Auth | none | **none, and no headers at all** | none for `fxea`; cookie for `fxpa` |
| CORS | open | **locked to their own origin — server-side only** | open on `fxea` |
| Their own TTL | not published | `cache-control: max-age=30` | not published |
| What it knows | the whole real competition, and FPL's scoring | the match, minute by minute | **our league**, and only our league |
| Layer | football | football | league |

**The poll is 30 seconds and the two live reads live 20.** `POLL.live` is 30 and
the Premier League's own CDN TTL is 30. `LIVE_REVALIDATE` is 20, so each poll
finds the last one's background refresh already stale and gets new data
(PLATFORM_NOTES, 23 Sep 2026). `shell/AutoRefresh` is the app's single client
poller and every page is a server component, which is also what makes the CORS
lock above cost nothing.

---

## The three questions, and what answers each

`PRODUCT.md` puts them in order of frequency, and the Live tab is judged against
Craig's own 15:50 test: *"it's 3.50, games are on. I can open the site, and
quickly check real scores, who got goals/assists in games, and check the Fantrax
matchup."*

| # | The question | The read | Built |
|---|---|---|---|
| 1 | **Am I winning?** | Fantrax `getLiveScoringStats`, one call for the whole league | ✔ `scoreboard.ts` |
| 2 | **Who just did what, and whose is he?** | PL `/fixtures?…&altIds=true`, whose `goals` array carries every goal in the round | ✔ `commentary.ts` → `matchday/wireLines.ts` |
| 3 | **What are the real scores?** | FPL `/fixtures/?event={gw}` | ✔ `football.ts` |

Question 2 is the one **nobody else can answer**. Fantrax knows our league and
not the football; FPL and the Premier League app know the football and not our
league. *"Salah just scored, and he's Dave's"* is the only sentence on the
internet that needs both, and it is one join away.

---

## FPL — the calendar, the scoresheet, and FPL's own points

Public, no auth. `CLAUDE.md` carries the full probe; this is the live subset.

| Endpoint | What it gives | Cost | Built |
|---|---|---|---|
| `/bootstrap-static/` | 20 clubs, 38 events, every player. `code` is season-stable and is the join key everything else hangs off | 1.3 MB | ✔ |
| `/fixtures/?event={gw}` | `started` · `finished` · `finished_provisional` · `minutes` · both scores | small | ✔ the fixture list |
| `/event/{gw}/live/` | per-player minutes, goals, assists, clean sheets, cards, saves, bonus, bps, and FPL's own `total_points` | **437 KB** | ✔ `gameweekLive` |
| `/fixtures/?event={gw}` + `stats` | the per-fixture scoresheet, including **signed** bps | 26 KB | ✔ `gameweekSheets` |
| `/event-status/` | `bonus_added` per match date | tiny | **nothing reads it** — see below |

**Two traps that have already cost us, both measured:**

- **A row in the live feed does not mean the man played.** After the round's
  first kickoff there is a row for *every player in the league*: 600 elements,
  600 with an `explain` block, **569 of them on zero minutes**. So the presence of
  a row says the ROUND has started and never that the MAN appeared. This is what
  `fpl/played.ts` exists for, and printing `0` instead of `—` for an idle player
  was the bug it fixed.
- **Provisional bonus agreeing with BPS is not evidence it is final.** The live
  feed publishes provisional bonus long before `event-status` turns its flag, and
  provisional bonus is *by construction* the current BPS order. Nothing reads
  `event-status` because the `settled`/`dataChecked` ladder derives the same rungs
  from reads we already make.

FPL's blunt `minutes` is the clock we print on the Live tab today. The Premier
League's own `clock.label` is better (see below) and is **not yet wired into that
row** — recorded so the absence is not read as an oversight.

---

## The Premier League — the minute-by-minute

`premier-league-api.md` is the full surface, the metric vocabularies and the
traps. What matters for a Saturday:

| Read | What it gives | Cost | Built |
|---|---|---|---|
| `/fixtures?comps=1&compSeasons=841&gameweekNumbers={gw}&altIds=true` | the round: status, a **real clock** (`clock.label "13'00"`, `phase`), `halfTimeScore`, ground, attendance — **and every `goal` in the round**, with `personId`, `assistId`, `clock` and a one-letter `type` | one request for ten matches | ✔ `roundGoals` |
| `/fixtures/{id}` | lineup, substitutes, **formation, shirt numbers, captain**, match officials | ~24 KB | ✖ |
| `/fixtures/{id}/textstream/EN` | Opta's own minute-stamped commentary — cards, subs, misses, VAR, prose | 4–19 KB | ✖ mapper written and tested; nothing draws it |
| `/stats/match/{id}` | 191 metrics per side — shots, possession, passes, tackles, corners | small | ✖ `plMatchMetrics` written and tested |

**The round read is the whole of question 2, for one request.** Counted across
GW1–3: the `goals` array reconciles with the scoreline on **21 of 21** played
fixtures, splits **57 `G` · 4 `O` · 3 `P`** exactly as the commentary stream does,
and carries an assist on **22 of 32** in GW2 — an unassisted goal, not a gap.

**How much wire there is, counted over two complete rounds:**

| per round | |
|---|---|
| all events | **1,083** |
| scoring-relevant (goal · pen · own goal · yellow · red · sub · VAR cancelled) | **160** |
| …involving a player somebody in our league owns | **102** |
| goals including penalties and own goals | **31** |
| …whose scorer is owned by one of the ten | **30 — 97%** |

That tiering is forced by the numbers rather than chosen: 1,083 can never be
printed, 102 is about two a minute through a 15:00–17:00 window, and **31 goals a
round is exactly the size of a panel you can read from the sofa**.

**Four things that fail silently and are all in the code as comments:**

1. `altIds=true` is not optional — without it the round read answers **0 of 10**
   join keys, and the screen is empty with no error.
2. The **textstream's own fixture header carries no `altIds`**, so a mapper that
   reads the fixture code off the payload it is mapping returns an empty round.
3. `time.secs` is **per-fixture elapsed** and runs *backwards* across the
   interval (`end 1` 2910, second-half `start` 2700). Only `kickoff + secs` orders
   a ROUND.
4. `/stats/match` **omits a metric worth zero** — the inverse of DESIGN §7.
   Counted over 40 team-sides: shots, fouls, possession, passes, tackles and
   headers 40/40; corners 39; on target 37; yellows 36; offsides 27; **red cards
   1**, and there was exactly one red card. Absence there means *nought*.

**The id map is harvested, not fetched.** `/players` misses **20 of the 360**
players who appear in GW1–3 events, 14 of them in a goal, card or substitution,
one a scorer. All 20 are in some fixture's `teamLists`, so `scripts/pl-bridge.ts`
unions the two into `data/mappings/premierleague.json` — 445 players, 0 unresolved
of 360.

---

## Fantrax — our league, and only ours

The league layer. `fxea` is public; `fxpa` needs the commissioner's cookie and
nothing in the tracked tree reads it.

| Method | What it gives | Built |
|---|---|---|
| `getLiveScoringStats` (`fxpa`) | **live H2H totals for all ten**, per-player points priced at the roster slot, and a per-category breakdown | ✔ — one call, mapped three ways |
| `getTeamRosters` (`fxea`) | every squad, optionally for a named period | ✔ |
| `getStandings` (`fxea`) | the table, and 38 period result tables | ✔ |
| `getLeagueInfo` (`fxea`) | scoring, roster limits, the period calendar, the schedule | ✔ |

**One read, three mappings, and it is the busiest request the app makes.**
`scoreboard.ts` says so in as many words: *"the read sixteen phones poll every
thirty seconds on a Saturday."* Team totals, per-player points and the category
breakdown all come out of that one payload — asking three times would be three
times the load for the same bytes.

**Their live scores are authoritative and ours are a fallback proxy.** Fantrax
computes the H2H itself. The one arithmetic this app is allowed to do is
`pendingCleanSheets()`, and it is printed *beside* a Fantrax total and never
folded into one.

**They score the roster SLOT, not the player.** 48 of 607 are eligible at two
positions, and `getLiveScoringStats` pays a man at the slot his manager filed him
in. The pool table's `FPts` is not what he scored for his owner.

---

## What a Saturday actually costs

| moment | requests | bytes |
|---|---|---|
| between kickoffs | the round read + FPL fixtures | ~30 KB |
| 15:00, five matches live, goals panel only | the same | ~30 KB |
| the same, with per-fixture commentary for the live ones | + 2 per live fixture | ~200 KB |

All of it cached thirty seconds and shared by every reader, so the numbers above
are **per revalidate and not per phone**.

---

## Built, and not built

**Live on `/matchday` today:** the wire (one row per event, both men and both
owners), the goal flash, the draft ties by competition, the day's real scores,
your own head-to-head, and your afternoon still to come.

**Written, tested, and drawing nothing yet** — each one is a tab away rather than
a project:

- **Match stats.** `fetchPlMatchStats` + `plMatchMetrics`, inside the adapter's 25 tests. Makes 12 of
  CM's 13 Match Stats rows shippable (`cm9900/22.jpg`); the only one missing is
  Action Zones.
- **Match report.** `fetchPlTextstream` + `mapMatchEvents`, answering 200 on
  **30 of 30** fixtures across GW1–3, 2,215 events. This is `DESIGN.md` §2's
  named absence — *"a text-commentary matchday"* — and the mapper is done.
- **Lineups, formation, shirt numbers, captain.** On `/fixtures/{id}`, unread.
- **The real match clock.** `clock.label` beats FPL's `minutes` and the Live
  tab still prints FPL's.

**Deliberately not built, with the reason**, so the absence is not mistaken for a
gap:

- **Republishing the Premier League's own written match reports.** They exist and
  are findable (tagged `label:Match report`), and **47 of 300 content items carry
  a body**, up to 62 KB — so the earlier claim that the content API "indexes but
  does not serve" was wrong and is corrected. We do not print their prose. The
  Gazetta is fed the *facts* instead, which is why its match report stopped
  reading like a ledger.
- **A per-man Fantrax points figure per MATCH.** A period total is what the wired
  read returns; the real thing costs 32 requests and belongs in a paced capture.
- **A minute that ticks between polls.** Counting FPL's `minutes` up on the
  client invents minutes at half-time and in stoppage time, where the real clock
  stops or runs past 90. The honest route is the Premier League's own
  `clock.label` and `phase`, off the `plRound` read the page already makes. That
  is the "real match clock" item above, and it waits on that (23 Sep 2026).
- **Push notifications when a goal lands.** Nothing exists. The page refreshes
  itself every thirty seconds (`shell/AutoRefresh`), which covers a reader with
  it open; a phone in a pocket gets nothing. Web Push would need a service
  worker, a subscription store and a sender — a real piece of work, and the first
  thing on this list that is not one read away.

---

## The World Cup Fantasy idea, recorded rather than built

Craig, 5 Sep 2026: *"world cup fantasy has a live dropdown for quick match info
for the prem when a match is live"*, and *"use world cup fantasy for other ideas
for live matches etc."*

The pattern is a **live fixture that opens in place** — you stay on the list and
the row expands to give you that match's goals, cards and your own men in it,
rather than navigating to a match page and back. On a phone, on a Saturday, that
is the right shape: a manager checking four scores does not want four round trips.

**It conflicts with something built the same day, and the conflict is the whole
of the design decision.** Every row on the Live tab is now a `Link` to its match
page (Craig, same message: *"live page should link to the respective match
pages"*). A row cannot be both a link and a disclosure — an anchor wrapping a
`<details>` is invalid markup that browsers resolve by dropping one of them, and
the app has already been bitten by exactly that in `schedule/Season.tsx`.

Three ways out, and none of them has been chosen:

1. **The chevron is the disclosure and the row is the link.** Two targets in one
   row, which is what `Season.tsx` does with its score cell — measured, works, and
   costs a second 44px target on a 390 screen.
2. **Live rows open; finished rows link.** The disclosure is only useful while
   something is happening, and a finished match wants the full page anyway.
3. **Neither — the wire already answers it.** The panel above the scores is the
   round's events with owners attached, which is most of what a dropdown would
   show, for every match at once.

Everything a dropdown would need is already fetched: `roundGoals` carries every
goal in the round keyed by fixture, and `involvement.marks()` already knows which
of the reader's men are in each match.
