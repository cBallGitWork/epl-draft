// Our screen beside Championship Manager's in one PNG, CM's 800x600 left and ours at the same height right, drawn in
// the open browser. Read the output: a composite nobody opens is two screenshots in a directory.
//   node tools/ui/compare.mjs <route> <cm9900/NN.jpg> [out.png] [--width 1440] [--team-cookie <file>]

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CAPTURE_CEILING, DESK, connect, parseArgs, teamCookie } from "./cdp.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2));
const [route, reference, out = "compare.png"] = positional;
if (!route || !reference) {
  console.error(
    `usage: node tools/ui/compare.mjs <route> <docs/ui/reference/cm9900/NN.jpg> [out.png] [--width ${DESK.width}]`,
  );
  process.exit(1);
}

/** CM's canvas, which every reference shot is; ours is scaled to its height so rows line up across the pair. */
const CM = { width: 800, height: 600 };

const width = Number(flags.width ?? DESK.width);
const height = Number(flags.height ?? DESK.height);

/** How far to blow the pair up: the most `CAPTURE_CEILING` allows, since a capture past it hangs. */
const pairBox = (zoom) => ({
  width: Math.round(CM.width * zoom + (width / height) * CM.height * zoom) + 40,
  height: Math.round(CM.height * zoom) + 60,
});
let zoom = 2;
while (zoom > 1 && pairBox(zoom).width * pairBox(zoom).height > CAPTURE_CEILING) zoom -= 0.05;
const pair = pairBox(zoom);

const cdp = await connect();
await cdp.setCookie(teamCookie(flags));
await cdp.setViewport(width, height, 1);
await cdp.open(route);
const live = await cdp.send("Page.captureScreenshot", { format: "png" });

const dir = mkdtempSync(join(tmpdir(), "cm-compare-"));
const page = join(dir, "compare.html");
writeFileSync(
  page,
  `<!doctype html><meta charset="utf-8">
<style>
  body { margin:0; background:#111; color:#eee; font:12px ui-monospace,monospace; display:flex; }
  figure { margin:0; }
  figcaption { padding:4px 8px; background:#000; white-space:nowrap; }
  img { display:block; height:${Math.round(CM.height * zoom)}px; width:auto; image-rendering:auto; }
</style>
<figure>
  <figcaption>Championship Manager 99/00 &mdash; ${reference.split("/").pop()} (${CM.width}&times;${CM.height})</figcaption>
  <img src="data:image/jpeg;base64,${readFileSync(reference).toString("base64")}">
</figure>
<figure>
  <figcaption>ours &mdash; ${route} @ ${width}&times;${height}</figcaption>
  <img src="data:image/png;base64,${live.data}">
</figure>`,
);

// Wide enough that neither is cropped: the live shot is the wider of the two once scaled.
await cdp.setViewport(pair.width, pair.height);
await cdp.send("Page.navigate", { url: `file://${page}` });
await new Promise((resolve) => setTimeout(resolve, 900));
const composite = await cdp.send("Page.captureScreenshot", { format: "png" });
writeFileSync(out, Buffer.from(composite.data, "base64"));

console.log(`${out} written — ${reference} beside ${route} @ ${width}x${height}`);
console.log("Now OPEN it. The differences are whatever does not line up.");
cdp.close();
