import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { OPENAI_IMAGES_URL, type PublishedStory } from "@epl/core";

// The splash picture: one image for the paper's lead, drawn in CI.
//
// **An editorial cartoon, never a photograph and never a likeness.** A drawing
// sits on newsprint the way a photograph does not, and it sidesteps the whole
// question of putting a generated face on a real footballer — which is the one
// thing this paper must not do. DESIGN's own rule already says a wrong
// photograph is worse than none.
//
// **Every failure here is silent and costs the picture, never the paper.** The
// prose is already written and validated by the time this runs; a paper with a
// headline and no drawing is a paper, and a run that failed after filing would
// throw away a column that cost a model call. So this returns null on anything
// going wrong — no key, a refusal, a bad payload — and the caller carries on.

const MODEL = process.env.GAZETTA_IMAGE_MODEL ?? "gpt-image-1";

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
    say("No OPENAI_API_KEY; filing without a picture.");
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
    });
    if (!response.ok) {
      say(`Image API answered ${response.status}; filing without a picture.`);
      return null;
    }

    const body = (await response.json()) as { data?: { b64_json?: string }[] };
    const encoded = body.data?.[0]?.b64_json;
    if (typeof encoded !== "string" || encoded === "") {
      say("Image API returned no picture; filing without one.");
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
    say(`Could not draw the splash (${String(error)}); filing without a picture.`);
    return null;
  }
}

function say(message: string): void {
  console.log(message);
}
