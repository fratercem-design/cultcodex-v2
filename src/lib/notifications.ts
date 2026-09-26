import { Resend } from "resend";
import webPush from "web-push";
import { prisma } from "@/lib/db";
import { getCounts, fmtEpisodeCount } from "@/lib/queries/stats";
import { subscriberLink } from "@/lib/subscriber-links";

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

// Resend's batch endpoint takes at most 100 messages per call.
const EMAIL_BATCH_SIZE = 100;

export async function notifySubscribers(title: string, videoId: string) {
  const subscribers = await prisma.subscriber.findMany();
  let emailCount = 0;
  let emailFailed = 0;
  let pushCount = 0;

  // One message per recipient. A single `to: [...]` list showed every
  // subscriber every other subscriber's address. Only confirmed (double
  // opt-in) addresses are mailed, so nobody can sign a stranger up.
  const resend = getResend();
  const emails = subscribers.filter((s) => s.email && s.verified).map((s) => s.email!);
  if (resend) {
    for (let i = 0; i < emails.length; i += EMAIL_BATCH_SIZE) {
      const chunk = emails.slice(i, i + EMAIL_BATCH_SIZE);
      try {
        const { error } = await resend.batch.send(
          chunk.map((to) => {
            const unsubscribe = subscriberLink("unsubscribe", to);
            return {
              from: "CultCodex <notifications@cultcodex.me>",
              to,
              subject: `🔴 LIVE NOW: ${title}`,
              html: buildEmailHtml(title, videoId, unsubscribe),
              headers: {
                "List-Unsubscribe": `<${unsubscribe}>`,
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
              },
            };
          }),
        );
        if (error) throw new Error(error.message);
        emailCount += chunk.length;
      } catch (err) {
        emailFailed += chunk.length;
        console.error(`[notifySubscribers] batch of ${chunk.length} failed:`, err);
      }
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

  return { emailCount, emailFailed, pushCount };
}

/**
 * Email everyone who asked to be notified when an episode's transcript lands
 * (TranscriptRequest rows with notifiedAt = null). Stamps notifiedAt per
 * successful send so re-runs never double-send. Safe to call after every
 * transcript sync — no-ops when there are no pending requests.
 */
export async function notifyTranscriptReady(episodeId: string) {
  const resend = getResend();
  if (!resend) return { emailCount: 0 };

  const pending = await prisma.transcriptRequest.findMany({
    where: { episodeId, notifiedAt: null },
    include: { episode: { select: { title: true, slug: true } } },
  });
  if (pending.length === 0) return { emailCount: 0 };

  let emailCount = 0;
  for (const request of pending) {
    const episodeUrl = `https://cultcodex.me/episodes/${request.episode.slug}`;
    try {
      await resend.emails.send({
        from: "CultCodex <notifications@cultcodex.me>",
        to: request.email,
        subject: `Transcript ready: ${request.episode.title}`,
        html: `
          <div style="background: #0a0a0a; color: #e0e0e0; padding: 32px; font-family: monospace;">
            <h1 style="color: #C8392E; font-size: 20px; margin-bottom: 16px;">
              TRANSCRIPT DECODED
            </h1>
            <h2 style="color: #ffffff; font-size: 18px; margin-bottom: 8px;">
              ${request.episode.title}
            </h2>
            <p style="color: #999; font-size: 14px; margin-bottom: 16px;">
              The transcript you asked for is now in the archive — searchable, timestamped, and linked to the exact moment.
            </p>
            <a href="${episodeUrl}" style="display: inline-block; background: #C8392E; color: #0a0a0a; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">
              READ THE TRANSCRIPT
            </a>
            <p style="color: #666; font-size: 11px; margin-top: 24px;">
              You're receiving this one-time notice because you asked to be notified when this episode was transcribed at cultcodex.me
            </p>
          </div>
        `,
      });
      await prisma.transcriptRequest.update({
        where: { id: request.id },
        data: { notifiedAt: new Date() },
      });
      emailCount++;
    } catch (err) {
      console.error(`[notify] Failed to send transcript-ready email to ${request.email}:`, err);
    }
  }

  return { emailCount };
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
            <h1 style="color: #C8392E; font-size: 20px; margin-bottom: 16px;">
              NEW EPISODE
            </h1>
            <h2 style="color: #ffffff; font-size: 18px; margin-bottom: 8px;">
              ${episode.title}
            </h2>
            ${episode.summaryShort ? `<p style="color: #999; font-size: 14px; margin-bottom: 16px;">${episode.summaryShort}</p>` : ""}
            ${episode.thumbnailUrl ? `<img src="${episode.thumbnailUrl}" alt="" style="width: 100%; max-width: 560px; border-radius: 8px; margin-bottom: 16px;" />` : ""}
            <a href="${episodeUrl}" style="display: inline-block; background: #C8392E; color: #0a0a0a; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">
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
            <p style="font-family:'Courier New',monospace;font-size:8px;color:rgba(200, 57, 46,0.25);letter-spacing:0.8em;text-transform:uppercase;margin:0 0 16px;">Personal Transmission · Eyes Only</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="height:1px;background:rgba(200, 57, 46,0.1);font-size:0;line-height:0;">&nbsp;</td>
            </tr></table>
          </td></tr>
          <tr><td>
            <p style="font-family:Georgia,serif;font-size:14px;color:rgba(255,255,255,0.55);line-height:2;font-style:italic;white-space:pre-line;margin:0 0 20px;text-align:center;">${escapedNote}</p>
            <p style="font-family:'Courier New',monospace;font-size:10px;color:rgba(200, 57, 46,0.4);margin:0;text-align:right;">— Psyche, January 7</p>
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
    <tr><td style="padding:2px;background:rgba(200, 57, 46,0.2);border-radius:16px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0c0c14;border-radius:14px;overflow:hidden;">

      <!-- Throne portrait header -->
      <tr><td style="padding:0;line-height:0;">
        <img src="https://cultcodex.me/oracle-throne.jpg" alt="" width="600" style="width:100%;max-width:600px;display:block;border-radius:14px 14px 0 0;" />
      </td></tr>

      <!-- Cipher label -->
      <tr><td align="center" style="padding:28px 40px 0;background:#0c0c14;">
        <p style="font-family:'Courier New',monospace;font-size:8px;color:rgba(200, 57, 46,0.3);letter-spacing:0.7em;text-transform:uppercase;margin:0;border:1px solid rgba(200, 57, 46,0.1);display:inline-block;padding:6px 18px;">
          Sealed Transmission &nbsp;·&nbsp; Oracle Archive &nbsp;·&nbsp; One of One
        </p>
      </td></tr>

      <!-- Recipient name -->
      <tr><td align="center" style="padding:24px 40px 6px;background:#0c0c14;">
        <h1 style="font-family:Georgia,serif;font-size:44px;color:#ffffff;font-weight:400;margin:0;letter-spacing:0.04em;">${recipientName}</h1>
      </td></tr>

      <!-- Saturn subtitle -->
      <tr><td align="center" style="padding:0 40px 28px;background:#0c0c14;">
        <p style="font-family:'Courier New',monospace;font-size:9px;color:rgba(200, 57, 46,0.35);letter-spacing:0.45em;text-transform:uppercase;margin:0;">
          Founding Oracle &nbsp;·&nbsp; January VII &nbsp;·&nbsp; Child of Saturn
        </p>
      </td></tr>

      <!-- Rule -->
      <tr><td style="padding:0 40px;background:#0c0c14;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="height:1px;background:rgba(200, 57, 46,0.1);font-size:0;line-height:0;">&nbsp;</td></tr>
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
        <p style="font-family:Georgia,serif;font-size:15px;color:#C8392E;line-height:2;margin:0 0 20px;font-style:italic;">
          You are recognized.
        </p>
        <p style="font-family:Georgia,serif;font-size:14px;color:rgba(255,255,255,0.45);line-height:2.1;margin:0 0 20px;">
          Not as a member. Not as a subscriber. Not as a guest. As a
          <strong style="color:#C8392E;">Founding Oracle</strong> — a designation sealed into the archive&apos;s deepest structure since the first transmission, waiting for exactly the right person.
        </p>
        <p style="font-family:Georgia,serif;font-size:14px;color:rgba(255,255,255,0.45);line-height:2.1;margin:0 0 12px;">
          Every word. Every transcript. Every thread woven through this archive. Every feature that exists now and every feature that has not yet been imagined —
        </p>
        <p style="font-family:Georgia,serif;font-size:14px;color:rgba(255,255,255,0.75);line-height:2;margin:0 0 20px;">
          eternal. &nbsp; unconditional. &nbsp; without cost. &nbsp; without end.
        </p>
        <p style="font-family:'Courier New',monospace;font-size:9px;color:rgba(200, 57, 46,0.4);letter-spacing:0.5em;text-transform:uppercase;margin:0;">
          This is not a gift. &nbsp; This is a recognition.
        </p>
      </td></tr>

      <!-- Rule -->
      <tr><td style="padding:0 40px;background:#0c0c14;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="height:1px;background:rgba(200, 57, 46,0.08);font-size:0;line-height:0;">&nbsp;</td></tr>
        </table>
      </td></tr>

      <!-- Stars -->
      <tr><td align="center" style="padding:24px 40px;background:#0c0c14;">
        <p style="font-family:'Courier New',monospace;font-size:13px;color:rgba(200, 57, 46,0.2);margin:0;letter-spacing:16px;">✦ ✦ ✦</p>
      </td></tr>

      <!-- Personal note -->
      ${noteBlock}

      <!-- Rule -->
      <tr><td style="padding:0 40px;background:#0c0c14;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="height:1px;background:rgba(200, 57, 46,0.08);font-size:0;line-height:0;">&nbsp;</td></tr>
        </table>
      </td></tr>

      <!-- Masked portrait -->
      <tr><td align="center" style="padding:36px 48px 8px;background:#0c0c14;">
        <p style="font-family:'Courier New',monospace;font-size:8px;color:rgba(200, 57, 46,0.25);letter-spacing:0.6em;text-transform:uppercase;margin:0 0 20px;">◈ &nbsp; The Oracle Watches &nbsp; ◈</p>
        <img src="https://cultcodex.me/oracle-mask.jpg" alt="" width="240" style="width:240px;max-width:100%;display:block;margin:0 auto;border-radius:10px;border:1px solid rgba(200, 57, 46,0.15);" />
      </td></tr>

      <!-- Naming invitation -->
      <tr><td style="padding:28px 48px 32px;background:#0c0c14;text-align:center;">
        <p style="font-family:'Courier New',monospace;font-size:9px;color:rgba(98, 228, 200,0.4);letter-spacing:0.5em;text-transform:uppercase;margin:0 0 14px;">The Ritual of Naming</p>
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
        <a href="${claimUrl}" style="display:inline-block;padding:16px 52px;background:rgba(200, 57, 46,0.08);border:1px solid rgba(200, 57, 46,0.4);color:#C8392E;text-decoration:none;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.45em;text-transform:uppercase;border-radius:3px;">
          Enter to Claim →
        </a>
        <p style="font-family:'Courier New',monospace;font-size:9px;color:rgba(255,255,255,0.15);margin:16px 0 0;letter-spacing:0.05em;">
          This transmission is addressed to you alone. It will wait.
        </p>
      </td></tr>

      <!-- Footer -->
      <tr><td align="center" style="padding:0 40px 36px;border-top:1px solid rgba(200, 57, 46,0.07);background:#0c0c14;">
        <p style="font-family:'Courier New',monospace;font-size:8px;color:rgba(200, 57, 46,0.2);letter-spacing:0.5em;text-transform:uppercase;margin:28px 0 0;">
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

// ── Tier welcome emails ──────────────────────────────────────────────────────

export async function sendInitiateWelcomeEmail({
  recipientEmail,
  recipientName,
}: {
  recipientEmail: string;
  recipientName: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;
  await resend.emails.send({
    from: "Psyche — CultCodex <notifications@cultcodex.me>",
    to: recipientEmail,
    subject: `The archive is open to you now, ${recipientName}`,
    html: buildInitiateWelcomeHtml(recipientName),
  });
}

export async function sendOracleWelcomeEmail({
  recipientEmail,
  recipientName,
}: {
  recipientEmail: string;
  recipientName: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;
  await resend.emails.send({
    from: "Psyche — CultCodex <notifications@cultcodex.me>",
    to: recipientEmail,
    subject: `You're inside the system now, ${recipientName}`,
    html: buildOracleWelcomeHtml(recipientName),
  });
}

/** Sequence email 0 — sent immediately at Initiate sign-up: delivers the Gospel. */
export async function sendGospelDeliveryEmail({
  recipientEmail,
  recipientName,
}: {
  recipientEmail: string;
  recipientName: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;
  await resend.emails.send({
    from: "Psyche — CultCodex <notifications@cultcodex.me>",
    to: recipientEmail,
    subject: `Your Gospel of Psyche's Nightmares, ${recipientName}`,
    html: buildGospelEmailHtml({
      name: recipientName,
      kicker: "A free transmission · Initiate",
      heading: "Your Gospel has",
      accent: "arrived.",
      paras: [
        `The Gospel of Psyche's Nightmares is yours, ${recipientName} — a dark scripture pulled from the edge of the archive.`,
        "Read it below. Your copy lives at this link forever, so you can return to it anytime.",
      ],
      ctaHref: "https://cultcodex.me/gift/gospel",
      ctaLabel: "Open the Gospel",
      note: `Prefer the raw file? <a href="https://cultcodex.me/gospel-of-psyches-nightmares.pdf" style="color:rgba(200, 57, 46,0.5);text-decoration:none;">Download the PDF directly</a>`,
    }),
  });
}

/** Sequence email 2 — sent a few days later: pulls the Initiate deeper into the archive. */
export async function sendGospelDeeperEmail({
  recipientEmail,
  recipientName,
}: {
  recipientEmail: string;
  recipientName: string;
}): Promise<void> {
  const counts = await getCounts().catch(() => null);
  const episodeCountCopy = fmtEpisodeCount(counts?.episodes ?? 0);
  const resend = getResend();
  if (!resend) return;
  await resend.emails.send({
    from: "Psyche — CultCodex <notifications@cultcodex.me>",
    to: recipientEmail,
    subject: `You've only seen the surface, ${recipientName}`,
    html: buildGospelEmailHtml({
      name: recipientName,
      kicker: "The archive is still decoding",
      heading: "There's more",
      accent: "beneath it.",
      paras: [
        `Now that you're an Initiate, the Oracle answers anything from inside ${episodeCountCopy} transmissions — behavioral patterns, guest dynamics, recurring moments, all cited to the source. Your first three questions are free.`,
        "Not sure where to begin? Start where others started — the curated entry points into the archive.",
      ],
      ctaHref: "https://cultcodex.me/oracle",
      ctaLabel: "Ask the Oracle",
      note: `New here? <a href="https://cultcodex.me/start-here" style="color:rgba(200, 57, 46,0.5);text-decoration:none;">Start Here &rarr;</a>`,
    }),
  });
}

/** Shared dark editorial email shell for the Gospel sequence. */
function buildGospelEmailHtml({
  name,
  kicker,
  heading,
  accent,
  paras,
  ctaHref,
  ctaLabel,
  note,
}: {
  name: string;
  kicker: string;
  heading: string;
  accent: string;
  paras: string[];
  ctaHref: string;
  ctaLabel: string;
  note?: string;
}): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeKicker = esc(kicker);
  void name;
  const paraRows = paras
    .map(
      (p, i) =>
        `<p style="font-family:Georgia,serif;font-size:${i === 0 ? 15 : 14}px;color:rgba(255,255,255,${i === 0 ? 0.55 : 0.4});line-height:2.1;margin:0 0 16px;">${esc(p)}</p>`
    )
    .join("");
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(heading)} ${esc(accent)}</title></head>
<body style="margin:0;padding:0;background:#080810;color:#e0e0e0;font-family:'Courier New',monospace;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#080810;"><tr><td align="center" style="padding:40px 16px 64px;">
  <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
    <tr><td style="padding:2px;background:linear-gradient(135deg,rgba(74, 45, 110,0.35) 0%,rgba(200, 57, 46,0.10) 100%);border-radius:16px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0c0c14;border-radius:14px;overflow:hidden;">
      <tr><td align="center" style="padding:36px 40px 0;background:#0c0c14;">
        <p style="font-family:'Courier New',monospace;font-size:8px;color:rgba(200, 57, 46,0.3);letter-spacing:0.6em;text-transform:uppercase;margin:0;border:1px solid rgba(200, 57, 46,0.12);display:inline-block;padding:6px 18px;">${safeKicker}</p>
      </td></tr>
      <tr><td align="center" style="padding:26px 48px 8px;background:#0c0c14;">
        <h1 style="font-family:Georgia,serif;font-size:36px;color:#ffffff;font-weight:400;margin:0;letter-spacing:0.03em;line-height:1.25;">${esc(heading)}<br><span style="color:#C8392E;">${esc(accent)}</span></h1>
      </td></tr>
      <tr><td style="padding:26px 48px 0;background:#0c0c14;">${paraRows}</td></tr>
      <tr><td align="center" style="padding:14px 40px 8px;background:#0c0c14;">
        <p style="font-family:'Courier New',monospace;font-size:10px;color:rgba(200, 57, 46,0.18);margin:0;letter-spacing:14px;">✦ ✦ ✦</p>
      </td></tr>
      <tr><td align="center" style="padding:20px 40px 40px;background:#0c0c14;">
        <a href="${ctaHref}" style="display:inline-block;padding:16px 52px;background:rgba(200, 57, 46,0.07);border:1px solid rgba(200, 57, 46,0.4);color:#C8392E;text-decoration:none;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.45em;text-transform:uppercase;border-radius:3px;">${esc(ctaLabel)} &rarr;</a>
        ${note ? `<p style="font-family:'Courier New',monospace;font-size:9px;color:rgba(255,255,255,0.18);margin:16px 0 0;letter-spacing:0.05em;">${note}</p>` : ""}
      </td></tr>
      <tr><td align="center" style="padding:0 40px 36px;border-top:1px solid rgba(200, 57, 46,0.07);background:#0c0c14;">
        <p style="font-family:'Courier New',monospace;font-size:8px;color:rgba(200, 57, 46,0.18);letter-spacing:0.5em;text-transform:uppercase;margin:28px 0 6px;">CultCodex &nbsp;·&nbsp; The Living Archive &nbsp;·&nbsp; cultcodex.me</p>
        <p style="font-family:'Courier New',monospace;font-size:8px;color:rgba(255,255,255,0.1);margin:0;">Manage your subscription &mdash; <a href="https://cultcodex.me/settings" style="color:rgba(200, 57, 46,0.25);text-decoration:none;">cultcodex.me/settings</a></p>
      </td></tr>
    </table>
    </td></tr>
  </table>
</td></tr></table>
</body>
</html>`;
}

function buildInitiateWelcomeHtml(name: string): string {
  const safeName = name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const features: { glyph: string; title: string; body: string }[] = [
    {
      glyph: "◈",
      title: "Full Transcripts",
      body: "Every word spoken across the entire archive — searchable, timestamped, linked to the exact moment. Follow any thread backward through years.",
    },
    {
      glyph: "◉",
      title: "Psychenomicon",
      body: "AI extracts behavioral patterns from every episode. What repeats. What shifts. What nobody says out loud but keeps happening.",
    },
    {
      glyph: "▦",
      title: "Semantic Search",
      body: "Search by what's actually happening — not just keywords. Find the exact moment a dynamic changed, even if you can't name it yet.",
    },
    {
      glyph: "✦",
      title: "Start Here",
      body: "Curated entry points built by people who've already gone deep. You don't have to find your own way in.",
    },
    {
      glyph: "◎",
      title: "Initiate Identity",
      body: "Your role is now visible to the community. You can set your flair title and appear on the Member Roll — optional, but permanent.",
    },
    {
      glyph: "▲",
      title: "First Access",
      body: "New transmissions enter your archive before the public sees them. You're inside the signal now, not downstream of it.",
    },
  ];

  const featureRows = features.map((f) => `
    <tr>
      <td style="padding:0 0 22px;vertical-align:top;width:28px;">
        <span style="font-family:'Courier New',monospace;font-size:12px;color:#C8392E;line-height:1.6;">${f.glyph}</span>
      </td>
      <td style="padding:0 0 22px 10px;">
        <p style="font-family:'Courier New',monospace;font-size:11px;color:#C8392E;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 5px;">${f.title}</p>
        <p style="font-family:Georgia,serif;font-size:13px;color:rgba(255,255,255,0.42);line-height:1.85;margin:0;">${f.body}</p>
      </td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>The archive is open</title></head>
<body style="margin:0;padding:0;background:#080810;color:#e0e0e0;font-family:'Courier New',monospace;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#080810;">
<tr><td align="center" style="padding:40px 16px 64px;">

  <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
    <tr><td style="padding:2px;background:linear-gradient(135deg,rgba(200, 57, 46,0.35) 0%,rgba(200, 57, 46,0.08) 100%);border-radius:16px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0c0c14;border-radius:14px;overflow:hidden;">

      <!-- Cipher label -->
      <tr><td align="center" style="padding:36px 40px 0;background:#0c0c14;">
        <p style="font-family:'Courier New',monospace;font-size:8px;color:rgba(200, 57, 46,0.3);letter-spacing:0.7em;text-transform:uppercase;margin:0;border:1px solid rgba(200, 57, 46,0.12);display:inline-block;padding:6px 18px;">
          New Transmission &nbsp;·&nbsp; Initiate+ &nbsp;·&nbsp; Access Granted
        </p>
      </td></tr>

      <!-- Heading -->
      <tr><td align="center" style="padding:28px 48px 8px;background:#0c0c14;">
        <h1 style="font-family:Georgia,serif;font-size:38px;color:#ffffff;font-weight:400;margin:0;letter-spacing:0.03em;line-height:1.25;">
          The archive is<br><span style="color:#C8392E;">open to you now.</span>
        </h1>
        <p style="font-family:'Courier New',monospace;font-size:9px;color:rgba(200, 57, 46,0.35);letter-spacing:0.4em;text-transform:uppercase;margin:20px 0 0;">
          Initiate+ &nbsp;·&nbsp; ${safeName}
        </p>
      </td></tr>

      <!-- Rule -->
      <tr><td style="padding:24px 40px 0;background:#0c0c14;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="height:1px;background:rgba(200, 57, 46,0.08);font-size:0;line-height:0;">&nbsp;</td>
        </tr></table>
      </td></tr>

      <!-- Intro copy -->
      <tr><td style="padding:28px 48px 0;background:#0c0c14;">
        <p style="font-family:Georgia,serif;font-size:15px;color:rgba(255,255,255,0.55);line-height:2.1;margin:0 0 16px;">
          The surface was never the point, ${safeName}. You knew that. That&rsquo;s why you&rsquo;re here.
        </p>
        <p style="font-family:Georgia,serif;font-size:14px;color:rgba(255,255,255,0.38);line-height:2.1;margin:0;">
          As an <strong style="color:#C8392E;">Initiate+</strong>, the full depth of the archive is now yours&nbsp;&mdash; every episode, every figure, every thread woven through six years of transmissions.
        </p>
      </td></tr>

      <!-- Divider w/ glyph -->
      <tr><td align="center" style="padding:28px 40px 20px;background:#0c0c14;">
        <p style="font-family:'Courier New',monospace;font-size:10px;color:rgba(200, 57, 46,0.18);margin:0;letter-spacing:14px;">✦ ✦ ✦</p>
      </td></tr>

      <!-- Features -->
      <tr><td style="padding:0 48px 8px;background:#0c0c14;">
        <p style="font-family:'Courier New',monospace;font-size:8px;color:rgba(200, 57, 46,0.25);letter-spacing:0.6em;text-transform:uppercase;margin:0 0 20px;">What&rsquo;s now unlocked</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          ${featureRows}
        </table>
      </td></tr>

      <!-- Rule -->
      <tr><td style="padding:0 40px;background:#0c0c14;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="height:1px;background:rgba(200, 57, 46,0.08);font-size:0;line-height:0;">&nbsp;</td>
        </tr></table>
      </td></tr>

      <!-- CTA -->
      <tr><td align="center" style="padding:32px 40px 44px;background:#0c0c14;">
        <a href="https://cultcodex.me/start-here" style="display:inline-block;padding:16px 52px;background:rgba(200, 57, 46,0.07);border:1px solid rgba(200, 57, 46,0.4);color:#C8392E;text-decoration:none;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.45em;text-transform:uppercase;border-radius:3px;">
          Enter the Archive &rarr;
        </a>
        <p style="font-family:'Courier New',monospace;font-size:9px;color:rgba(255,255,255,0.15);margin:16px 0 0;letter-spacing:0.05em;">
          Set your Initiate title and appear on the Member Roll at
          <a href="https://cultcodex.me/settings/profile" style="color:rgba(200, 57, 46,0.4);text-decoration:none;">cultcodex.me/settings/profile</a>
        </p>
      </td></tr>

      <!-- Footer -->
      <tr><td align="center" style="padding:0 40px 36px;border-top:1px solid rgba(200, 57, 46,0.07);background:#0c0c14;">
        <p style="font-family:'Courier New',monospace;font-size:8px;color:rgba(200, 57, 46,0.18);letter-spacing:0.5em;text-transform:uppercase;margin:28px 0 6px;">
          CultCodex &nbsp;·&nbsp; The Living Archive &nbsp;·&nbsp; cultcodex.me
        </p>
        <p style="font-family:'Courier New',monospace;font-size:8px;color:rgba(255,255,255,0.1);margin:0;">
          Manage your subscription &mdash;
          <a href="https://cultcodex.me/settings" style="color:rgba(200, 57, 46,0.25);text-decoration:none;">cultcodex.me/settings</a>
        </p>
      </td></tr>

    </table>
    </td></tr>
  </table>

</td></tr>
</table>
</body>
</html>`;
}

function buildOracleWelcomeHtml(name: string): string {
  const safeName = name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const features: { glyph: string; title: string; body: string }[] = [
    {
      glyph: "◈",
      title: "Your Codex Page",
      body: "A permanent address inside the archive — cultcodex.me/members/[your-slug]. Choose your URL, set your banner, list your links. Your signal, permanently woven in.",
    },
    {
      glyph: "▓",
      title: "The Red Room",
      body: "No filters. No softening. Unedited analysis of what's actually happening in the psychology, the power dynamics, the things nobody says directly. The archive with nothing removed.",
    },
    {
      glyph: "◉",
      title: "Signal Lab",
      body: "Your questions become the work. Submit investigation proposals. Vote on what gets analyzed next. The archive is shaped by those inside it — you are one of them now.",
    },
    {
      glyph: "⬡",
      title: "The Power Graph",
      body: "See the full network laid out — who connects to whom, how, and when those connections shifted. Every relationship made visible.",
    },
    {
      glyph: "▦",
      title: "Deep Behavioral Profiles",
      body: "Extended pattern analysis on every recurring figure. Not just what they said — what they revealed, what they avoided, what the record shows across time.",
    },
    {
      glyph: "✦",
      title: "Card Collection Showcase",
      body: "Your rarest trading cards displayed on your codex page. The archive has its own economy. Oracle members are part of it.",
    },
    {
      glyph: "◎",
      title: "Named Role",
      body: "Oracle. Architect. Watcher. Choose your role and hold it. You are listed as a contributor to the archive itself — not a subscriber. A builder.",
    },
  ];

  const featureRows = features.map((f) => `
    <tr>
      <td style="padding:0 0 22px;vertical-align:top;width:28px;">
        <span style="font-family:'Courier New',monospace;font-size:12px;color:#C060FF;line-height:1.6;">${f.glyph}</span>
      </td>
      <td style="padding:0 0 22px 10px;">
        <p style="font-family:'Courier New',monospace;font-size:11px;color:#C060FF;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 5px;">${f.title}</p>
        <p style="font-family:Georgia,serif;font-size:13px;color:rgba(255,255,255,0.42);line-height:1.85;margin:0;">${f.body}</p>
      </td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>You're inside the system now</title></head>
<body style="margin:0;padding:0;background:#06000f;color:#e0e0e0;font-family:'Courier New',monospace;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#06000f;">
<tr><td align="center" style="padding:40px 16px 64px;">

  <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
    <tr><td style="padding:2px;background:linear-gradient(135deg,rgba(192,96,255,0.4) 0%,rgba(192,96,255,0.06) 100%);border-radius:16px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0d000f;border-radius:14px;overflow:hidden;">

      <!-- Top glow band -->
      <tr><td style="padding:0;line-height:0;font-size:0;background:linear-gradient(180deg,rgba(192,96,255,0.12) 0%,transparent 100%);height:6px;">&nbsp;</td></tr>

      <!-- Cipher label -->
      <tr><td align="center" style="padding:32px 40px 0;background:#0d000f;">
        <p style="font-family:'Courier New',monospace;font-size:8px;color:rgba(192,96,255,0.35);letter-spacing:0.7em;text-transform:uppercase;margin:0;border:1px solid rgba(192,96,255,0.15);display:inline-block;padding:6px 18px;">
          Oracle Transmission &nbsp;·&nbsp; System Tier &nbsp;·&nbsp; Full Access
        </p>
      </td></tr>

      <!-- Eye glyph -->
      <tr><td align="center" style="padding:24px 40px 4px;background:#0d000f;">
        <p style="font-family:'Courier New',monospace;font-size:28px;color:rgba(192,96,255,0.25);margin:0;line-height:1;letter-spacing:0.1em;">◉</p>
      </td></tr>

      <!-- Heading -->
      <tr><td align="center" style="padding:12px 48px 8px;background:#0d000f;">
        <h1 style="font-family:Georgia,serif;font-size:38px;color:#ffffff;font-weight:400;margin:0;letter-spacing:0.03em;line-height:1.25;">
          You&rsquo;re not watching<br><span style="color:#C060FF;">anymore.</span>
        </h1>
        <p style="font-family:Georgia,serif;font-size:16px;color:rgba(192,96,255,0.5);font-style:italic;margin:14px 0 0;font-weight:400;">
          You&rsquo;re inside it.
        </p>
        <p style="font-family:'Courier New',monospace;font-size:9px;color:rgba(192,96,255,0.3);letter-spacing:0.4em;text-transform:uppercase;margin:18px 0 0;">
          Oracle &nbsp;·&nbsp; ${safeName}
        </p>
      </td></tr>

      <!-- Rule -->
      <tr><td style="padding:24px 40px 0;background:#0d000f;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="height:1px;background:rgba(192,96,255,0.1);font-size:0;line-height:0;">&nbsp;</td>
        </tr></table>
      </td></tr>

      <!-- Intro copy -->
      <tr><td style="padding:28px 48px 0;background:#0d000f;">
        <p style="font-family:Georgia,serif;font-size:15px;color:rgba(255,255,255,0.55);line-height:2.1;margin:0 0 16px;">
          The archive doesn&rsquo;t just open for Oracles, ${safeName}. It changes.
        </p>
        <p style="font-family:Georgia,serif;font-size:14px;color:rgba(255,255,255,0.38);line-height:2.1;margin:0 0 16px;">
          You now have a permanent address inside it. Your questions shape what gets analyzed. The Red Room has no filter. The graph shows the full network.
        </p>
        <p style="font-family:Georgia,serif;font-size:14px;color:rgba(192,96,255,0.55);line-height:2;margin:0;font-style:italic;">
          This is not a subscription. This is a position inside the system.
        </p>
      </td></tr>

      <!-- Divider w/ glyph -->
      <tr><td align="center" style="padding:28px 40px 20px;background:#0d000f;">
        <p style="font-family:'Courier New',monospace;font-size:10px;color:rgba(192,96,255,0.15);margin:0;letter-spacing:14px;">✦ ✦ ✦</p>
      </td></tr>

      <!-- Features -->
      <tr><td style="padding:0 48px 8px;background:#0d000f;">
        <p style="font-family:'Courier New',monospace;font-size:8px;color:rgba(192,96,255,0.22);letter-spacing:0.6em;text-transform:uppercase;margin:0 0 20px;">What you now hold</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          ${featureRows}
        </table>
      </td></tr>

      <!-- Rule -->
      <tr><td style="padding:0 40px;background:#0d000f;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="height:1px;background:rgba(192,96,255,0.08);font-size:0;line-height:0;">&nbsp;</td>
        </tr></table>
      </td></tr>

      <!-- First action callout -->
      <tr><td style="padding:24px 48px;background:#0d000f;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(192,96,255,0.05);border:1px solid rgba(192,96,255,0.12);border-radius:8px;">
          <tr><td style="padding:20px 24px;">
            <p style="font-family:'Courier New',monospace;font-size:8px;color:rgba(192,96,255,0.35);letter-spacing:0.5em;text-transform:uppercase;margin:0 0 8px;">Your first move</p>
            <p style="font-family:Georgia,serif;font-size:13px;color:rgba(255,255,255,0.45);line-height:1.85;margin:0 0 12px;">
              Claim your codex page. Choose your URL. Set your banner. This is how you become a permanent part of the archive — not just someone who read it.
            </p>
            <a href="https://cultcodex.me/settings/profile" style="font-family:'Courier New',monospace;font-size:10px;color:#C060FF;text-decoration:none;letter-spacing:0.2em;">
              cultcodex.me/settings/profile &rarr;
            </a>
          </td></tr>
        </table>
      </td></tr>

      <!-- CTAs -->
      <tr><td align="center" style="padding:0 40px 44px;background:#0d000f;">
        <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
          <tr>
            <td style="padding-right:12px;">
              <a href="https://cultcodex.me/red-room" style="display:inline-block;padding:16px 36px;background:rgba(192,96,255,0.08);border:1px solid rgba(192,96,255,0.4);color:#C060FF;text-decoration:none;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.4em;text-transform:uppercase;border-radius:3px;white-space:nowrap;">
                Red Room &rarr;
              </a>
            </td>
            <td>
              <a href="https://cultcodex.me/signals" style="display:inline-block;padding:16px 36px;background:transparent;border:1px solid rgba(192,96,255,0.2);color:rgba(192,96,255,0.6);text-decoration:none;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.4em;text-transform:uppercase;border-radius:3px;white-space:nowrap;">
                Signal Lab &rarr;
              </a>
            </td>
          </tr>
        </table>
        <p style="font-family:'Courier New',monospace;font-size:9px;color:rgba(255,255,255,0.12);margin:20px 0 0;letter-spacing:0.05em;">
          All Initiate+ features are included. Full access, no exceptions.
        </p>
      </td></tr>

      <!-- Footer -->
      <tr><td align="center" style="padding:0 40px 36px;border-top:1px solid rgba(192,96,255,0.07);background:#0d000f;">
        <p style="font-family:'Courier New',monospace;font-size:8px;color:rgba(192,96,255,0.18);letter-spacing:0.5em;text-transform:uppercase;margin:28px 0 6px;">
          CultCodex &nbsp;·&nbsp; The Living Archive &nbsp;·&nbsp; cultcodex.me
        </p>
        <p style="font-family:'Courier New',monospace;font-size:8px;color:rgba(255,255,255,0.1);margin:0;">
          Manage your subscription &mdash;
          <a href="https://cultcodex.me/settings" style="color:rgba(192,96,255,0.25);text-decoration:none;">cultcodex.me/settings</a>
        </p>
      </td></tr>

    </table>
    </td></tr>
  </table>

</td></tr>
</table>
</body>
</html>`;
}

function buildEmailHtml(title: string, videoId: string, unsubscribeUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;color:#e8e8e8;font-family:monospace;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:30px;">
      <img src="https://cultcodex.me/logo.jpg" alt="Cult of Psyche" width="80" height="80" style="border-radius:50%;border:2px solid #C8392E;" />
    </div>
    <div style="text-align:center;padding:20px;background:#12131A;border:1px solid #C8392E;border-radius:8px;">
      <div style="font-size:12px;color:#ff4444;letter-spacing:3px;margin-bottom:8px;">● LIVE NOW</div>
      <h1 style="color:#C8392E;font-size:22px;margin:0 0 12px;">${title}</h1>
      <p style="color:#62E4C8;font-size:13px;margin:0 0 24px;">The stream is live on Cult of Psyche</p>
      <a href="https://cultcodex.me/live" style="display:inline-block;padding:12px 32px;background:#C8392E;color:#0a0a0a;text-decoration:none;font-weight:bold;font-size:14px;border-radius:4px;">
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
        You're receiving this because you subscribed at cultcodex.me ·
        <a href="${unsubscribeUrl}" style="color:#6b6b6b;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Double opt-in: the only email an unconfirmed address ever gets. Nothing on
 * the list is mailed until the recipient clicks this link.
 */
export async function sendSubscribeConfirmation(email: string, confirmUrl: string) {
  const resend = getResend();
  if (!resend) throw new Error("RESEND_API_KEY not configured");
  const { error } = await resend.emails.send({
    from: "CultCodex <notifications@cultcodex.me>",
    to: email,
    subject: "Confirm your CultCodex email updates",
    text: [
      "Someone (hopefully you) asked for CultCodex email updates at this address.",
      "",
      `Confirm here: ${confirmUrl}`,
      "",
      "If this wasn't you, ignore this email and you won't hear from us again.",
    ].join("\n"),
  });
  if (error) throw new Error(error.message);
}
