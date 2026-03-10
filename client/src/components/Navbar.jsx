import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_LINKS = [
  { to: '/',          label: 'Dashboard', end: true },
  { to: '/log-trade', label: '+ Log Trade' },
  { to: '/trades',    label: 'History' },
  { to: '/analytics', label: 'Analytics' }
];

export default function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav style={{
      background: 'rgba(2, 1, 8, 0.92)',
      borderBottom: '1px solid rgba(168, 85, 247, 0.15)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(32px)',
      WebkitBackdropFilter: 'blur(32px)',
      boxShadow: '0 1px 0 rgba(168,85,247,0.1), 0 0 40px rgba(168,85,247,0.05), 0 4px 32px rgba(0,0,0,0.7)'
    }}>
      {/* Top accent line */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.8) 30%, rgba(0,255,136,0.5) 70%, transparent 100%)'
      }} />

      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '0 24px',
        height: 58,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16
      }}>

        {/* Logo */}
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32,
            background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #00ff88 100%)',
            borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.95rem',
            boxShadow: '0 0 20px rgba(168,85,247,0.5), 0 0 40px rgba(168,85,247,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
            flexShrink: 0
          }}>
            📈
          </div>
          <span style={{
            fontWeight: 800,
            fontSize: '1rem',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(90deg, #e8e8ff 0%, #a855f7 60%, #00ff88 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Trade Journal
          </span>
        </NavLink>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'center' }}>
          {NAV_LINKS.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              style={({ isActive }) => ({
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: '0.84rem',
                fontWeight: isActive ? 700 : 500,
                textDecoration: 'none',
                color: isActive ? '#00ff88' : 'var(--text-secondary)',
                background: isActive ? 'rgba(0,255,136,0.08)' : 'transparent',
                border: isActive ? '1px solid rgba(0,255,136,0.25)' : '1px solid transparent',
                transition: 'all 0.18s ease',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? '0 0 16px rgba(0,255,136,0.15)' : 'none',
                textShadow: isActive ? '0 0 12px rgba(0,255,136,0.5)' : 'none',
                letterSpacing: link.label.startsWith('+') ? '0.01em' : 'normal'
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: '1px solid rgba(168,85,247,0.2)',
            borderRadius: 7,
            color: 'var(--text-muted)',
            fontSize: '0.78rem',
            fontWeight: 600,
            padding: '6px 12px',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            fontFamily: 'inherit',
            flexShrink: 0,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-mono)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--red)';
            e.currentTarget.style.borderColor = 'rgba(255,26,74,0.4)';
            e.currentTarget.style.background = 'rgba(255,26,74,0.07)';
            e.currentTarget.style.textShadow = '0 0 10px rgba(255,26,74,0.5)';
            e.currentTarget.style.boxShadow = '0 0 16px rgba(255,26,74,0.1)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.borderColor = 'rgba(168,85,247,0.2)';
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.textShadow = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
