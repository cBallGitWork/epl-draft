"""Which stats explain the FotMob/SofaScore consensus once returns are counted? Scratch analysis."""
import json
from pathlib import Path

import numpy as np
import pandas as pd

d = pd.DataFrame(json.loads((Path(__file__).parent / "ratings-input-25-26.json").read_text()))
d = d[d.minutes >= 20].copy()
d["consensus"] = d[["fotmobRating", "sofascoreRating"]].mean(axis=1, skipna=True)
d = d[d.consensus.notna() & (d.sofascoreRating > 0)]
d["npxg"] = (d.xg - d.penXg).clip(lower=0)
d["openGoals"] = d.goals - d.penaltyGoals
d["m90"] = d.minutes / 90

BASE = ["openGoals", "penaltyGoals", "assists", "cleanSheet", "goalsAgainstOnPitch", "m90"]
CANDIDATES = [
    "npxg", "xa", "xgot", "shots", "shotsOnTarget", "keyPasses", "chancesCreated", "bigChancesCreated",
    "bigChancesMissed", "penaltiesMissed", "penaltiesWon", "goalsOutsideBox", "shotsOffPost",
    "touchesOppBox", "finalThirdPasses", "accuratePasses", "contestsWon", "contestsAttempted",
    "duelsWon", "duelsLost", "aerialsWon", "tacklesWon", "interceptions", "clearances", "blocks",
    "clearancesOffLine", "recoveries", "dispossessed", "turnovers", "foulsCommitted", "foulsSuffered",
    "errorsLeadingToShot", "errorsLeadingToGoal", "penaltiesConceded", "ownGoals", "yellowCards", "redCards",
    "crosses", "accurateCrosses", "offsides", "saves", "goalsPrevented", "penaltySaves", "defcon",
]
for c in BASE + CANDIDATES:
    d[c] = pd.to_numeric(d[c], errors="coerce").fillna(0.0)


def fit(X, y, lam=1.0):
    X1 = np.column_stack([np.ones(len(X)), X])
    I = np.eye(X1.shape[1]); I[0, 0] = 0
    b = np.linalg.solve(X1.T @ X1 + lam * I, X1.T @ y)
    r = y - X1 @ b
    return b, 1 - r.var() / y.var()


out = {}
for pos, g in d.groupby("pos"):
    y = g.consensus.values
    _, r2_base = fit(g[BASE].values, y)
    rows = []
    for c in CANDIDATES:
        if g[c].abs().sum() == 0:
            continue
        b, r2 = fit(g[BASE + [c]].values, y)
        rows.append((c, round(r2 - r2_base, 4), round(b[-1], 3), int((g[c] != 0).sum())))
    rows.sort(key=lambda t: -t[1])
    # full model: every candidate at once, raw units (rating points per event)
    keep = [c for c, gain, _, n in rows if n >= 30]
    b, r2_full = fit(g[BASE + keep].values, y, lam=5.0)
    coef = dict(zip(["intercept"] + BASE + keep, np.round(b, 3)))
    out[pos] = {"n": len(g), "r2_base": round(r2_base, 3), "r2_full": round(r2_full, 3),
                "single_gain": rows[:25], "full_coef": coef}
    print(f"\n=== {pos} n={len(g)} base R2={r2_base:.3f} full R2={r2_full:.3f}")
    for c, gain, beta, n in rows[:22]:
        print(f"  {c:22s} +R2 {gain:.4f}  beta {beta:+.3f}  nonzero {n}")
    print("  full:", {k: v for k, v in coef.items()})
(Path(__file__).parent / "discover.json").write_text(json.dumps(out, default=float))
