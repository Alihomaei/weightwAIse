# Frontend Auth — Known Issues & Required Patterns

## Login Failure: Stale localStorage Tokens

### Root Cause
Axios interceptors attach stale JWT tokens to requests, attempt refresh on expired tokens, and redirect on failure — ALL of which break the login/register flow. This happens every time the backend restarts or tokens expire.

### THE FIX — NEVER use axios for auth requests

**Login and register MUST use raw `fetch()`, NOT the axios instance.**

The `authFetch()` helper in `useAuth.ts` does this:
1. Calls `clearTokens()` first (removes any stale localStorage data)
2. Uses raw `fetch()` to POST to the backend (zero interceptors)
3. Parses the response and stores new tokens

```typescript
async function authFetch(path: string, body: object): Promise<AuthResponse> {
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
```

### Rules — NEVER break these:

1. **Login/register = raw fetch()** — NEVER `api.post('/api/auth/login')`. The axios instance has interceptors that will corrupt auth requests.
2. **clearTokens() before every auth request** — Always clear stale localStorage before login/register.
3. **Hydrate clears stale tokens** — If `isAuthenticated()` returns false, call `clearTokens()` to remove stale data. Don't leave orphaned tokens in localStorage.
4. **Hydrate must always call setLoading(false)** — In ALL code paths. Otherwise the landing page is stuck on the loading spinner forever.
5. **Only use axios for authenticated API calls** (chat, admin, etc.) — where the interceptor adding the Bearer token is actually helpful.

### Files
- `frontend/src/hooks/useAuth.ts` — authFetch() + login/register/hydrate
- `frontend/src/lib/api.ts` — axios instance (used for everything EXCEPT auth)
- `frontend/src/lib/auth.ts` — token storage helpers

### Testing
After any auth change, verify:
1. Fresh login works (cleared localStorage)
2. Login works after backend restart (stale localStorage)
3. Login works immediately after logout
4. Admin → /admin, patient → /chat redirect works
