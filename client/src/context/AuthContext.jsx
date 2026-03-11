import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const DEFAULT_USERNAME = 'trader';
const DEFAULT_PASSWORD = 'trader123';
const AUTH_KEY = 'tj_logged_in';

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem(AUTH_KEY) === 'true';
  });

  const login = (username, password) => {
    const storedPw = localStorage.getItem('tj_password') || DEFAULT_PASSWORD;
    const storedUser = localStorage.getItem('tj_username') || DEFAULT_USERNAME;
    if (username === storedUser && password === storedPw) {
      localStorage.setItem(AUTH_KEY, 'true');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
