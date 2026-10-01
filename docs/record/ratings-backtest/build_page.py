"""Renders review.json + weights.json into draft-ratings.html (static, one file)."""
import html
import json
from pathlib import Path

HERE = Path(__file__).parent
R = json.loads((HERE / "review.json").read_text())
W = json.loads((HERE / "weights.json").read_text())
CSS = (HERE / "page.css.tmpl").read_text().replace("{{", "{").replace("}}", "}")
e = html.escape

LABEL = {
    "goals": "G", "assists": "A", "penaltyGoals": "pen goal", "goalsOutsideBox": "from outside box", "xg": "xG",
    "xa": "xA", "shots": "shots", "shotsOnTarget": "on target", "keyPasses": "key passes",
    "bigChancesCreated": "big chances made", "bigChancesMissed": "big chances missed", "penaltiesMissed": "pen missed",
    "penaltiesWon": "pen won", "clearancesOffLine": "off the line", "cleanSheet": "clean sheet",
    "goalsAgainstOnPitch": "conceded", "fplSaves": "saves", "goalsPrevented": "prevented", "penaltySaves": "pen saved",
    "yellowCards": "yellow", "redCards": "RED", "ownGoals": "own goal", "errorsLeadingToGoal": "error → goal",
    "errorsLeadingToShot": "error → shot", "penaltiesConceded": "pen conceded", "dispossessed": "dispossessed",
}
BAD = {"bigChancesMissed", "penaltiesMissed", "redCards", "ownGoals", "errorsLeadingToGoal", "errorsLeadingToShot",
       "penaltiesConceded", "yellowCards", "goalsAgainstOnPitch", "dispossessed"}
RETURN = {"goals", "assists", "cleanSheet", "penaltySaves"}
PART_LABEL = {"opponent": "opponent", "mistakes": "mistakes", "extras": "extras"}


def fmt(v, dp=1):
    return "—" if v is None else f"{v:.{dp}f}"


def signed(v, dp=1):
    return "—" if v is None else f"{v:+.{dp}f}".replace("-", "−")


def band(r):
    if r is None:
        return "b-none"
    if r >= 9.5:
        return "b-top"
    if r >= 7.5:
        return "b-high"
    if r >= 4:
        return "b-mid"
    if r >= 2.5:
        return "b-low"
    return "b-bad"


def chips(line, pos):
    out = []
    for k, v in line.items():
        if k not in LABEL or (k == "fplSaves" and pos != "GK"):
            continue
        if k == "cleanSheet":
            txt = LABEL[k]
        elif k in ("xg", "xa", "goalsPrevented"):
            txt = f"{v:.2f} {LABEL[k]}"
        elif k in ("goals", "assists"):
            txt = f"{int(v)}{LABEL[k]}"
        else:
            txt = f"{int(v)} {LABEL[k]}"
        cls = "chip bad" if k in BAD else ("chip ret" if k in RETURN else "chip")
        out.append(f'<span class="{cls}">{e(txt)}</span>')
    return "".join(out)


def parts(c):
    p = c["parts"]
    out = [f'<span class="part base"><b>{fmt(p.get("points"), 0)}</b> league pts</span>']
    for k, lab in PART_LABEL.items():
        v = p.get(k)
        if v is None or abs(v) < 0.05:
            continue
        out.append(f'<span class="part {"down" if v < 0 else "up"}"><b>{signed(v)}</b> {lab}</span>')
    out.append(f'<span class="part base">= <b>{fmt(c["adjusted"])}</b></span>')
    return "".join(out)


CAT_LABEL = {"Min": "mins", "G": "goals", "AT": "assists", "CS": "clean sheet", "DFP": "DefCon", "DFP3": "DefCon",
             "GKP": "keeper pts", "PKS": "pen saved", "GA": "conceded", "GAO": "conceded", "YC": "yellow",
             "RC": "red", "OG": "own goal", "PKM": "pen missed"}


