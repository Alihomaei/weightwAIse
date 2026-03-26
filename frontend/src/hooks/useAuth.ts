'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';
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
} from '@/lib/types';

/**
 * IMPORTANT — login & register use raw fetch(), NOT the axios instance.
 * This completely bypasses axios interceptors which can attach stale tokens,
 * attempt token refresh, or redirect — all of which break the auth flow.
 * See .claude/skills/frontend-auth.md for full explanation.
 */

async function authFetch(path: string, body: object): Promise<AuthResponse> {
  // Always clear stale tokens before any auth request
  clearTokens();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Auth failed (${res.status})`);
  }

  return res.json();
}

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
        // Token exists but no stored user — clear and start fresh
        clearTokens();
        setUser(null);
      }
    } else {
      // No valid token — clear any stale data
      clearTokens();
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
        const data = await authFetch('/api/auth/login', credentials);
        setTokens(data.tokens);
        setStoredUser(data.user);
        setUser(data.user);
        setLanguage(data.user.language_preference);
        addToast('success', `Welcome back, ${data.user.full_name || data.user.username}!`);

        if (data.user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/chat');
        }
      } catch (err: unknown) {
        const message = (err as Error).message || 'Login failed. Please check your credentials.';
        addToast('error', message);
        throw err;
      }
    },
    [setUser, router, addToast, setLanguage]
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      try {
        const resp = await authFetch('/api/auth/register', data);
        setTokens(resp.tokens);
        setStoredUser(resp.user);
        setUser(resp.user);
        setLanguage(resp.user.language_preference);
        addToast('success', 'Account created successfully!');

        if (resp.user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/chat');
        }
      } catch (err: unknown) {
        const message = (err as Error).message || 'Registration failed. Please try again.';
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

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };
}
