---
paths:
  - "packages/core/src/**"
  - "scripts/**"
  - "apps/companion/app/*.ts"
---

# Provider facts (loaded because you are in provider code or a script)

Probed live from 3 Aug 2026 on, and counted rather than quoted: do not re-derive them, and re-count
a population before building on it. Moved out of CLAUDE.md on 23 Sep 2026 so it loads where
it is used.

### FPL — public, no auth

- `GET /api/bootstrap-static/` — 1.3 MB: 20 clubs, 38 events, and an element
  count that moves with the transfer window (564 on 3 Aug, 600 on 22 Aug, **652 on
  4 Sep** — read it, never assume it).
  Player `code` is **season-stable** (portraits key off it); `id` is per-season and
  **must not be persisted across seasons**. Carries `opta_code`, `news`,
  `chance_of_playing_next_round`.
  **109 keys per element; the mapper reads 31 and the domain carries 28.** Counted 4 Sep 2026, the ones a player
  screen wants: `birth_date` 633/652 · `team_join_date` 633 · `known_name` 72 ·
  `status` 652 (`a`490 `u`91 `i`55 `d`15 `s`1) · `influence`/`creativity`/`threat`
  652 as decimal STRINGS · `penalties_order` 64, `direct_freekicks_order` 56,
  `corners_and_indirect_freekicks_order` 79 · `scout_news_link` 43.
  Counted and **refused**: the three `*_text` companions to the set-piece orders
  are **0/652** — the order is the data, the prose is not; `scout_risks` is a key
  on all 652 and a non-empty array on **7**, every entry `loan_ineligible`, which
  is a footnote and never a tab; `region` is 633 but 67 opaque integers with no
  lookup published, retired by Fantrax's plain-text birthplace;
  `teams[].strength_attack_*`/`strength_defence_*` are **0/20 non-zero**.
  `squad_number` is present as a **key and never as a value** — null on all 622
  elements, checked 29 Aug 2026. This entry used to list it among the fields
  bootstrap carries, which is how a shirt-number fallback came to be designed on
  top of it; a field that is always null is not a field. Count it before
  building on it.
- `GET /api/fixtures/?event={gw}` — fixtures with `started` / `finished` /
  `finished_provisional` / `minutes` / scores.
- `GET /api/element-summary/{id}/` — one player's own season, 13.7 KB. `history`
  (per-GW, the only read that gives bps and expected goals PER FIXTURE),
  `history_past` (completed seasons) and `fixtures` (his run, with FPL's own
  difficulty). **`history_past` writes every key on every row back to 2014/15**,
  so a statistic FPL did not collect that year is a nought and not an absence —
  `starts`, the expected family, tackles and defensive contribution all read zero
  for Maguire's 2021/22, a season in which he played **2,513 minutes**. Counted
  4 Sep 2026 across eight long-career players; `fpl/raw.ts` carries the table.
- `GET /api/event/{gw}/live/` — per-player stats. `{"elements": []}` before the
  round's first kickoff is normal and not an error. **After it, there is a row
  for every player in the league, not only those who played** — 600 elements,
  600 with an `explain` block, 569 of them on zero minutes. So the presence of a
  row says the round has started, never that the man appeared.
- `GET /api/event-status/` — one row per match date, carrying `bonus_added` and
  `points`. The live feed publishes *provisional* bonus long before that flag
  turns, and provisional bonus is by construction the current BPS order — so
  agreement with BPS is not evidence a bonus is final. Nothing reads this; the
  `settled`/`dataChecked` ladder derives the same rungs from reads we already make.
- Portraits: `…/premierleague25/photos/players/{size}/{code}.png` — **PNG only**
  (and since 10 Sep 2026 **no pitch reads them**: a pitch draws the club's kit,
  because the fallback ladder below is what put three kinds of object in one line
  of eleven. Faces survive where a page is about one man. PLATFORM_NOTES carries
  the counts, including the 40/40 on `shirt_{code}[_1]-220.png`.)
  (webp/jpg 403), and note there is no `p` before the code and no 250x250 under
  this prefix. **Two sizes worth asking for, not one** — counted across 120 random
  players on 4 Sep 2026: `110x140` **105/120**, and it serves a real 220x280 PNG
  despite the name; **`500x500` 104/120**, a real 500x500. `220x280` as a literal
  path is **12/120** and mostly a genuine 404, so it is not a second name for the
  small one — that claim came from probing a single player who happened to have
  it, and is the reason this line carries a denominator. This file and
  `portraits.ts` both said 110x140 was the only size published, and a soft lead
  picture was blamed on a ceiling that sits more than twice as high. 15 of the
  120 have no photograph at any size. `premierleague25` is the Premier League's own string, read out of
  FPL's production bundle on 19 Aug 2026; it does **not** track the season (we
  are in 26/27) and `premierleague26` answers 502, so it is a recorded fact and
  never something to compute.
  The old path `…/premierleague/photos/players/250x250/p{code}.png` still answers
  **200 with the set as it stood in August 2024** — which is how a season of
  stale portraits went unnoticed: nothing 404s, the players are simply in their
  old shirts. It is deliberately **not** read as a fallback: a player with no
  current photograph gets his club's crest instead, because a wrong photograph is
  worse than none — only one of the two looks like an answer.
  `next.config.ts` allow-lists image paths, so both prefixes must be named there.
