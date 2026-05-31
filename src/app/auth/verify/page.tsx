import { Suspense } from "react";
import { VerifyContent } from "@/components/auth/verify-content";

export const metadata = {
  title: "Verifying — CULT CODEX",
  robots: { index: false, follow: false },
};

function VerifyFallback() {
  return (
    <div className="flex flex-col items-center gap-4">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-accent-gold border-t-transparent" />
      <p className="font-mono text-sm text-text-muted">Loading…</p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <main className="min-h-screen bg-void flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8">
        <Suspense fallback={<VerifyFallback />}>
          <VerifyContent />
        </Suspense>
      </div>
    </main>
  );
}
