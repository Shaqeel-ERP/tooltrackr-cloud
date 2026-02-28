import { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('tt_user');
      const storedToken = localStorage.getItem('tt_token');
      
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
        setIsAuthenticated(true);
      }
    } catch (e) {
      localStorage.removeItem('tt_user');
      localStorage.removeItem('tt_token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const { data } = await api.post('/api/auth/login', { username, password });
      localStorage.setItem('tt_token', data.token);
      localStorage.setItem('tt_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('tt_token');
    localStorage.removeItem('tt_user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  const hasRole = (requiredRole) => {
    if (!user || (!user.role && user.role !== '')) return false;
    
    if (user.role === 'Admin') return true;
    if (user.role === 'Manager') {
      return requiredRole === 'Manager' || requiredRole === 'User';
    }
    if (user.role === 'User') {
      return requiredRole === 'User';
    }
    return false;
  };

  const value = {
    user,
    token,
    isAuthenticated,
    isAdmin: user?.role === 'Admin',
    login,
    logout,
    hasRole,
  };

  if (isLoading) return null;

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
