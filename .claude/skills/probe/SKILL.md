---
name: probe
description: Settle what a provider field actually contains before anything is designed on top of it — the denominator, the non-null count, the range, and both leagues. Use before relying on any Fantrax or FPL field, and whenever a doc quotes a population number.
argument-hint: "[field] [--live|--snapshot] [--league real|rehearsal|both]"
---

# What is actually in that field

Two designs died on unprobed fields in one day. A shirt-number fallback was built
on `squad_number`, which bootstrap carries as a **key on every element and null as
a value on all of them** — the docs had listed it among the fields bootstrap
carries, and a field that is always null is not a field.

The answer to "does the API have X" is never yes or no. It is a fraction.

## 1. Count the denominator AND the non-nulls

Never `.some(x => x.field)`. Never a spot check on three players.

```bash
# --snapshot: today's capture on disk. Fast, offline, and the same bytes twice.
jq '[.[] | .field] | {n: length, present: map(select(. != null)) | length}' \
  data/snapshots/fantrax/<league>/<date>/<file>.json

# --live: the endpoint now. Use when the question is whether it CHANGED.
curl -s 'https://www.fantrax.com/fxea/general/getPlayerIds?sport=EPL' | \
  jq '{n: length, present: [.[] | select(.rotowireId != null)] | length}'
```

Report it as `PRESENT (544/699)`, `ALWAYS-NULL (0/622)`, or `MISREAD-RISK` — the
last when the field is populated but means something other than it appears to.

## 2. Check the range, not just the presence

A populated field can still be misread. `winPercentage` is a **0..1 fraction**;
rendering it as a percentage without multiplying is a number that looks right on
every row and is wrong on all of them. Print min and max.

## 3. Both leagues, always

**Field presence varies between leagues, not only between states.** On one day
the real league's `getLeagueInfo` carried `draftType` and `leagueHistoryId` and
the rehearsal league's carried neither. A field probed in one league is a fact
about that league.

The real league is pre-draft until 10 Oct and refuses `getTeamRosters` with
`NO_TEAMS`, which is a true answer about the league and not a failure.

## 4. Count, do not quote

Every population figure in `CLAUDE.md` and `PLATFORM_NOTES.md` was true the day it
was written and has moved since — the element count tracks the transfer window,
the pool was 759 in early August and 671 three weeks later. **Read the length.**
If a doc quotes a number your probe contradicts, that is a finding: fix the doc in
the same commit.

## 5. Record it

A probe nobody wrote down gets run again. Append to `PLATFORM_NOTES.md` under the
verified-facts section: the field, the fraction, the range, the date, both
leagues, and the endpoint. Date it — the number is a measurement, not a constant.

## Report

```
<field>   PRESENT (n/N) | ALWAYS-NULL (0/N) | MISREAD-RISK: <what it really is>
range     <min>..<max>   units: <fraction|percent|count>
real      <n/N>          rehearsal <n/N>
source    <endpoint or snapshot path>   as of <date>
recorded  PLATFORM_NOTES.md <section>
```

For a field on a rendered page rather than in a payload, measure it in the page:
`node tools/ui/probe.mjs <route> '<expression>'`. Never the CSS that was written.
