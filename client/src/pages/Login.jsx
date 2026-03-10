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
      {/* Void background layers */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(168,85,247,0.1) 0%, transparent 60%)'
      }} />
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 50% 40% at 20% 80%, rgba(0,255,136,0.06) 0%, transparent 50%)'
      }} />
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(18,18,42,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(18,18,42,0.35) 1px, transparent 1px)',
        backgroundSize: '52px 52px'
      }} />
      {/* Vignette */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)'
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 72, height: 72,
            background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #00ff88 100%)',
            borderRadius: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.9rem',
            margin: '0 auto 20px',
            boxShadow: '0 0 50px rgba(168,85,247,0.45), 0 0 80px rgba(168,85,247,0.2), 0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.2)'
          }}>📈</div>
          <h1 style={{
            fontSize: '2rem', fontWeight: 800, marginBottom: 8,
            letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, #e8e8ff 0%, #a855f7 50%, #00ff88 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Trade Journal
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
            track. analyze. dominate.
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(10, 7, 22, 0.98) 0%, rgba(6, 4, 16, 0.99) 100%)',
          border: '1px solid rgba(168,85,247,0.2)',
          borderRadius: 22,
          padding: '34px 38px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(168,85,247,0.06), 0 0 60px rgba(168,85,247,0.07), inset 0 1px 0 rgba(255,255,255,0.04)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Top glow line */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.7) 30%, rgba(0,255,136,0.4) 70%, transparent 100%)'
          }} />

          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>
            Welcome back
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 28, fontFamily: 'var(--font-mono)' }}>
            Enter your password to access the void
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
                style={{ fontSize: '1rem', padding: '12px 14px', letterSpacing: '0.15em' }}
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
                    border: '2px solid rgba(0,24,8,0.4)',
                    borderTopColor: '#001808',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.7s linear infinite'
                  }} />
                  Signing in...
                </span>
              ) : 'Enter the Journal'}
            </button>
          </form>

          <div style={{
            marginTop: 24,
            padding: '10px 14px',
            background: 'rgba(168,85,247,0.06)',
            borderRadius: 8,
            border: '1px solid rgba(168,85,247,0.15)',
            fontSize: '0.76rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            fontFamily: 'var(--font-mono)'
          }}>
            Default password: <strong style={{ color: 'var(--purple)', letterSpacing: '0.08em', textShadow: '0 0 10px rgba(168,85,247,0.5)' }}>trader123</strong>
          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.03em' }}>
          Trades stored locally in your browser
        </p>
      </div>
    </div>
  );
}
