import { useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import PasswordInput from '../components/PasswordInput';
import { api, setUsername, setToken, clearAdminSession } from '../api/client';
import { isValidEmail, normalizeEmail } from '../utils/validateName';
import { refreshGreeting } from '../utils/greeting';
import { useForm } from '../utils/useForm';

export default function Login() {
  const navigate = useNavigate();

  const { values, setField, error, submitting, handleSubmit } = useForm(
    { email: '', password: '' },
    {
      validate: ({ email }) => (isValidEmail(email) ? '' : 'Enter a valid email address.'),
      onSubmit: async ({ email, password }) => {
        const normalized = normalizeEmail(email);
        const data = await api.login({ email: normalized, password });
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
                type="email"
                className="auth-input"
                placeholder="Email address"
                value={values.email}
                onChange={setField('email')}
                autoComplete="email"
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
                disabled={submitting || !values.email || !values.password}
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
