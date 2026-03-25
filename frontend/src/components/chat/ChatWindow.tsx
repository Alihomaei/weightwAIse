'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '@/hooks/useChat';
import { useVoice } from '@/hooks/useVoice';
import { useLanguageStore, useAuthStore } from '@/lib/store';
import { Language, ChatMessage, SessionType } from '@/lib/types';
import { MessageBubble } from './MessageBubble';
import { VoiceButton } from './VoiceButton';
import { IntakeProgressBar } from './IntakeProgress';
import { SessionSummary } from './SessionSummary';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  Send,
  StopCircle,
  Globe,
  LogOut,
  MessageSquare,
  Stethoscope,
  ClipboardCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const phaseConfig: Record<SessionType, { label: string; icon: React.ReactNode; color: string }> = {
  intake: {
    label: 'Intake',
    icon: <ClipboardCheck className="h-3.5 w-3.5" />,
    color: 'bg-blue-100 text-blue-700',
  },
  consultation: {
    label: 'Consultation',
    icon: <Stethoscope className="h-3.5 w-3.5" />,
    color: 'bg-teal-100 text-teal-700',
  },
  follow_up: {
    label: 'Follow-up',
    icon: <MessageSquare className="h-3.5 w-3.5" />,
    color: 'bg-purple-100 text-purple-700',
  },
};

export function ChatWindow() {
  const {
    session,
    messages,
    streamingMessage,
    intakeProgress,
    currentPhase,
    isStreaming,
    sendMessage,
    stopStreaming,
    startSession,
  } = useChat();

  const {
    isListening,
    sttSupported,
    ttsSupported,
    currentTranscript,
    toggleListening,
    speakText,
    stopSpeech,
    resetTranscript,
  } = useVoice();

  const { language, setLanguage } = useLanguageStore();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [inputText, setInputText] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage?.content]);

  // Sync voice transcript to input
  useEffect(() => {
    if (isVoiceMode && currentTranscript) {
      setInputText(currentTranscript);
    }
  }, [currentTranscript, isVoiceMode]);

  // When voice stops, mark the message as voice-inputted
  useEffect(() => {
    if (!isListening && isVoiceMode && currentTranscript.trim()) {
      // Auto-send voice message after recording stops
      // Small delay to capture final result
      const timer = setTimeout(() => {
        if (currentTranscript.trim()) {
          handleSend(currentTranscript.trim(), true);
          setInputText('');
          resetTranscript();
          setIsVoiceMode(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isListening]);

  const handleSend = useCallback(
    async (text?: string, voice = false) => {
      const messageText = text || inputText.trim();
      if (!messageText || isStreaming) return;

      setInputText('');
      resetTranscript();
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }

      await sendMessage(messageText, voice);
    },
    [inputText, isStreaming, sendMessage, resetTranscript]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceToggle = () => {
    if (!isListening) {
      setIsVoiceMode(true);
    }
    toggleListening();
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  const isSessionCompleted = session?.status === 'completed';
  const phase = currentPhase ? phaseConfig[currentPhase] : phaseConfig.intake;

  return (
    <div className="flex flex-col h-full bg-medical-bg">
      {/* Header */}
      <header className="bg-white border-b border-medical-border px-4 py-3 shrink-0">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-600 to-teal-500 flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-medical-text">
                {user?.full_name || 'Patient'}
              </h1>
              <div className="flex items-center gap-2">
                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium', phase.color)}>
                  {phase.icon}
                  {phase.label}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-medical-border text-xs font-medium text-medical-muted hover:bg-gray-50 transition-colors"
              aria-label={`Switch to ${language === 'en' ? 'Spanish' : 'English'}`}
            >
              <Globe className="h-3.5 w-3.5" />
              {language === 'en' ? 'EN' : 'ES'}
            </button>
            <button
              onClick={() => {
                import('@/lib/auth').then(({ clearTokens }) => {
                  clearTokens();
                  useAuthStore.getState().logout();
                  window.location.href = '/';
                });
              }}
              className="p-2 rounded-lg text-medical-muted hover:bg-gray-100 transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Intake Progress */}
      {intakeProgress && currentPhase === 'intake' && (
        <div className="px-4 py-2 shrink-0 max-w-3xl mx-auto w-full">
          <IntakeProgressBar progress={intakeProgress} />
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Welcome message when no messages */}
          {messages.length === 0 && !isStreaming && (
            <div className="text-center py-12 animate-fade-in">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-100 to-teal-100 flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="h-8 w-8 text-primary-700" />
              </div>
              <h2 className="text-lg font-semibold text-medical-text mb-2">
                {language === 'en'
                  ? 'Welcome to weightwAIse'
                  : 'Bienvenido a weightwAIse'}
              </h2>
              <p className="text-sm text-medical-muted max-w-md mx-auto">
                {language === 'en'
                  ? "I'm your AI bariatric surgery consultant. Let's start by learning about you. Feel free to type or use the microphone button to speak."
                  : 'Soy su consultor de cirugia bariatrica con IA. Comencemos aprendiendo sobre usted. Puede escribir o usar el microfono para hablar.'}
              </p>
            </div>
          )}

          {/* Session completed */}
          {isSessionCompleted && session ? (
            <SessionSummary
              session={session}
              onNewSession={() => startSession()}
            />
          ) : (
            <>
              {/* Message List */}
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onSpeak={ttsSupported ? speakText : undefined}
                />
              ))}

              {/* Streaming message */}
              {streamingMessage && (
                <MessageBubble
                  message={{
                    id: 'streaming',
                    session_id: '',
                    role: 'assistant',
                    content: streamingMessage.content,
                    citations: streamingMessage.citations,
                    extracted_fields: streamingMessage.extracted_fields,
                    model_used: streamingMessage.model_used,
                    language,
                    created_at: new Date().toISOString(),
                  }}
                  isStreaming
                />
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      {!isSessionCompleted && (
        <div className="bg-white border-t border-medical-border px-4 py-3 shrink-0">
          <div className="max-w-3xl mx-auto">
            {/* Voice transcript preview */}
            {isListening && currentTranscript && (
              <div className="mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 animate-fade-in">
                <span className="inline-block h-2 w-2 bg-red-500 rounded-full animate-pulse mr-2" />
                {currentTranscript}
              </div>
            )}

            <div className="flex items-end gap-2">
              {/* Voice Button */}
              <VoiceButton
                isListening={isListening}
                isSupported={sttSupported}
                onToggle={handleVoiceToggle}
                size="md"
              />

              {/* Text Input */}
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    language === 'en'
                      ? 'Type your message...'
                      : 'Escribe tu mensaje...'
                  }
                  rows={1}
                  className="w-full resize-none rounded-xl border border-medical-border px-4 py-2.5 text-sm text-medical-text placeholder:text-medical-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                  disabled={isStreaming}
                  aria-label="Chat message input"
                />
              </div>

              {/* Send / Stop Button */}
              {isStreaming ? (
                <Button
                  variant="danger"
                  size="icon"
                  onClick={stopStreaming}
                  className="rounded-xl h-10 w-10"
                  aria-label="Stop response"
                >
                  <StopCircle className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="icon"
                  onClick={() => handleSend()}
                  disabled={!inputText.trim()}
                  className="rounded-xl h-10 w-10"
                  aria-label="Send message"
                >
                  <Send className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
