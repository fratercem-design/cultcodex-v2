interface MetaRowProps {
  label: string;
  value: React.ReactNode;
}

export function MetaRow({ label, value }: MetaRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 border-b border-border/50 last:border-0">
      <span className="font-mono text-xs text-text-muted shrink-0">{label}</span>
      <span className="font-mono text-xs text-text-primary text-right">{value}</span>
    </div>
  );
}
