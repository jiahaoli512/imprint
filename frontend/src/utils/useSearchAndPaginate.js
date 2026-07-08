import { useState } from 'react';
import { matchesQuery } from './matchesQuery';
import { usePagination } from './usePagination';

// The shared shell behind every searchable admin table: a free-text search box
// (matchesQuery) filtering `items`, paginated (usePagination) over the result.
// `getFields(item)` returns the strings to match against for that item (e.g.
// `(u) => [u.email, fullName(u)]`). Changing the search always jumps back to
// page 0 — usePagination's own clamp only prevents landing past the last page,
// it wouldn't otherwise force you back to the top of a new result set.
export function useSearchAndPaginate(items, getFields, pageSize) {
  const [search, setSearch] = useState('');
  const filtered = items.filter((item) => matchesQuery(search, ...getFields(item)));
  const pagination = usePagination(filtered, pageSize);

  const onSearchChange = (value) => {
    setSearch(value);
    pagination.setPage(0);
  };

  return { search, onSearchChange, filtered, ...pagination };
}
