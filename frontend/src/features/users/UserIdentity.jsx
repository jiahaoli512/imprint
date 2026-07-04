// A user's @handle with an optional muted display name beneath it. Shared by the
// friends-list modal and the user-search dropdown so the identity markup + styling
// live in one place instead of being re-inlined per list.
export default function UserIdentity({ username, name }) {
  return (
    <>
      <span className="user-handle">@{username}</span>
      {name && <span className="user-name">{name}</span>}
    </>
  );
}
