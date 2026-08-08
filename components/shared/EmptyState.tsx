interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 py-16 px-6">
      <p className="text-heading-sm">{title}</p>
      {description && (
        <p className="text-body-sm text-[var(--color-text-secondary)] max-w-sm">{description}</p>
      )}
      {action}
    </div>
  );
}
