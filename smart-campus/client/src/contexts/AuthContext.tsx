import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | void>;
  logout: () => void;
  quickSwitch: (role: UserRole) => Promise<string | void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDean: boolean;
  isHod: boolean;
  isFaculty: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('smart_campus_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.getMe();
        if (res.success && res.user) {
          setUser(res.user);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
        logout();
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    const handleAuthExpired = () => {
      logout();
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, [token]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      if (res.success && res.token) {
        localStorage.setItem('smart_campus_token', res.token);
        setToken(res.token);
        setUser(res.user);
        return res.redirectPath || '/';
      } else {
        throw new Error(res.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('smart_campus_token');
    setToken(null);
    setUser(null);
  };

  const quickSwitch = async (role: UserRole) => {
    const credentials: Record<UserRole, { email: string; pass: string }> = {
      ADMIN: { email: 'admin@college.edu', pass: 'AdminPassword123!' },
      DEAN: { email: 'dean@college.edu', pass: 'Password123!' },
      HOD: { email: 'hod.cse@college.edu', pass: 'Password123!' },
      FACULTY: { email: 'faculty.cse2@college.edu', pass: 'Password123!' },
      STUDENT: { email: 'student@college.edu', pass: 'Password123!' },
    };

    const target = credentials[role];
    if (target) {
      return await login(target.email, target.pass);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    quickSwitch,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isDean: user?.role === 'DEAN',
    isHod: user?.role === 'HOD',
    isFaculty: user?.role === 'FACULTY',
    isStudent: user?.role === 'STUDENT',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
