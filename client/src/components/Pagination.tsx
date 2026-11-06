export function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="rounded-xl border border-[#e4ddd0] bg-white px-3 py-2 text-sm disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-sm text-[#6b645b]">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
        className="rounded-xl border border-[#e4ddd0] bg-white px-3 py-2 text-sm disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}
