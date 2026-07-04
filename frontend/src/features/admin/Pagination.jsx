import { ChevronLeft, ChevronRight } from 'lucide-react';

// Prev/next pager with an "N–M of T" label, shared by the admin tables. Renders
// nothing when everything fits on one page. Takes the clamped `page` and derived
// `start`/`pageCount`/`total` from usePagination; `onPage(next)` sets the page.
export default function Pagination({ page, pageCount, start, pageSize, total, onPage }) {
  if (total <= pageSize) return null;
  return (
    <div className="admin-pagination">
      <button className="icon-btn" onClick={() => onPage(page - 1)} disabled={page === 0} aria-label="Previous page">
        <ChevronLeft size={18} />
      </button>
      <span className="admin-page-label">
        {start + 1}–{Math.min(start + pageSize, total)} of {total}
      </span>
      <button className="icon-btn" onClick={() => onPage(page + 1)} disabled={page >= pageCount - 1} aria-label="Next page">
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
