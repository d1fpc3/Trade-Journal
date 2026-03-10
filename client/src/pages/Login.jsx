import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const ok = login(password);
      if (ok) {
        navigate('/');
      } else {
        setError('Incorrect password.');
        setLoading(false);
      }
    }, 300);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Ambient background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(5,216,144,0.07) 0%, transparent 60%)'
      }} />
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(28,28,46,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(28,28,46,0.4) 1px, transparent 1px)',
        backgroundSize: '48px 48px'
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64,
            background: 'linear-gradient(135deg, #05d890 0%, #00a06a 100%)',
            borderRadius: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem',
            margin: '0 auto 20px',
            boxShadow: '0 0 40px rgba(5,216,144,0.3), 0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
          }}>📈</div>
          <h1 style={{
            fontSize: '1.75rem', fontWeight: 800, marginBottom: 8,
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #f0f0ff 0%, #8888b0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Edgeflow
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Track, analyze, and improve your trading
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'linear-gradient(145deg, #0f0f18 0%, #0c0c14 100%)',
          border: '1px solid rgba(28,28,46,0.9)',
          borderRadius: 20,
          padding: '32px 36px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(5,216,144,0.04), inset 0 1px 0 rgba(255,255,255,0.04)'
        }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>
            Welcome back
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginBottom: 28 }}>
            Enter your password to access your journal
          </p>

          {error && (
            <div className="error-msg" style={{ marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoFocus
                autoComplete="current-password"
                style={{ fontSize: '1rem', padding: '12px 14px', letterSpacing: '0.1em' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ justifyContent: 'center', width: '100%', marginTop: 4 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 14, height: 14,
                    border: '2px solid rgba(2,26,14,0.4)',
                    borderTopColor: '#021a0e',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.7s linear infinite'
                  }} />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div style={{
            marginTop: 24,
            padding: '10px 14px',
            background: 'rgba(5,216,144,0.05)',
            borderRadius: 8,
            border: '1px solid rgba(5,216,144,0.12)',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            textAlign: 'center'
          }}>
            Default password: <strong style={{ color: 'var(--green)', letterSpacing: '0.05em' }}>trader123</strong>
          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.775rem', color: 'var(--text-muted)' }}>
          Your trades are stored locally in your browser
        </p>
      </div>
    </div>
  );
}
