import { useNavigate } from 'react-router-dom';

// The "Sign Up / Log In" button pair — shared by Hero (top of the home page)
// and CTA (bottom), which previously each had their own identical copy of
// this markup and its handlers.
export default function AuthButtons() {
  const navigate = useNavigate();
  return (
    <div className="hero-auth-btns">
      <button className="btn btn-primary" onClick={() => navigate('/signup')}>Sign Up</button>
      <button className="btn btn-ghost" onClick={() => navigate('/login')}>Log In</button>
    </div>
  );
}
