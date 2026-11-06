export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-sm text-[#9f2d2d]">{error}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-[#e4ddd0] bg-white px-3 py-2.5 outline-none ring-[#0f6e56] focus:ring-2";

export const buttonClass =
  "inline-flex items-center justify-center rounded-xl bg-[#0f6e56] px-4 py-2.5 font-medium text-white disabled:opacity-60";
