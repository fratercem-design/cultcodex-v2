import Link from "next/link";
import { UserMenuLoader } from "@/components/auth/user-menu-loader";
import { SearchTrigger } from "@/components/search/search-trigger";
import { TerminalPathSeg } from "@/components/layout/terminal-path-seg";
import { CodexSigil } from "@/components/graphics/codex-sigil";

/**
 * Terminal-style topbar (36px).
 *
 * Layout (left → right):
 *   [◣ CULTCODEX]   [~/codex/{page}_]                 [● UPLINK: STABLE] [Search] [User]
 *
 * The session is loaded client-side (UserMenuLoader) rather than read
 * from the cookie during server render — this keeps the app shell and the
 * public content pages beneath it statically renderable / edge-cacheable.
 */
export function TerminalTopBar() {
  return (
    <header
      className="terminal-topbar flex items-center justify-between"
      style={{
        height: 36,
        borderBottom: "1px solid var(--term-line)",
        backgroundColor: "var(--term-bg-1)",
        paddingLeft: 12,
        paddingRight: 12,
      }}
    >
      {/* Brand */}
      <Link
        href="/"
        aria-label="CultCodex — Overview"
        className="font-mono text-[12px] font-semibold flex items-center gap-2"
        style={{
          color: "var(--neon)",
          textShadow: "var(--glow-neon)",
          letterSpacing: "0.12em",
        }}
      >
        <CodexSigil size={18} glow title="CultCodex sigil" />
        <span>CULTCODEX</span>
      </Link>

      {/* Center path */}
      <div className="hidden sm:flex flex-1 justify-center px-4 min-w-0">
        <TerminalPathSeg />
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-3">
        <span
          className="hidden md:inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest"
          style={{ color: "var(--neon-4)", textShadow: "var(--glow-amber)" }}
        >
          <span className="term-pulse" aria-hidden="true">
            ●
          </span>
          <span>UPLINK: STABLE</span>
        </span>
        <SearchTrigger />
        <UserMenuLoader />
      </div>
    </header>
  );
}
