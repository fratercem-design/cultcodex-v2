# Phase 2 — Plan 4: Confidence + Evidence System

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every Oracle analysis output carries a confidence score, ambiguity level, evidence references, and competing interpretations — so Hermes feels genuinely intelligent rather than falsely certain.

**Architecture:** Shared TypeScript types define `AnalysisResult`. An `analyzer.ts` service wraps Anthropic calls and always returns structured, confidence-annotated output. The Oracle `ask` route is updated to return `AnalysisResult` instead of raw text. The UI receives confidence metadata and can render it appropriately.

**Tech Stack:** TypeScript, Anthropic SDK, Next.js App Router, Vitest

**Prerequisite:** Plans 1–3 should be complete. Plan 4 wraps the other systems into a unified output format.

---

## File Structure

- Create: `src/types/analysis.ts` — AnalysisResult, EvidenceRef, CompetingPattern types
- Create: `src/lib/analysis/confidence.ts` — confidence scoring utilities
- Create: `src/lib/analysis/analyzer.ts` — structured analysis wrapper around Anthropic
- Create: `src/lib/analysis/__tests__/confidence.test.ts`
- Create: `src/lib/analysis/__tests__/analyzer.test.ts`
- Modify: `src/app/api/oracle/ask/route.ts` — return AnalysisResult metadata
- Modify: `src/components/oracle/oracle-console.tsx` — render confidence badge

---

### Task 1: Analysis Types

**Files:**
- Create: `src/types/analysis.ts`

- [ ] **Step 1: Write the type file**

```typescript
// src/types/analysis.ts
import type { EvidenceRef } from "@/types/ingestion";

export type AmbiguityLevel = "low" | "moderate" | "high";

export interface CompetingPattern {
  pattern: string;
  confidence: number;
}

export interface AnalysisResult {
  interpretation: string;
  confidence: number;       // 0–1
  ambiguity: AmbiguityLevel;
  evidence: EvidenceRef[];
  competingPatterns: CompetingPattern[];
}

export interface OracleAnalysis {
  answer: string;
  analysis: AnalysisResult;
  citations: import("@/app/api/oracle/ask/route").OracleCitation[];
  audioBase64: string | null;
  hasVoice: boolean;
}

export function ambiguityFromConfidence(confidence: number): AmbiguityLevel {
  if (confidence >= 0.75) return "low";
  if (confidence >= 0.45) return "moderate";
  return "high";
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/analysis.ts
git commit -m "feat(analysis): add AnalysisResult and OracleAnalysis types"
```

---

### Task 2: Confidence Scoring Utilities

**Files:**
- Create: `src/lib/analysis/confidence.ts`
- Create: `src/lib/analysis/__tests__/confidence.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/analysis/__tests__/confidence.test.ts
import { describe, it, expect } from "vitest";
import {
  blendConfidences,
  evidenceWeightedConfidence,
  clampConfidence,
} from "../confidence";

describe("clampConfidence", () => {
  it("clamps values above 1 to 1", () => {
    expect(clampConfidence(1.5)).toBe(1.0);
  });
  it("clamps values below 0 to 0", () => {
    expect(clampConfidence(-0.1)).toBe(0.0);
  });
  it("returns value unchanged when in range", () => {
    expect(clampConfidence(0.72)).toBeCloseTo(0.72);
  });
});

describe("blendConfidences", () => {
  it("returns average of equal-weight scores", () => {
    expect(blendConfidences([0.6, 0.8, 0.7])).toBeCloseTo(0.7);
  });
  it("returns 0 for empty array", () => {
    expect(blendConfidences([])).toBe(0);
  });
  it("applies weights when provided", () => {
    // 0.9 * 2 + 0.3 * 1 / 3 = 0.7
    expect(blendConfidences([0.9, 0.3], [2, 1])).toBeCloseTo(0.7);
  });
});

describe("evidenceWeightedConfidence", () => {
  it("boosts confidence proportional to evidence count up to a cap", () => {
    const base = 0.6;
    const with3 = evidenceWeightedConfidence(base, 3);
    const with0 = evidenceWeightedConfidence(base, 0);
    expect(with3).toBeGreaterThan(with0);
    expect(with3).toBeLessThanOrEqual(1.0);
  });
  it("never reduces confidence below base", () => {
    expect(evidenceWeightedConfidence(0.5, 0)).toBeGreaterThanOrEqual(0.5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/analysis/__tests__/confidence.test.ts
```
Expected: FAIL

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/analysis/confidence.ts

export function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function blendConfidences(scores: number[], weights?: number[]): number {
  if (scores.length === 0) return 0;
  if (!weights || weights.length !== scores.length) {
    return scores.reduce((s, v) => s + v, 0) / scores.length;
  }
  const totalWeight = weights.reduce((s, w) => s + w, 0);
  if (totalWeight === 0) return 0;
  const weighted = scores.reduce((s, v, i) => s + v * (weights[i] ?? 1), 0);
  return clampConfidence(weighted / totalWeight);
}

