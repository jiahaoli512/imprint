import { useState } from 'react';
import { LogOut } from 'lucide-react';
import LogoutModal from './LogoutModal';

// Self-contained logout control: a ghost button that owns its own confirmation
// modal, so pages don't each repeat the confirmLogout state + modal wiring.
export default function LogoutButton({ admin = false, label }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn btn-ghost" onClick={() => setOpen(true)}>
        <LogOut size={15} /> <span className="btn-label">{label || (admin ? 'Log out of Admin' : 'Log out')}</span>
      </button>
      {open && <LogoutModal admin={admin} onCancel={() => setOpen(false)} />}
    </>
  );
}
