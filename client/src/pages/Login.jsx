import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const TRADES = [
  { symbol: 'NQ', dir: 'LONG',  pnl: '+$1,240', time: '09:32', win: true },
  { symbol: 'ES', dir: 'SHORT', pnl: '+$680',   time: '10:14', win: true },
  { symbol: 'GC', dir: 'LONG',  pnl: '-$310',   time: '11:05', win: false },
  { symbol: 'CL', dir: 'SHORT', pnl: '+$950',   time: '12:48', win: true },
  { symbol: 'NQ', dir: 'SHORT', pnl: '+$2,100', time: '13:22', win: true },
];

const STATS = [
  { label: 'Win Rate',   value: '72%',     icon: '◎' },
  { label: 'Avg R:R',   value: '2.4:1',   icon: '⟳' },
  { label: 'Net P&L',   value: '+$8,940', icon: '▲' },
];

function FloatingCard({ trade, style }) {
  return (
    <div style={{
      position: 'absolute',
      background: 'linear-gradient(135deg, rgba(15,15,28,0.95) 0%, rgba(10,10,20,0.98) 100%)',
      border: `1px solid ${trade.win ? 'rgba(5,216,144,0.25)' : 'rgba(255,61,90,0.25)'}`,
      borderRadius: 14,
      padding: '12px 16px',
      boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05)`,
      backdropFilter: 'blur(12px)',
      minWidth: 180,
      ...style
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontWeight: 800, fontSize: '0.95rem', color: '#f0f0ff',
            letterSpacing: '-0.01em'
          }}>{trade.symbol}</span>
          <span style={{
            fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px',
            borderRadius: 5,
            background: trade.dir === 'LONG' ? 'rgba(5,216,144,0.15)' : 'rgba(255,61,90,0.15)',
            color: trade.dir === 'LONG' ? '#05d890' : '#ff3d5a',
            letterSpacing: '0.04em'
          }}>{trade.dir}</span>
        </div>
        <span style={{ fontSize: '0.72rem', color: '#44446a' }}>{trade.time}</span>
      </div>
      <div style={{
        fontSize: '1.1rem', fontWeight: 800,
        color: trade.win ? '#05d890' : '#ff3d5a',
        letterSpacing: '-0.02em'
      }}>{trade.pnl}</div>
    </div>
  );
}

function StatPill({ stat, delay }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      padding: '10px 16px',
      animation: `fadeUp 0.6s ease both`,
      animationDelay: delay,
      flex: 1
    }}>
      <span style={{ fontSize: '1rem', color: '#05d890' }}>{stat.icon}</span>
      <div>
        <div style={{ fontSize: '0.75rem', color: '#44446a', marginBottom: 2 }}>{stat.label}</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f0ff', letterSpacing: '-0.02em' }}>{stat.value}</div>
      </div>
    </div>
  );
}

function EqCurve() {
  const pts = [20,18,22,15,24,20,28,22,30,25,35,28,40,34,38,42,36,45,42,50];
  const max = Math.max(...pts), min = Math.min(...pts);
  const norm = pts.map(p => 1 - (p - min) / (max - min));
  const w = 240, h = 60;
  const coords = norm.map((n, i) => `${(i / (pts.length - 1)) * w},${n * h}`);
  const path = `M${coords.join(' L')}`;
  const fill = `M0,${h} L${coords.join(' L')} L${w},${h} Z`;
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="eqfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#05d890" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#05d890" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#eqfill)" />
      <path d={path} stroke="#05d890" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={coords[coords.length - 1].split(',')[0]} cy={coords[coords.length - 1].split(',')[1]}
        r="4" fill="#05d890" style={{ filter: 'drop-shadow(0 0 6px #05d890)' }} />
    </svg>
  );
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) { setError('Please enter your username.'); return; }
    setError('');
    setLoading(true);
    setTimeout(() => {
      const ok = login(username.trim(), password);
      if (ok) {
        navigate('/');
      } else {
        setError('Invalid username or password.');
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: '#06060f',
      fontFamily: 'Inter, sans-serif',
      overflow: 'hidden'
    }}>
      {/* ── Left: Hero ── */}
      <div style={{
        flex: 1, position: 'relative', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '60px 64px',
        background: 'linear-gradient(135deg, #08081a 0%, #060610 100%)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        overflow: 'hidden'
      }}>
        {/* grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(28,28,46,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(28,28,46,0.35) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        {/* glow */}
        <div style={{
          position: 'absolute', top: '30%', left: '20%',
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(5,216,144,0.08) 0%, transparent 70%)',
          pointerEvents: 'none', borderRadius: '50%'
        }} />

        {/* Floating trade cards */}
        {mounted && <>
          <FloatingCard trade={TRADES[0]} style={{ top: '8%',  left: '5%',  animation: 'fadeUp 0.7s ease 0.1s both', transform: 'rotate(-3deg)' }} />
          <FloatingCard trade={TRADES[1]} style={{ top: '18%', right: '4%', animation: 'fadeUp 0.7s ease 0.25s both', transform: 'rotate(2deg)' }} />
          <FloatingCard trade={TRADES[4]} style={{ bottom: '22%', right: '2%', animation: 'fadeUp 0.7s ease 0.4s both', transform: 'rotate(-1.5deg)' }} />
          <FloatingCard trade={TRADES[2]} style={{ bottom: '8%',  left: '3%', animation: 'fadeUp 0.7s ease 0.35s both', transform: 'rotate(3deg)' }} />
        </>}

        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 1, animation: mounted ? 'fadeUp 0.6s ease both' : 'none' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <svg width="40" height="40" viewBox="0 0 32 32" style={{ filter: 'drop-shadow(0 0 12px rgba(5,216,144,0.5))' }}>
              <defs>
                <linearGradient id="lg1" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#00c07e"/>
                  <stop offset="100%" stopColor="#05d890"/>
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="8" fill="#0a0a18"/>
              <rect width="32" height="32" rx="8" fill="none" stroke="#05d890" strokeWidth="1" opacity="0.3"/>
              <polyline points="4,24 9,18 14,21 20,12 28,7" stroke="url(#lg1)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="20" cy="12" r="3.5" fill="#05d890" opacity="0.2"/>
              <circle cx="20" cy="12" r="2" fill="#05d890"/>
            </svg>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f0f0ff', letterSpacing: '-0.03em' }}>Edgeflow</span>
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'rgba(5,216,144,0.09)', border: '1px solid rgba(5,216,144,0.2)',
            borderRadius: 99, padding: '5px 14px', marginBottom: 24
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#05d890', display: 'inline-block', boxShadow: '0 0 8px #05d890' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#05d890', letterSpacing: '0.04em' }}>Professional Trade Journal</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', fontWeight: 900,
            letterSpacing: '-0.04em', lineHeight: 1.15,
            marginBottom: 18, color: '#f0f0ff'
          }}>
            Track every edge.<br />
            <span style={{
              background: 'linear-gradient(90deg, #05d890, #00c07e)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>Grow every week.</span>
          </h1>

          <p style={{ fontSize: '1rem', color: '#6666a0', lineHeight: 1.7, maxWidth: 400, marginBottom: 40 }}>
            Log trades, visualize performance, and identify patterns that move your P&L. Built for serious traders.
          </p>

          {/* Equity curve mini-widget */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16, padding: '16px 20px', marginBottom: 28, maxWidth: 300,
            backdropFilter: 'blur(8px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.78rem', color: '#44446a', fontWeight: 500 }}>Equity Curve · 20 trades</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#05d890' }}>+31.4%</span>
            </div>
            <EqCurve />
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 10, maxWidth: 360 }}>
            {STATS.map((s, i) => <StatPill key={s.label} stat={s} delay={`${0.2 + i * 0.1}s`} />)}
          </div>
        </div>
      </div>

      {/* ── Right: Form ── */}
      <div style={{
        width: '100%', maxWidth: 480,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 56px',
        background: '#060609',
        position: 'relative'
      }}>
        {/* subtle top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(5,216,144,0.4), transparent)'
        }} />

        <div style={{ width: '100%', maxWidth: 360, animation: mounted ? 'fadeUp 0.5s ease 0.15s both' : 'none' }}>
          {/* Form header */}
          <div style={{ marginBottom: 36 }}>
            <h2 style={{
              fontSize: '1.7rem', fontWeight: 800, color: '#f0f0ff',
              letterSpacing: '-0.03em', marginBottom: 8
            }}>Welcome back</h2>
            <p style={{ color: '#44446a', fontSize: '0.9rem' }}>Sign in to your trading journal</p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(255,61,90,0.08)', border: '1px solid rgba(255,61,90,0.25)',
              borderRadius: 10, padding: '11px 14px', marginBottom: 20,
              fontSize: '0.85rem', color: '#ff3d5a', display: 'flex', alignItems: 'center', gap: 8
            }}>
              <span style={{ fontSize: '1rem' }}>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Username */}
            <div>
              <label style={{
                display: 'block', fontSize: '0.8rem', fontWeight: 600,
                color: '#8888b0', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase'
              }}>Username</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: '#44446a', fontSize: '0.95rem', pointerEvents: 'none'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="trader"
                  required
                  autoFocus
                  autoComplete="username"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, padding: '13px 14px 13px 42px',
                    fontSize: '0.95rem', color: '#f0f0ff',
                    outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(5,216,144,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(5,216,144,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: 'block', fontSize: '0.8rem', fontWeight: 600,
                color: '#8888b0', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase'
              }}>Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: '#44446a', fontSize: '0.95rem', pointerEvents: 'none'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, padding: '13px 44px 13px 42px',
                    fontSize: '0.95rem', color: '#f0f0ff',
                    outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                    letterSpacing: showPw ? 'normal' : '0.12em',
                    fontFamily: 'inherit'
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(5,216,144,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(5,216,144,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#44446a', padding: 4, display: 'flex', alignItems: 'center'
                  }}
                >
                  {showPw
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 6,
                padding: '14px',
                background: loading ? 'rgba(5,216,144,0.5)' : 'linear-gradient(135deg, #05d890 0%, #00c07e 100%)',
                border: 'none', borderRadius: 10,
                fontSize: '0.95rem', fontWeight: 700, color: '#021a0e',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'opacity 0.2s, transform 0.15s, box-shadow 0.2s',
                boxShadow: loading ? 'none' : '0 0 20px rgba(5,216,144,0.3)',
                letterSpacing: '-0.01em'
              }}
              onMouseEnter={e => { if (!loading) { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 4px 24px rgba(5,216,144,0.45)'; }}}
              onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 0 20px rgba(5,216,144,0.3)'; }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 14, height: 14, borderRadius: '50%',
                    border: '2px solid rgba(2,26,14,0.35)',
                    borderTopColor: '#021a0e',
                    display: 'inline-block',
                    animation: 'spin 0.7s linear infinite'
                  }} />
                  Signing in…
                </>
              ) : 'Sign In →'}
            </button>
          </form>

          {/* Credentials hint */}
          <div style={{
            marginTop: 24,
            background: 'rgba(5,216,144,0.05)', border: '1px solid rgba(5,216,144,0.12)',
            borderRadius: 10, padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <span style={{ fontSize: '1.1rem' }}>🔑</span>
            <div style={{ fontSize: '0.8rem', color: '#6666a0', lineHeight: 1.5 }}>
              Default credentials:&nbsp;
              <code style={{ color: '#05d890', background: 'rgba(5,216,144,0.1)', borderRadius: 4, padding: '1px 5px', fontSize: '0.78rem' }}>trader</code>
              &nbsp;/&nbsp;
              <code style={{ color: '#05d890', background: 'rgba(5,216,144,0.1)', borderRadius: 4, padding: '1px 5px', fontSize: '0.78rem' }}>trader123</code>
            </div>
          </div>

          <p style={{ textAlign: 'center', marginTop: 28, fontSize: '0.75rem', color: '#2a2a42' }}>
            © 2026 Edgeflow · Trade smarter
          </p>
        </div>
      </div>
    </div>
  );
}
