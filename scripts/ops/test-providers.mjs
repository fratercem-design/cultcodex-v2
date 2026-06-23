#!/usr/bin/env node
/**
 * One-command health check for every free AI provider key in .env.
 * Run: node scripts/ops/test-providers.mjs
 * Hits each provider's chat (and embeddings where supported) and reports OK/FAIL + latency.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const env = {};
for (const line of readFileSync(join(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  const eq = line.indexOf("=");
  if (eq < 1) continue;
  const k = line.slice(0, eq).trim();
  const v = line.slice(eq + 1).trim().replace(/^"(.*)"$/, "$1");
  if (/^[A-Z_][A-Z0-9_]*$/.test(k)) env[k] = v;
}

const PING = [{ role: "user", content: "Reply with exactly: OK" }];

async function timed(fn) {
  const t = Date.now();
  try {
    const out = await fn();
    return { ok: true, ms: Date.now() - t, detail: out };
  } catch (e) {
    return { ok: false, ms: Date.now() - t, detail: e.message?.slice(0, 120) };
  }
}

async function openAICompatChat(url, key, model) {
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: PING, max_tokens: 8 }),
  });
  if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 80)}`);
  const d = await res.json();
  return d.choices?.[0]?.message?.content?.trim() || "(empty)";
}

const checks = [
  { name: "Groq (chat)", key: env.GROQ_API_KEY, run: () => openAICompatChat("https://api.groq.com/openai/v1/chat/completions", env.GROQ_API_KEY, "llama-3.3-70b-versatile") },
  { name: "Mistral (chat)", key: env.MISTRAL_API_KEY, run: () => openAICompatChat("https://api.mistral.ai/v1/chat/completions", env.MISTRAL_API_KEY, "mistral-small-latest") },
  { name: "HuggingFace (chat)", key: env.HUGGINGFACE_API_KEY, run: () => openAICompatChat("https://router.huggingface.co/v1/chat/completions", env.HUGGINGFACE_API_KEY, "meta-llama/Llama-3.3-70B-Instruct") },
  { name: "Gemini (chat)", key: env.GEMINI_API_KEY, run: async () => {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Reply with exactly: OK" }] }] }),
      });
      if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 80)}`);
      const d = await res.json();
      return d.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "(empty)";
    } },
  { name: "Cohere (embed)", key: env.COHERE_API_KEY, run: async () => {
      const res = await fetch("https://api.cohere.ai/v1/embed", {
        method: "POST", headers: { Authorization: `Bearer ${env.COHERE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ texts: ["ping"], model: "embed-english-v3.0", input_type: "search_document" }),
      });
      if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 80)}`);
      const d = await res.json();
      return `${d.embeddings?.[0]?.length || 0}-dim`;
    } },
  { name: "OpenRouter (chat)", key: env.OPENROUTER_API_KEY, run: () => openAICompatChat("https://openrouter.ai/api/v1/chat/completions", env.OPENROUTER_API_KEY, "meta-llama/llama-3.3-70b-instruct") },
];

console.log("\n  AI PROVIDER HEALTH CHECK\n  " + "─".repeat(46));
let live = 0;
for (const c of checks) {
  if (!c.key) { console.log(`  ⚪ ${c.name.padEnd(22)} no key set`); continue; }
  const r = await timed(c.run);
  if (r.ok) { live++; console.log(`  🟢 ${c.name.padEnd(22)} ${String(r.ms + "ms").padEnd(8)} → ${r.detail}`); }
  else console.log(`  🔴 ${c.name.padEnd(22)} ${String(r.ms + "ms").padEnd(8)} → ${r.detail}`);
}
console.log("  " + "─".repeat(46));
console.log(`  ${live}/${checks.filter((c) => c.key).length} configured providers live\n`);
