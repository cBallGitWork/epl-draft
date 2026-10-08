// Screenshot one route at device scale 2, so text can be judged; then open the PNG and look at it.
//
//   node tools/ui/shot.mjs <route> <out.png> [--width 390] [--height 844] [--team-cookie <file>]

import { writeFileSync } from "node:fs";
import { PHONE, connect, parseArgs, teamCookie } from "./cdp.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2));
const [route, out] = positional;
if (!route || !out) {
  console.error(
    `usage: node tools/ui/shot.mjs <route> <out.png> [--width ${PHONE.width}] [--height ${PHONE.height}] [--team-cookie <file>]`,
  );
  process.exit(1);
}

const width = Number(flags.width ?? PHONE.width);
const height = Number(flags.height ?? PHONE.height);

const cdp = await connect();
await cdp.setCookie(teamCookie(flags));
await cdp.setViewport(width, height, 2);
await cdp.open(route);
const shot = await cdp.send("Page.captureScreenshot", { format: "png" });
writeFileSync(out, Buffer.from(shot.data, "base64"));
console.log(`${out} written (${route} @ ${width}x${height})`);
cdp.close();
