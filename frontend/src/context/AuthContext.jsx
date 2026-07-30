import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('gemini_key') || '');
  const [isDemo, setIsDemo] = useState(localStorage.getItem('medlaw_demo_mode') === 'true');

  // Base API URL supporting Vite env variables
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserProfile();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (geminiKey) {
      localStorage.setItem('gemini_key', geminiKey);
    } else {
      localStorage.removeItem('gemini_key');
    }
  }, [geminiKey]);

  const fetchUserProfile = async () => {
    if (localStorage.getItem('medlaw_demo_mode') === 'true') {
      let email = 'demo@example.com';
      if (token && token.startsWith('demo-token-')) {
        try {
          email = atob(token.replace('demo-token-', ''));
        } catch (e) {}
      }
      setUser({ id: 'demo-user-' + email, email });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (!error.response) {
        // Switch to demo mode if backend is not reachable
        localStorage.setItem('medlaw_demo_mode', 'true');
        setIsDemo(true);
        let email = 'demo@example.com';
        if (token && token.startsWith('demo-token-')) {
          try {
            email = atob(token.replace('demo-token-', ''));
          } catch (e) {}
        }
        setUser({ id: 'demo-user-' + email, email });
      } else {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      setToken(access_token);
      localStorage.removeItem('medlaw_demo_mode');
      setIsDemo(false);
      return { success: true };
    } catch (error) {
      if (!error.response || localStorage.getItem('medlaw_demo_mode') === 'true') {
        // Fallback to Demo Mode
        localStorage.setItem('medlaw_demo_mode', 'true');
        setIsDemo(true);
        
        const demoUsers = JSON.parse(localStorage.getItem('medlaw_demo_users') || '[]');
        const existingUser = demoUsers.find(u => u.email === email);
        if (existingUser && existingUser.password !== password) {
          return { success: false, error: 'Incorrect password for local demo account' };
        }
        if (!existingUser) {
          demoUsers.push({ id: Date.now(), email, password });
          localStorage.setItem('medlaw_demo_users', JSON.stringify(demoUsers));
        }

        const access_token = 'demo-token-' + btoa(email);
        localStorage.setItem('token', access_token);
        setToken(access_token);
        setUser({ id: 'demo-user-' + email, email });
        return { success: true };
      }
      const message = error.response?.data?.detail || 'Login failed';
      return { success: false, error: message };
    }
  };

  const register = async (email, password) => {
    try {
      await axios.post(`${API_URL}/auth/register`, { email, password });
      return await login(email, password);
    } catch (error) {
      if (!error.response) {
        // Fallback to Demo Mode
        localStorage.setItem('medlaw_demo_mode', 'true');
        setIsDemo(true);

        const demoUsers = JSON.parse(localStorage.getItem('medlaw_demo_users') || '[]');
        if (!demoUsers.find(u => u.email === email)) {
          demoUsers.push({ id: Date.now(), email, password });
          localStorage.setItem('medlaw_demo_users', JSON.stringify(demoUsers));
        }
        return await login(email, password);
      }
      const message = error.response?.data?.detail || 'Registration failed';
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('medlaw_demo_mode');
    setIsDemo(false);
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    geminiKey,
    setGeminiKey,
    login,
    register,
    logout,
    API_URL,
    isDemo
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

