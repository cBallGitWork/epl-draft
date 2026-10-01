# 25/26 ratings backtest

The scripts and outputs behind `packages/core/src/join/rating/`. Run from a scratch folder beside a worktree named `ratings` (the imports say `../ratings/…`); Python runs with `~/ai-carling-premiership/.venv/bin/python` from that repo's root.

1. `extract_25_26.py`: the sister repo's 25/26 match lines → `ratings-input-25-26.json` (18 MB, not committed).
2. `fetch-points.mts`: the real league's Fantrax points per matchday → `points-cache/` (228 reads, not committed). `dump-rules.mts` and `dump-raw-rules.mts` write the league's scoring rules.
3. `join_points.py`: points onto each match; men Fantrax no longer lists are priced by the league's own rules. `strength-check.mts` writes `club-results-25-26.json`.
4. `fit_underlying.py`, `discover.py`: what predicts the next five matches, and what the websites reward.
5. `run-ratings.mts` → `ratings-25-26.json` (not committed); `review_data.py` → `review.json`; `build_page.py` → `draft-ratings.html`, published as the review page.
