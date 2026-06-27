// Form field label with an optional red "required" asterisk. `variant` picks the
// styling: 'display' = the larger serif label used in the edit-profile form,
// 'compact' = the small muted label used in the auth/setup forms.
const STYLES = {
  display: { fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--muted)', display: 'block', marginBottom: '6px' },
  compact: { fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '6px' },
};

export default function FieldLabel({ children, required = false, variant = 'compact' }) {
  return (
    <label style={STYLES[variant]}>
      {children}
      {required && <span style={{ color: 'var(--error)' }}> *</span>}
    </label>
  );
}
