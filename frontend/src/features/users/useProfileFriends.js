import { useState } from 'react';

// Owns the profile's friend concern (mirrors useProfileEdit): the friends-list
// modal toggle, the derived count/label/visibility, and the optimistic sync of
// the owner's count + the viewer's relationship after a friend action — so the
// count and the list-clickability update without a reload. Keeping it here means
// UserProfile just renders the result instead of interleaving this logic.
export function useProfileFriends(user, setUser, { isMe }) {
  const [showFriends, setShowFriends] = useState(false);

  function onFriendChange(next) {
    setUser((u) => {
      if (!u) return u;
      const delta = next === 'friends' ? 1 : next === 'none' ? -1 : 0;
      return {
        ...u,
        friendCount: Math.max(0, (u.friendCount ?? 0) + delta),
        viewerRelationship: { ...(u.viewerRelationship || {}), status: next },
      };
    });
  }

  const friendCount = user?.friendCount ?? 0;

  return {
    showFriends,
    openFriends: () => setShowFriends(true),
    closeFriends: () => setShowFriends(false),
    onFriendChange,
    friendCount,
    friendsLabel: `${friendCount} ${friendCount === 1 ? 'friend' : 'friends'}`,
    // Friend list is visible to the owner and to the owner's friends only.
    canSeeFriends: isMe || user?.viewerRelationship?.status === 'friends',
  };
}
