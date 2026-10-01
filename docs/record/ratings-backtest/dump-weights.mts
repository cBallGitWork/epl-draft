import { writeFileSync } from "node:fs";
import { RATING_WEIGHTS } from "../ratings/packages/core/src/football/rating/weights.ts";
writeFileSync(new URL("weights.json", import.meta.url), JSON.stringify(RATING_WEIGHTS, null, 1));
