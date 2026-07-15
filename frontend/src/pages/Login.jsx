import { useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import PasswordInput from '../components/PasswordInput';
import { api, setUsername, setToken, clearAdminSession } from '../api/client';
import { normalizeEmail } from '../utils/validateName';
import { refreshGreeting } from '../utils/greeting';
import { useForm } from '../utils/useForm';

export default function Login() {
  const navigate = useNavigate();

  // Login accepts either an email address or a username in one field — the
  // server (authService.loginUser) tells them apart by whether the trimmed
  // value contains "@". Only non-empty is validated client-side; format
  // rules for each are already enforced where the value was created
  // (signup email, profile username), so re-validating here would just
  // reject values the account might actually have.
  const { values, setField, error, submitting, handleSubmit } = useForm(
    { identifier: '', password: '' },
    {
      validate: ({ identifier }) => (identifier.trim() ? '' : 'Enter your email address or username.'),
      onSubmit: async ({ identifier, password }) => {
        const trimmed = identifier.trim();
        // Only emails get the lowercase/trim normalization mirrored server-side;
        // usernames are normalized identically server-side regardless of case sent.
        const normalized = trimmed.includes('@') ? normalizeEmail(trimmed) : trimmed;
        const data = await api.login({ identifier: normalized, password });
        clearAdminSession(); // a user session is mutually exclusive with admin
        refreshGreeting();   // new random dashboard greeting per login
        if (data.token) setToken(data.token);
        if (data.username) {
          setUsername(data.username);
          navigate(`/${data.username}/dashboard`);
        } else {
          navigate('/login/profile', { state: { email: normalized } });
        }
      },
    }
  );

  return (
    <AuthShell onBack={() => navigate('/home')}>
          <>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-sub">Log in to your Imprint account.</p>
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <input
                type="text"
                className="auth-input"
                placeholder="Email address or username"
                value={values.identifier}
                onChange={setField('identifier')}
                autoComplete="username"
              />
              <PasswordInput
                placeholder="Password"
                value={values.password}
                onChange={setField('password')}
                autoComplete="current-password"
              />
              {error && <p className="auth-error">{error}</p>}
              <div style={{ textAlign: 'right', marginTop: '-4px' }}>
                <button type="button" className="auth-link-btn" onClick={() => navigate('/forgot')}>
                  Forgot password?
                </button>
              </div>
              <button
                type="submit"
                className="btn btn-primary auth-submit"
                disabled={submitting || !values.identifier || !values.password}
              >
                {submitting ? 'Logging in…' : 'Log In'}
              </button>
            </form>
            <p className="auth-switch">
              Don't have an account?{' '}
              <button className="auth-link-btn" onClick={() => navigate('/signup')}>Sign up</button>
            </p>
          </>
    </AuthShell>
  );
}
