import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = 'http://localhost:5000/api';

// Setup axios interceptor untuk auto-inject token
const api = axios.create({ baseURL: API_URL });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-load dari localStorage saat mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const loginUser = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData, redirectPath } = response.data.data;

    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

    return { user: userData, redirectPath };
  };

  const registerUser = async (formData) => {
    const response = await api.post('/auth/register', formData);
    const { token: newToken, user: userData } = response.data.data;

    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

    return userData;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  };

  const updateUserData = (newData) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...newData };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const isAuthenticated = !!token && !!user;

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login: loginUser,
    register: registerUser,
    logout,
    updateUserData,
    api,
  };

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

export default AuthContext;
