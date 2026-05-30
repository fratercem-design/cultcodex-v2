#!/usr/bin/env node
/**
 * Downloads the yt-dlp pre-built binary into bin/yt-dlp.
 * Runs as part of the npm postinstall hook so Railway always has it.
 * On non-Linux platforms (developer machines) this is skipped; install yt-dlp locally via pip/brew.
 */

const https = require("https");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const BIN_DIR = path.join(__dirname, "..", "bin");
const BIN_PATH = path.join(BIN_DIR, "yt-dlp");
const URL = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp";

// Already on PATH (e.g. developer has it via pip/brew)
try {
  const result = execSync("which yt-dlp 2>/dev/null || command -v yt-dlp 2>/dev/null", { encoding: "utf-8" }).trim();
  if (result) {
    console.log(`[postinstall] yt-dlp found on PATH at ${result} — skipping download`);
    process.exit(0);
  }
} catch {
  // not on PATH, continue
}

// Already downloaded
if (fs.existsSync(BIN_PATH) && fs.statSync(BIN_PATH).size > 100_000) {
  console.log(`[postinstall] yt-dlp already at ${BIN_PATH}`);
  process.exit(0);
}

// Only auto-download on Linux (Railway / CI)
if (process.platform !== "linux") {
  console.log("[postinstall] Non-Linux — skipping yt-dlp download. Install it manually if needed.");
  process.exit(0);
}

fs.mkdirSync(BIN_DIR, { recursive: true });

function download(url, dest, redirects = 0) {
  if (redirects > 5) {
    console.error("[postinstall] Too many redirects fetching yt-dlp");
    process.exit(0); // don't fail the build
  }
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "node-fetch" } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location, dest, redirects + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
      file.on("error", reject);
    }).on("error", reject);
  });
}

console.log("[postinstall] Downloading yt-dlp binary…");
download(URL, BIN_PATH)
  .then(() => {
    fs.chmodSync(BIN_PATH, "755");
    console.log(`[postinstall] yt-dlp installed at ${BIN_PATH}`);
  })
  .catch((err) => {
    // Non-fatal: Whisper endpoint will show a clear error instead of crashing the build
    console.error("[postinstall] yt-dlp download failed:", err.message);
    try { fs.unlinkSync(BIN_PATH); } catch {}
  });
