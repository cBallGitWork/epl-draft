---
name: shoot
description: Screenshot a route at a phone or desk width and then LOOK at the image. Use whenever a claim about what a screen looks like needs settling, and after any visible change.
argument-hint: "[route] [width] [--team <teamId>]"
---

# Take the picture, then look at it

A screenshot nobody opens is not verification. The last step of this skill is
reading the PNG back, and the skill is not done until you have.

## 1. The app has to be up

```bash
curl -sf -o /dev/null -w '%{http_code}\n' http://localhost:3000/ || npm run dev
```

If you start one, note that a hook will ask first when a server is already
running — a second `npm run dev` silently takes another port and every
`BASE_URL` then points at the old one.

## 2. Chrome has to be up

The instruments talk to an already-running headless Chrome; they never launch
one, because a launched browser must also be killed and the killing is where two
sessions on one machine tread on each other.

```bash
curl -sf http://localhost:9261/json/version >/dev/null || \
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    --headless=new --disable-gpu --remote-debugging-port=9261 \
    --no-first-run --user-data-dir="$(mktemp -d)" about:blank &
```

## 3. Shoot

```bash
node tools/ui/shot.mjs <route> <out.png> [--width 390] [--height 844]
```

390×844 is the phone this product is designed for. 1440 is the desk. Shoot both
when the change touches a layout; docs/rules/DESIGN.md's two registers fail differently at
the two widths.

## 4. `--team <teamId>`

Routes that personalise need a signed cookie. Mint one from the secret the app
itself verifies against — never a positional argument, because a cookie in shell
history is a session:

```bash
node --env-file=apps/companion/.env.local -e '
  const {createHmac}=require("node:crypto");
  const id=process.argv[1];
  process.stdout.write(id+"."+createHmac("sha256",process.env.SESSION_SECRET).update(id).digest("hex"));
' <teamId> > "$TMPDIR/team.cookie"

node tools/ui/shot.mjs /squad/<teamId> out.png --team-cookie "$TMPDIR/team.cookie"
```

A team id comes off any squad or matchup link. Delete the file when done.

## 5. Read the PNG

Open it with the Read tool. Then say what is actually in it, against docs/rules/DESIGN.md:

- Does anything overflow, clip, or scroll sideways?
- Is every colour in its slot — accent only for yours/selected/active, league
  red never for "active", live red only for a match in play?
- Is absence an em dash rather than a nought?
- Are figures in Archivo Narrow, tabular?
- Are taps `min-h-11` **at phone width**? At desk width a repeating row is 28px
  and a control 36 (`.cm-row`, docs/rules/PRODUCT.md). For a number rather than an
  impression, `node tools/ui/tapfit.mjs`.

## Beside the game

```bash
node tools/ui/compare.mjs <route> docs/ui/reference/cm9900/NN.jpg out.png [--width 1440]
```

Composes the reference and a live screenshot into ONE image, scaled to the same
height and labelled. The acceptance test for the whole conversion is a
comparison — "if a stranger can tell which decade each belongs to, it has not
landed" — and taking it by opening two images in sequence is two looks with a
memory in between, which loses exactly the differences worth finding: a row
pitch, a plate's weight, how much of the screen the content actually fills.
`docs/ui/reference/README.md` says which shot is which screen.

**Never report a screenshot you have not opened.** "Shot written" is a file
operation, not an observation, and the difference has cost this repo a day.

For a claim about a measurement rather than an appearance — a font size, a
scroll height, a computed colour — use `tools/ui/probe.mjs` instead and measure
the rendered value. Never the CSS that was written.
