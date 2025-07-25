'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
interface User {
  id: string;
  username: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const clearAuthData = useCallback(() => {
    localStorage.removeItem('auth-token');
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    setUser(null);
  }, []);

  const setAuthData = useCallback((token: string, fallbackUsername?: string) => {
    localStorage.setItem('auth-token', token);
    document.cookie = `auth-token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({
        id: payload.sub,
        username: payload.username,
      });
    } catch (decodeError) {
      console.error('Failed to decode token:', decodeError);
      if (fallbackUsername) {
        setUser({
          id: fallbackUsername,
          username: fallbackUsername,
        });
      } else {
        clearAuthData();
        throw new Error('Invalid token format');
      }
    }
  }, [clearAuthData]);

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/crawl/list?limit=1`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setAuthData(token);
      } else {
        clearAuthData();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  }, [clearAuthData, setAuthData]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setAuthData(data.token, username);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    clearAuthData();
    router.push('/login');
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('Context Error');
  }
  return context;
}