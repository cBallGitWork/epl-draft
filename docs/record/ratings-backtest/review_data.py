"""Everything the review page shows, from ratings-25-26.json. Every example is a real match."""
import json
from pathlib import Path

import pandas as pd

HERE = Path(__file__).parent
d = pd.DataFrame(json.loads((HERE / "ratings-25-26.json").read_text()))
r = d[d.rating.notna()].copy()
r["consensus"] = r[["fotmobRating", "sofascoreRating"]].astype(float).replace(0, float("nan")).mean(axis=1)
r["npxg"] = (r.xg.fillna(0) - r.penXg.fillna(0)).clip(lower=0)
parts = pd.json_normalize(r.parts).set_index(r.index)
r = r.join(parts.add_prefix("p_"))

# Each club's strength as an opponent, averaged over the season on the new reading.
opp = r.groupby("opp").agg(att=("oppAttack", "mean"), dfn=("oppDefence", "mean"))
opp["overall"] = opp.att + opp.dfn
TOP_ATTACK = set(opp.att.nlargest(4).index)
TOP_DEFENCE = set(opp.dfn.nlargest(4).index)
WORST = set(opp.overall.nsmallest(3).index)
WORST_ATTACK = set(opp.att.nsmallest(4).index)
BOTTOM_HALF = set(opp.overall.nsmallest(10).index)
PROMOTED = {"LEE", "BUR", "SUN"}

LINE = ["goals", "assists", "penaltyGoals", "goalsOutsideBox", "xg", "xa", "shots", "shotsOnTarget", "keyPasses",
        "bigChancesCreated", "bigChancesMissed", "penaltiesMissed", "penaltiesWon", "clearancesOffLine",
        "cleanSheet", "goalsAgainstOnPitch", "fplSaves", "goalsPrevented", "penaltySaves", "yellowCards",
        "redCards", "ownGoals", "errorsLeadingToGoal", "errorsLeadingToShot", "penaltiesConceded", "dispossessed"]
PARTS = ["points", "opponent", "mistakes", "extras"]


def clean(v):
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return None
    return round(float(v), 2)


def card(row, note=""):
    line = {k: clean(row[k]) for k in LINE if clean(row[k])}
    return {
        "name": row["name"], "pos": row.pos, "club": row.club, "opp": row.opp, "home": bool(row.home),
        "gw": int(row.gw), "minutes": int(row.minutes), "subOn": clean(row.subOn), "score": row.score,
        "rating": row.rating, "underlying": clean(row.underlying), "pts": clean(row.pts),
        "adjusted": clean(row.adjusted), "vsExpected": clean(row.vsExpected), "source": row.pointsSource,
        "fotmob": clean(row.fotmobRating), "sofascore": clean(row.sofascoreRating),
        "oppAttack": clean(row.oppAttack), "oppDefence": clean(row.oppDefence),
        "line": line, "parts": {p: clean(row["p_" + p]) for p in PARTS}, "note": note,
    }


def best(frame, by, asc=False):
    return frame.sort_values(by, ascending=asc).iloc[0] if len(frame) else None


# ---- the ladder: three per whole mark, spread across positions, nearest the mark
ladder = []
for band in range(10, 0, -1):
    pool = r[(r.rating.round() == band) & (r.minutes >= 20)].copy()
    pool["dist"] = (pool.rating - band).abs()
    picks, seen = [], set()
    for _, row in pool.sort_values(["dist", "minutes"], ascending=[True, False]).iterrows():
        if row.pos in seen and len(pool.pos.unique()) > len(seen):
            continue
        picks.append(card(row)); seen.add(row.pos)
        if len(picks) == 3:
            break
    ladder.append({"band": band, "count": int((r.rating.round() == band).sum()), "examples": picks})

# ---- kinds of match
kinds = []
def kind(title, question, cards, verdict):
    cards = [c for c in cards if c]
    kinds.append({"title": title, "question": question, "cards": cards, "verdict": verdict(cards) if cards else ""})

m = lambda c: f'{c["rating"]:.1f}'
u = lambda c: f'{c["underlying"]:.1f}' if c["underlying"] is not None else "—"
attackers = r[r.pos.isin(["MID", "FWD"]) & (r.minutes >= 80)]
blank = (attackers.goals == 0) & (attackers.assists == 0)
busy = attackers[blank].sort_values("underlyingPoints", ascending=False)
quiet = attackers[blank & (attackers.pts == busy.iloc[0].pts)].sort_values("underlyingPoints")
kind("Two blanks: one unlucky, one anonymous",
     "Same points, same rating. Underlying should tell the busy blank from the anonymous one.",
     [card(busy.iloc[0], "The season's biggest underlying in a blank"), card(quiet.iloc[0], "Same points, nothing happening")],
     lambda c: f"Both rate {m(c[0])}. Underlying is {u(c[0])} against {u(c[1])}: the first will come good if he keeps getting those chances.")

