import { useState } from 'react';
import { Settings } from 'lucide-react';
import SettingsModal from './SettingsModal';

// Round gear button (next to the notification bell) that opens the settings modal.
// Self-contained like NotificationBell — owns its own open state.
export default function SettingsButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="btn btn-ghost notif-bell" onClick={() => setOpen(true)} aria-label="Settings">
        <Settings size={16} />
      </button>
      {open && <SettingsModal onClose={() => setOpen(false)} />}
    </>
  );
}
