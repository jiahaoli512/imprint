import { useState } from 'react';
import Modal from '../../components/Modal';
import DisplaySettings from './DisplaySettings';
import AccountSettings from './AccountSettings';

// Tabs across the top. Each entry carries its body `component`; a tab without one
// renders the "Coming soon" placeholder. Adding a real Account / Notifications /
// Privacy tab is just filling in `component` — no change to the render below.
const TABS = [
  { id: 'display', label: 'Display', component: DisplaySettings },
  { id: 'account', label: 'Account', component: AccountSettings },
  { id: 'notifications', label: 'Notifications' },
  { id: 'privacy', label: 'Privacy' },
];

export default function SettingsModal({ onClose }) {
  const [tab, setTab] = useState('display');
  const ActiveBody = TABS.find((t) => t.id === tab)?.component;

  return (
    <Modal onClose={onClose} icon={false} closable className="settings-modal">
      <h2 className="modal-title">Settings</h2>

      <div className="settings-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`settings-tab-btn${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {ActiveBody ? <ActiveBody onClose={onClose} /> : <p className="settings-placeholder">Coming soon.</p>}
    </Modal>
  );
}
