import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { api } from '../../api/client';
import { fullName } from '../../utils/fullName';
import { useDebouncedCallback } from '../../utils/useDebouncedCallback';
import { useDismiss } from '../../utils/useDismiss';
import UserIdentity from './UserIdentity';

const isNative = Capacitor.isNativePlatform();

// Self-contained user search: owns its query/results state, debounced lookups,
// click-outside dismissal, and navigation on select. `variant` controls the
// compact header styling vs. the full-width content block.
export default function UserSearch({ isAdminView, variant = 'block' }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef(null);

  // Admin view carries an admin token (no user session), so search must go
  // through the admin request; a regular user uses the user request.
  const debouncedSearch = useDebouncedCallback(async (q) => {
    try {
      const data = await (isAdminView ? api.adminSearchUsers : api.searchUsers)(q);
      setResults(data);
      setShowResults(true);
    } catch { setResults([]); }
  }, 250);

  useDismiss(containerRef, () => setShowResults(false), { escape: true });

  function handleChange(e) {
    const val = e.target.value;
    setSearch(val);
    const q = val.trim();
    if (!q) { debouncedSearch.cancel(); setResults([]); setShowResults(false); return; }
    debouncedSearch(q);
  }

  function selectUser(u) {
    setSearch('');
    setResults([]);
    setShowResults(false);
    navigate(isAdminView ? `/admin/${u.username}/profile` : `/${u.username}`);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0) { selectUser(results[0]); return; }
      const q = search.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (q) { setSearch(''); setShowResults(false); navigate(`/${q}`); }
    }
    // Escape-to-close is handled by useDismiss (document-level).
  }

  const isHeader = variant === 'header';
  const containerStyle = isHeader
    ? { position: 'relative', flex: 1, maxWidth: '300px' }
    : { position: 'relative' };

  return (
    <div ref={containerRef} style={containerStyle}>
      <input
        value={search}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => results.length > 0 && setShowResults(true)}
        placeholder="Search users…"
        style={{
          width: '100%',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: isHeader ? '7px 14px' : '10px 16px',
          // 16px on native avoids iOS focus auto-zoom
          fontSize: isHeader ? '14px' : (isNative ? '16px' : '14px'),
          color: 'var(--text)',
          fontFamily: 'inherit',
          outline: 'none',
        }}
      />
      {showResults && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
          zIndex: 1000,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          {results.map(u => (
            <div key={u.username} className="user-search-result" onClick={() => selectUser(u)}>
              <UserIdentity username={u.username} name={(u.firstName || u.lastName) ? fullName(u) : ''} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
