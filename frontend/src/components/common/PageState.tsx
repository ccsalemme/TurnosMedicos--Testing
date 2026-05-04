export function PageState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
      {message}
    </div>
  );
}
