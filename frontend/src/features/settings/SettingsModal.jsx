import { useState } from 'react';
import Modal from '../../components/Modal';
import DisplaySettings from './DisplaySettings';

// Tabs across the top. Only "display" has content today; the rest are placeholders
// so the structure is ready for Account / Notifications / Privacy settings later.
const TABS = [
  { id: 'display', label: 'Display' },
  { id: 'account', label: 'Account' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'privacy', label: 'Privacy' },
];

export default function SettingsModal({ onClose }) {
  const [tab, setTab] = useState('display');

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

      {tab === 'display' ? (
        <DisplaySettings />
      ) : (
        <p className="settings-placeholder">Coming soon.</p>
      )}
    </Modal>
  );
}
