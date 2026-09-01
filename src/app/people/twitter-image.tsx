// X/Twitter reads twitter:image, not og:image. Without this file the card falls
// back to the site-wide static /images/site/og.jpg while Discord, Slack and
// iMessage get the per-route generated image from opengraph-image.tsx — so the
// same link previewed very differently depending on where it was shared.
import OGImage, {
  alt as ogAlt,
  size as ogSize,
  contentType as ogContentType,
} from "./opengraph-image";

export const runtime = "nodejs";
export const alt = ogAlt;
export const size = ogSize;
export const contentType = ogContentType;

export default OGImage;
