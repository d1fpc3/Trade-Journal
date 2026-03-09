import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { username, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '0 20px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16
      }}>
        {/* Logo */}
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <span style={{ fontSize: '1.25rem' }}>📈</span>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Trade Journal
          </span>
        </NavLink>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'center' }}>
          {[
            { to: '/', label: 'Dashboard' },
            { to: '/log-trade', label: '+ Log Trade' },
            { to: '/trades', label: 'History' },
            { to: '/analytics', label: 'Analytics' }
          ].map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              style={({ isActive }) => ({
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: '0.875rem',
                fontWeight: 500,
                textDecoration: 'none',
                color: isActive ? 'var(--green)' : 'var(--text-secondary)',
                background: isActive ? 'var(--green-dim)' : 'transparent',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            padding: '4px 10px',
            background: 'var(--bg-input)',
            borderRadius: 20,
            border: '1px solid var(--border)'
          }}>
            {username}
          </span>
          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-sm"
            title="Logout"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
