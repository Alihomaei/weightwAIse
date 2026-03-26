# Frontend Auth — Known Issues & Required Patterns

## Login Failure: Stale localStorage Tokens

### Problem
When the backend restarts, old JWT tokens in the browser's localStorage become invalid. The axios interceptor sees these old tokens and either:
1. Tries to refresh them (fails → clears tokens → redirects to `/` before login executes)
2. Attaches the expired token to the login request itself (backend may reject)

This causes "Login failed" errors even though the backend works fine via curl.

### Required Pattern — ALWAYS follow these rules:

1. **Clear tokens before login/register**: Always call `clearTokens()` as the first line inside `login()` and `register()` in `useAuth.ts`. This ensures no stale token interferes with the auth request.

```typescript
const login = useCallback(async (credentials) => {
  try {
    clearTokens(); // ← MUST be first
    const response = await api.post('/api/auth/login', credentials);
    // ...
```

2. **Skip interceptor for ALL auth routes**: The axios request interceptor must skip token handling for any URL containing `/auth/`:

```typescript
if (isTokenExpired(token) && !config.url?.includes('/auth/')) {
```

3. **Response interceptor also skips auth**: The 401 response interceptor must not retry auth requests:

```typescript
if (error.response?.status === 401 && !originalRequest.url?.includes('/auth')) {
```

4. **Hydration gracefully handles missing users**: The `hydrate()` function in `useAuth` must call `setLoading(false)` in ALL code paths, including when there's no token or when the `/api/auth/me` call fails.

### Files Involved
- `frontend/src/hooks/useAuth.ts` — login/register must clearTokens() first
- `frontend/src/lib/api.ts` — axios interceptors must skip /auth/ routes
- `frontend/src/lib/auth.ts` — token storage helpers
- `frontend/src/lib/store.ts` — auth store (isLoading must start true, hydrate sets false)

### Testing
After any auth change, verify:
1. Fresh login works (no localStorage)
2. Login works after backend restart (stale localStorage)
3. Login works immediately after logout
4. Admin and patient roles redirect correctly
