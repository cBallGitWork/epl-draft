# The Premier League's own API — what it actually gives us

`www.premierleague.com` is a shell over **`https://footballapi.pulselive.com/football`**.
Everything below was probed live on **4 Sep 2026** against the 2026/27 season. Counts are
counts, not estimates. **Do not re-derive any of it** — add to it.

`docs/record/PLATFORM_NOTES.md` carries the decisions and the one rule this provider inverts; this
file is the surface. **`live-reporting.md` is the map of all three providers** — what
answers which question on a Saturday, what it costs, and what is built — and is the
one to read first if the question is "what can we show at ten to four".

## Access

- **Public. No auth, and no headers at all** — re-tested with each removed in turn, a bare
  request answers 200.
- `cache-control: max-age=30` — their own TTL, which is already `PAGE_REVALIDATE`. Asking
  faster returns the same bytes off their CDN.
- `access-control-allow-origin: https://www.premierleague.com` — **server-side only**.
  A browser on our origin is refused, so nothing here may be reached from a
  `"use client"` component.
- Ten requests back to back: 10 × 200, 2.0s, no throttling seen.

## The two constants you need

| | | why it cannot be computed |
|---|---|---|
| `comps=1` | the Premier League | competition ids are theirs; the same API serves the EFL and the women's game |
| `compSeasons=841` | 2026/27 | opaque, changes every summer, published only by `/competitions/1/compseasons` |

Both are in `packages/core/src/config.ts` as `PL_COMPETITION` and `PL_COMP_SEASON`, beside
`SEASON`, with the same treatment `PL_PHOTO_BASE` gets: **a recorded fact, never derived**.
`PL_COMP_SEASON` will be wrong next August and the failure mode is an empty round rather
than an error, so it belongs on the same checklist as `FANTRAX_LEAGUE_ID`.

## `altIds=true` is not optional, and its absence fails silently

Two endpoints answer **no `altIds` at all** without it — `/fixtures` (0 of 10 measured)
and `/players`. `altIds` is the entire join to FPL, so without the parameter the screen is
empty and nothing throws.

| | ours | theirs |
|---|---|---|
| Fixture | FPL `fixture.code` `2645221` | `altIds.opta` `"g2645221"` |
| Player | FPL `opta_code` `"p531442"` | `altIds.opta` `"p531442"` |
| Club | — | `altIds.opta` `"t14"` |

`opta_code` is non-null on **652/652** FPL elements; a full match's lineup and bench joined
**40 of 40**. Nothing matches a name.

## The endpoints

Eighteen answer. `/compseasons`, `/awards`, `/news`, `/videos`, `/hero`,
`/teams/{id}/compseasons`, `/fixtures/{id}/lineup` and `/stats/matchOfficials/{id}`
are **404 — probed, do not retry**.

### Used today

| Endpoint | Size | What it carries |
|---|---|---|
| `/fixtures?comps&compSeasons&gameweekNumbers&altIds=true` | ~25 KB | The round. Live `clock` (a real one — FPL has only `minutes`), `phase`, `halfTimeScore`, `ground`, `matchOfficials`, `attendance`, `altIds` — **and `goals`**: scorer, assister and minute for every goal in all ten matches |
| `/fixtures/{id}` | ~30 KB | `teamLists` — lineup, substitutes, **formation as lines of player ids**, `matchShirtNumber`, `captain`; plus `matchOfficials`, `attendance`, `halfTimeScore` |
| `/fixtures/{id}/textstream/EN?pageSize=300` | 4–19 KB | Opta's minute-stamped commentary. **`pageSize=100` truncates** — a full match runs to 107 events |

### Available and unbuilt

