'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  getAccessToken,
  setTokens,
  clearTokens,
  setStoredUser,
  getStoredUser,
  isAuthenticated as checkAuth,
} from '@/lib/auth';
import { useAuthStore, useToastStore, useLanguageStore } from '@/lib/store';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from '@/lib/types';

export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, setUser, setLoading, logout: storeLogout } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  // Hydrate auth state from localStorage on mount
  const hydrate = useCallback(() => {
    if (checkAuth()) {
      const storedUser = getStoredUser();
      if (storedUser) {
        setUser(storedUser);
        setLanguage(storedUser.language_preference);
      } else {
        // Token exists but no user — fetch from API
        api
          .get<User>('/api/auth/me')
          .then((res) => {
            setUser(res.data);
            setStoredUser(res.data);
            setLanguage(res.data.language_preference);
          })
          .catch(() => {
            clearTokens();
            setUser(null);
          });
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [setUser, setLoading, setLanguage]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      try {
        // Clear any stale tokens before login attempt — prevents the axios
        // interceptor from attaching an expired token to the login request
        clearTokens();

        const response = await api.post<AuthResponse>('/api/auth/login', credentials);
        const { user: loggedInUser, tokens } = response.data;
        setTokens(tokens);
        setStoredUser(loggedInUser);
        setUser(loggedInUser);
        setLanguage(loggedInUser.language_preference);
        addToast('success', `Welcome back, ${loggedInUser.full_name || loggedInUser.username}!`);

        // Role-based redirect
        if (loggedInUser.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/chat');
        }
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          'Login failed. Please check your credentials.';
        addToast('error', message);
        throw err;
      }
    },
    [setUser, router, addToast, setLanguage]
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      try {
        clearTokens();
        const response = await api.post<AuthResponse>('/api/auth/register', data);
        const { user: newUser, tokens } = response.data;
        setTokens(tokens);
        setStoredUser(newUser);
        setUser(newUser);
        setLanguage(newUser.language_preference);
        addToast('success', 'Account created successfully!');

        if (newUser.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/chat');
        }
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          'Registration failed. Please try again.';
        addToast('error', message);
        throw err;
      }
    },
    [setUser, router, addToast, setLanguage]
  );

  const logout = useCallback(() => {
    clearTokens();
    storeLogout();
    addToast('info', 'You have been logged out.');
    router.push('/');
  }, [storeLogout, router, addToast]);

  const fetchCurrentUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return null;
    try {
      const response = await api.get<User>('/api/auth/me');
      setUser(response.data);
      setStoredUser(response.data);
      return response.data;
    } catch {
      clearTokens();
      setUser(null);
      return null;
    }
  }, [setUser]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    fetchCurrentUser,
  };
}
