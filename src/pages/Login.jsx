import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import '../styles/login.css';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      setError(null);
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-card__logo">
          <div className="login-card__logo-icon">R</div>
          <h1>Rayna Social</h1>
        </div>

        <p className="login-card__subtitle">
          Sign in to your marketing dashboard
        </p>

        {error && <div className="login-card__error">{error}</div>}

        <div className="form-field">
          <label className="form-field__label">Email</label>
          <input
            type="email"
            className="form-field__input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-field">
          <label className="form-field__label">Password</label>
          <input
            type="password"
            className="form-field__input"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="login-card__btn"
          disabled={loading || !email || !password}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

export default Login;
