interface PageShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function PageShell({ title, subtitle, children }: PageShellProps) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="font-mono text-2xl font-bold tracking-tight text-accent-green">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 font-mono text-sm text-text-muted">{subtitle}</p>
        )}
      </div>
      {children}
    </main>
  );
}