| Endpoint | Size | What it carries |
|---|---|---|
| `/stats/match/{id}` | 34 KB | **191 Opta metrics per side**, per match. Present on 21/21 played fixtures |
| `/stats/team/{id}?comps&compSeasons` | 22 KB | **212 season metrics** for one club, plus `greatestVictory` as a whole fixture object |
| `/stats/player/{id}?comps&compSeasons` | 12 KB | **116 season metrics** for one player, plus his profile |
| `/stats/ranked/players/{metric}` | small | A **leaderboard** for any player metric, paged, each row `{owner, rank, name, value}` |
| `/stats/ranked/teams/{metric}` | small | The same for clubs |
| `/standings?compSeasons&altIds=true` | 14 KB | The league table with `overall`/`home`/`away` splits per club, `position`, `startingPosition`, `annotations`, `ground`, and a `live` flag |
| `/teams/{id}/compseasons/{cs}/staff` | 23 KB | **The squad with season figures** (appearances, goals, cleanSheets, saves, height, weight, joinDate, awards) **and the officials — the manager and his staff** |
| `/players/{id}?compSeasons` | 1 KB | Career profile: `debut`, `height`, `weight`, `currentTeam`, `previousTeam`, `appearances`, `goals`, `assists`, `tackles`, `shots`, `keyPasses`, `cleanSheets`, and `awards` by type |
| `/compseasons/{cs}/teams?altIds=true` | 6 KB | All 20 clubs with their **grounds, capacity and lat/long** |
| `/teams/{id}?comps&altIds=true` | 1 KB | One club, with every ground it has used |
| `/clubs`, `/grounds` | paged | The whole historical register — 2,944 clubs, 4,640 grounds, with `founded`, `city`, `postalCode`, capacity, coordinates |
| `/competitions` | small | 115 competitions |
| `/broadcasting-schedule/fixtures` | ~1 KB | UK broadcasters (Sky, TNT…). **`content` was empty when probed** — do not build on it without re-counting |

## The written match reports — the prose IS served, but not for the reports

There is a second API on the same host: **`/content/premierleague/text/EN`**. It is the
site's editorial content, and the match reports are in it — an article tagged
`label:Match report` · `franchise:match-reports` · `content-format:long-read` ·
`content-type:article` was found for the Ipswich–Liverpool game on the first look.

**`body` is 0 characters on those items — in the list view and the single-item fetch
alike.** *This file first said the endpoint "indexes the article and does not serve it".
That was wrong, and Craig called it: measured across **300 items spanning
2025-09-04 to 2026-09-04, 47 carry a body**, up to 62 KB. The endpoint serves prose.*

What is true is narrower and stranger. Across those same 300 items there are **only two
tagged as match reports at all**, they are duplicates of one another, and both have an
empty body and a 74-character summary. Whether that is because the match had just
finished, or because reports are syndicated in without their text, **n=2 cannot say** —
re-count after a full weekend before building anything on it.

Three things about it, all measured, none obvious:

- **The references are not fixtures.** They are `SDP_FOOTBALL_TEAM` (Opta team ids —
  `40` and `14` for Ipswich and Liverpool), `SDP_FOOTBALL_SEASON` and
  `SDP_FOOTBALL_COMPETITION`. Querying `references=FOOTBALL_FIXTURE:{id}` returns **0
  entries**, which looks like "no reports exist" and is not. To tie a report to a match you
  join on the two Opta team ids plus the season.
- **`pageInfo.numEntries` reads 0 while `content` returns five items.** The pagination
  metadata on this endpoint is not to be trusted; count the array.
- `canonicalUrl` was empty on the item checked, so even the link back is not reliably there.

**And the judgement, which outlasts the field list.** These are the Premier League's own
written journalism. Opta's event feed is a record of facts — who scored, when, from where —
and this is an authored article. The Gazetta already writes its own prose from facts
(`scripts/write-edition.ts`), and that is the right shape: feed it the minute-by-minute and
the ~170 match metrics, not somebody else's report. If we ever want to point at theirs, the
title and a link are the surface to use, never the body.

## The fixture detail carries its OWN events array

Found 10 Sep 2026, and not previously documented or typed. `GET /fixtures/{id}`
answers with an `events` array beside the team sheets — a second, compact feed
that is **not** the textstream, and the only place a substitution's minute and a
booking's minute are published as DATA rather than inside Opta's prose.

Counted across the 30 completed fixtures of gameweeks 1-3, 862 rows:

