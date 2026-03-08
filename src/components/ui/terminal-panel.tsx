import { cn } from "@/lib/utils";

interface TerminalPanelProps {
  header?: string;
  className?: string;
  children: React.ReactNode;
}

export function TerminalPanel({ header, className, children }: TerminalPanelProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-accent-green/20 bg-void overflow-hidden",
        className
      )}
    >
      {header && (
        <div className="border-b border-accent-green/20 bg-accent-green-dim px-4 py-2">
          <span className="font-mono text-xs font-bold text-accent-green">
            {header}
          </span>
        </div>
      )}
      <div className="p-4 font-mono text-sm">{children}</div>
    </div>
  );
}
