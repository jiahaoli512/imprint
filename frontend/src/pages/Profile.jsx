import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, X, Loader } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import { api, setUsername as saveUsername } from '../api/client';
import { validateName, USERNAME_RE } from '../utils/validateName';
import { useDebouncedCallback } from '../utils/useDebouncedCallback';
import { refreshGreeting } from '../utils/greeting';
import { useForm } from '../utils/useForm';

const maxDob = new Date();
maxDob.setFullYear(maxDob.getFullYear() - 18);
const MAX_DOB = maxDob.toISOString().split('T')[0];

// Field label + required asterisk, mirroring the edit-profile form in UserProfile.
const fieldLabelStyle = { fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '6px' };
const RequiredMark = () => <span style={{ color: 'var(--error)' }}> *</span>;

// mirrors ageFromDob() in userService.js — keep in sync if the threshold changes
function ageOk(dobStr) {
  if (!dobStr) return false;
  const today = new Date();
  const birth = new Date(dobStr);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 18;
}

export default function Profile() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email;

  // Live username availability is separate from the plain form fields: it's
  // debounced and reflects a server check, so it stays outside useForm.
  const [usernameStatus, setUsernameStatus] = useState('idle'); // idle | checking | available | taken | invalid

  const debouncedCheck = useDebouncedCallback(async (clean) => {
    try {
      const data = await api.checkUsername(clean);
      setUsernameStatus(data.available ? 'available' : 'taken');
    } catch {
      setUsernameStatus('idle');
    }
  }, 500);

  const { values, setValues, setField, error, setError, submitting, handleSubmit } = useForm(
    { firstName: '', lastName: '', username: '', dob: '' },
    {
      validate: ({ firstName, lastName, username, dob }) => {
        if (!firstName.trim()) return 'Please enter your first name.';
        const nameError = validateName(firstName, lastName);
        if (nameError) return nameError;
        if (!USERNAME_RE.test(username)) return 'Username must be 3–20 characters: letters, numbers, underscores.';
        if (usernameStatus === 'taken') return 'That username is already taken.';
        if (usernameStatus === 'checking') return 'Still checking username — please wait a moment.';
        if (!dob) return 'Please enter your date of birth.';
        const dobYear = new Date(dob).getFullYear();
        if (dobYear < 1000 || dobYear > 9999) return 'Please enter a valid 4-digit birth year.';
        if (!ageOk(dob)) return 'You must be at least 18 years old to use Imprint.';
        return '';
      },
      onSubmit: async ({ firstName, lastName, username, dob }) => {
        const data = await api.setupProfile({ email, firstName, lastName, username, dateOfBirth: dob });
        saveUsername(data.username);
        refreshGreeting();
        navigate(`/${data.username}/dashboard`);
      },
    }
  );

  if (!email) {
    navigate('/login', { replace: true });
    return null;
  }

  function handleUsernameChange(val) {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setValues(v => ({ ...v, username: clean }));
    setError('');

    if (!clean) { debouncedCheck.cancel(); setUsernameStatus('idle'); return; }
    if (!USERNAME_RE.test(clean)) { debouncedCheck.cancel(); setUsernameStatus('invalid'); return; }

    setUsernameStatus('checking');
    debouncedCheck(clean);
  }

  const canSubmit =
    values.firstName.trim() &&
    usernameStatus === 'available' &&
    values.dob && ageOk(values.dob);

  return (
    <AuthShell>
        <h1 className="auth-title">Set up your profile</h1>
        <p className="auth-sub">Just a few details to get started.</p>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div>
            <label style={fieldLabelStyle}>First name<RequiredMark /></label>
            <input
              type="text"
              className="auth-input"
              placeholder="First name"
              value={values.firstName}
              maxLength={50}
              onChange={setField('firstName')}
              autoComplete="given-name"
            />
          </div>
          <div>
            <label style={fieldLabelStyle}>Last name</label>
            <input
              type="text"
              className="auth-input"
              placeholder="Last name (optional)"
              value={values.lastName}
              maxLength={50}
              onChange={setField('lastName')}
              autoComplete="family-name"
            />
          </div>

          <div>
            <label style={fieldLabelStyle}>Username<RequiredMark /></label>
            <div className="auth-input-wrap">
              <input
                type="text"
                className="auth-input"
                placeholder="Username"
                value={values.username}
                onChange={e => handleUsernameChange(e.target.value)}
                autoComplete="username"
                style={{ paddingRight: '40px' }}
              />
              <span className="auth-eye" style={{ pointerEvents: 'none' }}>
                {usernameStatus === 'checking'  && <Loader size={15} className="spin" />}
                {usernameStatus === 'available' && <Check size={15} color="var(--success)" />}
                {usernameStatus === 'taken'     && <X size={15} color="var(--error)" />}
                {usernameStatus === 'invalid'   && <X size={15} color="var(--error)" />}
              </span>
            </div>
          </div>
          {usernameStatus === 'taken'   && <p className="auth-error" style={{ marginTop: '-4px' }}>Username already taken.</p>}
          {usernameStatus === 'invalid' && <p className="auth-error" style={{ marginTop: '-4px' }}>3–20 characters, letters, numbers and _ only.</p>}
          {usernameStatus === 'available' && <p style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '-4px' }}>Username available!</p>}

          <div>
            <label style={fieldLabelStyle}>
              Date of birth (must be 18+)<RequiredMark />
            </label>
            <input
              type="date"
              className="auth-input"
              value={values.dob}
              max={MAX_DOB}
              onChange={setField('dob')}
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={submitting || !canSubmit}
          >
            {submitting ? 'Saving…' : 'Continue'}
          </button>
        </form>
    </AuthShell>
  );
}
