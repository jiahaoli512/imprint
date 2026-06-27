import { useState } from 'react';

// Form-state helper for the auth/contact pages. Tracks field values, a single
// error string, and a submitting flag, and wires a submit handler that: clears
// the error, runs an optional `validate(values)` (return a message to block
// submission), awaits `onSubmit(values)`, and surfaces any thrown message. Pages
// stay focused on their fields + markup instead of re-implementing this plumbing.
//
//   const { values, setField, error, submitting, handleSubmit } = useForm(
//     { email: '' },
//     { validate, onSubmit },
//   );
//   <input value={values.email} onChange={setField('email')} />
export function useForm(initial, { onSubmit, validate } = {}) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Curried change handler: accepts a DOM event or a raw value, and clears any
  // standing error so the message doesn't linger while the user fixes input.
  const setField = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e?.target ? e.target.value : e }));
    setError('');
  };

  async function handleSubmit(e) {
    e?.preventDefault?.();
    setError('');
    const msg = validate?.(values);
    if (msg) { setError(msg); return; }
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return { values, setValues, setField, error, setError, submitting, handleSubmit };
}
