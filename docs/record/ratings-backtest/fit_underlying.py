"""Which of one match's stats best predict a man's league points over his next five? Fits Underlying's weights."""
import json
from pathlib import Path

import numpy as np
import pandas as pd

HERE = Path(__file__).parent
d = pd.DataFrame(json.loads((HERE / "ratings-input-pts-25-26.json").read_text()))
d = d[d.nextPoints.notna() & (d.minutes >= 30)].copy()
d["pts"] = d.points.map(lambda p: p["total"])
d["npxg"] = (d.xg.fillna(0) - d.penXg.fillna(0)).clip(lower=0)
d["dfp"] = d[["tacklesWon", "interceptions", "blocks"]].fillna(0).sum(axis=1)
d["dfp3"] = d.dfp + d[["clearances", "recoveries"]].fillna(0).sum(axis=1)
FEATURES = {
    "attack": ["shots", "shotsOnTarget", "touchesOppBox", "npxg", "xa", "keyPasses", "bigChancesCreated",
               "bigChancesMissed", "penaltiesWon", "penaltiesTaken"],
    "defence": ["dfp", "dfp3"],
    "keeping": ["fplSaves", "goalsPrevented"],
}
ALL = [f for fs in FEATURES.values() for f in fs]
for c in ALL:
    d[c] = pd.to_numeric(d[c], errors="coerce").fillna(0.0)
# Per ninety, so a man's rate is read rather than his minutes; minutes go in on their own.
for c in ALL:
    d[c + "_p90"] = d[c] / d.minutes * 90
d["full"] = (d.minutes >= 60).astype(float)


def ridge(X, y, lam=20.0):
    X1 = np.column_stack([np.ones(len(X)), X])
    I = np.eye(X1.shape[1]); I[0, 0] = 0
    return np.linalg.solve(X1.T @ X1 + lam * I, X1.T @ y)


out = {}
for pos, g in d.groupby("pos"):
    cols = ["full"] + [c + "_p90" for c in (FEATURES["keeping"] if pos == "GK" else FEATURES["attack"] + FEATURES["defence"])]
    # Fit on the first half of the season, judge on the second, so the score is earned out of sample.
    train, test = g[g.gw <= 19], g[g.gw > 19]
    b = ridge(train[cols].values, train.nextPoints.values)
    pred = np.column_stack([np.ones(len(test)), test[cols].values]) @ b
    r_pred = np.corrcoef(pred, test.nextPoints)[0, 1]
    r_pts = np.corrcoef(test.pts, test.nextPoints)[0, 1]
    b_all = ridge(g[cols].values, g.nextPoints.values)
    coef = dict(zip(["intercept"] + cols, np.round(b_all, 3)))
    out[pos] = {"n": len(g), "rUnderlying": round(r_pred, 3), "rPointsToday": round(r_pts, 3), "coef": coef}
    print(f"{pos}: n={len(g)}  next-5 correlation, second half: underlying {r_pred:.3f}  vs today's points {r_pts:.3f}")
    print("   ", {k: v for k, v in coef.items()})
(HERE / "underlying-fit.json").write_text(json.dumps(out, default=float))
