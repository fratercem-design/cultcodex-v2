import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Resend } from "resend";
import crypto from "crypto";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://cultcodex.me";
const TOKEN_TTL_MINUTES = 15;
// Minimum seconds between sends for the same email
const SEND_COOLDOWN_SECONDS = 60;

function getResend() {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, callbackUrl } = body as { email?: string; callbackUrl?: string };

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const emailLower = email.toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  // Rate-limit: reject if a token was issued within the last 60 seconds
  const existing = await prisma.verificationToken.findFirst({
    where: { identifier: emailLower },
  });
  const cooldownCutoff =
    Date.now() + (TOKEN_TTL_MINUTES * 60 - SEND_COOLDOWN_SECONDS) * 1000;
  if (existing && existing.expires.getTime() > cooldownCutoff) {
    return NextResponse.json(
      { error: "Please wait a moment before requesting another link." },
      { status: 429 },
    );
  }

  // Clean up any stale tokens for this email
  await prisma.verificationToken.deleteMany({ where: { identifier: emailLower } });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  await prisma.verificationToken.create({
    data: { identifier: emailLower, token, expires },
  });

  const params = new URLSearchParams({ token, email: emailLower });
  if (callbackUrl) params.set("callbackUrl", callbackUrl);
  const magicUrl = `${SITE_URL}/auth/verify?${params.toString()}`;

  const resend = getResend();
  if (!resend) {
    console.error("[magic-link] RESEND_API_KEY not configured");
    return NextResponse.json({ error: "Email service not available" }, { status: 503 });
  }

  try {
    await resend.emails.send({
      from: "CultCodex <notifications@cultcodex.me>",
      to: emailLower,
      subject: "Your CultCodex sign-in link",
      html: buildMagicLinkHtml(magicUrl, TOKEN_TTL_MINUTES),
    });
  } catch (err) {
    console.error("[magic-link] Resend error:", err);
    return NextResponse.json({ error: "Failed to send email. Try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

function buildMagicLinkHtml(url: string, ttlMinutes: number): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080810;color:#e0e0e0;font-family:'Courier New',monospace;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#080810;">
<tr><td align="center" style="padding:48px 16px 64px;">
  <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;">
    <tr><td style="padding:2px;background:rgba(200,169,107,0.18);border-radius:14px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0c0c14;border-radius:12px;overflow:hidden;">

      <tr><td align="center" style="padding:36px 40px 24px;">
        <img src="https://cultcodex.me/logo.jpg" alt="CultCodex" width="60"
          style="width:60px;border-radius:50%;border:2px solid rgba(200,169,107,0.5);display:block;margin:0 auto 20px;" />
        <p style="font-family:'Courier New',monospace;font-size:8px;color:rgba(200,169,107,0.4);
          letter-spacing:0.7em;text-transform:uppercase;margin:0 0 10px;">CultCodex &nbsp;&bull;&nbsp; Access Granted</p>
        <h1 style="font-family:Georgia,serif;font-size:24px;color:#ffffff;font-weight:400;margin:0;">
          Your sign-in link
        </h1>
      </td></tr>

      <tr><td style="padding:0 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="height:1px;background:rgba(200,169,107,0.08);font-size:0;line-height:0;">&nbsp;</td></tr>
        </table>
      </td></tr>

      <tr><td style="padding:28px 40px;">
        <p style="font-family:Georgia,serif;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.9;margin:0 0 20px;">
          Click the button below to sign in to CultCodex. This link expires in
          <strong style="color:rgba(255,255,255,0.75);">${ttlMinutes} minutes</strong> and can only be used once.
        </p>
        <p style="font-family:'Courier New',monospace;font-size:12px;color:rgba(255,255,255,0.3);
          line-height:1.6;margin:0 0 24px;">
          If you didn&apos;t request this, you can safely ignore it.
        </p>
      </td></tr>

      <tr><td align="center" style="padding:0 40px 36px;">
        <a href="${url}"
          style="display:inline-block;padding:14px 48px;background:rgba(200,169,107,0.1);
          border:1px solid rgba(200,169,107,0.45);color:#C8A96B;text-decoration:none;
          font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.4em;
          text-transform:uppercase;border-radius:4px;">
          Sign in to CultCodex &rarr;
        </a>
        <p style="font-family:'Courier New',monospace;font-size:9px;color:rgba(255,255,255,0.15);
          margin:14px 0 0;letter-spacing:0.05em;">
          Or paste this link in your browser:<br/>
          <span style="color:rgba(93,183,216,0.4);word-break:break-all;">${url}</span>
        </p>
      </td></tr>

      <tr><td align="center" style="padding:0 40px 28px;border-top:1px solid rgba(200,169,107,0.06);">
        <p style="font-family:'Courier New',monospace;font-size:8px;color:rgba(200,169,107,0.2);
          letter-spacing:0.5em;text-transform:uppercase;margin:24px 0 0;">
          CultCodex &nbsp;&bull;&nbsp; cultcodex.me
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
