import type { MetadataRoute } from "next";
import { LEAGUE_NAME } from "@epl/core";
import { MANIFEST_ICON_SIZES } from "./appIcon";
import { APP_SHORT_NAME, TOKEN_SRGB } from "./config";

// What a phone needs to install the app: a name, a window without the browser's bar, and icons.

export default function manifest(): MetadataRoute.Manifest {
  const icons = MANIFEST_ICON_SIZES.map((size) => ({
    src: `/icon/${size}`,
    sizes: `${size}x${size}`,
    type: "image/png",
  }));
  return {
    name: LEAGUE_NAME,
    short_name: APP_SHORT_NAME,
    start_url: "/",
    display: "standalone",
    background_color: TOKEN_SRGB.bg,
    theme_color: TOKEN_SRGB.bg,
    // The crest sits inside Android's safe circle, so the same squares serve as maskable.
    icons: [...icons, ...icons.map((icon) => ({ ...icon, purpose: "maskable" as const }))],
  };
}
