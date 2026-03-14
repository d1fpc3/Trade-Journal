import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'tj_token';
const USER_KEY  = 'tj_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser]   = useState(() => {
    const u = localStorage.getItem(USER_KEY);
    return u ? JSON.parse(u) : null;
  });

  const isAuthenticated = !!token;

  const login = async (username, password) => {
    const res  = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    const u = { username: data.username, plan: data.plan || 'free' };
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setToken(data.token);
    setUser(u);
  };

  const register = async (username, password) => {
    const res  = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    const u = { username: data.username, plan: data.plan || 'free' };
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setToken(data.token);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  // Change username or password — throws on error
  const changeCredentials = async (currentPassword, { newUsername, newPassword }) => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    const res = await fetch('/api/auth/change-credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`,
      },
      body: JSON.stringify({ currentPassword, newUsername, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update credentials');

    // If username changed, server returns a new token + username
    if (data.token) {
      const u = { ...user, username: data.username };
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(u));
      setToken(data.token);
      setUser(u);
    }
  };

  // Re-fetch plan from server and update local state (call after Stripe redirect)
  const refreshPlan = async () => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (!currentToken) return;
    try {
      const res = await fetch('/api/billing/status', {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const u = { ...user, plan: data.plan };
      localStorage.setItem(USER_KEY, JSON.stringify(u));
      setUser(u);
    } catch (_) {}
  };

  const getUsername = () => user?.username || '';

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout, getUsername, changeCredentials, refreshPlan }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
