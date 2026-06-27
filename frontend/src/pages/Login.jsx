import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import { api, setUsername, setToken, clearAdminSession } from '../api/client';
import { isValidEmail } from '../utils/validateName';
import { refreshGreeting } from '../utils/greeting';
import { useForm } from '../utils/useForm';

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const { values, setField, error, submitting, handleSubmit } = useForm(
    { email: '', password: '' },
    {
      validate: ({ email }) => (isValidEmail(email) ? '' : 'Enter a valid email address.'),
      onSubmit: async ({ email, password }) => {
        const normalized = email.trim().toLowerCase();
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
              <div className="auth-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Password"
                  value={values.password}
                  onChange={setField('password')}
                  autoComplete="current-password"
                />
                <button type="button" className="auth-eye" onClick={() => setShowPassword(s => !s)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {error && <p className="auth-error">{error}</p>}
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
