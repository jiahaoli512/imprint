import { Check, X } from 'lucide-react';
import { evaluatePassword } from '../utils/passwordRules';

// The live password-requirements checklist shared by signup and forgot-password:
// one row per rule, pass/fail icon. Owns the markup so both flows look identical
// and a rule/label change lands in one place (the rules themselves in passwordRules).
export default function PasswordChecklist({ password }) {
  return (
    <ul className="auth-checks">
      {evaluatePassword(password).map((c) => (
        <li key={c.key} className={c.passed ? 'check-pass' : 'check-fail'}>
          {c.passed ? <Check size={12} /> : <X size={12} />}
          {c.label}
        </li>
      ))}
    </ul>
  );
}
