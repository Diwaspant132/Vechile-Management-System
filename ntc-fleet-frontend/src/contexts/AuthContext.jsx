import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Automatically check if a user session token exists when the browser loads up
  useEffect(() => {
    const savedUser = sessionStorage.getItem('ntc_user');
    const savedToken = sessionStorage.getItem('ntc_token');
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Error parsing stored session user:", e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login verification failed.');
      }

      // 💾 Save using your explicit enterprise key-names
      sessionStorage.setItem('ntc_token', data.token);
      sessionStorage.setItem('ntc_user', JSON.stringify(data.user));
      
      // Update global React state context
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    sessionStorage.removeItem('ntc_token');
    sessionStorage.removeItem('ntc_user');
    setUser(null);
  };

  const updateSessionUser = (updatedUser) => {
    sessionStorage.setItem('ntc_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateSessionUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};