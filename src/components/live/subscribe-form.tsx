"use client";

import { useState } from "react";

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [pushStatus, setPushStatus] = useState<
    "idle" | "loading" | "granted" | "denied" | "unsupported"
  >("idle");
  const [message, setMessage] = useState("");

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus("success");
        setMessage("You'll be notified when we go live!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage("Something went wrong. Try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Try again.");
    }
  }

  async function handleEnablePush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushStatus("unsupported");
      return;
    }

    setPushStatus("loading");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushStatus("denied");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Get VAPID key
      const vapidRes = await fetch("/api/subscribe/vapid");
      const { publicKey } = await vapidRes.json();

      if (!publicKey) {
        setPushStatus("denied");
        return;
      }

      // Convert VAPID key to ArrayBuffer for PushManager
      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      // Send subscription to server
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email || undefined,
          pushSubscription: subscription.toJSON(),
        }),
      });

      setPushStatus("granted");
    } catch (err) {
      console.error("Push subscription failed:", err);
      setPushStatus("denied");
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <h3 className="mb-1 font-mono text-sm font-bold text-[#ffd700]">
        GET NOTIFIED WHEN WE GO LIVE
      </h3>
      <p className="mb-4 font-mono text-xs text-text-muted">
        Never miss a stream — get an email or push notification.
      </p>

      <form onSubmit={handleEmailSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 rounded border border-border bg-void px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted/50 focus:border-[#ffd700]/50 focus:outline-none focus:ring-1 focus:ring-[#ffd700]/30"
          required
          disabled={status === "loading" || status === "success"}
        />
        <button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="rounded border border-[#ffd700] bg-[#ffd700]/10 px-4 py-2 font-mono text-xs font-bold text-[#ffd700] transition hover:bg-[#ffd700]/20 disabled:opacity-50"
        >
          {status === "loading"
            ? "..."
            : status === "success"
              ? "✓"
              : "Notify Me"}
        </button>
      </form>

      {message && (
        <p
          className={`mt-2 font-mono text-xs ${status === "success" ? "text-accent-green" : "text-red-400"}`}
        >
          {message}
        </p>
      )}

      <div className="mt-3 border-t border-border pt-3">
        <button
          onClick={handleEnablePush}
          disabled={pushStatus === "loading" || pushStatus === "granted"}
          className="w-full rounded border border-[#00d9ff]/30 bg-[#00d9ff]/5 px-4 py-2 font-mono text-xs text-[#00d9ff] transition hover:bg-[#00d9ff]/10 disabled:opacity-50"
        >
          {pushStatus === "loading"
            ? "Enabling..."
            : pushStatus === "granted"
              ? "✓ Push Notifications Enabled"
              : pushStatus === "denied"
                ? "Notifications Blocked"
                : pushStatus === "unsupported"
                  ? "Push Not Supported"
                  : "🔔 Enable Push Notifications"}
        </button>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
