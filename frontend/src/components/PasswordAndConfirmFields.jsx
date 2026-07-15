import PasswordChecklist from './PasswordChecklist';
import PasswordInput from './PasswordInput';
import { passwordValid, passwordsMatch } from '../utils/passwordRules';

// The "new password + confirm" field trio — every "set a new password"
// surface in the app (Signup, ForgotPassword, Settings > Account > Change
// Password) needs this same password input + PasswordChecklist + confirm
// input (disabled until the password passes, highlighted once it matches).
// Callers own the actual password/confirmPassword state (each needs the
// value for its own submit call, and Signup/ForgotPassword additionally
// clear confirmPassword when password changes, which isn't this
// component's call to make).
export default function PasswordAndConfirmFields({
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  passwordPlaceholder = 'Password',
  confirmPlaceholder = 'Confirm password',
}) {
  const allPassed = passwordValid(password);
  const matches = passwordsMatch(password, confirmPassword);

  return (
    <>
      <PasswordInput
        placeholder={passwordPlaceholder}
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
      />

      <PasswordChecklist password={password} />

      <PasswordInput
        placeholder={confirmPlaceholder}
        value={confirmPassword}
        onChange={(e) => onConfirmPasswordChange(e.target.value)}
        disabled={!allPassed}
        extraClass={matches ? 'auth-input-match' : ''}
      />
    </>
  );
}
