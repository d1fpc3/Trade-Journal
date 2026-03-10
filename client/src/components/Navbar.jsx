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
      background: 'rgba(8, 8, 14, 0.88)',
      borderBottom: '1px solid rgba(28,28,46,0.8)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      boxShadow: '0 1px 0 rgba(5,216,144,0.06), 0 4px 24px rgba(0,0,0,0.4)'
    }}>
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
            width: 30, height: 30,
            background: 'linear-gradient(135deg, #05d890 0%, #00a06a 100%)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.9rem',
            boxShadow: '0 0 14px rgba(5,216,144,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
            flexShrink: 0
          }}>
            📈
          </div>
          <span style={{
            fontWeight: 800,
            fontSize: '1rem',
            letterSpacing: '-0.03em',
            background: 'linear-gradient(90deg, #f0f0ff 0%, #8888b0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Edgeflow
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
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 500,
                textDecoration: 'none',
                color: isActive ? '#05d890' : 'var(--text-secondary)',
                background: isActive ? 'rgba(5,216,144,0.1)' : 'transparent',
                border: isActive ? '1px solid rgba(5,216,144,0.2)' : '1px solid transparent',
                transition: 'all 0.18s ease',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? '0 0 12px rgba(5,216,144,0.12)' : 'none',
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
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 7,
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            fontWeight: 500,
            padding: '6px 12px',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            fontFamily: 'inherit',
            flexShrink: 0
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--red)';
            e.currentTarget.style.borderColor = 'rgba(255,61,90,0.3)';
            e.currentTarget.style.background = 'rgba(255,61,90,0.06)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
