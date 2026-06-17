const Waitlist = require('../models/Waitlist');
const User = require('../models/User');
const { sendApprovalEmail } = require('../utils/email');

async function normalizePositions() {
  const all = await Waitlist.find({}).sort({ position: 1, createdAt: 1 });
  await Promise.all(all.map((e, i) => Waitlist.updateOne({ _id: e._id }, { position: i })));
}

async function joinWaitlist(email, name) {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) throw Object.assign(new Error('An account with this email is already registered.'), { status: 409 });

  const existing = await Waitlist.findOne({ email: email.toLowerCase() });
  if (existing) throw Object.assign(new Error('This email is already on the waitlist.'), { status: 409 });

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

async function checkWaitlist(email) {
  const entry = await Waitlist.findOne({ email: email.toLowerCase() });
  if (!entry) return { status: 'not_found' };
  if (!entry.approved) return { status: 'pending' };
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) return { status: 'already_registered' };
  return { status: 'approved' };
}

async function reorderWaitlist(ids) {
  if (!Array.isArray(ids)) throw Object.assign(new Error('ids must be an array'), { status: 400 });
  await Promise.all(ids.map((id, i) => Waitlist.updateOne({ _id: id }, { position: i })));
}

async function approveEntry(id) {
  const entry = await Waitlist.findByIdAndUpdate(id, { approved: true }, { new: true });
  if (!entry) throw Object.assign(new Error('Entry not found'), { status: 404 });
  sendApprovalEmail(entry.email, entry.name).catch(err =>
    console.error('[email] Failed to send approval email:', err.message)
  );
}

async function deleteEntry(id) {
  await Waitlist.findByIdAndDelete(id);
  await normalizePositions();
}

module.exports = { joinWaitlist, listWaitlist, countWaitlist, checkWaitlist, reorderWaitlist, approveEntry, deleteEntry };
