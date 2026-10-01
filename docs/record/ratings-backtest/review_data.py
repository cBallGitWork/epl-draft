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

# Season strength per club: mean of its own as-of ratings across its matches.
clubs = r.groupby("club").agg(att=("ownAttack", "mean"), dfn=("ownDefence", "mean"))
clubs["overall"] = clubs.att + clubs.dfn
TOP_ATTACK = set(clubs.att.nlargest(4).index)
TOP_DEFENCE = set(clubs.dfn.nlargest(4).index)
WORST = set(clubs.overall.nsmallest(3).index)
WORST_ATTACK = set(clubs.att.nsmallest(4).index)
BOTTOM_HALF = set(clubs.overall.nsmallest(10).index)
PROMOTED = {"LEE", "BUR", "SUN"}

LINE = ["goals", "assists", "penaltyGoals", "goalsOutsideBox", "npxg", "xa", "shotsOnTarget", "keyPasses",
        "bigChancesCreated", "bigChancesMissed", "penaltiesMissed", "penaltiesWon", "duelsWon", "duelsLost",
        "tacklesWon", "interceptions", "clearances", "blocks", "recoveries", "clearancesOffLine", "cleanSheet",
        "goalsAgainstOnPitch", "saves", "fplSaves", "goalsPrevented", "penaltySaves", "yellowCards", "redCards",
        "ownGoals", "errorsLeadingToGoal", "errorsLeadingToShot", "penaltiesConceded", "accuratePasses", "dispossessed"]
PARTS = ["minutes", "returns", "keeping", "attacking", "waste", "defending", "passing", "discipline"]


def card(row, note=""):
    def clean(v):
        if v is None or (isinstance(v, float) and pd.isna(v)):
            return None
        return round(float(v), 2)
    line = {k: clean(row[k]) for k in LINE if clean(row[k])}
    return {
        "name": row["name"], "pos": row.pos, "club": row.club, "opp": row.opp, "home": bool(row.home),
        "gw": int(row.gw), "minutes": int(row.minutes), "started": bool(row.started),
        "subOn": clean(row.subOn), "score": row.score,
        "rating": row.rating, "blended": row.blended, "vsExpected": clean(row.vsExpected),
        "raw": clean(row.raw), "consensus": clean(row.consensus), "fotmob": clean(row.fotmobRating),
        "sofascore": clean(row.sofascoreRating), "fplPoints": clean(row.fplPoints),
        "oppAttack": clean(row.oppAttack), "oppDefence": clean(row.oppDefence),
        "line": line, "parts": {p: clean(row["p_" + p]) for p in PARTS}, "note": note,
    }


def best(frame, by, asc=False):
    return frame.sort_values(by, ascending=asc).iloc[0] if len(frame) else None


# ---- the ladder: three per whole mark, spread across positions, nearest the mark
ladder = []
for band in range(10, 1, -1):
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
def kind(title, question, cards, verdict=""):
    kinds.append({"title": title, "question": question, "cards": [c for c in cards if c], "verdict": verdict})

attackers = r[r.pos.isin(["MID", "FWD"]) & (r.minutes >= 80)]
star_blank = attackers[attackers.club.isin(TOP_ATTACK) & attackers.opp.isin(WORST) & (attackers.goals == 0) & (attackers.assists == 0)]
star_score = attackers[attackers.club.isin(TOP_ATTACK) & attackers.opp.isin(WORST) & (attackers.goals == 1) & (attackers.assists == 0) & (attackers.penaltyGoals == 0)]
h_blank = star_blank[star_blank.name == "Haaland"]
kind("The best attack against one of the worst teams",
     "A star blanking against the bottom side should land around 6; his goal against them should count for less.",
     [card(best(h_blank if len(h_blank) else star_blank, "npxg"), "Blank, the most xG he had without a return"),
      card(best(star_blank, "raw", asc=True), "The worst blank by a top-four attacker against the bottom three"),
      card(best(star_score[star_score.name == "Haaland"] if (star_score.name == "Haaland").any() else star_score, "oppDefence", asc=True), "One goal against the weakest defence")])