lucky = attackers[(attackers.goals == 1) & (attackers.assists == 0) & (attackers.penaltyGoals == 0)].sort_values("xg")
kind("A lucky goal",
     "The rating pays the goal; Underlying should say there was little behind it.",
     [card(lucky.iloc[0], "One goal from the season's smallest xG")],
     lambda c: f"Rated {m(c[0])} for the goal, Underlying {u(c[0])}: one shot, almost no chance, and no sign it repeats.")

star_blank = attackers[attackers.club.isin(TOP_ATTACK) & attackers.opp.isin(WORST) & blank]
star_score = attackers[attackers.club.isin(TOP_ATTACK) & attackers.opp.isin(WORST) & (attackers.goals == 1) & (attackers.assists == 0) & (attackers.penaltyGoals == 0)]
hb, hs = star_blank[star_blank.name == "Haaland"], star_score[star_score.name == "Haaland"]
weak_scorer = attackers[attackers.club.isin(WORST_ATTACK) & attackers.opp.isin(TOP_DEFENCE) & (attackers.goals == 1) & (attackers.penaltyGoals == 0) & (attackers.assists == 0)]
kind("The best attack against one of the worst teams",
     "A star blanking against the bottom side, his goal against them, and a bottom side's goal against the best defence.",
     [card(best(hb if len(hb) else star_blank, "xg"), "A blank against a bottom-three side"),
      card(best(hs if len(hs) else star_score, "oppDefence", asc=True), "One goal against the weakest defence"),
      card(best(weak_scorer, "oppDefence"), "A weak attack's goal against the strongest defence")],
     lambda c: f"The blank is {m(c[0])}. The goal against the weakest defence is marked down to {m(c[1])}; the weak side's goal against the best defence is worth {m(c[2])}.")

defs = r[(r.pos == "DEF") & (r.minutes >= 90) & (r.cleanSheet == 1)]
kind("A clean sheet, weighed by the attack it kept out",
     "A bottom-half side shutting out a top-four attack should beat a top side shutting out the bottom three.",
     [card(best(defs[defs.club.isin(BOTTOM_HALF) & defs.opp.isin(TOP_ATTACK)], "oppAttack"), "Bottom-half defender against a top-four attack"),
      card(best(defs[defs.club.isin(TOP_DEFENCE) & defs.opp.isin(WORST)], "oppAttack", asc=True), "Top side's defender against a bottom-three attack")],
     lambda c: f"{m(c[0])} against {m(c[1])} for the same clean sheet.")

kind("Being terrible",
     "Big chances missed and errors should sink a man, whatever else he did.",
     [card(best(r[r.goals == 0], "bigChancesMissed"), "Most big chances missed without scoring"),
      card(best(r[(r.penaltiesMissed >= 1) & (r.goals == 0)], "xg"), "A missed penalty and no goal"),
      card(best(r[r.errorsLeadingToGoal >= 1], "adjusted", asc=True), "The worst error-led day")],
     lambda c: f"{m(c[0])}, {m(c[1])} and {m(c[2])}. Each big chance missed costs a point before the table, each error leading to a goal two.")

late = r[(r.subOn >= 75) & (r.goals >= 1)]
kind("The late substitute who scored",
     "A goal off the bench rates well, but his minutes point is one, not two.",
     [card(best(late, "subOn"), "The latest scoring substitute")],
     lambda c: f"{m(c[0])}: the league gives a short appearance one point, and the mark follows the points.")

gk = r[(r.pos == "GK") & (r.goalsAgainstOnPitch >= 3)]
kind("The keeper who let in three",
     "Conceding three but stopping far more should not sink him.",
     [card(best(gk, "goalsPrevented"), "Most goals prevented in a match he conceded three"), card(best(gk, "adjusted", asc=True), "Worst")],
     lambda c: f"{m(c[0])} for the keeper who saved his side from worse, {m(c[1])} for the worst.")

outside = r[(r.goalsOutsideBox >= 1) & (r.goals == 1) & (r.assists == 0) & (r.minutes >= 80)]
kind("A goal from outside the box",
     "Worth a point more than a tap-in.",
     [card(best(outside, "xg", asc=True), "The lowest-xG long-range goal")],
     lambda c: f"{m(c[0])}: the goal's points plus one for the distance.")

