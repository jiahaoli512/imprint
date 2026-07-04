// Mirror of backend/src/constants/friendship.js — the relationship vocabulary the
// client shares with the API (packages can't share a module, so this documents
// the contract on the frontend side instead of scattering magic strings).
export const RELATIONSHIP = {
  SELF: 'self',
  NONE: 'none',
  OUTGOING: 'outgoing',
  INCOMING: 'incoming',
  FRIENDS: 'friends',
};
