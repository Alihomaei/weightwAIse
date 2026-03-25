import { AuthTokens, User, UserRole } from './types';

const ACCESS_TOKEN_KEY = 'ww_access_token';
const REFRESH_TOKEN_KEY = 'ww_refresh_token';
const USER_KEY = 'ww_user';

// ─── Token Storage ──────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(tokens: AuthTokens): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ─── User Storage ───────────────────────────────────────────────────────────

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ─── Role Checks ────────────────────────────────────────────────────────────

export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin';
}

export function isPatient(user: User | null): boolean {
  return user?.role === 'patient';
}

export function hasRole(user: User | null, role: UserRole): boolean {
  return user?.role === role;
}

// ─── Token Parsing ──────────────────────────────────────────────────────────

interface JWTPayload {
  sub: string;
  role: string;
  exp: number;
  iat: number;
}

export function parseJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = parseJWT(token);
  if (!payload) return true;
  // Check if token expires within the next 30 seconds
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now + 30;
}

export function isAuthenticated(): boolean {
  const token = getAccessToken();
  if (!token) return false;
  return !isTokenExpired(token);
}