def league_chips(by):
    return "".join(f'<span class="lp {"down" if v < 0 else "up"}"><b>{signed(v, 0)}</b> {CAT_LABEL.get(k, k)}</span>' for k, v in by.items())


def card(c):
    venue = "v" if c["home"] else "at"
    score = f' {c["score"][0]}–{c["score"][1]}' if c.get("score") else ""
    sub = f' · on {int(c["subOn"])}′' if c.get("subOn") else ""
    note = f'<p class="note">{e(c["note"])}</p>' if c.get("note") else ""
    priced = ' · <span title="Not in Fantrax\'s pool now; priced by the league\'s own rules">priced by rules</span>' if c.get("source") == "rules" else ""
    opp = ""
    if c.get("oppDefence") is not None:
        opp = f'<span title="The opponent before the match: goals and xG so far against the league\'s, 1.0 average">their attack {c["oppAttack"]:.2f} · defence {c["oppDefence"]:.2f}</span>'
    return f"""<article class="card">
  <div class="mark {band(c['rating'])}"><span>{fmt(c['rating'])}</span><small>{fmt(c['pts'], 0)} pts</small></div>
  <div class="body">
    <header><strong>{e(c['name'])}</strong> <span class="pos">{c['pos']}</span>
      <span class="fx">{e(c['club'])} {venue} {e(c['opp'])}{score} · GW{c['gw']} · {c['minutes']}′{sub}</span></header>
    {note}
    <div class="chips">{chips(c['line'], c['pos'])}</div>
    <div class="parts lps">{league_chips(c.get('pointsBy') or {})}</div>
    <div class="parts">{parts(c)}</div>
    <div class="meta">{opp}<span>vs expected {signed(c['vsExpected'])} pts</span><span>FotMob {fmt(c['fotmob'])} · SofaScore {fmt(c['sofascore'])}{priced}</span></div>
  </div>
</article>"""


def table(rows, cols):
    head = "".join(f'<th class="{c[2] if len(c) > 2 else ""}">{c[1]}</th>' for c in cols)
    body = ""
    for x in rows:
        tds = ""
        for c in cols:
            v = x.get(c[0])
            if c[0] in ("avg", "und", "pts", "gf", "ga", "oldAtt", "oldDef", "att", "dfn"):
                v = fmt(v, 2)
            elif c[0] in ("vs", "gap"):
                v = signed(v, 1)
            tds += f'<td class="{c[2] if len(c) > 2 else ""}">{e(str(v))}</td>'
        body += f"<tr>{tds}</tr>"
    return f'<div class="scroll"><table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table></div>'


SEASON_COLS = [("name", "Player"), ("club", "Club"), ("pos", "Pos"), ("apps", "Apps", "n"), ("goals", "G", "n"),
               ("assists", "A", "n"), ("pts", "Pts/gm", "n"), ("avg", "Rating", "n hl"), ("rank", "Rank", "n"),
               ("vs", "vs exp.", "n"), ("tens", "10s", "n")]


def marks_table():
    cells = "".join(f'<tr><td class="n">{signed(p, 0) if p < 0 else int(p)}</td><td class="n hl">{m:g}</td></tr>' for p, m in W["marks"])
    return f'<div class="scroll"><table class="marks"><thead><tr><th class="n">League pts</th><th class="n">Mark</th></tr></thead><tbody>{cells}</tbody></table></div>'


def terms_table():
    rows = ""
    for part in W["parts"]:
        for i, t in enumerate(part["terms"]):
            rows += f'<tr><td>{e(part["label"]) if i == 0 else ""}</td><td>{e(LABEL.get(t["stat"], t["stat"]))}</td><td class="n">{signed(t["points"], 2)}</td></tr>'
    return f'<div class="scroll"><table class="wt"><thead><tr><th>Part</th><th>Stat</th><th class="n">League pts each</th></tr></thead><tbody>{rows}</tbody></table></div>'


