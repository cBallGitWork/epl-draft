import { APPLE_ICON_SIZE, appIcon } from "./appIcon";

export const size = { width: APPLE_ICON_SIZE, height: APPLE_ICON_SIZE };
export const contentType = "image/png";

export default function AppleIcon() {
  return appIcon(APPLE_ICON_SIZE);
}
