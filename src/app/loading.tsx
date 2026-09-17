export default function Loading() {
  return (
    <div className="container-page py-20">
      <div className="mx-auto max-w-2xl space-y-4" aria-busy="true" aria-label="Loading">
        <div className="h-8 w-2/3 animate-pulse rounded-lg bg-[var(--bg-muted)]" />
        <div className="h-4 w-full animate-pulse rounded bg-[var(--bg-muted)]" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-[var(--bg-muted)]" />
        <div className="h-64 w-full animate-pulse rounded-[var(--radius-card)] bg-[var(--bg-muted)]" />
      </div>
    </div>
  );
}
