// Our screen and Championship Manager's, side by side, in one image.
//
//   node tools/ui/compare.mjs <route> <cm9900/NN.jpg> [out.png] [--width 1440] [--team-cookie <file>]
//
// The acceptance test this whole conversion is judged by is a comparison — "put
// a CM screenshot beside the same-shaped screen; if a stranger can tell which
// decade each belongs to, it has not landed" — and until now it was taken by
// opening two images one after the other, which is not a comparison, it is two
// looks and a memory between them. Differences of a few pixels in a row height,
// a plate's weight or a strip's alignment do not survive that gap.
//
// So this composes both into a single PNG: the reference on the left at its own
// 800×600, ours on the right, scaled to the same height, each labelled. One
// image, one look, and the differences are the things that are not lined up.
//
// It renders the pair in the browser that is already open rather than reaching
// for an image library, because the drawer's rule is that these talk to a
// running headless Chrome and nothing else.
//
// **Read the output.** A composite nobody opens is two screenshots in a
// directory. `shot.mjs` says the same thing and means it just as much.

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { connect, parseArgs, teamCookie } from "./cdp.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2));
const [route, reference, out = "compare.png"] = positional;
if (!route || !reference) {
  console.error(
    "usage: node tools/ui/compare.mjs <route> <docs/ui/reference/cm9900/NN.jpg> [out.png] [--width 1440]",
  );
  process.exit(1);
}

/** CM's canvas, which every reference shot in the library is (README, measured).
 *  Ours is scaled to this height so a row in one is the same distance down the
 *  image as a row in the other — which is the whole point of putting them in a
 *  line. */
const CM = { width: 800, height: 600 };

const width = Number(flags.width ?? 1440);
const height = Number(flags.height ?? 900);

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
  img { display:block; height:${CM.height * 2}px; width:auto; image-rendering:auto; }
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

// Tall enough for both at double CM's height, and wide enough that neither is
// cropped: the live shot is the wider of the two once scaled, and a composite
// that clips the thing being judged is worse than no composite.
await cdp.setViewport(Math.round(CM.width * 2 + (width / height) * CM.height * 2) + 40, CM.height * 2 + 60);
await cdp.send("Page.navigate", { url: `file://${page}` });
await new Promise((resolve) => setTimeout(resolve, 900));
const composite = await cdp.send("Page.captureScreenshot", { format: "png" });
writeFileSync(out, Buffer.from(composite.data, "base64"));

console.log(`${out} written — ${reference} beside ${route} @ ${width}x${height}`);
console.log("Now OPEN it. The differences are whatever does not line up.");
cdp.close();