# ---- seasons
season = r.groupby(["name", "pos", "club"]).agg(
    apps=("rating", "size"), mins=("minutes", "sum"), avg=("rating", "mean"), und=("underlying", "mean"),
    pts=("pts", "mean"), vs=("vsExpected", "sum"), goals=("goals", "sum"), assists=("assists", "sum"),
    tens=("rating", lambda s: int((s >= 9.95).sum()))).reset_index()
season = season[season.mins >= 900].copy()
season["rank"] = season.avg.rank(ascending=False, method="min").astype(int)
season["urank"] = season.und.rank(ascending=False, method="min").astype(int)
season["gap"] = season.und - season.avg
STARS = ["Haaland", "B.Fernandes", "Saka", "Rice", "Gabriel", "Virgil", "M.Salah", "Palmer", "Raya", "Semenyo",
         "Mbeumo", "Watkins", "João Pedro", "Bruno G.", "Wood", "Isak", "Cunha", "Wirtz", "Ekitiké", "Gyökeres"]
rnd = lambda f: json.loads(f.round(2).to_json(orient="records"))
stars = rnd(season[season.name.isin(STARS)].sort_values("avg", ascending=False))
promoted = rnd(season[season.club.isin(PROMOTED) & season.pos.isin(["FWD", "MID"])].sort_values("vs", ascending=False).head(6))
by_pos = {p: rnd(season[season.pos == p].sort_values("avg", ascending=False).head(6)) for p in ["GK", "DEF", "MID", "FWD"]}
due = rnd(season[season.pos.isin(["MID", "FWD"])].sort_values("gap", ascending=False).head(8))
best_vs = rnd(season.sort_values("vs", ascending=False).head(6))
worst_vs = rnd(season.sort_values("vs").head(6))

# ---- strength: the sister model against the new reading against what happened
res = json.loads((HERE / "club-results-25-26.json").read_text())
cr = pd.DataFrame(res).groupby("club").agg(gf=("goalsFor", "mean"), ga=("goalsAgainst", "mean"))
old = d.dropna(subset=["ownAttack"]).groupby("club").agg(oldAtt=("ownAttack", "mean"), oldDef=("ownDefence", "mean"))
strength = cr.join(old).join(opp[["att", "dfn"]]).round(2).sort_values("gf", ascending=False).reset_index()
strength_corr = {"old": {"attack": round(float(strength.oldAtt.corr(strength.gf)), 2), "defence": round(float(strength.oldDef.corr(-strength.ga)), 2)},
                 "new": {"attack": round(float(strength.att.corr(strength.gf)), 2), "defence": round(float(strength.dfn.corr(-strength.ga)), 2)}}

full = r[r.minutes >= 60]
spread = {p: {"median": round(float(g.rating.median()), 2), "underlying": round(float(g.underlying.median()), 2),
              "p90": round(float(g.rating.quantile(.9)), 2), "nines": int((g.rating >= 9).sum()),
              "tens": int((g.rating >= 9.95).sum()), "ones": int((g.rating <= 1.05).sum()), "n": len(g)}
          for p, g in full.groupby("pos")}
bands = {int(k): int(v) for k, v in r.rating.round().value_counts().sort_index().items()}
agreement = {"points": round(float(r.rating.corr(r.pts)), 3), "consensus": round(float(r.rating.corr(r.consensus)), 3)}
top = [card(x) for _, x in r.sort_values("adjusted", ascending=False).head(20).iterrows()]
bottom = [card(x) for _, x in r.sort_values("adjusted").head(12).iterrows()]
sources = d[d.rating.notna()].pointsSource.value_counts().to_dict()

out = {"rated": len(r), "matches": len(d), "ladder": ladder, "kinds": kinds, "stars": stars, "promoted": promoted,
       "byPos": by_pos, "due": due, "bestVs": best_vs, "worstVs": worst_vs, "spread": spread, "bands": bands,
       "agreement": agreement, "tensAll": int((r.rating >= 9.95).sum()), "onesAll": int((r.rating <= 1.05).sum()), "top": top, "bottom": bottom, "sources": sources,
       "strength": rnd(strength), "strengthCorr": strength_corr,
       "underlyingFit": json.loads((HERE / "underlying-fit.json").read_text())}
(HERE / "review.json").write_text(json.dumps(out, default=lambda o: None if pd.isna(o) else o))
print("ladder", [(b["band"], b["count"], len(b["examples"])) for b in ladder])
print("strength corr", strength_corr, "sources", sources)
for k in kinds:
    print(" ", k["title"][:40], "|", k["verdict"])
