import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, List, LayoutDashboard } from 'lucide-react';
import LogoutButton from '../../components/LogoutButton';
import AdminViewingBadge from '../../components/AdminViewingBadge';
import NotificationBell from './NotificationBell';
import SettingsButton from '../settings/SettingsButton';

// The fixed top-of-page controls on a profile: a context-aware Back button plus,
// in admin view, the admin nav (waitlist / dashboard / logout) and the "viewing
// as admin" badge. Extracted from UserProfile so the page body stays readable.
//
// Portaled to <body> on purpose: the profile page wrapper (.auth-page) runs the
// pageEnter animation with `both` fill mode, which leaves a `transform` on the
// container. A transformed ancestor becomes the containing block for its
// position:fixed descendants, so a toolbar rendered inside it scrolls away with
// the page instead of staying pinned to the viewport (and never returns until a
// re-render clears it). Portaling out of that subtree keeps `fixed` = viewport.
// Same rationale as ScrollToTopButton.
export default function ProfileToolbar({ username, isAdminView, isMe }) {
  const navigate = useNavigate();
  const toolbarRef = useRef(null);

  // Self-heal an iOS/WKWebView quirk: the shared Modal locks scroll by toggling
  // document.body to position:fixed and back (see Modal.jsx). That body toggle
  // can leave this position:fixed toolbar (portaled to <body>) detached from the
  // viewport — it scrolls away and won't repaint until a layout is forced. Watch
  // for the lock releasing (body no longer fixed) and nudge the toolbar to
  // re-composite. The hide→reflow→show happens in one tick, so there's no paint
  // of the hidden state and thus no visible flicker.
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (document.body.style.position === 'fixed') return; // lock still engaged
      const el = toolbarRef.current;
      if (!el) return;
      el.style.display = 'none';
      void el.offsetHeight; // force reflow → iOS re-pins the fixed layer
      el.style.display = '';
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, []);

  const onBack = () => {
    if (isAdminView) navigate(`/admin/${username}/dashboard`);
    else if (isMe) navigate(`/${username}/dashboard`);
    else navigate(-1);
  };

  return createPortal(
    <>
      {isAdminView && (
        <div className="profile-admin-badge">
          <AdminViewingBadge username={username} />
        </div>
      )}
      <div className="profile-toolbar" ref={toolbarRef}>
        <button className="btn btn-ghost" onClick={onBack}>
          <ArrowLeft size={16} />{' '}
          <span className="btn-label">
            {isAdminView ? `@${username}'s dashboard` : isMe ? 'Dashboard' : 'Back'}
          </span>
        </button>
        {isMe && !isAdminView && <NotificationBell align="left" />}
        {isMe && !isAdminView && <SettingsButton />}
        {isAdminView && (
          <>
            <button className="btn btn-ghost" onClick={() => navigate('/admin/waitlist')}>
              <List size={15} /> <span className="btn-label">Admin Waitlist</span>
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/admin/dashboard')}>
              <LayoutDashboard size={15} /> <span className="btn-label">Admin Dashboard</span>
            </button>
            <LogoutButton admin />
          </>
        )}
      </div>
    </>,
    document.body
  );
}
