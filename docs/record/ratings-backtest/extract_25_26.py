"""25/26 per-match lines for the rating prototype, in the stats league's key vocabulary.

Read-only on ~/ai-carling-premiership. Run with its .venv/bin/python from that repo's root.
Writes ratings-input-25-26.json next to this file.
"""
from __future__ import annotations

import glob
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

import pandas as pd

ROOT = Path(".")
OUT = Path(__file__).parent / "ratings-input-25-26.json"
sys.path.insert(0, str(ROOT))
from src.engine.projection.team_strength_ratings_builder import build_team_strength_ratings  # noqa: E402

POS = {1: "GK", 2: "DEF", 3: "MID", 4: "FWD"}
FPL_GOAL_PTS = {"GK": 10, "DEF": 6, "MID": 5, "FWD": 4}
FPL_ASSIST_PTS = 3

# ---- match log, Premier League, played
ml = pd.read_parquet("data/match_logs/player_match_log/season=25-26/player_match_log.parquet")
ml = ml[(ml.competition == "premier_league") & (ml.minutes_played > 0)].copy()
ids = ml.provider_player_ids.map(json.loads)
ml["fpl_id"] = ids.map(lambda d: int(d["fpl"]) if d.get("fpl") else None)
ml["fotmob_pid"] = ids.map(lambda d: d.get("fotmob"))
ml["sofa_pid"] = ids.map(lambda d: d.get("sofascore"))
print("played PL rows", len(ml))

# ---- FPL players, teams, fixtures
players = {p["id"]: p for p in json.load(open("data/staging/fpl/2025-26/players.json"))}
boot = json.load(open("data/raw/fpl/snapshots/25-26/gw38/bootstrap-static.json"))
team_short = {t["id"]: t["short_name"] for t in boot["teams"]}
fixtures = {str(f["id"]): f for f in json.load(open("data/staging/fpl/2025-26/fixtures.json"))}

# ---- team log: venue and slug -> FPL short name
tl = pd.read_parquet("data/match_logs/team_match_log/season=25-26/team_match_log.parquet")
venue = {(r.match_id, r.team_id): bool(r.is_home) for r in tl.itertuples()}

# ---- SofaScore raw lineups: the events the staged table drops
SOFA_KEYS = {
    "errorLeadToAGoal": "errorsLeadingToGoal", "errorLeadToAShot": "errorsLeadingToShot",
    "penaltyConceded": "penaltiesConceded", "penaltyWon": "penaltiesWon", "penaltyMiss": "penaltiesMissed",
    "penaltySave": "penaltySaves", "ownGoals": "ownGoals", "hitWoodwork": "shotsOffPost",
    "clearanceOffLine": "clearancesOffLine", "wonTackle": "tacklesWon", "interceptionWon": "interceptions",
    "totalClearance": "clearances", "outfielderBlock": "blocks", "ballRecovery": "recoveries",
    "keyPass": "keyPasses", "bigChanceCreated": "bigChancesCreated", "bigChanceMissed": "bigChancesMissed",
    "onTargetScoringAttempt": "shotsOnTarget", "totalShots": "shots", "accuratePass": "accuratePasses",
    "aerialWon": "aerialsWon", "duelWon": "duelsWon", "duelLost": "duelsLost", "dispossessed": "dispossessed",
    "fouls": "foulsCommitted", "wasFouled": "foulsSuffered", "wonContest": "contestsWon",
    "totalContest": "contestsAttempted", "possessionLost": "turnovers", "saves": "saves",
    "goalsPrevented": "goalsPrevented", "expectedGoalsOnTarget": "xgot", "totalOffside": "offsides",
    "totalCross": "crosses", "accurateCross": "accurateCrosses", "rating": "sofascoreRating",
}
sofa: dict[tuple[str, str], dict] = {}
for f in glob.glob("data/raw/sofascore/2025-26/premier-league/*/lineups.json"):
    mid = re.search(r"_(\d+)$", Path(f).parent.name).group(1)
    j = json.load(open(f))
    for side in ("home", "away"):
        for p in (j.get(side) or {}).get("players", []):
            st = p.get("statistics") or {}
            if not st.get("minutesPlayed"):
                continue
            sofa[(mid, str(p["player"]["id"]))] = {v: st.get(k, 0) or 0 for k, v in SOFA_KEYS.items()}
print("sofascore lines", len(sofa))

# ---- FotMob raw shotmap: penalties and goals from outside the box
shots_by = defaultdict(lambda: {"penaltyGoals": 0, "penaltiesTaken": 0, "goalsOutsideBox": 0, "penXg": 0.0})
for f in glob.glob("data/raw/fotmob/matches/2025-2026/premier_league/*/match_details.json"):
    j = json.load(open(f))
    mid = str(j.get("general", {}).get("matchId") or re.search(r"_(\d+)$", Path(f).parent.name).group(1))
    for s in ((j.get("content") or {}).get("shotmap") or {}).get("shots") or []:
        if s.get("isOwnGoal"):
            continue
        b = shots_by[(mid, str(s.get("playerId")))]
        goal = s.get("eventType") == "Goal"
        if s.get("situation") == "Penalty":
            b["penaltiesTaken"] += 1
            b["penXg"] += s.get("expectedGoals") or 0
            b["penaltyGoals"] += int(goal)
        elif goal and s.get("isFromInsideBox") is False:
            b["goalsOutsideBox"] += 1

# ---- as-of team strength, one frame per gameweek, cut at that gameweek's first kickoff
gw_first = defaultdict(lambda: "9999")
for fx in fixtures.values():
    if fx.get("event") and fx.get("kickoff_time"):
        gw_first[fx["event"]] = min(gw_first[fx["event"]], fx["kickoff_time"])
