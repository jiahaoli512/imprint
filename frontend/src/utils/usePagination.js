import { useState } from 'react';

// Client-side pagination over an in-memory list. `page` is clamped to the valid
// range so shrinking the list (deleting rows, filtering) can't strand the view
// on an empty page. Returns the clamped page plus the slice to render.
export function usePagination(items, pageSize) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const start = current * pageSize;
  return {
    page: current,
    setPage,
    pageCount,
    start,
    pageSize,
    total: items.length,
    visible: items.slice(start, start + pageSize),
  };
}
