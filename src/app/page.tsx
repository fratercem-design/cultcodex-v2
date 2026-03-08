import { PageShell } from "@/components/ui/page-shell";
import { TerminalPanel } from "@/components/ui/terminal-panel";

export default function HomePage() {
  return (
    <PageShell
      title="MATRIX ARCHIVE"
      subtitle="The sacred intelligence terminal of the Cult of Psyche"
    >
      <TerminalPanel header="SYS::STATUS">
        <p className="text-accent-green">Archive online. Loading data feeds...</p>
        <p className="mt-2 text-text-muted">
          Episodes: — · People: — · Lore: — · Quotes: —
        </p>
      </TerminalPanel>
    </PageShell>
  );
}
