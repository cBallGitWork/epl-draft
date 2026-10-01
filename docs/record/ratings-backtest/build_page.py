"""Renders review.json + weights.json + discover.json into draft-ratings.html (static, one file)."""
import html
import json
from pathlib import Path

HERE = Path(__file__).parent
R = json.loads((HERE / "review.json").read_text())
W = json.loads((HERE / "weights.json").read_text())
D = json.loads((HERE / "discover.json").read_text())
e = html.escape

LABEL = {
    "goals": "G", "assists": "A", "penaltyGoals": "pen goal", "goalsOutsideBox": "from outside box", "npxg": "npxG",
    "xa": "xA", "shotsOnTarget": "on target", "keyPasses": "key passes", "bigChancesCreated": "big chances made",
    "bigChancesMissed": "big chances missed", "penaltiesMissed": "pen missed", "penaltiesWon": "pen won",
    "duelsWon": "duels won", "duelsLost": "duels lost", "tacklesWon": "tackles won", "interceptions": "int",
    "clearances": "clearances", "blocks": "blocks", "recoveries": "recoveries", "clearancesOffLine": "off the line",
    "cleanSheet": "clean sheet", "goalsAgainstOnPitch": "conceded", "fplSaves": "saves", "goalsPrevented": "prevented",
    "penaltySaves": "pen saved", "yellowCards": "yellow", "redCards": "RED", "ownGoals": "own goal",
    "errorsLeadingToGoal": "error → goal", "errorsLeadingToShot": "error → shot", "penaltiesConceded": "pen conceded",
    "accuratePasses": "passes", "dispossessed": "dispossessed",
}
BAD = {"bigChancesMissed", "penaltiesMissed", "redCards", "ownGoals", "errorsLeadingToGoal", "errorsLeadingToShot",
       "penaltiesConceded", "yellowCards", "goalsAgainstOnPitch"}
PART_LABEL = {"returns": "returns", "keeping": "keeping", "attacking": "threat", "waste": "waste",
              "defending": "defending", "passing": "passing", "discipline": "discipline"}


def fmt(v, dp=1):
    return "—" if v is None else f"{v:.{dp}f}"


def signed(v, dp=1):
    return "—" if v is None else f"{v:+.{dp}f}".replace("-", "−")


def band(r):
    if r is None:
        return "b-none"
    if r >= 9.5:
        return "b-top"
    if r >= 8:
        return "b-high"
    if r >= 6:
        return "b-mid"
    if r >= 4.5:
        return "b-low"
    return "b-bad"


def chips(line, pos):
    out = []
    for k, v in line.items():
        if k not in LABEL or (k == "fplSaves" and pos != "GK"):
            continue
        if k in ("cleanSheet",):
            txt = LABEL[k]
        elif k in ("npxg", "xa", "goalsPrevented"):
            txt = f"{v:.2f} {LABEL[k]}"
        elif k in ("goals", "assists"):
            txt = f"{int(v)}{LABEL[k]}"
        else:
            txt = f"{int(v)} {LABEL[k]}"
        cls = "chip bad" if k in BAD else ("chip ret" if k in ("goals", "assists", "cleanSheet", "penaltySaves") else "chip")
        out.append(f'<span class="{cls}">{e(txt)}</span>')
    return "".join(out)


def parts(p):
    out = []
    for k, lab in PART_LABEL.items():
        v = p.get(k)
        if v is None or abs(v) < 0.05:
            continue
        out.append(f'<span class="part {"down" if v < 0 else "up"}"><b>{signed(v)}</b> {lab}</span>')
    return f'<span class="part base"><b>{fmt(p.get("minutes"))}</b> base</span>' + "".join(out)