| type | rows | `description` |
|---|---|---|
| `S` substitution | 538 | `ON` 269, `OFF` 269 |
| `B` booking | 118 | `Y` 117, `R` **1** |
| `G` goal | 76 | `G`, with `assistId` on 56 |
| `PS` / `PE` period marks | 60 / 60 | none |
| `O` own goal | 5 | `O` |
| `P` penalty | 4 | `P` |
| `MP` missed penalty | 1 | `MP` |

Present and non-empty on **30/30** completed fixtures and absent on all 10
upcoming ones, so it is an exact tell for "has this been played" rather than a
clock to interpret.

Four things about it, all measured, none obvious:

1. **The goal types are three, not one.** `G` + `O` + `P` = 76 + 5 + 4 = **85**,
   and the sister repo's independent shot export counts exactly 85 goals over the
   same 30 fixtures. A reader taking only `G` silently drops nine, and one that
   files `O` under goals credits a man with an own goal.
2. **A card can belong to nobody.** 121 of the 862 rows carry no `personId`; 120
   are the period marks and **the 121st is a real booking** with a `teamId` and no
   man — Newcastle v Bournemouth at 71', a bench or staff card. A reader must
   tolerate a card that belongs to a side.
3. **The pairing of a substitution is the feed's ORDER and nothing else.** Each
   `ON` is immediately followed by its own `OFF`: **269 of 269** adjacent pairs,
   every pair agreeing on both minute and `teamId`, no fixture with an odd number
   of rows. This matters because a side can make three changes in the same minute
   — Liverpool at 71' in the recorded fixture — and pairing on the clock then
   pairs arbitrarily. `plSubstitutions` is the only thing that may do this join;
   `plManMatches` is per-man and has already lost the order.
4. **`MP` is a missed penalty and is real**, carrying a man. Read and dropped
   deliberately — CM's ratings board has no such mark and FPL's own sheet
   publishes `penaltiesMissed` — and named here so it is not re-found.
5. **`assistId` is the PASS and nothing else.** It is absent on **0 of 5** own
   goals and **0 of 4** penalties across gameweeks 1-3, which is not a hole in
   the feed: FPL pays an assist for three things that are not passes, and none of
   them is a thing Opta calls an assist. The next section is where those come
   from.

Typed as `RawPlFixtureEvent`. The vocabulary and the clock reader are in
`premierleague/fixtureEvents.ts`; `sheetEvents.ts` maps it into `PlManMatch`
(per man) and `PlSubstitution` (per change), and `goals.ts` into `PlGoal`
(per goal).

## The three assists FPL pays that `assistId` cannot give you

Counted 11 Sep 2026 on Man Utd 5-2 Ipswich, gameweek 2. FPL pays five assists
for United's five goals; the fixture detail places two. FPL's own rules pay for
three things beyond the ball that was played, and each is an event TYPE in the
**textstream**:

| FPL pays for | textstream type | where the man is |
|---|---|---|
| winning a penalty that is converted | **`penalty won`** | `playerIds[0]` |
| forcing an own goal with a shot or cross | the attempt immediately before the `own goal` | `playerIds[0]` |
| a shot blocked, saved or off the woodwork, scored from the rebound | the attempt immediately before the `goal` | `playerIds[0]` |

The attempt types are `miss`, `attempt blocked`, `attempt saved` and `post`.
A textstream entry carries only `id`, `type`, `text`, `time` and `playerIds` —
checked across all 116 entries of that fixture — and `playerIds` is `[scorer,
assister]` on an assisted goal and `[scorer]` alone on an own goal, so **the own
goal's assister is published nowhere structurally**.

**`playerIds` are the PL's own person ids**, the same space as the fixture
detail's `personId`/`assistId` and NOT FPL's `opta_code` digits — Maguire is
person `9566` and opta `p95658`. The join therefore needs a team sheet, which
the textstream does not carry, which is why `matchStreamCredits` reads the
fixture detail alongside it.

