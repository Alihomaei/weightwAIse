'use client';

import { useState, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api, { streamChat } from '@/lib/api';
import { useChatStore, useLanguageStore, useToastStore } from '@/lib/store';
import {
  ChatMessage,
  ChatSession,
  Citation,
  IntakeProgress,
  SessionType,
  StreamingMessage,
} from '@/lib/types';
import { generateId } from '@/lib/utils';

export function useChat() {
  const { sessionId, isStreaming, setSessionId, setStreaming } = useChatStore();
  const language = useLanguageStore((s) => s.language);
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<StreamingMessage | null>(null);
  const [intakeProgress, setIntakeProgress] = useState<IntakeProgress | null>(null);
  const [currentPhase, setCurrentPhase] = useState<SessionType>('intake');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch current session metadata (not messages)
  const { data: session, refetch: refetchSession } = useQuery<ChatSession>({
    queryKey: ['chatSession', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('No session');
      const res = await api.get<ChatSession>(`/api/chat/sessions/${sessionId}`);
      return res.data;
    },
    enabled: !!sessionId,
    refetchOnWindowFocus: false,
  });

  // Helper: load messages from backend for a session
  const loadMessages = useCallback(async (sid: string) => {
    const res = await api.get<ChatMessage[]>(`/api/chat/sessions/${sid}/messages`);
    setMessages(res.data);
    return res.data;
  }, []);

  // Start a new session — returns session and loads welcome message
  const startSession = useCallback(async () => {
    try {
      const res = await api.post<ChatSession>('/api/chat/sessions', {
        session_type: 'intake',
      });
      const newId = res.data.id;
      setSessionId(newId);
      setIntakeProgress(null);
      setCurrentPhase('intake');
      await loadMessages(newId);
      return res.data;
    } catch (err) {
      addToast('error', 'Failed to start chat session.');
      throw err;
    }
  }, [setSessionId, addToast, loadMessages]);

  // Get existing session or create new one
  const getOrCreateSession = useCallback(async (): Promise<string> => {
    if (sessionId) return sessionId;

    try {
      const res = await api.get<ChatSession[]>('/api/chat/sessions');
      const active = res.data.find((s) => s.status === 'active');
      if (active) {
        setSessionId(active.id);
        await loadMessages(active.id);
        return active.id;
      }
    } catch {
      // Ignore — create new
    }

    const newSession = await startSession();
    return newSession.id;
  }, [sessionId, setSessionId, startSession, loadMessages]);

  // Send a message
  const sendMessage = useCallback(
    async (content: string, isVoice = false) => {
      if (isStreaming) return;

      const sid = await getOrCreateSession();
      setStreaming(true);

      // Add user message to local state immediately
      const userMessage: ChatMessage = {
        id: generateId(),
        session_id: sid,
        role: 'user',
        content,
        citations: [],
        extracted_fields: {},
        model_used: null,
        language,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Initialize streaming message
      setStreamingMessage({
        content: '',
        citations: [],
        extracted_fields: {},
        intake_progress: null,
        phase: null,
        model_used: null,
        isStreaming: true,
      });

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        await streamChat(
          sid,
          content,
          language,
          {
            onToken: (token: string) => {
              setStreamingMessage((prev) =>
                prev ? { ...prev, content: prev.content + token } : null
              );
            },
            onCitations: (citations: unknown[]) => {
              setStreamingMessage((prev) =>
                prev ? { ...prev, citations: citations as Citation[] } : null
              );
            },
            onExtractedFields: (fields: Record<string, unknown>) => {
              setStreamingMessage((prev) =>
                prev ? { ...prev, extracted_fields: fields } : null
              );
            },
            onIntakeProgress: (progress: unknown) => {
              const prog = progress as IntakeProgress;
              setIntakeProgress(prog);
              setStreamingMessage((prev) =>
                prev ? { ...prev, intake_progress: prog } : null
              );
            },
            onPhase: (phase: string) => {
              setCurrentPhase(phase as SessionType);
              setStreamingMessage((prev) =>
                prev ? { ...prev, phase: phase as SessionType } : null
              );
            },
            onModelUsed: (model: string) => {
              setStreamingMessage((prev) =>
                prev ? { ...prev, model_used: model } : null
              );
            },
            onDone: () => {
              setStreamingMessage((prev) => {
                if (prev && prev.content) {
                  const finalMessage: ChatMessage = {
                    id: generateId(),
                    session_id: sid,
                    role: 'assistant',
                    content: prev.content,
                    citations: prev.citations,
                    extracted_fields: prev.extracted_fields,
                    model_used: prev.model_used,
                    language,
                    created_at: new Date().toISOString(),
                  };
                  setMessages((msgs) => [...msgs, finalMessage]);
                }
                return null;
              });
              setStreaming(false);
            },
            onError: (error: string) => {
              addToast('error', `Chat error: ${error}`);
              setStreamingMessage(null);
              setStreaming(false);
            },
          },
          abortController.signal
        );
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          addToast('error', 'Failed to send message. Please try again.');
        }
        setStreamingMessage(null);
        setStreaming(false);
      }
    },
    [isStreaming, getOrCreateSession, setStreaming, language, addToast]
  );

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStreamingMessage((prev) => {
      if (prev && prev.content) {
        const finalMessage: ChatMessage = {
          id: generateId(),
          session_id: sessionId || '',
          role: 'assistant',
          content: prev.content + '\n\n*[Response stopped]*',
          citations: prev.citations,
          extracted_fields: prev.extracted_fields,
          model_used: prev.model_used,
          language,
          created_at: new Date().toISOString(),
        };
        setMessages((msgs) => [...msgs, finalMessage]);
      }
      return null;
    });
    setStreaming(false);
  }, [sessionId, setStreaming, language]);

  // End session
  const endSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      await api.post(`/api/chat/sessions/${sessionId}/end`);
      queryClient.invalidateQueries({ queryKey: ['chatSession'] });
      addToast('success', 'Session ended.');
    } catch {
      addToast('error', 'Failed to end session.');
    }
  }, [sessionId, queryClient, addToast]);

  // Manual refetch for resuming sessions
  const refetchMessages = useCallback(async () => {
    if (sessionId) await loadMessages(sessionId);
  }, [sessionId, loadMessages]);

  return {
    session,
    sessionId,
    messages,
    streamingMessage,
    intakeProgress,
    currentPhase,
    isStreaming,
    sendMessage,
    stopStreaming,
    startSession,
    endSession,
    getOrCreateSession,
    refetchSession,
    refetchMessages,
    setSessionId,
  };
}