def card(c):
    venue = "v" if c["home"] else "at"
    score = f' {c["score"][0]}–{c["score"][1]}' if c.get("score") else ""
    sub = f' · on {int(c["subOn"])}′' if c.get("subOn") else ""
    note = f'<p class="note">{e(c["note"])}</p>' if c.get("note") else ""
    opp = ""
    if c.get("oppDefence") is not None:
        opp = f'<span class="opp" title="Opponent strength before the match, 1.0 = league average">their attack {c["oppAttack"]:.2f} · defence {c["oppDefence"]:.2f}</span>'
    return f"""<article class="card">
  <div class="mark {band(c['rating'])}"><span>{fmt(c['rating'])}</span><small>B {fmt(c['blended'])}</small></div>
  <div class="body">
    <header><strong>{e(c['name'])}</strong> <span class="pos">{c['pos']}</span>
      <span class="fx">{e(c['club'])} {venue} {e(c['opp'])}{score} · GW{c['gw']} · {c['minutes']}′{sub}</span></header>
    {note}
    <div class="chips">{chips(c['line'], c['pos'])}</div>
    <div class="parts">{parts(c['parts'])}</div>
    <div class="meta">{opp}<span>vs expected {signed(c['vsExpected'])}</span><span>FotMob {fmt(c['fotmob'])} · SofaScore {fmt(c['sofascore'])}</span><span>FPL {fmt(c['fplPoints'], 0)} pts</span></div>
  </div>
</article>"""


def verdict(k):
    c = k["cards"]
    t = k["title"]
    r = lambda i: fmt(c[i]["rating"]) if len(c) > i else "—"
    if t.startswith("The best attack"):
        return f"{c[0]['name']}'s blank reads {r(0)}. A top attacker's worst blank against the bottom three reads {r(1)}. One goal against the weakest defence gets {r(2)}: the goal is marked down for the opposition."
    if t.startswith("The worst attack"):
        return f"The same single open-play goal: {r(0)} against a strong defence, {r(1)} against a weak one."
    if t.startswith("A clean sheet"):
        return f"{r(0)} for keeping a top-four attack out, against {r(1)} for keeping out a bottom-three attack."
    if t.startswith("Lots of xG"):
        return f"The missed penalty gives nothing for its xG and costs 1.2 on top, so it lands at {r(0)}. A pile of big chances missed lands at {r(1)}."
    if t.startswith("A quiet penalty"):
        return f"The busy blank ({r(1)}) beats the quiet penalty ({r(0)}). FotMob and SofaScore agree. Is that right for a draft league? See question 2."
    if t.startswith("The late substitute"):
        return f"A goal a minute after coming on reads {r(0)}, and the best late cameo {r(1)}. Both sit below a 90-minute scorer, who starts 0.5 higher before doing anything."
    if t.startswith("A centre-back"):
        return f"{r(0)} with no clean sheet. Defending alone can carry a centre-back to an 8."
    if t.startswith("The keeper"):
        return f"Conceding three but saving well gets {r(0)}. The same scoreline with an error behind it gets {r(1)}."
    if t.startswith("A red card"):
        return f"A goal and a red reads {r(0)}; a return with an own goal reads {r(1)}. The day survives, marked down hard."
    if t.startswith("A goal from outside"):
        return f"{r(0)} for one long-range goal: the goal, plus 0.3 for the distance."
    return ""


def table(rows, cols):
    head = "".join(f'<th class="{c[2] if len(c) > 2 else ""}">{c[1]}</th>' for c in cols)
    body = ""
    for x in rows:
        tds = ""
        for c in cols:
            v = x.get(c[0])
            cls = c[2] if len(c) > 2 else ""
            if c[0] in ("avg", "blend", "cons"):
                v = fmt(v, 2)
            elif c[0] == "vs":
                v = signed(v, 1)
            tds += f'<td class="{cls}">{e(str(v))}</td>'
        body += f"<tr>{tds}</tr>"
    return f'<div class="scroll"><table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table></div>'


