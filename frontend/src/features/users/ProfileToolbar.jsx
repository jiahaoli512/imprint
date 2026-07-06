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
      <div className="profile-toolbar">
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
