import { useState, useEffect, useCallback } from 'react';
import { api, getActivitySeen, setActivitySeen } from '../../api/client';

// Owns the notification bell's data concern: fetching pending friend requests +
// the activity feed, responding to a request (which removes its row), and the
// unseen-activity badge math backed by a client-side "seen" timestamp. The
// component is left to render + own the open/close UI. Fetches are error-swallowing
// (a bell that can't load just shows nothing) and the request list is mutable, so
// this keeps its own state rather than the read-only useAsync helper.
export function useNotifications() {
  const [requests, setRequests] = useState([]);
  const [activity, setActivity] = useState([]);
  const [seenAt, setSeenAt] = useState(() => getActivitySeen());
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = (fn, set) => fn().then((d) => { if (alive) set(Array.isArray(d) ? d : []); }).catch(() => {});
    load(api.getFriendRequests, setRequests);
    load(api.getFriendActivity, setActivity);
    return () => { alive = false; };
  }, []);

  const respond = useCallback(async (id, action) => {
    setBusyId(id);
    try {
      await api.respondFriendRequest(id, action);
      setRequests((rs) => rs.filter((r) => r.id !== id));
    } catch {
      /* keep the row so the user can retry */
    } finally {
      setBusyId(null);
    }
  }, []);

  // Marks all current activity as seen (called when the panel opens).
  const markSeen = useCallback(() => {
    const now = new Date().toISOString();
    setActivitySeen(now);
    setSeenAt(now);
  }, []);

  const unseenActivity = activity.filter((a) => !seenAt || (a.at && a.at > seenAt)).length;

  return { requests, activity, busyId, respond, markSeen, count: requests.length + unseenActivity };
}
