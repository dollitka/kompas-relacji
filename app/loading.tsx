export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="flex items-center gap-3 text-sm text-navy-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy-200 border-t-navy-700" />
        Ładowanie…
      </div>
    </div>
  );
}
