interface AdminStatCardProps {
  icon: string;
  label: string;
  value: number;
  href?: string;
}

export function AdminStatCard({ icon, label, value, href }: AdminStatCardProps) {
  const Wrapper = href ? "a" : "div";
  return (
    <Wrapper
      {...(href ? { href } : {})}
      className="rounded-lg border border-border bg-surface p-4 text-center transition-colors hover:border-accent-gold/30"
    >
      <span className="text-lg">{icon}</span>
      <p className="mt-1 font-mono text-2xl font-bold text-accent-gold">
        {value.toLocaleString()}
      </p>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">
        {label}
      </p>
    </Wrapper>
  );
}
