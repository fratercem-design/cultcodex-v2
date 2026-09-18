import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";

/**
 * Browsers drop the *entire* `Permissions-Policy` header when it fails to
 * parse, and log a console warning for any feature name they do not
 * recognise. The audit (BUG-02) caught exactly that: the site shipped a
 * `vr=()` directive, which was never a registered feature — the VR/AR
 * capability it was aiming at is `xr-spatial-tracking`.
 *
 * Registered policy-controlled features, per the W3C feature registry and
 * the features Chromium ships. Anything not on this list either does not
 * exist or is too new to assume; add it deliberately rather than by typo.
 */
const KNOWN_FEATURES = new Set([
  "accelerometer",
  "ambient-light-sensor",
  "attribution-reporting",
  "autoplay",
  "bluetooth",
  "browsing-topics",
  "camera",
  "clipboard-read",
  "clipboard-write",
  "compute-pressure",
  "cross-origin-isolated",
  "display-capture",
  "encrypted-media",
  "fullscreen",
  "gamepad",
  "geolocation",
  "gyroscope",
  "hid",
  "identity-credentials-get",
  "idle-detection",
  "local-fonts",
  "magnetometer",
  "microphone",
  "midi",
  "otp-credentials",
  "payment",
  "picture-in-picture",
  "publickey-credentials-create",
  "publickey-credentials-get",
  "screen-wake-lock",
  "serial",
  "storage-access",
  "usb",
  "web-share",
  "window-management",
  "xr-spatial-tracking",
]);

async function headerValue(key: string): Promise<string> {
  const groups = await nextConfig.headers!();
  const values = groups
    .flatMap((group) => group.headers)
    .filter((header) => header.key.toLowerCase() === key.toLowerCase())
    .map((header) => header.value);

  expect(values, `expected exactly one ${key} header`).toHaveLength(1);
  return values[0];
}

describe("Permissions-Policy", () => {
  it("names only registered policy-controlled features", async () => {
    const value = await headerValue("Permissions-Policy");

    const names = value.split(",").map((directive) => directive.split("=")[0].trim());
    expect(names.length).toBeGreaterThan(0);

    const unknown = names.filter((name) => !KNOWN_FEATURES.has(name));
    expect(unknown, `unrecognised Permissions-Policy feature(s): ${unknown.join(", ")}`).toEqual([]);
  });

  it("gives every directive a parseable allowlist", async () => {
    const value = await headerValue("Permissions-Policy");

    for (const directive of value.split(",")) {
      expect(directive.trim()).toMatch(/^[a-z-]+=(\*|\(\s*[^()]*\s*\)|self)$/);
    }
  });
});
