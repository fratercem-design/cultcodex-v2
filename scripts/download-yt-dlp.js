#!/usr/bin/env node
/**
 * Downloads the yt-dlp pre-built binary into bin/yt-dlp at project root.
 * Always writes to bin/yt-dlp so the runtime has it in a stable, known path —
 * even if yt-dlp is on PATH during the build (Nixpacks PATH differs at runtime).
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const BIN_DIR = path.join(__dirname, "..", "bin");
const BIN_PATH = path.join(BIN_DIR, "yt-dlp");
const URL = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp";

// Only auto-download on Linux (Railway / CI). Developers install via pip/brew.
if (process.platform !== "linux") {
  console.log("[postinstall] Non-Linux — skipping yt-dlp download.");
  process.exit(0);
}

// Already downloaded and non-trivial size
if (fs.existsSync(BIN_PATH) && fs.statSync(BIN_PATH).size > 100_000) {
  console.log(`[postinstall] yt-dlp already at ${BIN_PATH}`);
  process.exit(0);
}

fs.mkdirSync(BIN_DIR, { recursive: true });

function download(url, dest, redirects) {
  if (redirects === undefined) redirects = 0;
  if (redirects > 10) {
    console.error("[postinstall] Too many redirects — giving up");
    process.exit(0);
  }
  https.get(url, { headers: { "User-Agent": "cultcodex-postinstall/1.0" } }, function(res) {
    if (res.statusCode === 301 || res.statusCode === 302) {
      return download(res.headers.location, dest, redirects + 1);
    }
    if (res.statusCode !== 200) {
      console.error("[postinstall] yt-dlp download failed: HTTP " + res.statusCode);
      process.exit(0); // non-fatal — Whisper endpoint will show a clear error
    }
    var file = fs.createWriteStream(dest);
    res.pipe(file);
    file.on("finish", function() {
      file.close(function() {
        fs.chmodSync(dest, "755");
        var size = (fs.statSync(dest).size / 1024 / 1024).toFixed(1);
        console.log("[postinstall] yt-dlp downloaded to " + dest + " (" + size + " MB)");
      });
    });
    file.on("error", function(err) {
      console.error("[postinstall] Write error:", err.message);
      try { fs.unlinkSync(dest); } catch(_) {}
      process.exit(0);
    });
  }).on("error", function(err) {
    console.error("[postinstall] Network error:", err.message);
    process.exit(0);
  });
}

console.log("[postinstall] Downloading yt-dlp to " + BIN_PATH + "...");
download(URL, BIN_PATH, 0);
