import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Fingerprint } from 'lucide-react';
import { api } from '../api/client';

// Public contact form — collects name, email, and feedback, then sends it to
// the Imprint inbox via the backend (/api/contact → Brevo).
export default function Contact() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!firstName.trim() || !lastName.trim()) { setError('Please enter your first and last name.'); return; }
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!feedback.trim()) { setError('Please enter your feedback.'); return; }

    setLoading(true);
    try {
      await api.sendContact({ firstName, lastName, email, feedback });
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <button className="auth-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="auth-card">
        <div className="logo" style={{ justifyContent: 'center', marginBottom: '24px' }}>
          <div className="logo-icon" style={{ width: '40px', height: '40px' }}>
            <Fingerprint size={22} strokeWidth={2} color="#0b0e13" />
          </div>
        </div>

        {sent ? (
          <>
            <h1 className="auth-title">Message sent</h1>
            <p className="auth-sub">Thanks for reaching out — we'll get back to you soon.</p>
            <button className="btn btn-primary auth-submit" onClick={() => navigate('/home')}>
              Back to home
            </button>
          </>
        ) : (
          <>
            <h1 className="auth-title">Contact Us</h1>
            <p className="auth-sub">Questions or feedback? Send us a message.</p>
            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              <input
                className="auth-input"
                placeholder="First name"
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); setError(''); }}
                disabled={loading}
              />
              <input
                className="auth-input"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); setError(''); }}
                disabled={loading}
              />
              <input
                className="auth-input"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                disabled={loading}
              />
              <textarea
                className="auth-input"
                placeholder="Your feedback"
                value={feedback}
                onChange={(e) => { setFeedback(e.target.value); setError(''); }}
                disabled={loading}
                rows={5}
                style={{ resize: 'vertical', minHeight: '120px' }}
              />
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                {loading ? 'Sending…' : 'Submit'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
