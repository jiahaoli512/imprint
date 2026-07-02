import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import { api } from '../api/client';
import { isValidEmail } from '../utils/validateName';
import { useForm } from '../utils/useForm';

// Contact-form categories — kept byte-for-byte identical to the server-side
// allowlist (CONTACT_CATEGORIES in backend/src/services/contactService.js).
const CONTACT_CATEGORIES = [
  'General Inquiry',
  'Account & Login',
  'Bug / Technical Issue',
  'Feature Request',
  'Feedback / Suggestion',
  'Privacy / Data Request',
  'Other',
];

// Public contact form — collects name, email, a category, and feedback, then
// sends it to the Imprint inbox via the backend (/api/contact → Brevo).
export default function Contact() {
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const { values, setField, error, submitting, handleSubmit } = useForm(
    { firstName: '', lastName: '', email: '', category: '', feedback: '' },
    {
      validate: ({ firstName, lastName, email, category, feedback }) => {
        if (!firstName.trim() || !lastName.trim()) return 'Please enter your first and last name.';
        if (!isValidEmail(email)) return 'Please enter a valid email address.';
        if (!category) return 'Please select a category.';
        if (!feedback.trim()) return 'Please enter your feedback.';
        return '';
      },
      onSubmit: async (v) => { await api.sendContact(v); setSent(true); },
    }
  );

  return (
    <AuthShell onBack={() => navigate(-1)} logoText={false}>
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
                value={values.firstName}
                maxLength={50}
                onChange={setField('firstName')}
                disabled={submitting}
              />
              <input
                className="auth-input"
                placeholder="Last name"
                value={values.lastName}
                maxLength={50}
                onChange={setField('lastName')}
                disabled={submitting}
              />
              <input
                className="auth-input"
                type="email"
                placeholder="Email address"
                value={values.email}
                maxLength={254}
                onChange={setField('email')}
                disabled={submitting}
              />
              <select
                className={`auth-input auth-select${values.category ? '' : ' auth-select-placeholder'}`}
                value={values.category}
                onChange={setField('category')}
                disabled={submitting}
              >
                <option value="" disabled>What can we help with?</option>
                {CONTACT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <textarea
                className="auth-input"
                placeholder="Your feedback"
                value={values.feedback}
                maxLength={5000}
                onChange={setField('feedback')}
                disabled={submitting}
                rows={5}
                style={{ resize: 'vertical', minHeight: '120px' }}
              />
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
                {submitting ? 'Sending…' : 'Submit'}
              </button>
            </form>
          </>
        )}
    </AuthShell>
  );
}
