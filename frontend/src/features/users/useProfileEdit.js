import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setUsername as saveUsername } from '../../api/client';
import { validateName, USERNAME_RE } from '../../utils/validateName';
import { COOLDOWN_DAYS, daysUntil } from '../../utils/cooldowns';

// Owns the profile edit flow so the page stays presentational: field state,
// per-field validation, the confirm-before-save staging, the API write, and the
// post-username-change navigation/stored-username update. `updateUser`/`setUser`
// are injected so it works for both self and admin views.
export function useProfileEdit({ user, setUser, username, isAdminView, updateUser }) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [uname, setUname] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [pendingSave, setPendingSave] = useState(null); // validated change awaiting confirmation

  function start() {
    setFirst(user.firstName || '');
    setLast(user.lastName || '');
    setUname(user.username || '');
    setError('');
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setError('');
    setPendingSave(null);
  }

  // Validate the edit, then stage it for confirmation rather than saving outright.
  function requestSave() {
    setError('');
    const nextUsername = uname.trim().toLowerCase();
    const nameChanged = first.trim() !== (user.firstName || '') || last.trim() !== (user.lastName || '');
    const usernameChanged = nextUsername !== user.username;

    if (!nameChanged && !usernameChanged) {
      setError('Make a change before saving.');
      return;
    }
    if (nameChanged) {
      if (!first.trim()) { setError('First name is required.'); return; }
      const nameError = validateName(first, last);
      if (nameError) { setError(nameError); return; }
    }
    if (usernameChanged && !USERNAME_RE.test(nextUsername)) {
      setError('Username must be 3–20 characters: letters, numbers, underscores.');
      return;
    }

    const body = {};
    const changes = [];
    if (nameChanged) {
      body.firstName = first;
      body.lastName = last;
      changes.push({ label: 'Name', value: [first.trim(), last.trim()].filter(Boolean).join(' ') });
    }
    if (usernameChanged) {
      body.username = nextUsername;
      changes.push({ label: 'Username', value: `@${nextUsername}` });
    }
    setPendingSave({ body, usernameChanged, changes });
  }

  // Commit the staged change after the user confirms.
  async function confirmSave() {
    if (!pendingSave) return;
    const { body, usernameChanged } = pendingSave;
    setPendingSave(null);
    setSaving(true);
    try {
      const data = await updateUser(username, body);
      setUser(data);
      setEditing(false);
      // A username change moves the profile's URL (and the stored username for a
      // self-edit). Markers are keyed by user _id, so they're unaffected.
      if (usernameChanged && data.username && data.username !== username) {
        if (isAdminView) {
          navigate(`/admin/${data.username}/profile`, { replace: true });
        } else {
          saveUsername(data.username);
          navigate(`/${data.username}/profile`, { replace: true });
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // Self-service cooldowns (admins have none). 0 = editable now.
  const nameWait = isAdminView ? 0 : daysUntil(user?.nameChangedAt, COOLDOWN_DAYS.name);
  const usernameWait = isAdminView ? 0 : daysUntil(user?.usernameChangedAt, COOLDOWN_DAYS.username);

  return {
    editing, saving, error, pendingSave,
    first, last, username: uname,
    setFirst: (v) => { setFirst(v); setError(''); },
    setLast: (v) => { setLast(v); setError(''); },
    setUsername: (v) => { setUname(v); setError(''); },
    nameWait, usernameWait,
    start, cancel, requestSave, confirmSave,
    closePending: () => setPendingSave(null),
  };
}
