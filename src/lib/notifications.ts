import { Resend } from "resend";
import webPush from "web-push";
import { prisma } from "@/lib/db";

let vapidConfigured = false;

function getResend() {
  return process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;
}

function ensureVapid() {
  if (!vapidConfigured && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webPush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:psychetarotchannel@gmail.com",
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    vapidConfigured = true;
  }
}

export async function notifySubscribers(title: string, videoId: string) {
  const subscribers = await prisma.subscriber.findMany();
  let emailCount = 0;
  let pushCount = 0;

  // Send emails
  const resend = getResend();
  const emailSubs = subscribers.filter((s) => s.email);
  if (resend && emailSubs.length > 0) {
    const emails = emailSubs.map((s) => s.email!);
    try {
      await resend.emails.send({
        from: "CultCodex <notifications@cultcodex.me>",
        to: emails,
        subject: `🔴 LIVE NOW: ${title}`,
        html: buildEmailHtml(title, videoId),
      });
      emailCount = emails.length;
    } catch (err) {
      console.error("Email send failed:", err);
    }
  }

  // Send push notifications
  ensureVapid();
  const pushSubs = subscribers.filter((s) => s.pushSubscription);
  const payload = JSON.stringify({
    title: "Cult of Psyche is LIVE!",
    body: title,
    icon: "/logo.jpg",
    badge: "/favicon.jpg",
    url: "/live",
  });

  for (const sub of pushSubs) {
    try {
      await webPush.sendNotification(
        sub.pushSubscription as unknown as webPush.PushSubscription,
        payload
      );
      pushCount++;
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 410 || statusCode === 404) {
        // Subscription expired — remove it
        await prisma.subscriber.delete({ where: { id: sub.id } });
      }
      console.error("Push send failed:", err);
    }
  }

  return { emailCount, pushCount };
}

function buildEmailHtml(title: string, videoId: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;color:#e8e8e8;font-family:monospace;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:30px;">
      <img src="https://cultcodex.me/logo.jpg" alt="Cult of Psyche" width="80" height="80" style="border-radius:50%;border:2px solid #ffd700;" />
    </div>
    <div style="text-align:center;padding:20px;background:#1a0033;border:1px solid #ffd700;border-radius:8px;">
      <div style="font-size:12px;color:#ff4444;letter-spacing:3px;margin-bottom:8px;">● LIVE NOW</div>
      <h1 style="color:#ffd700;font-size:22px;margin:0 0 12px;">${title}</h1>
      <p style="color:#00d9ff;font-size:13px;margin:0 0 24px;">The stream is live on Cult of Psyche</p>
      <a href="https://cultcodex.me/live" style="display:inline-block;padding:12px 32px;background:#ffd700;color:#0a0a0a;text-decoration:none;font-weight:bold;font-size:14px;border-radius:4px;">
        Watch Now →
      </a>
    </div>
    <div style="text-align:center;margin-top:30px;">
      <a href="https://www.youtube.com/watch?v=${videoId}" style="color:#6b6b6b;font-size:11px;text-decoration:underline;">
        Watch on YouTube
      </a>
    </div>
    <div style="text-align:center;margin-top:20px;padding-top:20px;border-top:1px solid #2a2a2a;">
      <p style="color:#6b6b6b;font-size:10px;margin:0;">
        You're receiving this because you subscribed at cultcodex.me
      </p>
    </div>
  </div>
</body>
</html>`;
}
