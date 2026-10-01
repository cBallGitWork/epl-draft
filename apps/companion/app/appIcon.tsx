import { ImageResponse } from "next/og";
import { LEAF } from "./components/shell/LeagueCrest";
import { TOKEN_SRGB } from "./config";

// The home-screen icon: `LeagueCrest`'s mark on the desk's navy, drawn with literal colours because a PNG
// cannot read a token. A second copy of the mark's geometry, so a change to one is a change to both.

/** The square sizes Chrome wants before it offers to install: 192 for the launcher, 512 for the splash. */
export const MANIFEST_ICON_SIZES = [192, 512] as const;

/** iOS's apple-touch-icon. */
export const APPLE_ICON_SIZE = 180;

/** How wide the crest sits in the square: inside the 80% circle Android's maskable icons keep. */
const CREST_SPAN = 0.75;

export function appIcon(size: number): ImageResponse {
  const width = Math.round(size * CREST_SPAN);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: TOKEN_SRGB.bg,
        }}
      >
        <svg viewBox="0 0 64 44" width={width} height={Math.round((width * 44) / 64)}>
          <ellipse cx="32" cy="22" rx="31.5" ry="21.5" fill={TOKEN_SRGB.league} />
          <ellipse cx="32" cy="22" rx="28" ry="18" fill="none" strokeWidth="2" stroke={TOKEN_SRGB.cream} />
          <path
            fill={TOKEN_SRGB.cream}
            transform="translate(16 4) scale(0.32) translate(-0.02 -0.34) scale(0.0208437)"
            d={LEAF}
          />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