STAT_VERDICTS = [
    ("Rating", "League points", "Fantrax, the real league's scoring", "The base of every mark. 0.94 correlation between mark and points."),
    ("Rating", "Opponent", "goals + xG so far, ours", "Goal and assist points × their defence, clean-sheet points × their attack, held to 0.7–1.5."),
    ("Rating", "Big chances missed, missed pens", "BCM · PKM", "−1 point each on top of the league's own −2 for a missed pen."),
    ("Rating", "Errors, pens conceded, dispossessed", "ErG · ErS · Pen · DIS", "−2, −0.5, −1.5, −0.15."),
    ("Rating", "Long-range goals, pens won, off the line, goals prevented", "GOB · PKD · CLO · shots export", "+1, +1, +1.5, +1 per goal prevented."),
    ("Out", "Shots, xG, key passes, touches in the box", "—", "What a man is likely to do next is the projections' job. The rating is the match."),
    ("Out", "Successful dribbles", "FotMob only", "The stats league has attempts only, so we cannot read it live."),
    ("Out", "The sister model's team strength", "data/intel/strength", "Too smoothed: Wolves' defence read as average while conceding 1.79 a game."),
]


def histogram():
    bands = {int(k): v for k, v in R["bands"].items()}
    top = max(bands.values())
    bars = ""
    for b in range(1, 11):
        n = bands.get(b, 0)
        h = max(2, round(n / top * 120)) if n else 0
        bars += f'<div class="bar"><span class="cnt">{n:,}</span><i style="height:{h}px" class="{band(b)}"></i><span class="lab">{b}</span></div>'
    return f'<div class="hist">{bars}</div>'


def paid_table():
    cats = ["Min", "G", "AT", "CS", "DFP", "DFP3", "GKP", "PKS", "GA", "GAO", "YC", "RC", "OG", "PKM"]
    head = "".join(f'<th class="n">{CAT_LABEL[c] if c not in ("DFP", "DFP3") else c}</th>' for c in cats)
    body = "".join(f'<tr><td>{p}</td>' + "".join(f'<td class="n">{fmt(R["paidBy"][p].get(c), 2) if R["paidBy"][p].get(c) else ""}</td>' for c in cats) + "</tr>" for p in ["GK", "DEF", "MID", "FWD"])
    return f'<div class="scroll"><table><thead><tr><th>Pos</th>{head}</tr></thead><tbody>{body}</tbody></table></div>'


ladder_html = "".join(
    f'<div class="rung"><div class="rung-h"><span class="big {band(s["band"])}">{s["band"]}</span><span>{s["count"]:,} matches round to {s["band"]}</span></div><div class="cards">{"".join(card(c) for c in s["examples"])}</div></div>'
    for s in R["ladder"])
kinds_html = "".join(
    f'<section class="kind"><h3>{e(k["title"])}</h3><p class="q">{e(k["question"])}</p><p class="verdict">{e(k["verdict"])}</p><div class="cards">{"".join(card(c) for c in k["cards"])}</div></section>'
    for k in R["kinds"])
sp = R["spread"]
spread_rows = "".join(f'<tr><td>{p}</td><td class="n">{sp[p]["n"]:,}</td><td class="n">{sp[p]["median"]}</td><td class="n">{sp[p]["nines"]}</td><td class="n">{sp[p]["tens"]}</td><td class="n">{sp[p]["ones"]}</td></tr>' for p in ["GK", "DEF", "MID", "FWD"])
ag, sc, src = R["agreement"], R["strengthCorr"], R["sources"]
stat_rows = "".join(f'<tr><td><span class="tag t-{v[0].lower()}">{v[0]}</span></td><td>{e(v[1])}</td><td class="src">{e(v[2])}</td><td>{e(v[3])}</td></tr>' for v in STAT_VERDICTS)
pos_html = "".join(f'<div><h4>{p}</h4>{table(R["byPos"][p], [("name", "Player"), ("club", "Club"), ("avg", "Rating", "n hl"), ("pts", "Pts/gm", "n")])}</div>' for p in ["GK", "DEF", "MID", "FWD"])
tens, ones = R["tensAll"], R["onesAll"]
haaland = next((s for s in R["stars"] if s["name"] == "Haaland"), None)

