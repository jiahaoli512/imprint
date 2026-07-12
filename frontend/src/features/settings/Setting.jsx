// A labeled setting row: title + one-line description, then its control below.
// Shared by every settings tab body (Display, Account, ...) so a layout tweak
// (e.g. an icon slot) lands in one place instead of drifting across copies.
export default function Setting({ title, description, children }) {
  return (
    <div className="settings-row">
      <div className="settings-row-label">{title}</div>
      <p className="settings-row-desc">{description}</p>
      {children}
    </div>
  );
}
