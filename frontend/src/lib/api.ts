import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens, isTokenExpired } from './auth';
import { AuthTokens } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002';

// ─── Axios Instance ─────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// ─── Request Interceptor: Attach JWT ────────────────────────────────────────

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      // Check if token needs refresh before making request
      if (isTokenExpired(token) && !config.url?.includes('/auth/refresh')) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const newToken = await refreshAccessToken();
            if (newToken) {
              onRefreshed(newToken);
              config.headers.Authorization = `Bearer ${newToken}`;
            }
          } catch {
            clearTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            }
          } finally {
            isRefreshing = false;
          }
        } else {
          // Wait for the current refresh to finish
          return new Promise((resolve) => {
            subscribeTokenRefresh((newToken: string) => {
              config.headers.Authorization = `Bearer ${newToken}`;
              resolve(config);
            });
          });
        }
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Handle 401 ───────────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch {
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }
    }

    return Promise.reject(error);
  }
);

// ─── Token Refresh ──────────────────────────────────────────────────────────

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await axios.post<AuthTokens>(`${API_BASE_URL}/api/auth/refresh`, {
      refresh_token: refreshToken,
    });

    const tokens = response.data;
    setTokens(tokens);
    return tokens.access_token;
  } catch {
    clearTokens();
    return null;
  }
}

// ─── SSE Helper for Chat Streaming ──────────────────────────────────────────

export interface SSECallbacks {
  onToken: (token: string) => void;
  onCitations: (citations: unknown[]) => void;
  onExtractedFields: (fields: Record<string, unknown>) => void;
  onIntakeProgress: (progress: unknown) => void;
  onPhase: (phase: string) => void;
  onModelUsed: (model: string) => void;
  onDone: (data: unknown) => void;
  onError: (error: string) => void;
}

export async function streamChat(
  sessionId: string | undefined,
  content: string,
  language: string,
  callbacks: SSECallbacks,
  signal?: AbortSignal
): Promise<void> {
  const token = getAccessToken();
  const url = `${API_BASE_URL}/api/chat/stream`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      content,
      language,
      session_id: sessionId,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    callbacks.onError(errorText || `HTTP ${response.status}`);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError('No response body');
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr || jsonStr === '[DONE]') {
          callbacks.onDone({});
          continue;
        }

        try {
          const event = JSON.parse(jsonStr);
          switch (event.type) {
            case 'token':
              callbacks.onToken(event.data as string);
              break;
            case 'citations':
              callbacks.onCitations(event.data as unknown[]);
              break;
            case 'extracted_fields':
              callbacks.onExtractedFields(event.data as Record<string, unknown>);
              break;
            case 'intake_progress':
              callbacks.onIntakeProgress(event.data);
              break;
            case 'phase':
              callbacks.onPhase(event.data as string);
              break;
            case 'model_used':
              callbacks.onModelUsed(event.data as string);
              break;
            case 'done':
              callbacks.onDone(event.data);
              break;
            case 'error':
              callbacks.onError(event.data as string);
              break;
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export { API_BASE_URL };
export default api;
