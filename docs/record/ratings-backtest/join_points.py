"""Attach the real league's Fantrax points to every 25/26 match, split by the league's own flat rules.

Reads points-cache/ (fetch-points.mts), rules-real.json (dump-rules.mts) and the committed bridge.
Writes ratings-input-pts-25-26.json. A man no longer in Fantrax's pool gets no points, counted.
"""
import glob
import json
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).parent
BRIDGE = json.loads((HERE.parent / "ratings/data/mappings/fantrax.json").read_text())
RULES = json.loads((HERE / "rules-real.json").read_text())
RAW = json.loads((HERE / "rules-raw-real.json").read_text())["scoringCategories"]
FPL_POS = {"GK": "G", "DEF": "D", "MID": "M", "FWD": "F"}


def rule_points(expr, value):
    """The league's own expression for one category: 'pointsN', or 'range{lo}|{hi}|{pts}|{per}' segments joined by $."""
    if expr is None or value is None:
        return 0.0
    if expr.startswith("points"):
        return float(expr[6:]) * value
    total = 0.0
    for seg in expr[5:].split("$"):
        lo, hi, pts, per = seg.replace("range", "").split("|")
        if float(lo) <= value <= float(hi):
            total += float(pts) * (value // float(per) if per != "NULL" else 1)
    return total


def league_points(counts, pos):
    """Every category the league prices, from counts keyed by Fantrax's short names."""
    table = RAW["GOALIE" if pos == "G" else "NON_GOALIE"]
    return sum(rule_points(prices.get(pos, prices.get("Default")), counts.get(cat)) for cat, prices in table.items())


def our_counts(r):
    """The same counts built from our match line, for a man Fantrax no longer lists."""
    dfp = sum((r.get(k) or 0) for k in ("tacklesWon", "interceptions", "blocks"))
    return {"G": r["goals"], "AT": r["assists"], "CS": r["cleanSheet"], "YC": r["yellowCards"], "RC": r["redCards"],
            "PKM": r.get("penaltiesMissed") or 0, "OG": r.get("ownGoals") or 0, "Min": r["minutes"],
            "GAO": r.get("goalsAgainstOnPitch") or 0, "GA": r.get("goalsAgainstOnPitch") or 0,
            "PKS": r.get("penaltySaves") or 0, "DFP": dfp,
            "DFP3": dfp + (r.get("clearances") or 0) + (r.get("recoveries") or 0),
            "GKP": (r.get("fplSaves") or 0)}
rows = json.loads((HERE / "ratings-input-25-26.json").read_text())


def num(v):
    try:
        return float(str(v).replace(",", ""))
    except (TypeError, ValueError):
        return 0.0


def price(table, cat, pos):
    t = RULES[table].get(cat) or {}
    v = t.get(pos, t.get("Default"))
    return v or 0


fx = {}
for f in glob.glob(str(HERE / "points-cache/*.json")):
    j = json.loads(Path(f).read_text())
    keeper = j["group"] == "SOCCER_GOALIE"
    for r in j["rows"]:
        code = (BRIDGE.get(r["id"]) or {}).get("fplCode")
        if code is None:
            continue
        c = r["cells"]
        pos = "G" if keeper else str(r["pos"] or "M").split(",")[-1]  # a dual-eligible man is scored at his last position
        table = "goalie" if keeper else "outfield"
        attacking = num(c.get("G")) * price(table, "G", pos) + num(c.get("AT")) * price(table, "AT", pos)
        sheet = num(c.get("CS")) * price(table, "CS", pos)
        fx[(code, j["date"])] = {"total": num(c.get("FPts")), "attacking": attacking, "cleanSheet": sheet,
                                 "fxPos": pos, "fxMinutes": num(c.get("Min")),
                                 "fromCells": league_points({k: num(v) for k, v in c.items()}, pos)}

stats = Counter()
diffs = Counter()
for r in rows:
    p = fx.get((r["code"], r["kickoff"][:10]))
    pos = p["fxPos"] if p else FPL_POS[r["pos"]]
    ours = league_points(our_counts(r), pos)
    if p:
        stats["fantrax"] += 1
        stats["engine reads Fantrax's cells exactly"] += int(p["fromCells"] == p["total"])
        stats["engine on our counts exactly"] += int(ours == p["total"])
        diffs[round(ours - p["total"])] += 1
        r["points"] = {k: p[k] for k in ("total", "attacking", "cleanSheet")}
        r["pointsSource"] = "fantrax"
    else:
        table = "goalie" if pos == "G" else "outfield"
        r["points"] = {"total": ours,
                       "attacking": r["goals"] * price(table, "G", pos) + r["assists"] * price(table, "AT", pos),
                       "cleanSheet": r["cleanSheet"] * price(table, "CS", pos)}
        r["pointsSource"] = "rules"
        stats["priced by the league's rules"] += 1
    r["fxPos"] = pos
print("engine minus Fantrax, by points:", dict(sorted(diffs.items())))

# What each man went on to score: his mean Fantrax points over his next five appearances.
by_man = defaultdict(list)
for r in rows:
    if r["points"]:
        by_man[r["code"]].append(r)
for apps in by_man.values():
    apps.sort(key=lambda r: r["kickoff"])
    for i, r in enumerate(apps):
        nxt = apps[i + 1:i + 6]
        r["nextPoints"] = sum(a["points"]["total"] for a in nxt) / len(nxt) if len(nxt) >= 3 else None

(HERE / "ratings-input-pts-25-26.json").write_text(json.dumps(rows))
print(dict(stats), "of", len(rows))
