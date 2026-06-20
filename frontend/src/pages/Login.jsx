import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import { api, setUsername, setToken, clearAdminSession } from '../api/client';
import { isValidEmail } from '../utils/validateName';
import { refreshGreeting } from '../utils/greeting';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const data = await api.login({ email: email.trim().toLowerCase(), password });
      clearAdminSession(); // a user session is mutually exclusive with admin
      refreshGreeting();   // new random dashboard greeting per login
      if (data.token) setToken(data.token);
      if (data.username) {
        setUsername(data.username);
        navigate(`/${data.username}/dashboard`);
      } else {
        navigate('/login/profile', { state: { email: email.trim().toLowerCase() } });
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

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
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                autoComplete="email"
              />
              <div className="auth-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
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
                disabled={loading || !email || !password}
              >
                {loading ? 'Logging in…' : 'Log In'}
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
