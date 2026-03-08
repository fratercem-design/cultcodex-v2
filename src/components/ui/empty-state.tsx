interface EmptyStateProps {
  message: string;
  suggestion?: string;
}

export function EmptyState({ message, suggestion }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="font-mono text-sm text-text-muted">{message}</p>
      {suggestion && (
        <p className="mt-2 font-mono text-xs text-text-muted/60">{suggestion}</p>
      )}
    </div>
  );
}
