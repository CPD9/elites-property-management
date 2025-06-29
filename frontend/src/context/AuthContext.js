import React, { createContext, useContext, useEffect, useState } from 'react';

import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set up axios defaults
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userEmail');
    delete axios.defaults.headers.common['x-auth-token'];
    setUser(null);
  };
  
  // Add axios interceptors for handling token
  useEffect(() => {
    // Request interceptor to ensure token is always sent
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token && !config.headers['x-auth-token']) {
          config.headers['x-auth-token'] = token;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for handling token errors
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 || error.response?.data?.message === 'Token is not valid') {
          // Token is invalid or expired, logout user
          logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Always set the token header first
      axios.defaults.headers.common['x-auth-token'] = token;
      // Verify the token is still valid
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  // Function to ensure token is set
  const ensureToken = () => {
    const token = localStorage.getItem('token');
    if (token && !axios.defaults.headers.common['x-auth-token']) {
      axios.defaults.headers.common['x-auth-token'] = token;
    }
    return token;
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('userEmail', user.email);
      axios.defaults.headers.common['x-auth-token'] = token;
      
      setUser(user);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const verifyToken = async (token) => {
    try {
      // Try to make a simple authenticated request to verify token
      const response = await axios.get(`${API_URL}/auth/me`);
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
      setLoading(false);
    } catch (error) {
      // If token verification fails, try to get user data instead
      console.log('Token verification failed, trying fallback...');
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
        setLoading(false);
      } catch (fallbackError) {
        // Token is invalid, clear it
        logout();
        setLoading(false);
      }
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    verifyToken,
    ensureToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};