Two of the three legs rest on event ORDER rather than a published field, so
`assists.ts` treats the whole thing as a proposal and has FPL's per-man counts
confirm it before any of it reaches a screen.

## Highlights: not from THIS API, but Sky's YouTube is a real answer

Checked 10 Sep 2026. There is **no** `highlights`, `video`, `videos`, `media`,
`matchReport` or `report` key on the round read, the fixture detail, the
textstream or `/stats/match`. `content.pulselive.com`, which older notes reach
for, **no longer resolves**. The match page's own HTML names
`checkout.plplus.premierleague.com` and `ottapp-appgw-client-a.proda.epl.tv3cloud.com`
— DRM'd subscription OTT behind a paywall.

Nothing THEY publish is embeddable, and the answer is not "we have not found it
yet". If we ever want to point at theirs, a title and a link is the surface,
never the body — the same ruling this file already makes about their written
reports.

**But YouTube is a different answer, found 11 Sep 2026.** This section used to
end "there is nothing to embed", full stop, and that was wrong about the whole
question rather than about this API. Craig supplied the playlist and it settles
it:

- **Sky Sports Premier League** — channel `UCTU_wC79Dgi9rh4e9-baTqA`, playlist
  `PLUY_YSABhemI`, "Premier League Highlights 26/27". Sky hold the UK rights, so
  this is the official source for the audience this app has, and oEmbed answers
  **200** — it is offered for embedding.
- **No API key for the current round.** `https://www.youtube.com/feeds/videos.xml?playlist_id=…`
  is public and returns the latest **15** entries, which is about a round and a
  half. A season's back catalogue needs the Data API's `playlistItems.list`,
  which is 1 quota unit per 50 items against 10,000 a day.
- **The title is a JOIN, not a search**, which is the whole reason this is safe.
  Every title carries `{home} {h}-{a} {away}` — `Arsenal 2-1 Chelsea`,
  `N Forest 0-0 Spurs`. **15 of 15 parse**, counted. Requiring BOTH clubs AND the
  score to match one of our fixtures is a constraint no re-upload or compilation
  passes by accident, which is what keeps us clear of the rule the portraits
  decision set: a wrong one is worse than none.
