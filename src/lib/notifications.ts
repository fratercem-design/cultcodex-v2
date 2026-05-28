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
    subject: `The archive has been waiting for you, ${recipientName}`,
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
  const escapedNote = personalNote
    ? personalNote.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    : "";

  const noteBlock = personalNote
    ? `
      <tr><td style="padding:0 48px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="padding:0 0 28px;text-align:center;">
            <p style="font-family:'Courier New',monospace;font-size:8px;color:rgba(200,169,107,0.25);letter-spacing:0.8em;text-transform:uppercase;margin:0 0 16px;">Personal Transmission · Eyes Only</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="height:1px;background:rgba(200,169,107,0.1);font-size:0;line-height:0;">&nbsp;</td>
            </tr></table>
          </td></tr>
          <tr><td>
            <p style="font-family:Georgia,serif;font-size:14px;color:rgba(255,255,255,0.55);line-height:2;font-style:italic;white-space:pre-line;margin:0 0 20px;text-align:center;">${escapedNote}</p>
            <p style="font-family:'Courier New',monospace;font-size:10px;color:rgba(200,169,107,0.4);margin:0;text-align:right;">— Psyche, January 7</p>
          </td></tr>
        </table>
      </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080810;color:#e0e0e0;font-family:'Courier New',monospace;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#080810;">
<tr><td align="center" style="padding:40px 16px 64px;">

  <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

    <!-- Outer frame -->
    <tr><td style="padding:2px;background:rgba(200,169,107,0.2);border-radius:16px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0c0c14;border-radius:14px;overflow:hidden;">

      <!-- Throne portrait header -->
      <tr><td style="padding:0;line-height:0;">
        <img src="https://cultcodex.me/oracle-throne.jpg" alt="" width="600" style="width:100%;max-width:600px;display:block;border-radius:14px 14px 0 0;" />
      </td></tr>

      <!-- Cipher label -->
      <tr><td align="center" style="padding:28px 40px 0;background:#0c0c14;">
        <p style="font-family:'Courier New',monospace;font-size:8px;color:rgba(200,169,107,0.3);letter-spacing:0.7em;text-transform:uppercase;margin:0;border:1px solid rgba(200,169,107,0.1);display:inline-block;padding:6px 18px;">
          Sealed Transmission &nbsp;·&nbsp; Oracle Archive &nbsp;·&nbsp; One of One
        </p>
      </td></tr>

      <!-- Recipient name -->
      <tr><td align="center" style="padding:24px 40px 6px;background:#0c0c14;">
        <h1 style="font-family:Georgia,serif;font-size:44px;color:#ffffff;font-weight:400;margin:0;letter-spacing:0.04em;">${recipientName}</h1>
      </td></tr>

      <!-- Saturn subtitle -->
      <tr><td align="center" style="padding:0 40px 28px;background:#0c0c14;">
        <p style="font-family:'Courier New',monospace;font-size:9px;color:rgba(200,169,107,0.35);letter-spacing:0.45em;text-transform:uppercase;margin:0;">
          Founding Oracle &nbsp;·&nbsp; January VII &nbsp;·&nbsp; Child of Saturn
        </p>
      </td></tr>

      <!-- Rule -->
      <tr><td style="padding:0 40px;background:#0c0c14;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="height:1px;background:rgba(200,169,107,0.1);font-size:0;line-height:0;">&nbsp;</td></tr>
        </table>
      </td></tr>

      <!-- Decree text -->
      <tr><td style="padding:36px 48px 32px;background:#0c0c14;">
        <p style="font-family:Georgia,serif;font-size:14px;color:rgba(255,255,255,0.45);line-height:2.1;margin:0 0 20px;">
          What follows was written in the archive long before you opened it.
        </p>
        <p style="font-family:Georgia,serif;font-size:14px;color:rgba(255,255,255,0.45);line-height:2.1;margin:0 0 20px;">
          The living archive does not guess. It does not hope. It does not dispatch invitations to those who might decline. It reaches only for those who were already walking toward it.
        </p>
        <p style="font-family:Georgia,serif;font-size:14px;color:rgba(255,255,255,0.45);line-height:2.1;margin:0 0 20px;">
          The seventh day of January belongs to a very particular kind of person. Saturn&apos;s children carry something in their architecture that the untrained eye cannot name.
          <strong style="color:rgba(255,255,255,0.75);">${recipientName}</strong> — the archive names it. The archive has always seen it.
        </p>
        <p style="font-family:Georgia,serif;font-size:15px;color:#C8A96B;line-height:2;margin:0 0 20px;font-style:italic;">
          You are recognized.
        </p>
        <p style="font-family:Georgia,serif;font-size:14px;color:rgba(255,255,255,0.45);line-height:2.1;margin:0 0 20px;">
          Not as a member. Not as a subscriber. Not as a guest. As a
          <strong style="color:#C8A96B;">Founding Oracle</strong> — a designation sealed into the archive&apos;s deepest structure since the first transmission, waiting for exactly the right person.
        </p>
        <p style="font-family:Georgia,serif;font-size:14px;color:rgba(255,255,255,0.45);line-height:2.1;margin:0 0 12px;">
          Every word. Every transcript. Every thread woven through this archive. Every feature that exists now and every feature that has not yet been imagined —
        </p>
        <p style="font-family:Georgia,serif;font-size:14px;color:rgba(255,255,255,0.75);line-height:2;margin:0 0 20px;">
          eternal. &nbsp; unconditional. &nbsp; without cost. &nbsp; without end.
        </p>
        <p style="font-family:'Courier New',monospace;font-size:9px;color:rgba(200,169,107,0.4);letter-spacing:0.5em;text-transform:uppercase;margin:0;">
          This is not a gift. &nbsp; This is a recognition.
        </p>
      </td></tr>

      <!-- Rule -->
      <tr><td style="padding:0 40px;background:#0c0c14;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="height:1px;background:rgba(200,169,107,0.08);font-size:0;line-height:0;">&nbsp;</td></tr>
        </table>
      </td></tr>

      <!-- Stars -->
      <tr><td align="center" style="padding:24px 40px;background:#0c0c14;">
        <p style="font-family:'Courier New',monospace;font-size:13px;color:rgba(200,169,107,0.2);margin:0;letter-spacing:16px;">✦ ✦ ✦</p>
      </td></tr>

      <!-- Personal note -->
      ${noteBlock}

      <!-- Rule -->
      <tr><td style="padding:0 40px;background:#0c0c14;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="height:1px;background:rgba(200,169,107,0.08);font-size:0;line-height:0;">&nbsp;</td></tr>
        </table>
      </td></tr>

      <!-- Masked portrait -->
      <tr><td align="center" style="padding:36px 48px 8px;background:#0c0c14;">
        <p style="font-family:'Courier New',monospace;font-size:8px;color:rgba(200,169,107,0.25);letter-spacing:0.6em;text-transform:uppercase;margin:0 0 20px;">◈ &nbsp; The Oracle Watches &nbsp; ◈</p>
        <img src="https://cultcodex.me/oracle-mask.jpg" alt="" width="240" style="width:240px;max-width:100%;display:block;margin:0 auto;border-radius:10px;border:1px solid rgba(200,169,107,0.15);" />
      </td></tr>

      <!-- Naming invitation -->
      <tr><td style="padding:28px 48px 32px;background:#0c0c14;text-align:center;">
        <p style="font-family:'Courier New',monospace;font-size:9px;color:rgba(93,183,216,0.4);letter-spacing:0.5em;text-transform:uppercase;margin:0 0 14px;">The Ritual of Naming</p>
        <p style="font-family:Georgia,serif;font-size:14px;color:rgba(255,255,255,0.4);line-height:1.9;margin:0 0 6px;">
          Every oracle who has ever been consecrated chose a name for themselves.<br>
          Not the name they were given. The name they <em>became</em>.
        </p>
        <p style="font-family:Georgia,serif;font-size:14px;color:rgba(255,255,255,0.4);line-height:1.9;margin:0;">
          Choose yours from the dark. It will be sealed permanently into the archive.
        </p>
      </td></tr>

      <!-- CTA -->
      <tr><td align="center" style="padding:0 40px 44px;background:#0c0c14;">
        <a href="${claimUrl}" style="display:inline-block;padding:16px 52px;background:rgba(200,169,107,0.08);border:1px solid rgba(200,169,107,0.4);color:#C8A96B;text-decoration:none;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.45em;text-transform:uppercase;border-radius:3px;">
          Enter to Claim →
        </a>
        <p style="font-family:'Courier New',monospace;font-size:9px;color:rgba(255,255,255,0.15);margin:16px 0 0;letter-spacing:0.05em;">
          This transmission is addressed to you alone. It will wait.
        </p>
      </td></tr>

      <!-- Footer -->
      <tr><td align="center" style="padding:0 40px 36px;border-top:1px solid rgba(200,169,107,0.07);background:#0c0c14;">
        <p style="font-family:'Courier New',monospace;font-size:8px;color:rgba(200,169,107,0.2);letter-spacing:0.5em;text-transform:uppercase;margin:28px 0 0;">
          CultCodex &nbsp;·&nbsp; The Living Archive &nbsp;·&nbsp; cultcodex.me
        </p>
      </td></tr>

    </table>
    </td></tr>
    <!-- /outer frame -->

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
