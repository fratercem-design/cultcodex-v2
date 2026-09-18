// Shared format rules for .env.fly-production. Never returns or logs a value.

// Branch id the prior session recorded for the restored staging copy. Used only
// as a negative guard: production must not point at it.
const STAGING_BRANCH = "duthqmsm1t7o7495r8vnb635n0";
const PROD_GOOGLE_CLIENT = "954951080916-kpt9mfdmv68ld096qrdt2mvvmcis25vu.apps.googleusercontent.com";

const pg = (v) => /^postgres(ql)?:\/\//i.test(v) || "not a postgres:// URL";
const notStaging = (v) => !v.includes(STAGING_BRANCH) || "points at the migration-staging branch, not production";

// Each rule returns a list of problems; empty means well-formed.
export const checks = {
  DATABASE_URL: (v) => [pg(v), notStaging(v)],
  DIRECT_URL: (v, env) => [pg(v), notStaging(v), v !== env.DATABASE_URL || "identical to DATABASE_URL — must be the direct (non-pooled) string"],
  GOOGLE_CLIENT_ID: (v) => [v === PROD_GOOGLE_CLIENT || "does not match the client production signs in with"],
  GOOGLE_CLIENT_SECRET: (v) => [/^GOCSPX-/.test(v) || "Google web client secrets start with GOCSPX-"],
  STRIPE_SECRET_KEY: (v) => [/^(sk|rk)_live_/.test(v) || (/^(sk|rk)_test_/.test(v) ? "TEST key — production needs a live key" : "not a Stripe secret key")],
  STRIPE_WEBHOOK_SECRET: (v) => [/^whsec_/.test(v) || "Stripe signing secrets start with whsec_"],
  ADMIN_EMAILS: (v) => [v.split(",").every((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.trim())) || "must be comma-separated email addresses"],
  GROQ_API_KEY: (v) => [/^gsk_/.test(v) || "Groq keys start with gsk_"],
  OPENAI_API_KEY: (v) => [/^sk-/.test(v) || "OpenAI keys start with sk-"],
  RESEND_API_KEY: (v) => [/^re_/.test(v) || "Resend keys start with re_"],
  ALERT_FROM: (v) => [/@cultcodex\.me>?$/.test(v) || "sender should be on the verified cultcodex.me domain"],
};

// Pipeline keys: format rules only. Not part of the cutover minimum, so the
// checker's status table does not list them, but paste-secret validates them.
export const pipelineChecks = {
  ANTHROPIC_API_KEY: (v) => [/^sk-ant-/.test(v) || "Anthropic keys start with sk-ant-"],
  OPENROUTER_API_KEY: (v) => [/^sk-or-/.test(v) || "OpenRouter keys start with sk-or-"],
  GEMINI_API_KEY: (v) => [/^AIza[0-9A-Za-z_-]{30,}$/.test(v) || "Google AI keys start with AIza"],
  AWS_ACCESS_KEY_ID: (v) => [/^(AKIA|ASIA)[0-9A-Z]{16}$/.test(v) || "AWS access key ids look like AKIA + 16 characters"],
  AWS_SECRET_ACCESS_KEY: (v) => [/^[A-Za-z0-9/+=]{40}$/.test(v) || "AWS secret keys are 40 characters"],
  SUPADATA_API_KEY: (v) => [v.length >= 16 || "looks too short for an API key"],
  R2_ACCOUNT_ID: (v) => [/^[0-9a-f]{32}$/.test(v) || "Cloudflare account ids are 32 hex characters"],
  R2_ACCESS_KEY_ID: (v) => [/^[0-9a-f]{32}$/.test(v) || "R2 access key ids are 32 hex characters"],
  R2_SECRET_ACCESS_KEY: (v) => [/^[0-9a-f]{64}$/.test(v) || "R2 secret keys are 64 hex characters"],
  R2_BUCKET: (v) => [/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(v) || "not a valid bucket name"],
};

export function problemsFor(name, value, env = {}) {
  const rule = checks[name] ?? pipelineChecks[name];
  return rule ? rule(value, env).filter((r) => r !== true) : [];
}

export function parseEnv(text) {
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^"(.*)"$/, "$1");
  }
  return env;
}
