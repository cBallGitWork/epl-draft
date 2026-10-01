p='docs/record/PLATFORM_NOTES.md'; s=open(p).read()
entry='''## Our player rating is a football-layer mark, tuned on 25/26 and awaiting Craig's review — decided 30 Sep 2026

- **What it is**: `football/rating/` rates one man's match out of ten: returns weighed by the opponent's as-of
  strength, then threat, defending, waste and discipline, each stat at so many points apiece in `weights.ts`.
  `vsExpected` sets his returns against the projection's for that fixture. Nothing reads it on screen yet.
- **Counted on 25/26**: 11,492 played matches, 10,521 rated (a cameo under 10 minutes needs a return). Median
  6.5 at every position, 14 tens; correlation 0.89 with the FotMob/SofaScore average and 0.88 with FPL points.
- **Inputs are the stats league's**: the SofaScore counts used for 25/26 matched the dummy league's Opta
  columns exactly on 22 of 22 stats for GW1 (217 men) and GW20 (208), via `SEASON_925_BY_DATE` over each
  gameweek's dates. xG and xA are FPL's; assists are FPL's (A+AF), which the projections predict.
- **Weights came from a ridge fit on the FotMob/SofaScore average, then a draft tilt** (returns, opponent,
  big chances missed, cards). Stats with no live source this season were left out (successful dribbles).
- **Open until Craig answers**: the blend, penalty against busy blank, the opponent clamp, red weight, keepers.

'''
anchor="## A player's fixture run"
i=s.index(anchor); s=s[:i]+entry+s[i:]
open(p,'w').write(s)
p='packages/core/src/football/rating/weights.ts'; s=open(p).read()
s=s.replace('(PLATFORM_NOTES, "Our player rating").','(PLATFORM_NOTES, "Our player rating is…").')
open(p,'w').write(s)
