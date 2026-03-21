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

export async function notifyNewEpisode(episode: {
  title: string;
  slug: string;
  summaryShort: string | null;
  thumbnailUrl: string | null;
}) {
  const resend = getResend();
  if (!resend) return { emailCount: 0 };

  // Get users who opted in for new episode emails
  const prefs = await prisma.notificationPreference.findMany({
    where: { emailNewEpisode: true },
    select: { user: { select: { email: true } } },
  });

  const emails = prefs
    .map((p) => p.user.email)
    .filter((e): e is string => !!e);

  if (emails.length === 0) return { emailCount: 0 };

  const episodeUrl = `https://cultcodex.me/episodes/${episode.slug}`;

  let emailCount = 0;
  for (const email of emails) {
    try {
      await resend.emails.send({
        from: "CultCodex <notifications@cultcodex.me>",
        to: email,
        subject: `New Episode: ${episode.title}`,
        html: `
          <div style="background: #0a0a0a; color: #e0e0e0; padding: 32px; font-family: monospace;">
            <h1 style="color: #C8A96B; font-size: 20px; margin-bottom: 16px;">
              NEW EPISODE
            </h1>
            <h2 style="color: #ffffff; font-size: 18px; margin-bottom: 8px;">
              ${episode.title}
            </h2>
            ${episode.summaryShort ? `<p style="color: #999; font-size: 14px; margin-bottom: 16px;">${episode.summaryShort}</p>` : ""}
            ${episode.thumbnailUrl ? `<img src="${episode.thumbnailUrl}" alt="" style="width: 100%; max-width: 560px; border-radius: 8px; margin-bottom: 16px;" />` : ""}
            <a href="${episodeUrl}" style="display: inline-block; background: #C8A96B; color: #0a0a0a; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">
              WATCH NOW
            </a>
            <p style="color: #666; font-size: 11px; margin-top: 24px;">
              You're receiving this because you opted in at cultcodex.me
            </p>
          </div>
        `,
      });
      emailCount++;
    } catch (err) {
      console.error(`[notify] Failed to send new episode email to ${email}:`, err);
    }
  }

  return { emailCount };
}

function buildEmailHtml(title: string, videoId: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;color:#e8e8e8;font-family:monospace;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:30px;">
      <img src="https://cultcodex.me/logo.jpg" alt="Cult of Psyche" width="80" height="80" style="border-radius:50%;border:2px solid #C8A96B;" />
    </div>
    <div style="text-align:center;padding:20px;background:#12131A;border:1px solid #C8A96B;border-radius:8px;">
      <div style="font-size:12px;color:#ff4444;letter-spacing:3px;margin-bottom:8px;">● LIVE NOW</div>
      <h1 style="color:#C8A96B;font-size:22px;margin:0 0 12px;">${title}</h1>
      <p style="color:#5DB7D8;font-size:13px;margin:0 0 24px;">The stream is live on Cult of Psyche</p>
      <a href="https://cultcodex.me/live" style="display:inline-block;padding:12px 32px;background:#C8A96B;color:#0a0a0a;text-decoration:none;font-weight:bold;font-size:14px;border-radius:4px;">
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