SEASON_COLS = [("name", "Player"), ("club", "Club"), ("pos", "Pos"), ("apps", "Apps", "n"), ("goals", "G", "n"),
               ("assists", "A", "n"), ("avg", "Avg (A)", "n hl"), ("rank", "Rank", "n"), ("blend", "Avg (B)", "n"),
               ("rankBlend", "Rank", "n"), ("vs", "vs exp.", "n"), ("cons", "Websites", "n"), ("tens", "10s", "n")]


def weights_table():
    rows = ""
    for part in W["parts"]:
        for i, t in enumerate(part["terms"]):
            wv = t["weight"]
            wtxt = signed(wv, 3 if abs(wv) < 0.01 else 2) if isinstance(wv, (int, float)) else " · ".join(f"{k} {signed(v, 2)}" for k, v in wv.items())
            opp = {"defence": "× their defence", "attack": "× their attack", "attackInverse": "÷ their attack"}.get(t.get("opponent"), "")
            rows += f'<tr><td>{e(part["label"]) if i == 0 else ""}</td><td>{e(t["stat"])}</td><td class="n">{e(wtxt)}</td><td>{opp}</td></tr>'
    return f'<div class="scroll"><table class="wt"><thead><tr><th>Part</th><th>Stat</th><th class="n">Points each</th><th>Scaled by</th></tr></thead><tbody>{rows}</tbody></table></div>'