strength = {}
for gw, cut in sorted(gw_first.items()):
    df = build_team_strength_ratings(ROOT, season="25-26", as_of_ts=cut)
    strength[gw] = {r.team_id: r for r in df.itertuples()}
print("strength frames", len(strength))

# ---- point-in-time projections, per (player_id, fixture)
proj = {}
for f in glob.glob("data/derived/projections_backtest/season=25-26/gw*/projections.json"):
    for r in json.load(open(f)):
        for fp in r.get("fixture_projections") or []:
            proj[(r["player_id"], str(fp["fixture_id"]))] = fp


def num(v, default=None):
    return default if v is None or pd.isna(v) else float(v)


rows, missing = [], defaultdict(int)
for r in ml.itertuples():
    p = players.get(r.fpl_id)
    if p is None:
        missing["fpl player"] += 1
        continue
    pos = POS[p["raw"]["element_type"]]
    fx = fixtures.get(str(r.fpl_fixture_id))
    gw = fx["event"] if fx else None
    home = venue.get((r.match_id, r.team_id))
    own_team = p["raw"]["team"] if fx is None else (fx["team_h"] if home else fx["team_a"])
    opp_team = None if fx is None else (fx["team_a"] if home else fx["team_h"])
    s = sofa.get((str(r.sofascore_match_id), str(r.sofa_pid)))
    if s is None:
        missing["sofascore line"] += 1
    sh = shots_by.get((str(r.fotmob_match_id), str(r.fotmob_pid)), shots_by.default_factory())
    st = strength.get(gw, {})
    opp = st.get(r.opponent_team_id)
    mine = st.get(r.team_id)
    if opp is None:
        missing["strength"] += 1
    dgw = pd.isna(r.fpl_total_points)
    goals_for = None if pd.isna(r.home_score) else int(r.home_score if home else r.away_score)
    goals_against = None if pd.isna(r.home_score) else int(r.away_score if home else r.home_score)
    minutes = int(r.minutes_played)
    xg = num(r.fpl_xg) if not dgw else num(r.fotmob_xg, num(r.understat_xg, 0.0))
    fp = proj.get((r.player_id, str(r.fpl_fixture_id)))
    if fp is None:
        missing["projection"] += 1
    expected = None
    if fp is not None:
        xm = max(float(fp.get("xmins_mean") or 0), 1.0)
        scale = min(minutes, 90) / max(xm, 30.0)
        expected = {
            "minutes": round(xm, 1),
            "goals": round(fp["goal_points"] / FPL_GOAL_PTS[pos] * scale, 3),
            "assists": round(fp["assist_points"] / FPL_ASSIST_PTS * scale, 3),
            "cleanSheet": round(float(fp.get("cs_probability") or 0), 3),
            "points": fp["expected_points"],
        }
    cs = num(r.fpl_clean_sheets)
    if cs is None:  # double gameweek: FPL's rule rebuilt from the score
        cs = float(minutes >= 60 and goals_against == 0)
    gao = num(r.fpl_goals_conceded)
    if gao is None:
        gao = float(goals_against or 0) if minutes >= 85 else None
    ev = s or {}
    rows.append({
        "code": p["raw"]["code"], "name": p["web_name"], "pos": pos,
        "club": team_short.get(own_team), "opp": team_short.get(opp_team), "home": home,
        "gw": gw, "fixture": str(r.fpl_fixture_id), "kickoff": r.kickoff_utc,
        "score": None if goals_for is None else [goals_for, goals_against],
        "minutes": minutes, "started": bool(r.started),
        "subOn": num(r.substituted_on_minute), "subOff": num(r.substituted_off_minute),
        "goals": int(r.goals), "assists": int(r.assists_fpl), "officialAssists": int(r.assists),
        "penaltyGoals": sh["penaltyGoals"], "penaltiesTaken": sh["penaltiesTaken"],
        "goalsOutsideBox": sh["goalsOutsideBox"],
        "xg": xg, "penXg": round(sh["penXg"], 3),
        "xa": num(r.fpl_xa) if not dgw else num(r.fotmob_xa, 0.0),
        "chancesCreated": num(r.chances_created, 0.0),
        "touchesOppBox": num(r.touches_opp_box), "finalThirdPasses": num(r.passes_into_final_third),
        **{k: ev.get(k) for k in SOFA_KEYS.values()},
        "cleanSheet": cs, "goalsAgainstOnPitch": gao,
        "fplSaves": num(r.fpl_saves), "defcon": num(r.fpl_defensive_contribution),
        "yellowCards": int(r.yellow_cards), "redCards": int(r.red_cards),
        "oppAttack": None if opp is None else (opp.attack_home if home is False else opp.attack_away),
        "oppDefence": None if opp is None else (opp.defense_home if home is False else opp.defense_away),
        "ownAttack": None if mine is None else (mine.attack_home if home else mine.attack_away),
        "ownDefence": None if mine is None else (mine.defense_home if home else mine.defense_away),
        "expected": expected,
        "fotmobRating": num(r.fotmob_rating), "fplPoints": num(r.fpl_total_points), "bps": num(r.fpl_bps),
        "dgw": dgw,
    })

# The projections under-call assists; scale each expected count so the season's sums match what happened.
for key, actual in (("goals", "goals"), ("assists", "assists")):
    exp_sum = sum(r["expected"][key] for r in rows if r["expected"])
    act_sum = sum(r[actual] for r in rows if r["expected"])
    for r in rows:
        if r["expected"]:
            r["expected"][key] = round(r["expected"][key] * act_sum / exp_sum, 3)
    print("calibrated", key, round(act_sum / exp_sum, 3))
print("rows", len(rows), "missing", dict(missing))
OUT.write_text(json.dumps(rows))
print("wrote", OUT)
