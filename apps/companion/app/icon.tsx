import { appIcon, MANIFEST_ICON_SIZES } from "./appIcon";

// The browser tab's icon and the manifest's, one per size, at `/icon/{size}`.

export function generateImageMetadata() {
  return MANIFEST_ICON_SIZES.map((size) => ({
    id: String(size),
    size: { width: size, height: size },
    contentType: "image/png",
  }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
  return appIcon(Number(await id));
}
