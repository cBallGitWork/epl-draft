import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { PublishedStory } from "@epl/core";
import { PAPER_NAME, TOKEN_SRGB } from "./config";
import { sharePicture } from "./sharePicture";

// The picture a shared article link previews with: the masthead, the headline and the byline on the paper's
// stock, beside the story's drawing or its columnist's photograph. Literal colours: a PNG cannot read a token.

export const SHARE_CARD = { width: 1200, height: 630 } as const;

/** `.paper`'s stock, ink and print red, as paper.css sets them. Change with it. */
const STOCK = { paper: TOKEN_SRGB.paper, ink: "#2a2018", red: "#8f2318", muted: "rgba(42, 32, 24, 0.7)" } as const;

const PICTURE_WIDTH = 470;

/** A file under the app's root, which is `next start`'s working directory locally and on Vercel. */
const local = (path: string) => readFile(join(process.cwd(), path));

/** The story's picture as a data URL, since the renderer fetches nothing. */
async function pictureOf(story: Pick<PublishedStory, "image" | "reporter">): Promise<string | null> {
  const src = sharePicture(story);
  if (src === null) return null;
  const type = src.endsWith(".png") ? "png" : src.endsWith(".webp") ? "webp" : "jpeg";
  return `data:image/${type};base64,${(await local(join("public", src))).toString("base64")}`;
}

export async function shareCard(
  story: Pick<PublishedStory, "headline" | "edition" | "image" | "reporter">,
): Promise<ImageResponse> {
  const [display, picture] = await Promise.all([local("app/fonts/fraunces/card-800.ttf"), pictureOf(story)]);
  const byline = [story.reporter ? `By ${story.reporter}` : null, story.edition].filter(Boolean).join(" · ");
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: STOCK.paper, color: STOCK.ink }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "56px 56px 52px" }}>
          <div style={{ display: "flex", height: 8, background: STOCK.ink }} />
          <div style={{ display: "flex", marginTop: 18, fontFamily: "Fraunces", fontSize: 44 }}>{PAPER_NAME}</div>
          <div style={{ display: "flex", height: 3, marginTop: 14, background: STOCK.red }} />
          <div style={{ display: "flex", flex: 1, alignItems: "center", fontFamily: "Fraunces", fontSize: 78, lineHeight: 1.02 }}>
            {story.headline}
          </div>
          <div style={{ display: "flex", fontSize: 24, letterSpacing: 3, color: STOCK.muted, textTransform: "uppercase" }}>
            {byline}
          </div>
        </div>
        {picture ? (
          // eslint-disable-next-line @next/next/no-img-element -- a PNG renderer, not a page
          <img
            src={picture}
            alt=""
            width={PICTURE_WIDTH}
            height={SHARE_CARD.height}
            style={{ objectFit: "cover" }}
          />
        ) : null}
      </div>
    ),
    { ...SHARE_CARD, fonts: [{ name: "Fraunces", data: display, weight: 800, style: "normal" }] },
  );
}