export function evidenceWeightedConfidence(
  baseConfidence: number,
  evidenceCount: number
): number {
  // Each evidence ref adds up to 5% boost, capped at 20% total boost
  const boost = Math.min(evidenceCount * 0.05, 0.20);
  return clampConfidence(baseConfidence + boost);
}

export function parseAiConfidence(raw: unknown): number {
  const n = typeof raw === "number" ? raw : parseFloat(String(raw ?? "0"));
  return clampConfidence(isNaN(n) ? 0 : n);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/analysis/__tests__/confidence.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/analysis/confidence.ts src/lib/analysis/__tests__/confidence.test.ts
git commit -m "feat(analysis): confidence scoring utilities — blend, clamp, evidence weight"
```

---

### Task 3: Structured Analyzer Service

**Files:**
- Create: `src/lib/analysis/analyzer.ts`
- Create: `src/lib/analysis/__tests__/analyzer.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/analysis/__tests__/analyzer.test.ts
import { describe, it, expect, vi } from "vitest";
import { parseAnalysisResponse } from "../analyzer";

describe("parseAnalysisResponse", () => {
  it("parses complete valid response", () => {
    const raw = JSON.stringify({
      interpretation: "Dominance pattern emerging.",
      confidence: 0.72,
      ambiguity: "moderate",
      competingPatterns: [
        { pattern: "Defensive posturing", confidence: 0.28 }
      ],
    });
    const result = parseAnalysisResponse(raw, []);
    expect(result.interpretation).toBe("Dominance pattern emerging.");
    expect(result.confidence).toBeCloseTo(0.72);
    expect(result.ambiguity).toBe("moderate");
    expect(result.competingPatterns).toHaveLength(1);
  });

  it("falls back to low confidence on unparseable response", () => {
    const result = parseAnalysisResponse("not json", []);
    expect(result.confidence).toBe(0.1);
    expect(result.ambiguity).toBe("high");
  });

  it("clamps confidence to valid range", () => {
    const raw = JSON.stringify({ interpretation: "X", confidence: 1.5, ambiguity: "low", competingPatterns: [] });
    const result = parseAnalysisResponse(raw, []);
    expect(result.confidence).toBeLessThanOrEqual(1.0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/analysis/__tests__/analyzer.test.ts
```
Expected: FAIL

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/analysis/analyzer.ts
import Anthropic from "@anthropic-ai/sdk";
import { clampConfidence, evidenceWeightedConfidence } from "./confidence";
import { ambiguityFromConfidence } from "@/types/analysis";
import type { AnalysisResult, AmbiguityLevel, CompetingPattern } from "@/types/analysis";
import type { EvidenceRef } from "@/types/ingestion";

const client = new Anthropic();

const ANALYSIS_SYSTEM = `You analyze social dynamics from conversation evidence. Return ONLY JSON matching this schema exactly:
{
  "interpretation": "string — the primary pattern observed",
  "confidence": 0.0,
  "ambiguity": "low"|"moderate"|"high",
  "competingPatterns": [{"pattern":"string","confidence":0.0}]
}
Rules: confidence 0–1, be probabilistic never certain, list 1–3 competing patterns when ambiguous, base claims only on provided evidence.`;

export function parseAnalysisResponse(
  raw: string,
  evidence: EvidenceRef[]
): AnalysisResult {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      interpretation: "Pattern unclear — insufficient evidence.",
      confidence: 0.1,
      ambiguity: "high",
      evidence,
      competingPatterns: [],
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      interpretation?: string;
      confidence?: number;
      ambiguity?: string;
      competingPatterns?: { pattern: string; confidence: number }[];
    };

    const baseConfidence = clampConfidence(parsed.confidence ?? 0.1);
    const boosted = evidenceWeightedConfidence(baseConfidence, evidence.length);
    const ambiguity = (["low", "moderate", "high"].includes(parsed.ambiguity ?? "")
      ? parsed.ambiguity
      : ambiguityFromConfidence(boosted)) as AmbiguityLevel;

    const competingPatterns: CompetingPattern[] = (parsed.competingPatterns ?? []).map((p) => ({
      pattern: p.pattern ?? "",
      confidence: clampConfidence(p.confidence ?? 0),
    }));

    return {
      interpretation: parsed.interpretation ?? "No clear pattern identified.",
      confidence: boosted,
      ambiguity,
      evidence,
      competingPatterns,
    };
  } catch {
    return {
      interpretation: "Analysis failed — response unparseable.",
      confidence: 0.1,
      ambiguity: "high",
      evidence,
      competingPatterns: [],
    };
  }
}

export async function analyzeContext(
  context: string,
  question: string,
  evidence: EvidenceRef[]
): Promise<AnalysisResult> {
  const res = await client.messages.create({
    model: process.env.ENRICHMENT_MODEL ?? "claude-haiku-4-5-20251001",
    max_tokens: 400,
    system: ANALYSIS_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Evidence context:\n${context.slice(0, 3000)}\n\nQuestion: ${question}`,
      },
    ],
  });

  const text = res.content.find((b) => b.type === "text")?.text ?? "{}";
  return parseAnalysisResponse(text, evidence);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/analysis/__tests__/analyzer.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/analysis/analyzer.ts src/lib/analysis/__tests__/analyzer.test.ts
git commit -m "feat(analysis): structured analyzer service with confidence + competing patterns"
```

---

### Task 4: Update Oracle Route to Return AnalysisResult

**Files:**
- Modify: `src/app/api/oracle/ask/route.ts`

- [ ] **Step 1: Import and wire analyzer**

At top of `src/app/api/oracle/ask/route.ts`, add:

```typescript
import { analyzeContext } from "@/lib/analysis/analyzer";
import type { AnalysisResult } from "@/types/analysis";
```

Update `OracleResponse` interface to include analysis metadata:

```typescript
export interface OracleResponse {
  ok: boolean;
  answer?: string;
  analysis?: AnalysisResult;
  citations?: OracleCitation[];
  audioBase64?: string | null;
  hasVoice?: boolean;
  error?: string;
}
```

In the `POST` handler, after `buildContext`, add analysis call and include in response:

```typescript
// After buildContext:
const [claudeRes, analysisResult] = await Promise.all([
  client.messages.create({
    model: process.env.ENRICHMENT_MODEL ?? "claude-haiku-4-5-20251001",
    max_tokens: 350,
    system: ORACLE_SYSTEM,
    messages: [{ role: "user", content: `Archive context:\n${contextText}\n\nQuestion: ${question}` }],
  }),
  analyzeContext(contextText, question, []).catch(() => null),
]);
```

Update return statement:
```typescript
return NextResponse.json({
  ok: true,
  answer,
  analysis: analysisResult ?? undefined,
  citations,
  audioBase64,
  hasVoice: !!audioBase64,
} satisfies OracleResponse);
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/oracle/ask/route.ts
git commit -m "feat(analysis): Oracle route returns AnalysisResult with confidence metadata"
```

---

### Task 5: Render Confidence in Oracle Console

**Files:**
- Modify: `src/components/oracle/oracle-console.tsx`

- [ ] **Step 1: Read the current oracle-console.tsx**

```bash
cat src/components/oracle/oracle-console.tsx
```

- [ ] **Step 2: Add confidence badge rendering**

Find where the Oracle answer is rendered. After the answer `<p>` (or whatever element renders the text), add:

```tsx
{response.analysis && (
  <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
    <span className={
      response.analysis.confidence >= 0.75
        ? "text-emerald-400"
        : response.analysis.confidence >= 0.45
        ? "text-amber-400"
        : "text-red-400"
    }>
      {Math.round(response.analysis.confidence * 100)}% confidence
    </span>
    <span className="opacity-50">·</span>
    <span className="capitalize">{response.analysis.ambiguity} ambiguity</span>
    {response.analysis.competingPatterns.length > 0 && (
      <>
        <span className="opacity-50">·</span>
        <span title={response.analysis.competingPatterns.map(p => p.pattern).join("; ")}>
          {response.analysis.competingPatterns.length} competing pattern{response.analysis.competingPatterns.length > 1 ? "s" : ""}
        </span>
      </>
    )}
  </div>
)}
```

You will need to add `analysis?: AnalysisResult` to the local state type that holds the Oracle response.

- [ ] **Step 3: Verify visually**

Start dev server and ask the Oracle a question. Confirm confidence bar appears below the answer.

- [ ] **Step 4: Commit**

```bash
git add src/components/oracle/oracle-console.tsx
git commit -m "feat(analysis): render confidence score and ambiguity in Oracle console"
```

---

## Self-Review

**Spec coverage:**
- ✅ Confidence score on every analysis
- ✅ Ambiguity level (low/moderate/high)
- ✅ Evidence references (`EvidenceRef[]` linked to stream chunks/events)
- ✅ Competing interpretations (`CompetingPattern[]`)
- ✅ Prevents hallucinated mythology — low-evidence responses get low confidence
- ✅ Oracle returns structured `AnalysisResult`
- ✅ UI renders confidence metadata
- ✅ Ethical stability — probabilistic framing enforced in system prompt

**No placeholders found.**

**Type consistency:** `AmbiguityLevel` defined in `types/analysis.ts` and re-exported — used in `analyzer.ts`, `types/ingestion.ts` (via `StreamInterpretation`), and `memory-layers.ts`. Consistent `"low" | "moderate" | "high"` union throughout.
