---
name: rehearsal-saturday
description: The matchday measurement protocol — watch a live round with the instruments running and write down what the feeds actually do, before any cadence or polling number is changed. Run on a Saturday with football on; it gates the cadence work.
argument-hint: "[gameweek]"
disable-model-invocation: true
---

# Rehearsal Saturday — measure first

The cadence change (`PAGE_REVALIDATE` 30→15 and the route literals) is **gated on
a measured Saturday**. Nothing in the test suite can tell you what a live round
does to these feeds, and every number in the polling design is currently an
inference from two rounds nobody was watching closely.

**Measure, do not change.** No commit today except the observations.

## 1. Before the first kickoff

```bash
.claude/hooks/repo_clock.sh --print
curl -s 'https://fantasy.premierleague.com/api/event/<gw>/live/' | jq '.elements | length'
```

`{"elements": []}` before the round's first kickoff is normal and not an error.
Record that it was empty, and when.

## 2. The flip order — sample the three together

This is the observation that has been missed twice, and it is only available
while a round settles. The question is whether the `bonus-settling` rung is
reachable at all, and it needs **all three sampled at the same moment**, on a
loop, from about an hour after the last whistle:

```bash
curl -s 'https://fantasy.premierleague.com/api/event-status/'          # bonus_added, points
curl -s 'https://fantasy.premierleague.com/api/fixtures/?event=<gw>'   # started/finished/finished_provisional
curl -s 'https://fantasy.premierleague.com/api/bootstrap-static/' | jq '.events[] | select(.id==<gw>) | .data_checked'
```

**Timestamps are data.** Record the wall-clock of every sample, not just its
value; the finding is the ORDER the three flip in, and an unstamped sample cannot
contribute to it.

And the trap: the live feed publishes *provisional* bonus long before
`bonus_added` turns, and provisional bonus is by construction the current BPS
order — so **agreement with BPS is not evidence a bonus is final**.

## 3. What the app does while it happens

With the round live:

- `/matchday` and `/matchday/desk` at 390 and at 1440 — shoot and **read** them.
- Time the shared Fantrax read: the hot path must stay ONE read per window for
  all sixteen phones, not one per phone.
- Watch a score change and note how long it took to appear.
- `getMatchups` beside our own engine: Fantrax computes live H2H itself and
  **their numbers are authoritative** — ours is a fallback proxy. Where they
  disagree, record both, and check ours is labelled and not in a column headed
  `FPts`.
- The lineup gate at the lock, if the round crosses one.

## 4. Write it down before deciding anything

Append to `PLATFORM_NOTES.md`: every sample with its timestamp, the flip order,
the observed lag, the read count. Then, and only in a later commit, the cadence
change — `PAGE_REVALIDATE` plus the route literals **in one commit**, kept or
reverted **as one commit**.

## Report

```
gameweek    <n>   first kickoff <utc>   last whistle <utc>
live feed   empty until <utc> · <n> elements after · <n> on zero minutes
flip order  <which of event-status / fixtures / data_checked turned first, with times>
app         score change visible after <n>s · shared reads <n> per window
matchups    fantrax <x> vs ours <y> · labelled <yes|no>
recorded    PLATFORM_NOTES.md <section>
verdict     cadence change: <justified|not justified|still unmeasured> — and why
```

`still unmeasured` is a legitimate outcome. A Saturday where the round settled
before anyone sampled it proves nothing, and saying so beats inventing a number.
