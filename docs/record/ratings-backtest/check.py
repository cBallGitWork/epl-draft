"""Quick read of a backtest run: spread, agreement, anchors, stars, ladder."""
import json
from pathlib import Path

import pandas as pd

pd.set_option("display.width", 220)
d = pd.DataFrame(json.loads((Path(__file__).parent / "ratings-25-26.json").read_text()))
r = d[d.rating.notna()].copy()
r["consensus"] = r[["fotmobRating", "sofascoreRating"]].astype(float).replace(0, float("nan")).mean(axis=1)
full = r[r.minutes >= 60]
print("rated", len(r), "| 60+ median by pos", full.groupby("pos").rating.median().round(2).to_dict(),
      "| consensus median", full.groupby("pos").consensus.median().round(2).to_dict())
print("share >=9:", full.groupby("pos").rating.apply(lambda s: round((s >= 9).mean() * 100, 2)).to_dict(),
      "| count 10.0:", int((r.rating >= 10).sum()), "| >=9.5:", int((r.rating >= 9.5).sum()))
print("corr with consensus", round(r.rating.corr(r.consensus), 3), "fotmob", round(r.rating.corr(r.fotmobRating), 3),
      "sofa", round(r.rating.corr(r.sofascoreRating), 3), "fpl pts", round(r.rating.corr(r.fplPoints), 3))
print("bands", r.rating.round().value_counts().sort_index().to_dict())
cols = ["name", "pos", "club", "opp", "gw", "minutes", "goals", "assists", "rating", "blended", "vsExpected", "consensus", "fplPoints"]
print("\nanchors\n", r[((r.name == "J.Timber") & (r.gw == 2)) | ((r.name == "B.Fernandes") & (r.gw == 15))][cols].round(2).to_string(index=False))
print("\ntop 15\n", r.sort_values("raw", ascending=False)[cols].head(15).round(2).to_string(index=False))
print("\nbottom 10\n", r.sort_values("raw")[cols + ["redCards", "ownGoals", "penaltiesMissed", "errorsLeadingToGoal"]].head(10).round(2).to_string(index=False))
STARS = ["Haaland", "M.Salah", "Palmer", "Saka", "B.Fernandes", "Rice", "Virgil", "Gabriel", "Raya", "Isak", "Semenyo", "Mbeumo", "Watkins", "Wood"]
season = r.groupby(["name", "pos", "club"]).agg(apps=("rating", "size"), mins=("minutes", "sum"), avg=("rating", "mean"),
                                                 blend=("blended", "mean"), vs=("vsExpected", "sum"), goals=("goals", "sum"),
                                                 cons=("consensus", "mean")).reset_index()
season = season[season.mins >= 900]
season["rank"] = season.avg.rank(ascending=False).astype(int)
print("\nstars\n", season[season.name.isin(STARS)].sort_values("avg", ascending=False).round(2).to_string(index=False))
print("\nbest averages\n", season.sort_values("avg", ascending=False).head(12).round(2).to_string(index=False))
print("\nbest vs expected\n", season.sort_values("vs", ascending=False).head(8).round(2).to_string(index=False))
print("\nworst vs expected\n", season.sort_values("vs").head(8).round(2).to_string(index=False))
