import { writeFileSync } from "node:fs";
import { RATING_WEIGHTS } from "../ratings/packages/core/src/join/rating/weights.ts";
writeFileSync(new URL("weights.json", import.meta.url), JSON.stringify(RATING_WEIGHTS, null, 1));
