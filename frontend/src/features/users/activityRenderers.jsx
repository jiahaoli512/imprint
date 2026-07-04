// Registry mapping an activity item's `type` to how its message renders. Adding a
// new activity kind (e.g. badge unlocks) is a new entry here — ActivityItem and
// the rest of the notification bell don't change (open for extension). Each
// renderer receives the item and returns the message body.
export const ACTIVITY_RENDERERS = {
  friend_accepted: (item) => (
    <><strong>{item.name || `@${item.username}`}</strong> accepted your friend request.</>
  ),
  // badge_earned: (item) => (
  //   <><strong>{item.name || `@${item.username}`}</strong> earned the {item.badge} badge.</>
  // ),
};
