const Waitlist = require('../models/Waitlist');
const User = require('../models/User');
const { sendApprovalEmail } = require('../utils/email');
const { checkLength, checkRequired, checkEmail, normalizeEmail } = require('../utils/validate');
const httpError = require('../utils/httpError');

// Reassign positions to a clean 0..n-1 sequence in their current sort order.
// One bulkWrite (a single round trip) rather than N separate updateOne calls.
async function normalizePositions() {
  const all = await Waitlist.find({}, '_id').sort({ position: 1, createdAt: 1 });
  if (!all.length) return;
  await Waitlist.bulkWrite(
    all.map((e, i) => ({ updateOne: { filter: { _id: e._id }, update: { position: i } } }))
  );
}

async function joinWaitlist(email, name) {
  checkRequired('Email', email);
  checkLength('email', email);
  checkEmail(email);
  checkLength('name', name);
  email = normalizeEmail(email);

  // Don't disclose *which* state an email is in. Returning distinct messages for
  // "already registered" vs "already on the waitlist" turns this public endpoint
  // into an account-existence / email-enumeration oracle. Collapse both to one
  // indistinguishable response so a registered account can't be probed here.
  const [existingUser, existing] = await Promise.all([
    User.findOne({ email }, '_id'),
    Waitlist.findOne({ email }, '_id'),
  ]);
  if (existingUser || existing)
    throw httpError(409, "This email is unable to join the waitlist. If you already have an account, log in instead. If you are already on the waitlist, please wait for approval.");

  const count = await Waitlist.countDocuments();
  await Waitlist.create({ email, name: name || null, position: count });
  return { position: count + 1 };
}

async function listWaitlist() {
  return Waitlist.find({}, 'email name createdAt position approved').sort({ position: 1, createdAt: 1 });
}

async function countWaitlist() {
  return Waitlist.countDocuments();
}

// Public, pre-auth probe used by the signup flow. To avoid leaking account
// existence (email enumeration), it collapses every state to just "can this
// email register now?" — the only distinction the UI needs. 'unavailable'
// covers not-on-waitlist, pending, and already-registered alike.
async function checkWaitlist(email) {
  checkRequired('Email', email);
  email = normalizeEmail(email);
  const entry = await Waitlist.findOne({ email });
  const existingUser = entry?.approved ? await User.findOne({ email }) : null;
  const canRegister = !!entry && entry.approved && !existingUser;
  return { status: canRegister ? 'approved' : 'unavailable' };
}

async function reorderWaitlist(ids) {
  if (!Array.isArray(ids) || ids.length === 0) throw httpError(400, 'ids must be a non-empty array');

  // The new order must be exactly the current waitlist set — unique and complete
  // — so positions stay a clean 0..n-1 permutation (no dupes/gaps from a bad or
  // partial request).
  const asStrings = ids.map(String);
  if (new Set(asStrings).size !== asStrings.length) throw httpError(400, 'ids must be unique');

  const current = await Waitlist.find({}, '_id');
  if (asStrings.length !== current.length) throw httpError(400, 'ids must match the current waitlist');
  const currentSet = new Set(current.map((e) => e._id.toString()));
  if (!asStrings.every((id) => currentSet.has(id))) throw httpError(400, 'Unknown waitlist id in reorder');

  await Waitlist.bulkWrite(
    asStrings.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { position: i } } }))
  );
}

async function approveEntry(id) {
  const entry = await Waitlist.findByIdAndUpdate(id, { approved: true }, { new: true });
  if (!entry) throw httpError(404, 'Entry not found');
  sendApprovalEmail(entry.email, entry.name).catch(err =>
    console.error('[email] Failed to send approval email:', err.message)
  );
}

async function deleteEntry(id) {
  await Waitlist.findByIdAndDelete(id);
  await normalizePositions();
}

module.exports = { joinWaitlist, listWaitlist, countWaitlist, checkWaitlist, reorderWaitlist, approveEntry, deleteEntry };
