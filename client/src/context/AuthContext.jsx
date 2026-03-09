import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('tj_token'));
  const [username, setUsername] = useState(() => localStorage.getItem('tj_username'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Validate token on mount
    if (token) {
      fetch('/api/health', { headers: { Authorization: `Bearer ${token}` } })
        .then(() => setLoading(false))
        .catch(() => {
          logout();
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = (newToken, user) => {
    setToken(newToken);
    setUsername(user);
    localStorage.setItem('tj_token', newToken);
    localStorage.setItem('tj_username', user);
  };

  const logout = () => {
    setToken(null);
    setUsername(null);
    localStorage.removeItem('tj_token');
    localStorage.removeItem('tj_username');
  };

  const authFetch = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers
      }
    });
    if (res.status === 401) {
      logout();
      throw new Error('Unauthorized');
    }
    return res;
  };

  return (
    <AuthContext.Provider value={{ token, username, loading, login, logout, authFetch, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