- Crests: `…/premierleague/badges/t{code}.svg` (also `/50/`, `/70/` PNG).

### Fantrax — two surfaces

**Public reads, no auth:** `GET https://www.fantrax.com/fxea/general/{method}?leagueId=…`
— `getLeagueInfo`, `getTeamRosters` (takes an optional `period` and echoes it
back), `getStandings`, `getDraftResults`, `getPlayerIds?sport=EPL` (671 entries on 22 Aug —
611 players plus 60 synthetic per-club entities, 20 each of `Tm`/`TmG`/`TmOF`;
it was 759/~699 on 3 Aug, so count it rather than quoting it; sport code is
**`EPL`**, not `SOCCER`).

**Field presence varies between leagues, not only between states.** On the same
day the real league's `getLeagueInfo` carries `draftType` and `leagueHistoryId`
and the rehearsal league's carries neither. Every field in `raw.ts` is optional
for that reason.

**Internal SPA API:** `POST https://www.fantrax.com/fxpa/req?leagueId=…` with
`{"msgs":[{"method":…,"data":…}]}`. Cookie auth; returns the caller's `roles`.
Some reads work unauthenticated (`getStandings`, `getPlayerProfile`); league data
returns `WARNING_NOT_LOGGED_IN`.

Methods that matter:

- `confirmOrExecuteTeamRosterChanges` — **lineup writes**. Takes
  `rosterLimitPeriod`, `fantasyTeamId`, `applyToFuturePeriods`, and `adminMode`.
- `getCommissionerHubInfo` + `executeCommissionerHubAction({actionKey, …})` — the
  commissioner console. The returned action list is server-driven; do not hardcode.
- `getMatchups` — Fantrax computes live H2H points itself. Their live scores are
  authoritative; our engine is a fallback proxy.
- `getStandings` takes a **`view`**, and `displayedLists.tabs` names all three:
  `REGULAR_SEASON` (the table), `SCHEDULE` (their "Results", 38 period tables)
  and `SEASON_STATS` (29 tables of per-category team totals). We read the first
  two. **Its stat tables repeat one header key eleven times**, so they must be
  read positionally — the inverse of the read-by-key rule the league table needs
  — and its "Games Played" counts player appearances, not rounds. PLATFORM_NOTES
  carries the probe.
- `getScorerDetails`, `getPlayerProfile`, `getPlayerNews`, `setPlayerNews`,
  `setPlayerNote`, `removePlayerNote` — per-player notes are writable and are the
  native home for our player metadata.
- `executeTrade`, `confirmOrExecutePlayerPickerChanges`, `findPlayers`.

### Auth constraint — read before designing any login

Fantrax login uses **reCAPTCHA v3 with a v2 image fallback**, plus 2FA and
`ACCOUNT_LOCKED`. Server-side password login is not viable. Members must provide
their own browser session cookie. We do not hold passwords.

**And "via a browser extension" is not a plan.** Ten friends will not install
one, and most of them read this on a phone, where Chrome has no extensions at all
and Safari's are a per-user install nobody is doing. Any write surface has to
work for a person holding a phone who has never heard of a cookie. The one route
that does is the commissioner's own session plus `adminMode` — one cookie, kept
by one person, writing on behalf of members our own team codes have already
authenticated. Unprobed as of 19 Aug 2026; see PLATFORM_NOTES.

### Fantrax scores the roster slot, not the player

Their scoring is position-dependent (`G: {D:6, M:5, F:4}`, `CS: {D:4, M:1}`) and
the position applied is **the slot his manager chose**, not any single position
of his own. 48 of 607 players are eligible at two — `getLeagueInfo.playerInfo`
carries `eligiblePos` like `"F,M"` — and `getPlayerIds`' one letter per man is the
global pool's default, never the league's answer. Saka is `F,M`, filed at M:
`getLiveScoringStats` pays him 8 at midfield rates while `getPlayerStats` pays him
6 at forward rates. So the pool table's `FPts` is not what a player scored for his
owner. **Read the roster slot, never a position off the player.**

### Identity

Fantrax exposes `rotowireId` on about four players in five — 544 of 699 on 3 Aug,
and the denominator has moved since (see the pool counts above), so count it
rather than quoting it. **`sportRadarId` is not on this endpoint at all** — it is not a second identity space. The existing
identity pipeline at `~/ai-carling-premiership/src/identity/` produces canonical
`person_id`/`root_id` and bridges FPL/SofaScore/FotMob/Understat/Transfermarkt.
It does not include the RotoWire ID space either, so that is not a shortcut. The
Fantrax bridge is built once by matching normalized name + club + position,
audited manually, and persisted in `data/mappings/fantrax.json`.
Never name-match at runtime.
