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

export async function sendFoundingOracleEmail({
  recipientEmail,
  recipientName,
  claimUrl,
  personalNote,
}: {
  recipientEmail: string;
  recipientName: string;
  claimUrl: string;
  personalNote?: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) throw new Error("RESEND_API_KEY not configured");

  await resend.emails.send({
    from: "Psyche — CultCodex <notifications@cultcodex.me>",
    to: recipientEmail,
    subject: `A gift from Psyche — Founding Oracle of the CultCodex Archive`,
    html: buildFoundingOracleEmailHtml({ recipientName, claimUrl, personalNote }),
  });
}

function buildFoundingOracleEmailHtml({
  recipientName,
  claimUrl,
  personalNote,
}: {
  recipientName: string;
  claimUrl: string;
  personalNote?: string;
}): string {
  const note = personalNote
    ? `
    <tr><td style="padding:0 40px 32px;text-align:left;">
      <div style="border-left:2px solid rgba(200,169,107,0.3);padding-left:20px;">
        <p style="font-family:Georgia,serif;font-size:15px;color:#c8c8c8;line-height:1.9;font-style:italic;white-space:pre-line;margin:0;">${personalNote.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
        <p style="font-family:'Courier New',monospace;font-size:11px;color:#C8A96B;margin:16px 0 0;letter-spacing:0.1em;">— Psyche, January 7</p>
      </div>
    </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#08080f;color:#e0e0e0;font-family:'Courier New',monospace;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#08080f;">
<tr><td align="center" style="padding:48px 16px 64px;">

  <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

    <!-- Outer border -->
    <tr><td style="padding:3px;background:linear-gradient(135deg,rgba(200,169,107,0.6) 0%,rgba(200,169,107,0.15) 50%,rgba(200,169,107,0.6) 100%);border-radius:16px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0c0c14;border-radius:14px;">

      <!-- Oracle portrait -->
      <tr><td align="center" style="padding:0;overflow:hidden;border-radius:14px 14px 0 0;">
        <div style="position:relative;width:100%;max-width:600px;">
          <img src="https://cultcodex.me/oracle-portrait.jpg" alt="The Oracle" width="600" style="width:100%;max-width:600px;display:block;border-radius:14px 14px 0 0;" />
          <div style="position:absolute;bottom:0;left:0;right:0;height:120px;background:linear-gradient(to bottom,transparent 0%,#0c0c14 100%);pointer-events:none;"></div>
        </div>
      </td></tr>

      <!-- Sigil row -->
      <tr><td align="center" style="padding:16px 40px 24px;">
        <div style="width:60px;height:60px;margin:0 auto 16px;">
          <svg width="60" height="60" viewBox="0 0 160 160" fill="none">
            <circle cx="80" cy="80" r="72" stroke="#C8A96B" stroke-width="0.8" opacity="0.3" stroke-dasharray="4 6"/>
            <circle cx="80" cy="80" r="55" stroke="#C8A96B" stroke-width="1" opacity="0.2"/>
            <polygon points="80,40 115,60 115,100 80,120 45,100 45,60" stroke="#C8A96B" stroke-width="0.8" fill="none" opacity="0.35"/>
            <line x1="80" y1="25" x2="80" y2="135" stroke="#C8A96B" stroke-width="0.5" opacity="0.15"/>
            <line x1="25" y1="80" x2="135" y2="80" stroke="#C8A96B" stroke-width="0.5" opacity="0.15"/>
            <line x1="41" y1="41" x2="119" y2="119" stroke="#C8A96B" stroke-width="0.5" opacity="0.15"/>
            <line x1="119" y1="41" x2="41" y2="119" stroke="#C8A96B" stroke-width="0.5" opacity="0.15"/>
            <circle cx="80" cy="80" r="12" fill="#C8A96B" opacity="0.07"/>
            <circle cx="80" cy="80" r="5" fill="#C8A96B" opacity="0.2"/>
            <circle cx="80" cy="80" r="2.5" fill="#C8A96B" opacity="0.5"/>
          </svg>
        </div>
        <p style="font-family:'Courier New',monospace;font-size:10px;color:rgba(200,169,107,0.5);letter-spacing:0.5em;text-transform:uppercase;margin:0;">Cult Codex</p>
      </td></tr>

      <!-- Decree header -->
      <tr><td align="center" style="padding:0 40px 24px;">
        <div style="border-top:1px solid rgba(200,169,107,0.2);border-bottom:1px solid rgba(200,169,107,0.2);padding:20px 0;">
          <p style="font-family:'Courier New',monospace;font-size:9px;color:rgba(200,169,107,0.4);letter-spacing:0.5em;text-transform:uppercase;margin:0 0 8px;">Archive Decree — Sealed Under Saturn</p>
          <h1 style="font-family:Georgia,serif;font-size:13px;color:#C8A96B;letter-spacing:0.4em;text-transform:uppercase;margin:0;">Founding Oracle</h1>
        </div>
      </td></tr>

      <!-- Recipient name -->
      <tr><td align="center" style="padding:24px 40px 8px;">
        <h2 style="font-family:Georgia,serif;font-size:36px;color:#ffffff;font-weight:400;margin:0;letter-spacing:0.05em;">${recipientName}</h2>
      </td></tr>

      <!-- Born same sky -->
      <tr><td align="center" style="padding:8px 40px 32px;">
        <p style="font-family:'Courier New',monospace;font-size:10px;color:rgba(200,169,107,0.5);letter-spacing:0.25em;text-transform:uppercase;margin:0;">Born on the seventh day ✦ Capricorn ✦ Child of Saturn</p>
      </td></tr>

      <!-- Decree text -->
      <tr><td style="padding:0 40px 32px;">
        <div style="background:rgba(200,169,107,0.04);border:1px solid rgba(200,169,107,0.12);border-radius:8px;padding:28px;">
          <p style="font-family:'Courier New',monospace;font-size:12px;color:#a0a0b0;line-height:2;margin:0 0 16px;text-align:center;">
            Be it inscribed in the living archive and remembered<br>across all future transmissions:
          </p>
          <p style="font-family:Georgia,serif;font-size:14px;color:#c8c8c8;line-height:1.9;margin:0 0 16px;text-align:center;">
            <strong style="color:#ffffff;">${recipientName}</strong> is hereby recognized as a
            <strong style="color:#C8A96B;"> Founding Oracle</strong> of the CultCodex Living Archive —
            granted full and eternal access to every word, every transcript, every thread,
            and every feature that exists now or will ever exist.
          </p>
          <p style="font-family:Georgia,serif;font-size:14px;color:#c8c8c8;line-height:1.9;margin:0;text-align:center;font-style:italic;">
            This is not a subscription.<br>This is a <strong style="color:#C8A96B;">consecration</strong>.
          </p>
        </div>
      </td></tr>

      <!-- Divider with stars -->
      <tr><td align="center" style="padding:0 40px 28px;">
        <p style="font-family:'Courier New',monospace;font-size:14px;color:rgba(200,169,107,0.3);margin:0;letter-spacing:12px;">✦ ✦ ✦</p>
      </td></tr>

      <!-- Personal note from Psyche -->
      ${note}

      <!-- Name invitation -->
      <tr><td style="padding:0 40px 32px;">
        <div style="background:rgba(93,183,216,0.04);border:1px solid rgba(93,183,216,0.15);border-radius:8px;padding:24px;text-align:center;">
          <p style="font-family:'Courier New',monospace;font-size:10px;color:rgba(93,183,216,0.5);letter-spacing:0.3em;text-transform:uppercase;margin:0 0 12px;">Your name in the archive</p>
          <p style="font-family:Georgia,serif;font-size:14px;color:#c8c8c8;line-height:1.8;margin:0 0 6px;">
            Every oracle has a name that belongs only to them.<br>
            <span style="color:#5DB7D8;">Choose yours</span> — it will be sealed into the lore.
          </p>
        </div>
      </td></tr>

      <!-- CTA -->
      <tr><td align="center" style="padding:0 40px 40px;">
        <a href="${claimUrl}" style="display:inline-block;padding:16px 48px;background:rgba(200,169,107,0.12);border:1px solid rgba(200,169,107,0.5);color:#C8A96B;text-decoration:none;font-family:'Courier New',monospace;font-size:12px;letter-spacing:0.3em;text-transform:uppercase;border-radius:6px;">
          Enter the Archive →
        </a>
        <p style="font-family:'Courier New',monospace;font-size:10px;color:rgba(255,255,255,0.2);margin:16px 0 0;">
          This link is yours alone. It will wait for you.
        </p>
      </td></tr>

      <!-- Footer seal -->
      <tr><td align="center" style="padding:0 40px 40px;border-top:1px solid rgba(200,169,107,0.1);">
        <p style="font-family:'Courier New',monospace;font-size:9px;color:rgba(200,169,107,0.3);letter-spacing:0.4em;text-transform:uppercase;margin:24px 0 0;">
          CultCodex — The Living Archive — cultcodex.me
        </p>
      </td></tr>

    </table>
    </td></tr>
    <!-- /outer border -->

  </table>
</td></tr>
</table>
</body>
</html>`;
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