weak_scorer = attackers[attackers.club.isin(WORST_ATTACK) & attackers.opp.isin(TOP_DEFENCE) & (attackers.goals == 1) & (attackers.penaltyGoals == 0)]
kind("The worst attack scoring against the best defence",
     "The same single goal, but against a top-four defence: it should count for more.",
     [card(best(weak_scorer, "oppDefence"), "One goal against the strongest defence of the day"),
      card(best(star_score, "oppDefence", asc=True), "For comparison: one goal against the weakest")])

defs = r[r.pos.isin(["DEF", "GK"]) & (r.minutes >= 90) & (r.cleanSheet == 1)]
kind("A clean sheet, weighed by the attack it kept out",
     "A bottom-half side shutting out a top-four attack should beat a top side shutting out the bottom three.",
     [card(best(defs[defs.club.isin(BOTTOM_HALF) & defs.opp.isin(TOP_ATTACK) & (defs.pos == "DEF")], "oppAttack"), "Bottom-half defender against a top-four attack"),
      card(best(defs[defs.club.isin(TOP_DEFENCE) & defs.opp.isin(WORST) & (defs.pos == "DEF")], "oppAttack", asc=True), "Top side's defender against a bottom-three attack")])

kind("Lots of xG, nothing to show",
     "Craig's case: 1.5 xG from two penalties, both missed, is not a good day.",
     [card(best(r[(r.penaltiesMissed >= 1) & (r.goals == 0)], "xg"), "Missed penalty, no goal"),
      card(best(r[(r.goals == 0)], "bigChancesMissed"), "Most big chances missed without scoring")])

pen_only = r[(r.goals == 1) & (r.penaltyGoals == 1) & (r.assists == 0) & (r.minutes >= 80)]
busy_blank = r[(r.goals == 0) & (r.assists == 0) & (r.minutes >= 80) & r.pos.isin(["MID", "FWD"])]
kind("A quiet penalty against a busy blank",
     "Same fantasy points roughly apart, but one man did far more.",
     [card(best(pen_only, "p_attacking", asc=True), "A penalty and little else"),
      card(best(busy_blank, "p_attacking"), "No return, the busiest attacking blank of the season")])

late = r[(r.subOn >= 75) & (r.goals >= 1)]
kind("The late substitute who scored",
     "Ten minutes and a goal should rate well, but below a full ninety with the same goal.",
     [card(best(late, "subOn"), "The latest scoring substitute"),
      card(best(late, "raw"), "The best late-sub cameo")])

cb = r[(r.pos == "DEF") & (r.cleanSheet == 0) & (r.goals == 0) & (r.assists == 0) & (r.minutes >= 90)]
kind("A centre-back's big day without a clean sheet",
     "Blocks, clearances, duels and a clearance off the line should still earn a big mark.",
     [card(best(cb, "p_defending"), "The most defending in a match his side conceded in")])

gk = r[(r.pos == "GK") & (r.goalsAgainstOnPitch >= 3)]
kind("The keeper who let in three",
     "Conceding three but stopping far more should not sink him.",
     [card(best(gk, "p_keeping"), "Best keeping in a match he conceded three or more"),
      card(best(gk, "p_keeping", asc=True), "Worst")])

reds = r[(r.redCards >= 1) & ((r.goals + r.assists) >= 1)]
kind("A red card on an otherwise good day",
     "The red should cost him the day, not erase it.",
     [card(best(reds, "raw"), "Best mark with a red card"),
      card(best(r[(r.ownGoals >= 1) & (r.goals + r.assists >= 1)], "raw"), "Best mark with an own goal")])

outside = r[(r.goalsOutsideBox >= 1) & (r.goals == 1) & (r.assists == 0) & (r.minutes >= 80)]
kind("A goal from outside the box",
     "Worth a little more than a tap-in: +0.3 on top of the goal.",
     [card(best(outside, "xg", asc=True), "The lowest-xG screamer, one goal from outside the box")])