- **Six aliases, and Sky is not consistent with itself**: `Hull`→`Hull City`,
  `N Forest` and `Nottingham Forest`→`Nott'm Forest`, `B'mouth`→`Bournemouth`,
  `Coventry`→`Coventry City`, `Ipswich`→`Ipswich Town`. Counted 28 Sep 2026: the
  feed held **13 of 15** joinable titles before the last two were added (gameweek
  5's Bournemouth and Forest videos never showed), and 15 of 15 after.
- **Do not order on the feed's dates.** The playlist feed's `published` is the
  video's own publication and does not sort with the playlist — Arsenal 2-1
  Chelsea is dated 9 Aug and arrives first. Match on the title.

`next.config.ts` needs nothing for an iframe and the app sets no CSP, so the
embed is `youtube-nocookie.com/embed/{id}` in a 16:9 box. Never fetch or re-host
the video: embedding is what YouTube offers, and it is the only thing we take.

## The traps, all measured

1. **`/stats/match` omits a metric whose value is zero.** Counted over 40 team-sides:
   shots, fouls, possession, passes, tackles, headers **40/40**; corners 39; on target 37;
   yellow cards 36; offsides 27; **red cards 1** — and there was exactly one red card in
   those rounds. **So absence there means NOUGHT**, the opposite of `docs/rules/DESIGN.md` §7's
   *"Absence is `—`, never `0`"*. A reader of this endpoint defaults a missing metric to 0
   and says so at the call site.
2. **`/players` is incomplete.** It misses 20 of the 360 players who appear in a round's
   events — 14 in a goal, card or substitution, one a scorer. All twenty are on a team
   sheet. `scripts/pl-bridge.ts` harvests from sheets instead; **0 unresolved of 360**.
3. **`time.secs` is per-fixture elapsed, not a wall clock**, and it runs *backwards* across
   the interval (`end 1` 2910, second-half `start` 2700). Order a round on
   `kickoff.millis + secs × 1000`.
4. **The textstream is append-only.** A goal cancelled by VAR is published as the
   cancellation and never also as a goal, so counting it reconciles with the scoreline on
   **21/21** played fixtures and nothing has to be un-printed.
5. **`penalty goal` is its own event type.** A goals feed reading only `goal` loses every
   penalty. `end 14` means "match ends" and its minute label is junk.
6. **`description` on every metric reads `"Todo: <name>"`.** It is a placeholder in their
   own payload, not a label. Never print it.
7. **The metric names are Opta's, not English.** `fk_foul_lost` is fouls *committed*,
   `fk_foul_won` is fouls *won*. Map them explicitly.

## CM's Match Stats board, mapped

`cm9900/22.jpg` runs thirteen rows. Twelve are on `/stats/match`:

| CM row | Opta |
|---|---|
| Shots On Goal | `total_scoring_att` |
| On Target | `ontarget_scoring_att` |
| Off Target | `shot_off_target` |
| Corners | `corner_taken` |
| Free Kicks | `fk_foul_won` |
| Fouls | `fk_foul_lost` |
| Offsides | `total_offside` |
| Passes Completed | `accurate_pass` |
| Tackles Won | `won_tackle` |
| Headers Won | `aerial_won` |
| Yellow Cards | `total_yel_card` |
| Red Cards | `total_red_card` |
| Throw-Ins | `total_throws` |

Possession is `possession_percentage`, which CM drew as its "Last 5 Mins" bar.

## The metric vocabularies, in full

### Per match, per side — 191

  accurate_back_zone_pass · accurate_chipped_pass · accurate_corners_intobox · accurate_cross · accurate_cross_nocorner · accurate_flick_on
  accurate_fwd_zone_pass · accurate_goal_kicks · accurate_keeper_sweeper · accurate_keeper_throws · accurate_launches · accurate_layoffs
  accurate_long_balls · accurate_pass · accurate_pull_back · accurate_through_ball · accurate_throws · aerial_lost
  aerial_won · att_assist_openplay · att_assist_setplay · att_bx_centre · att_bx_left · att_bx_right
  att_cmiss_high_right · att_cmiss_right · att_corner · att_freekick_miss · att_freekick_total · att_goal_high_centre
  att_goal_low_centre · att_goal_low_left · att_goal_low_right · att_hd_miss · att_hd_target · att_hd_total
  att_ibox_blocked · att_ibox_goal · att_ibox_miss · att_ibox_target · att_lf_goal · att_lf_total
  att_miss_high · att_miss_high_right · att_miss_left · att_miss_right · att_obox_blocked · att_obox_miss
  att_obox_target · att_obx_centre · att_obx_left · att_openplay · att_pen_goal · att_rf_goal
  att_rf_target · att_rf_total · att_sv_high_centre · att_sv_high_left · attempted_tackle_foul · attempts_conceded_ibox
  attempts_conceded_obox · attempts_ibox · attempts_obox · backward_pass · ball_recovery · big_chance_created
  big_chance_missed · big_chance_saves · big_chance_scored · blocked_cross · blocked_pass · blocked_scoring_att
  carries · challenge_lost · contentious_decision · corner_taken · crosses_18yard · crosses_18yardplus
  defensive_actions · dispossessed · diving_save · draws · duel_lost · duel_won
  effective_blocked_cross · effective_clearance · effective_head_clearance · final_third_entries · final_third_entries_open_play · first_half_goals
  fk_foul_lost · fk_foul_won · formation_used · forward_goals · fouled_final_third · freekick_cross
  fwd_pass · goal_assist · goal_assist_intentional · goal_assist_openplay · goal_kicks · goals
  goals_conceded · goals_conceded_ibox · goals_ibox · goals_openplay · head_clearance · hit_woodwork
  interception · interception_won · keeper_throws · last_man_tackle · leftside_pass · long_pass_own_to_opp
  long_pass_own_to_opp_success · lost_corners · midfielder_goals · offtarget_att_assist · ontarget_att_assist · ontarget_scoring_att
  open_play_pass · opposition_passes · outfielder_block · overrun · passes_left · passes_right
  pen_area_entries · pen_area_entries_open_play · pen_goals_conceded · penalty_conceded · penalty_faced · penalty_won
  poss_lost_all · poss_lost_ctrl · poss_won_att_3rd · poss_won_def_3rd · poss_won_mid_3rd · possession_percentage
  ppda · progressive_carries · pts_dropped_winning_pos · pts_gained_losing_pos · punches · put_through
  rightside_pass · saved_ibox · saved_obox · saves · shield_ball_oop · shot_created
  shot_off_target · six_yard_block · subs_made · successful_final_third_entries · successful_final_third_entries_open_play · successful_final_third_passes
  successful_open_play_pass · successful_pen_area_entries · successful_pen_area_entries_open_play · successful_put_through · total_att_assist · total_back_zone_pass
  total_chipped_pass · total_clearance · total_contest · total_corners_intobox · total_cross · total_cross_nocorner
  total_final_third_passes · total_flick_on · total_fwd_zone_pass · total_high_claim · total_keeper_sweeper · total_launches
  total_layoffs · total_long_balls · total_offside · total_pass · total_pull_back · total_scoring_att
  total_tackle · total_through_ball · total_throws · total_yel_card · touches · touches_in_final_third
  touches_in_opp_box · unsuccessful_touch · won_contest · won_corners · won_tackle

### Per club, per season — 212

  accurate_back_zone_pass · accurate_chipped_pass · accurate_corners_intobox · accurate_cross · accurate_cross_nocorner · accurate_flick_on
  accurate_freekick_cross · accurate_fwd_zone_pass · accurate_goal_kicks · accurate_keeper_sweeper · accurate_keeper_throws · accurate_launches
  accurate_layoffs · accurate_long_balls · accurate_pass · accurate_through_ball · accurate_throws · aerial_lost
  aerial_won · att_assist_openplay · att_assist_setplay · att_bx_centre · att_bx_left · att_bx_right
  att_cmiss_high · att_cmiss_high_right · att_cmiss_right · att_corner · att_fastbreak · att_freekick_miss
  att_freekick_total · att_goal_high_centre · att_goal_high_left · att_goal_high_right · att_goal_low_centre · att_goal_low_left
  att_hd_miss · att_hd_target · att_hd_total · att_ibox_blocked · att_ibox_goal · att_ibox_miss
  att_ibox_target · att_lf_goal · att_lf_target · att_lf_total · att_miss_high · att_miss_high_right
  att_miss_left · att_miss_right · att_obox_blocked · att_obox_goal · att_obox_miss · att_obox_target
  att_obx_centre · att_obx_left · att_openplay · att_pen_goal · att_rf_goal · att_rf_target
  att_rf_total · att_setpiece · att_sv_high_centre · att_sv_high_left · att_sv_high_right · att_sv_low_centre
  att_sv_low_left · att_sv_low_right · attempted_tackle_foul · attempts_conceded_ibox · attempts_conceded_obox · attempts_ibox
  attempts_obox · attendance_average · attendance_count · attendance_highest · attendance_lowest · attendance_total
  backward_pass · ball_recovery · big_chance_created · big_chance_missed · big_chance_saves · big_chance_scored
  blocked_cross · blocked_pass · blocked_scoring_att · carries · challenge_lost · clean_sheet
  contentious_decision · corner_taken · crosses_18yard · crosses_18yardplus · defensive_actions · dispossessed
  diving_save · draws · duel_lost · duel_won · effective_blocked_cross · effective_clearance
  effective_head_clearance · error_lead_to_shot · final_third_entries · final_third_entries_open_play · first_half_goals · fk_foul_lost
  fk_foul_won · forward_goals · foul_throw_in · fouled_final_third · freekick_cross · fwd_pass
  goal_assist · goal_assist_intentional · goal_assist_openplay · goal_kicks · goals · goals_conceded
  goals_conceded_ibox · goals_conceded_obox · goals_ibox · goals_obox · goals_openplay · hand_ball
  head_clearance · interception · interception_won · interceptions_in_box · keeper_throws · leftside_pass
  long_pass_own_to_opp · long_pass_own_to_opp_success · lost_corners · midfielder_goals · offtarget_att_assist · ontarget_att_assist
  ontarget_scoring_att · open_play_pass · opposition_passes · outfielder_block · overrun · passes_left
  passes_right · pen_area_entries · pen_area_entries_open_play · pen_goals_conceded · penalty_conceded · penalty_faced
  penalty_won · poss_lost_all · poss_lost_ctrl · poss_won_att_3rd · poss_won_def_3rd · poss_won_mid_3rd
  possession_percentage · ppda · progressive_carries · pts_gained_losing_pos · punches · put_through
  rightside_pass · saved_ibox · saved_obox · saves · shield_ball_oop · shot_created
  shot_fastbreak · shot_off_target · six_yard_block · subs_made · successful_final_third_entries · successful_final_third_entries_open_play
  successful_final_third_passes · successful_open_play_pass · successful_pen_area_entries · successful_pen_area_entries_open_play · successful_put_through · total_att_assist
  total_back_zone_pass · total_chipped_pass · total_clearance · total_contest · total_corners_intobox · total_cross
  total_cross_nocorner · total_fastbreak · total_final_third_passes · total_flick_on · total_fwd_zone_pass · total_high_claim
  total_keeper_sweeper · total_launches · total_layoffs · total_long_balls · total_offside · total_pass
  total_pull_back · total_scoring_att · total_tackle · total_through_ball · total_throws · total_yel_card
  touches · touches_in_final_third · touches_in_opp_box · unsuccessful_touch · wins · won_contest
  won_corners · won_tackle

### Per player, per season — 116

  accurate_back_zone_pass · accurate_flick_on · accurate_fwd_zone_pass · accurate_layoffs · accurate_long_balls · accurate_pass
  aerial_lost · aerial_won · appearances · att_assist_openplay · att_bx_centre · att_bx_left
  att_bx_right · att_corner · att_goal_high_right · att_goal_low_centre · att_hd_target · att_hd_total
  att_ibox_blocked · att_ibox_goal · att_ibox_miss · att_ibox_target · att_lf_goal · att_lf_total
  att_miss_high · att_miss_left · att_openplay · att_rf_goal · att_rf_total · att_sv_high_left
  att_sv_low_centre · attempts_conceded_ibox · attempts_conceded_obox · attempts_ibox · backward_pass · ball_recovery
  big_chance_missed · big_chance_scored · blocked_pass · blocked_scoring_att · carries · dispossessed
  draws · duel_lost · duel_won · effective_clearance · effective_head_clearance · error_lead_to_shot
  final_third_entries · final_third_entries_open_play · fouled_final_third · fouls · fwd_pass · game_started
  goals · goals_conceded · goals_conceded_ibox · goals_conceded_obox · goals_openplay · head_clearance
  head_pass · leftside_pass · long_pass_own_to_opp · mins_played · offtarget_att_assist · ontarget_att_assist
  ontarget_scoring_att · open_play_pass · outfielder_block · passes_left · passes_right · pen_area_entries
  pen_area_entries_open_play · pen_goals_conceded · poss_lost_all · poss_lost_ctrl · poss_won_att_3rd · poss_won_mid_3rd
  progressive_carries · put_through · rightside_pass · shot_created · shot_off_target · six_yard_block
  successful_final_third_entries · successful_final_third_entries_open_play · successful_final_third_passes · successful_open_play_pass · successful_pen_area_entries · successful_pen_area_entries_open_play
  successful_put_through · times_tackled · total_att_assist · total_back_zone_pass · total_clearance · total_contest
  total_final_third_passes · total_flick_on · total_fwd_zone_pass · total_layoffs · total_long_balls · total_offside
  total_pass · total_scoring_att · total_sub_off · total_tackle · touches · touches_in_final_third
  touches_in_opp_box · turnover · unsuccessful_touch · was_fouled · winning_goal · wins
  won_contest · won_corners