page = f"""<title>Draft Match Ratings</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;800&family=Archivo+Narrow:wght@500;700&family=Oxanium:wght@600;800&display=swap">
{CSS}
<style>
.mark small.und {{ font: 700 12px var(--digits); }}
.t-rating {{ background: color-mix(in oklch, var(--derived) 22%, transparent); color: var(--derived); }}
.t-out {{ background: color-mix(in oklch, var(--bad) 20%, transparent); color: var(--bad); }}
table.marks {{ width: auto; min-width: 180px; }}
.changes li {{ margin-bottom: 4px; }}
.lps {{ gap: 3px 10px; }}
.lp {{ font: 500 12px var(--narrow); color: var(--muted); }}
.lp b {{ font-family: var(--digits); font-weight: 600; }}
.lp.up b {{ color: var(--good); }} .lp.down b {{ color: var(--bad); }}
</style>
<div class="wrap">
<header style="display:grid;gap:12px">
  <p class="small">Tim Hortons Pro League · third draft for review · 25/26 backtest</p>
  <h1>Our own match rating, <em>out of ten</em></h1>
  <p class="lede">Every Premier League appearance of 25/26, {R['rated']:,} long enough to rate, marked from the real league's own Fantrax points. The opponent and what the league does not score move the points; one table turns points into a mark. The small figure under each mark is his league points.</p>
</header>

<section>
  <h2>What changed from your feedback</h2>
  <ul class="changes" style="margin:0;padding-left:20px;max-width:72ch">
    <li><b>Strengths:</b> the sister model was too smoothed (Wolves' defence read as average while conceding 1.79 a game). Ours is goals and xG so far this season against the league's, eased in over six games. It tracks the season's goals at {sc['new']['attack']} for attack and {sc['new']['defence']} for defence, against {sc['old']['attack']} and {sc['old']['defence']} before.</li>
    <li><b>Scale:</b> a blank is now 4–5; across the season {tens} match reaches 10 and {ones} reach 1.</li>
    <li><b>Fantrax points:</b> the real league's own points from Fantrax for {src.get('fantrax', 0):,} matches. The other {src.get('rules', 0):,} are men Fantrax no longer lists (relegated or gone abroad), priced by the league's own rules, which reproduce Fantrax's points exactly in 98.3% of matches and within a point in 99.9%.</li>
    <li><b>Points lead:</b> mark and league points correlate at {ag['points']}.</li>
    <li><b>Being terrible:</b> a big chance missed now costs a point before the table, an error leading to a goal two.</li>
    <li><b>Underlying is gone:</b> what a man will do next is the projections' job, so the mark is the match alone.</li>
    <li><b>Haaland</b> stays 7th: good, a little under what was expected of him.</li>
    <li><b>The real league's scoring, in full:</b> every card now shows his league points by category, DefCon and keeper points included. Departed keepers were short: their keeper points now count saves, punches and high claims as Fantrax does, and the league's rules match Fantrax exactly in 98.3% of matches.</li>
  </ul>
</section>

<div class="facts">
  <div><b>{sp['MID']['median']}</b><span>median mark, midfielders</span></div>
  <div><b>{tens}</b><span>ten all season</span></div>
  <div><b>{ones}</b><span>ones all season</span></div>
  <div><b>{ag['points']}</b><span>mark against league points</span></div>
  <div><b>{sc['new']['attack']}</b><span>new strength against goals</span></div>
</div>

<section>
  <h2>Questions for you</h2>
  <ol class="qs">
    <li><b>The points table.</b> 2 points is 4.5, 6 is 6.8, 10 is 8.3, 16 is 9.5, 22 is 10. Steeper or flatter anywhere?</li>
    <li><b>Two blanks rate the same.</b> The season's busiest attacking blank and an anonymous one on the same points both rate 4.1. Leave it to the points, or give activity a small say (half a mark at most)?</li>
    <li><b>Big chances missed at −1 point.</b> Enough, or should it be −2 like an error?</li>
  </ol>
</section>

<section>
  <h2>The ladder, 10 down to 1</h2>
  <p class="q">Real matches for each whole mark, across positions. Under each mark, his league points.</p>
  {ladder_html}
</section>

<section>
  <h2>Kinds of match</h2>
  {kinds_html}
</section>

<section>
  <h2>The star test</h2>
  <p class="q">Season averages, 900 minutes or more. "vs exp." sums his goal, assist and clean-sheet points against what the projection expected before each match.</p>
  {table(R['stars'], SEASON_COLS)}
  <div class="grid2">
    <div><h4>Promoted clubs' attackers, by vs expected</h4>{table(R['promoted'], [("name","Player"),("club","Club"),("goals","G","n"),("avg","Rating","n hl"),("vs","vs exp.","n")])}</div>
  </div>
  <div class="grid2">
    <div><h4>Most above expectation</h4>{table(R['bestVs'], [("name","Player"),("club","Club"),("goals","G","n"),("avg","Rating","n hl"),("vs","vs exp.","n")])}</div>
    <div><h4>Most below expectation</h4>{table(R['worstVs'], [("name","Player"),("club","Club"),("goals","G","n"),("avg","Rating","n hl"),("vs","vs exp.","n")])}</div>
  </div>
  <h4>Best average by position</h4>
  <div class="grid4">{pos_html}</div>
</section>

<section>
  <h2>What the real league paid for</h2>
  <p class="q">Average league points per rated match, by category, across 25/26. DefCon is tackles won, interceptions and blocks for defenders (3 = 1 point, 5 = 2) and those plus clearances and recoveries for midfielders (8 = 1, 11 = 2) and forwards (6 = 1, 9 = 2). Keeper points are saves, punches and high claims, one point per three.</p>
  {paid_table()}
</section>

<section>
  <h2>Team strength, old and new</h2>
  <p class="q">Season averages of each club's reading, beside what happened. Higher defence concedes less.</p>
  {table(R['strength'], [("club","Club"),("gf","Scored/gm","n"),("ga","Conceded/gm","n"),("oldAtt","Old att.","n"),("att","New att.","n hl"),("oldDef","Old def.","n"),("dfn","New def.","n hl")])}
</section>

<section>
  <h2>How the marks spread</h2>
  <div class="grid2">
    <div>{histogram()}<p class="small">Every rated match, rounded to the whole mark.</p></div>
    <div><div class="scroll"><table><thead><tr><th>Pos</th><th class="n">60+ min</th><th class="n">Median</th><th class="n">9s</th><th class="n">10s</th><th class="n">1s</th></tr></thead><tbody>{spread_rows}</tbody></table></div>
    <p class="small" style="margin-top:8px">Correlation with league points {ag['points']}; with the FotMob/SofaScore average {ag['consensus']}.</p></div>
  </div>
</section>

<section>
  <h2>The scale</h2>
  <p class="q">His league points, plus the opponent and the parts below, are read off this table, straight lines between the rows. Under 10 minutes a man is rated only if something happened.</p>
  <div class="grid2"><div>{marks_table()}</div><div>{terms_table()}</div></div>
  <div class="scroll"><table><thead><tr><th></th><th>What</th><th>Live source</th><th>Why</th></tr></thead><tbody>{stat_rows}</tbody></table></div>
</section>

<section>
  <h2>Season's top 20 and bottom 12</h2>
  <div class="cards">{"".join(card(c) for c in R['top'])}</div>
  <h4>Bottom 12</h4>
  <div class="cards">{"".join(card(c) for c in R['bottom'])}</div>
</section>
</div>
"""
(HERE / "draft-ratings.html").write_text(page)
print("wrote", len(page) // 1024, "KB")
