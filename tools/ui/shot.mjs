// Screenshot one route.
//
//   node tools/ui/shot.mjs <route> <out.png> [--width 390] [--height 844] [--team-cookie <file>]
//
// Device scale 2, so text is judgeable when the PNG is read back. A screenshot
// nobody looks at is not verification — the caller's next step is to open it.

import { writeFileSync } from "node:fs";
import { connect, parseArgs, teamCookie } from "./cdp.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2));
const [route, out] = positional;
if (!route || !out) {
  console.error("usage: node tools/ui/shot.mjs <route> <out.png> [--width 390] [--height 844] [--team-cookie <file>]");
  process.exit(1);
}

const width = Number(flags.width ?? 390);
const height = Number(flags.height ?? 844);

const cdp = await connect();
await cdp.setCookie(teamCookie(flags));
await cdp.setViewport(width, height, 2);
await cdp.open(route);
const shot = await cdp.send("Page.captureScreenshot", { format: "png" });
writeFileSync(out, Buffer.from(shot.data, "base64"));
console.log(`${out} written (${route} @ ${width}x${height})`);
cdp.close();
