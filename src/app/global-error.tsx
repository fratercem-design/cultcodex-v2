"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body
        style={{
          backgroundColor: "#0a0a0f",
          color: "#c8c8d0",
          fontFamily: "monospace",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          margin: 0,
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 480 }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⚠</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#FFB800", marginBottom: 8 }}>
            TRANSMISSION FAILURE
          </h1>
          <p style={{ fontSize: 12, color: "#8c8c9a", lineHeight: 1.6, marginBottom: 8 }}>
            A critical error disrupted the signal. The archive could not be reached.
          </p>
          {error.digest && (
            <p style={{ fontSize: 10, color: "#8c8c9a", marginBottom: 20 }}>
              Error ID: {error.digest}
            </p>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={reset}
              style={{
                padding: "8px 20px",
                background: "transparent",
                border: "1px solid #FFB800",
                borderRadius: 4,
                color: "#FFB800",
                fontFamily: "monospace",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              RETRY
            </button>
            <Link
              href="/"
              style={{
                padding: "8px 20px",
                background: "transparent",
                border: "1px solid #444",
                borderRadius: 4,
                color: "#8c8c9a",
                fontFamily: "monospace",
                fontSize: 11,
                textDecoration: "none",
              }}
            >
              RETURN HOME
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
