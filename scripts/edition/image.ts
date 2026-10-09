import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { MODEL_TIMEOUT_MS, NEWSROOM, OPENAI_IMAGES_URL, type PublishedStory } from "@epl/core";

// The splash picture for the paper's lead, drawn in CI: an editorial cartoon, never a photograph and never a likeness
// of a real footballer. Any failure (no key, a refusal, a bad payload) returns null and costs the picture, never the
// paper: the column is already written and paid for.

const MODEL = process.env.GAZETTA_IMAGE_MODEL ?? NEWSROOM.illustrator;

/** Where the app serves it from. `public/` and not `data/`: Next serves this
 *  directory statically, and `data/` is not reachable from a browser. */
const PUBLIC_ROOT = fileURLToPath(new URL("../../apps/companion/public/paper/", import.meta.url));

/** The house style, in one string. Craig's copy, and the whole reason the
 *  pictures will look like one paper's rather than like a model's default. */
const STYLE =
  "A single-colour editorial cartoon in the style of a 1990s British sports newspaper: " +
  "bold ink linework, cross-hatched shading, no text or lettering anywhere in the image, " +
  "no recognisable real people, no club badges or sponsor logos. " +
  "Warm off-white paper background, dark brown-black ink.";

export interface Splash {
  src: string;
  alt: string;
}

/** Draw the lead, or answer null and let the paper go out without a picture. */
export async function drawSplash(story: PublishedStory): Promise<Splash | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.log("No OPENAI_API_KEY; filing without a picture.");
    return null;
  }

  try {
    // The DECK and not the headline: the headline is wordplay, and a pun
    // handed to an illustrator produces a picture of the pun.
    const subject = story.deck === "" ? story.headline : story.deck;
    const response = await fetch(OPENAI_IMAGES_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        prompt: `${STYLE}\n\nThe drawing illustrates this sports story: ${subject}`,
        size: "1024x1024",
        n: 1,
      }),
      signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
    });
    if (!response.ok) {
      console.log(`Image API answered ${response.status}; filing without a picture.`);
      return null;
    }

    const body = (await response.json()) as { data?: { b64_json?: string }[] };
    const encoded = body.data?.[0]?.b64_json;
    if (typeof encoded !== "string" || encoded === "") {
      console.log("Image API returned no picture; filing without one.");
      return null;
    }

    mkdirSync(PUBLIC_ROOT, { recursive: true });
    writeFileSync(join(PUBLIC_ROOT, `${story.slug}.png`), Buffer.from(encoded, "base64"));
    return {
      src: `/paper/${story.slug}.png`,
      // The alt is the deck, which is the story in plain words — a drawing of
      // a story is described by the story.
      alt: subject,
    };
  } catch (error) {
    console.log(`Could not draw the splash (${String(error)}); filing without a picture.`);
    return null;
  }
}
