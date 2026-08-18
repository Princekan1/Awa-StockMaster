export default function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 min-h-[50vh] py-24 px-6 text-sm text-[var(--color-ink-muted)]">
      <div
        className="h-9 w-9 rounded-full border-[2.5px] border-t-transparent animate-spin"
        style={{
          borderColor: 'var(--color-brand)',
          borderTopColor: 'transparent',
        }}
      />
      <span className="font-medium">{label}</span>
    </div>
  );
}