STAT_VERDICTS = [
    ("In", "Duels won / lost", "DW · DL", "The biggest single signal for every outfield position (+0.11 R² for defenders)."),
    ("In", "Tackles won, interceptions, clearances, blocks, recoveries", "TkW · Int · CLR · DFP · BR", "Each adds on top of duels; blocks come from DFP − TkW − Int."),
    ("In", "Key passes, big chances created, xA", "KP · BCC · FPL xA", "Creation: +0.05 R² for midfielders."),
    ("In", "Shots on target, woodwork, non-penalty xG", "SOT · SOP · FPL xG − pens", "Threat. Penalty xG is taken out so a penalty earns nothing until it goes in."),
    ("In", "Penalties won, fouls suffered", "PKD · FS", "Small but real, mostly for forwards."),
    ("In", "Dispossessed, fouls committed", "DIS · FC", "Small negatives."),
    ("In", "Errors leading to a goal / shot", "ErG · ErS", "About −0.7 on the websites, at every position. We use −1.0."),
    ("In", "Penalty conceded, clearance off the line", "Pen · CLO", "Rare, but decisive when they happen."),
    ("In", "Accurate passes", "AP", "0.004 each: 50 passes ≈ +0.2."),
    ("In", "Saves, goals prevented", "FPL saves · xGOT faced − conceded", "Keepers' whole game (+0.31 R²). Goals prevented needs the shots export live."),
    ("Draft tilt", "Big chances missed", "BCM", "The websites barely count it (−0.03). We charge −0.25 because you asked."),
    ("Draft tilt", "Goals from outside the box", "GOB", "The websites give nothing extra. We give +0.3."),
    ("Out", "Successful dribbles", "FotMob only", "Helps forwards (+0.04), but the stats league only has attempts (CoA), so we cannot read it live."),
    ("Out", "Aerials won", "AER", "Already inside duels won; it goes negative once duels are counted."),
    ("Out", "Touches in the opponent's box", "FotMob only", "Adds nothing once shots and xG are in."),
    ("Out", "xGOT", "shots export", "Overlaps shots on target and goals; almost no gain."),
    ("Out", "FPL defensive contribution", "FPL DC", "A sum of stats we already count one by one."),
    ("Out", "Crosses, final-third passes, offsides", "Crs · SFTP · Off", "Negligible once passing and creation are in."),
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


ladder_html = ""
for step in R["ladder"]:
    cards = "".join(card(c) for c in step["examples"])
    ladder_html += f'<div class="rung"><div class="rung-h"><span class="big {band(step["band"])}">{step["band"]}</span><span>{step["count"]:,} matches round to {step["band"]}</span></div><div class="cards">{cards}</div></div>'

kinds_html = ""
for k in R["kinds"]:
    kinds_html += f'<section class="kind"><h3>{e(k["title"])}</h3><p class="q">{e(k["question"])}</p><p class="verdict">{e(verdict(k))}</p><div class="cards">{"".join(card(c) for c in k["cards"])}</div></section>'

sp = R["spread"]
spread_rows = "".join(f'<tr><td>{p}</td><td class="n">{sp[p]["n"]:,}</td><td class="n">{sp[p]["median"]}</td><td class="n">{sp[p]["p90"]}</td><td class="n">{sp[p]["nines"]}</td><td class="n">{sp[p]["tens"]}</td></tr>' for p in ["GK", "DEF", "MID", "FWD"])
spot = R["spotcheck"]
spot_txt = " · ".join(f'GW{s["gw"]}: {s["joined"]} players, {sum(1 for v in s["pairs"].values() if v["exact"] == v["n"])}/{len(s["pairs"])} stats exact' for s in spot)
ag = R["agreement"]
stat_rows = "".join(f'<tr><td><span class="tag t-{v[0].split()[0].lower()}">{v[0]}</span></td><td>{e(v[1])}</td><td class="src">{e(v[2])}</td><td>{e(v[3])}</td></tr>' for v in STAT_VERDICTS)
pos_html = "".join(f'<div><h4>{p}</h4>{table(R["byPos"][p], [("name", "Player"), ("club", "Club"), ("avg", "Avg", "n hl"), ("vs", "vs exp.", "n")])}</div>' for p in ["GK", "DEF", "MID", "FWD"])

page = f"""<title>Draft Match Ratings</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;800&family=Archivo+Narrow:wght@500;700&family=Oxanium:wght@600;800&display=swap">
<style>
:root {{
  color-scheme: dark;
  --bg: oklch(0.19 0.045 265); --surface: oklch(0.245 0.012 80); --raised: oklch(0.29 0.014 80);
  --line: oklch(0.40 0.012 80); --ink: oklch(0.97 0.008 80); --muted: oklch(0.78 0.022 80); --faint: oklch(0.66 0.022 80);
  --yours: oklch(0.88 0.16 95); --derived: oklch(0.82 0.13 210); --peak: oklch(0.78 0.17 60);
  --bad: oklch(0.66 0.215 22); --chrome: oklch(0.45 0.13 264); --good: oklch(0.80 0.17 150);
  --body: "Archivo", "Helvetica Neue", Arial, sans-serif; --narrow: "Archivo Narrow", "Arial Narrow", sans-serif;
  --digits: "Oxanium", "Archivo", monospace;
}}
body {{ background: var(--bg); color: var(--ink); font: 15px/1.5 var(--body); margin: 0; }}
.wrap {{ max-width: 1120px; margin: 0 auto; padding-inline: 16px; padding-block: 28px 64px; display: grid; gap: 40px; }}
h1, h2, h3, h4 {{ text-wrap: balance; margin: 0; }}
h1 {{ font: 800 clamp(30px, 5vw, 46px)/1.05 var(--body); letter-spacing: -0.01em; }}
h1 em {{ font-style: normal; color: var(--derived); }}
h2 {{ font: 700 13px/1 var(--narrow); text-transform: uppercase; letter-spacing: .12em; color: var(--yours);
     background: var(--chrome); padding: 8px 12px; }}
h3 {{ font: 700 19px/1.25 var(--body); }}
h4 {{ font: 700 12px var(--narrow); letter-spacing: .1em; color: var(--muted); margin-bottom: 6px; }}
p {{ margin: 0; max-width: 68ch; }}
section {{ display: grid; gap: 14px; }}
.lede {{ color: var(--muted); font-size: 16px; }}
.facts {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(min(150px, 100%), 1fr)); gap: 1px; background: var(--line); border: 1px solid var(--line); }}
.facts div {{ background: var(--surface); padding: 12px 14px; display: grid; gap: 2px; }}
.facts b {{ font: 800 24px var(--digits); color: var(--derived); font-variant-numeric: tabular-nums; }}
.facts span {{ color: var(--muted); font-size: 13px; }}
.cards {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(min(330px, 100%), 1fr)); gap: 10px; }}
.card {{ display: grid; grid-template-columns: 64px minmax(0, 1fr); background: var(--surface); border: 1px solid var(--line); }}
.mark {{ display: grid; place-content: center; text-align: center; gap: 2px; border-right: 1px solid var(--line); background: var(--raised); }}
.mark span {{ font: 800 26px var(--digits); font-variant-numeric: tabular-nums; }}
.mark small {{ font: 600 11px var(--narrow); color: var(--faint); }}
.b-top, .big.b-top {{ color: var(--peak); }} .b-high {{ color: var(--derived); }} .b-mid {{ color: var(--ink); }}
.b-low {{ color: var(--muted); }} .b-bad {{ color: var(--bad); }}
.body {{ padding: 10px 12px; display: grid; gap: 7px; min-width: 0; }}
.body header {{ display: flex; flex-wrap: wrap; gap: 4px 8px; align-items: baseline; }}
.body header strong {{ font-size: 16px; }}
.pos {{ font: 700 11px var(--narrow); color: var(--bg); background: var(--muted); padding: 1px 5px; }}
.fx {{ color: var(--muted); font: 500 13px var(--narrow); }}
.note {{ font-size: 13px; color: var(--yours); }}
.chips, .parts, .meta {{ display: flex; flex-wrap: wrap; gap: 4px 6px; }}
.chip {{ font: 500 12px var(--narrow); padding: 1px 6px; border: 1px solid var(--line); color: var(--muted); }}
.chip.ret {{ color: var(--ink); border-color: var(--good); }}
.chip.bad {{ color: var(--bad); border-color: color-mix(in oklch, var(--bad) 60%, var(--line)); }}
.part {{ font: 500 12px var(--narrow); color: var(--faint); }}
.part b {{ font-family: var(--digits); font-weight: 600; }}
.part.up b {{ color: var(--derived); }} .part.down b {{ color: var(--bad); }} .part.base b {{ color: var(--muted); }}
.meta {{ font: 500 11.5px var(--narrow); color: var(--faint); gap: 2px 12px; }}
.rung {{ display: grid; gap: 10px; }}
.rung-h {{ display: flex; align-items: baseline; gap: 12px; color: var(--muted); border-bottom: 1px solid var(--line); padding-bottom: 4px; }}
.big {{ font: 800 34px/1 var(--digits); }}
.kind {{ border-top: 1px solid var(--line); padding-top: 18px; }}
.q {{ color: var(--muted); }}
.verdict {{ color: var(--ink); border-left: 3px solid var(--derived); padding-left: 10px; }}
.scroll {{ overflow-x: auto; }}
table {{ border-collapse: collapse; width: 100%; font-size: 13.5px; }}
th {{ font: 700 11px var(--narrow); text-transform: uppercase; letter-spacing: .08em; color: var(--yours); text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--line); white-space: nowrap; }}
td {{ padding: 5px 8px; border-bottom: 1px solid color-mix(in oklch, var(--line) 50%, transparent); vertical-align: top; }}
td.n, th.n {{ text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }}
td.hl {{ color: var(--derived); font-weight: 600; }}
td.src {{ color: var(--faint); font: 500 12px var(--narrow); white-space: nowrap; }}
.wt td:first-child {{ color: var(--muted); font: 600 12px var(--narrow); }}
.tag {{ font: 700 11px var(--narrow); padding: 1px 6px; white-space: nowrap; }}
.t-in {{ background: color-mix(in oklch, var(--good) 25%, transparent); color: var(--good); }}
.t-out {{ background: color-mix(in oklch, var(--bad) 20%, transparent); color: var(--bad); }}
.t-draft {{ background: color-mix(in oklch, var(--yours) 20%, transparent); color: var(--yours); }}
.grid2 {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap: 18px; }}
.grid4 {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr)); gap: 18px; }}
.hist {{ display: grid; grid-template-columns: repeat(10, 1fr); gap: 6px; align-items: end; height: 170px; max-width: 560px; }}
.bar {{ display: grid; justify-items: center; align-content: end; gap: 4px; height: 100%; }}
.bar i {{ display: block; width: 100%; background: currentColor; }}
.bar .cnt {{ font: 600 11px var(--digits); color: var(--faint); }}
.bar .lab {{ font: 800 14px var(--digits); color: var(--muted); }}
ol.qs {{ margin: 0; padding-left: 22px; display: grid; gap: 10px; max-width: 72ch; }}
ol.qs b {{ color: var(--yours); }}
.small {{ font-size: 13px; color: var(--faint); }}
a {{ color: var(--derived); }}
:focus-visible {{ outline: 2px solid var(--yours); outline-offset: 2px; }}
@media (max-width: 420px) {{ .cards {{ grid-template-columns: 1fr; }} .card {{ grid-template-columns: 56px 1fr; }} }}
</style>
<div class="wrap">
<header style="display:grid;gap:12px">
  <p class="small">Tim Hortons Pro League · prototype for review · 25/26 backtest</p>
  <h1>Our own match rating, <em>out of ten</em></h1>
  <p class="lede">Every Premier League appearance of 25/26 is rated here: {R['matches']:,} matches, {R['rated']:,} long enough to rate. The mark is built for a draft league. Returns come first, weighed by who they came against. Threat, defending and mistakes then move it. A typical match is 6.5 at every position, and only the season's biggest days reach 10. Each card shows both versions: <b>A</b> is the match alone; <b>B</b> blends in how he did against what was expected of him.</p>
</header>

<div class="facts">
  <div><b>6.5</b><span>median mark, every position</span></div>
  <div><b>{sum(v["tens"] for v in sp.values())}</b><span>tens all season</span></div>
  <div><b>{ag['consensus']}</b><span>agreement with FotMob/SofaScore</span></div>
  <div><b>{ag['fplPoints']}</b><span>agreement with FPL points</span></div>
  <div><b>22/22</b><span>stats match the dummy league exactly</span></div>
</div>

<section>
  <h2>Questions for you</h2>
  <ol class="qs">
    <li><b>A or B?</b> B adds 0.35 of "against expectation" to the mark. It barely moves the table: Haaland stays 2nd; Burnley's Flemming moves from {next((s['rank'] for s in R['promoted'] if s['name']=='Flemming'), '—')} to {next((s['rankBlend'] for s in R['promoted'] if s['name']=='Flemming'), '—')}. The expectation reads best as its own column: Haaland's 27 goals are par (+1.1); Flemming's 11 are +5.2.</li>
    <li><b>Busy blank or quiet penalty?</b> Cherki's goalless match with lots of chances made rates above Anderson's penalty and little else. FotMob and SofaScore agree. In a draft league, should the penalty win?</li>
    <li><b>Opponent strength:</b> factor = strength<sup>0.7</sup>, held to 0.75–1.35. Sunderland's Ballard scoring and assisting against Arsenal gets 9.1, where the websites give 7.4. Too much?</li>
    <li><b>Reds and errors:</b> red −2.0, own goal −1.2, error leading to a goal −1.0. A defender's red lands near 3.3. Harsh enough?</li>
    <li><b>Keepers:</b> a median of 6.5, but only {sp['GK']['nines']} nines and no tens all season. Should a big save day reach 9 more often?</li>
  </ol>
</section>

<section>
  <h2>The ladder, 10 down to 2</h2>
  <p class="q">Three real matches for each whole mark, across positions, nearest the mark. <span class="small">The big number is A; B is underneath.</span></p>
  {ladder_html}
</section>

<section>
  <h2>Kinds of match</h2>
  {kinds_html}
</section>

<section>
  <h2>The star test</h2>
  <p class="q">Season averages, 900 minutes or more. "vs exp." sums his returns against what the projection expected before each match. "Websites" is the FotMob/SofaScore average.</p>
  {table(R['stars'], SEASON_COLS)}
  <div class="grid2">
    <div><h4>Promoted clubs' attackers, by vs expected</h4>{table(R['promoted'], [("name","Player"),("club","Club"),("goals","G","n"),("avg","Avg","n hl"),("rank","Rank","n"),("vs","vs exp.","n")])}</div>
    <div><h4>Most above expectation</h4>{table(R['bestVs'], [("name","Player"),("club","Club"),("goals","G","n"),("avg","Avg","n hl"),("vs","vs exp.","n")])}
    <h4 style="margin-top:14px">Most below expectation</h4>{table(R['worstVs'], [("name","Player"),("club","Club"),("goals","G","n"),("avg","Avg","n hl"),("vs","vs exp.","n")])}</div>
  </div>
  <h4>Best average by position</h4>
  <div class="grid4">{pos_html}</div>
</section>

<section>
  <h2>How the marks spread</h2>
  <div class="grid2">
    <div>{histogram()}<p class="small">Every rated match, rounded to the whole mark.</p></div>
    <div><div class="scroll"><table><thead><tr><th>Pos</th><th class="n">60+ min</th><th class="n">Median</th><th class="n">Top 10%</th><th class="n">9s</th><th class="n">10s</th></tr></thead><tbody>{spread_rows}</tbody></table></div>
    <p class="small" style="margin-top:8px">Correlation with FotMob {ag['fotmob']}, SofaScore {ag['sofascore']}, their average {ag['consensus']}, FPL points {ag['fplPoints']}.</p></div>
  </div>
</section>

<section>
  <h2>Where we part from the websites</h2>
  <p class="q">Our five biggest marks above the FotMob/SofaScore average, then our five biggest below. The gaps are mostly the draft tilt: returns, the opponent, and mistakes.</p>
  <h4>We rate higher</h4><div class="cards">{"".join(card(c) for c in R['higher'])}</div>
  <h4>We rate lower</h4><div class="cards">{"".join(card(c) for c in R['lower'])}</div>
</section>

<section>
  <h2>Which stats made the cut</h2>
  <p class="q">Every candidate was tested for what it adds once goals, assists and clean sheets are counted, per position, against the FotMob/SofaScore average. A stat we cannot read live this season was dropped however well it did. Live sources: FPL per fixture, and the dummy league's Opta columns (short codes shown).</p>
  <div class="scroll"><table><thead><tr><th></th><th>Stat</th><th>Live source</th><th>Why</th></tr></thead><tbody>{stat_rows}</tbody></table></div>
  <p class="small">The 25/26 counts came from the sister repo's SofaScore and FotMob files. Checked against the dummy league for two gameweeks: {spot_txt} (key passes differ on 3 rows). They are the same Opta feed.</p>
</section>

<section>
  <h2>The scale</h2>
  <p class="q">A typical match starts at the base for his position (GK 6.0, DEF 6.0, MID 5.8, FWD 6.15), up to 0.5 lower for a short cameo. Each part adds its stats at so many points apiece. Above 8.5, each further point counts 0.73, and the mark is capped at 10. Under 10 minutes, a man is rated only if something happened. Opponent strength is the sister repo's team model as it stood before that gameweek.</p>
  {weights_table()}
</section>

<section>
  <h2>Season's top 25 and bottom 15</h2>
  <div class="cards">{"".join(card(c) for c in R['top'])}</div>
  <h4>Bottom 15</h4>
  <div class="cards">{"".join(card(c) for c in R['bottom'])}</div>
</section>
</div>
"""
(HERE / "draft-ratings.html").write_text(page)
print("wrote", len(page) // 1024, "KB")