# ---- seasons
season = r.groupby(["name", "pos", "club"]).agg(
    apps=("rating", "size"), mins=("minutes", "sum"), avg=("rating", "mean"), blend=("blended", "mean"),
    vs=("vsExpected", "sum"), goals=("goals", "sum"), assists=("assists", "sum"), cons=("consensus", "mean"),
    tens=("rating", lambda s: int((s >= 9.95).sum()))).reset_index()
season = season[season.mins >= 900].copy()
season["rank"] = season.avg.rank(ascending=False, method="min").astype(int)
season["rankBlend"] = season.blend.rank(ascending=False, method="min").astype(int)
STARS = ["Haaland", "B.Fernandes", "Saka", "Rice", "Gabriel", "Virgil", "M.Salah", "Palmer", "Raya", "Semenyo",
         "Mbeumo", "Watkins", "João Pedro", "Bruno G.", "Wood", "Isak", "Ekitiké", "Gyökeres", "Cunha", "Wirtz"]
rnd = lambda f: json.loads(f.round(2).to_json(orient="records"))
stars = rnd(season[season.name.isin(STARS)].sort_values("avg", ascending=False))
promoted = rnd(season[season.club.isin(PROMOTED) & season.pos.isin(["FWD", "MID"])].sort_values("vs", ascending=False).head(6))
by_pos = {p: rnd(season[season.pos == p].sort_values("avg", ascending=False).head(6)) for p in ["GK", "DEF", "MID", "FWD"]}
best_vs = rnd(season.sort_values("vs", ascending=False).head(6))
worst_vs = rnd(season.sort_values("vs").head(6))

full = r[r.minutes >= 60]
spread = {p: {"median": round(float(g.rating.median()), 2), "p90": round(float(g.rating.quantile(.9)), 2),
              "nines": int((g.rating >= 9).sum()), "tens": int((g.rating >= 9.95).sum()), "n": len(g)}
          for p, g in full.groupby("pos")}
bands = {int(k): int(v) for k, v in r.rating.round().value_counts().sort_index().items()}
r["gap"] = r.rating - r.consensus
agreement = {"consensus": round(float(r.rating.corr(r.consensus)), 3), "fotmob": round(float(r.rating.corr(r.fotmobRating)), 3),
             "sofascore": round(float(r.rating.corr(r.sofascoreRating)), 3), "fplPoints": round(float(r.rating.corr(r.fplPoints)), 3)}
higher = [card(x) for _, x in r.sort_values("gap", ascending=False).head(5).iterrows()]
lower = [card(x) for _, x in r.sort_values("gap").head(5).iterrows()]
top = [card(x) for _, x in r.sort_values("raw", ascending=False).head(25).iterrows()]
bottom = [card(x) for _, x in r.sort_values("raw").head(15).iterrows()]

out = {"rated": len(r), "matches": len(d), "ladder": ladder, "kinds": kinds, "stars": stars, "promoted": promoted,
       "byPos": by_pos, "bestVs": best_vs, "worstVs": worst_vs, "spread": spread, "bands": bands,
       "agreement": agreement, "higher": higher, "lower": lower, "top": top, "bottom": bottom,
       "spotcheck": json.loads((HERE / "spotcheck.json").read_text()),
       "clubs": {"topAttack": sorted(TOP_ATTACK), "topDefence": sorted(TOP_DEFENCE), "worst": sorted(WORST)}}
(HERE / "review.json").write_text(json.dumps(out, default=lambda o: None if pd.isna(o) else o))
print("ladder", [(b["band"], b["count"], len(b["examples"])) for b in ladder])
print("kinds", [(k["title"][:40], len(k["cards"])) for k in kinds])
print("clubs", out["clubs"])
for k in kinds:
    for c in k["cards"]:
        print(f'  {k["title"][:28]:28s} | {c["name"]:14s} {c["club"]} v {c["opp"]} GW{c["gw"]:2d} {c["minutes"]}m  {c["rating"]:4.1f}  cons {c["consensus"]}  {c["note"]}')
