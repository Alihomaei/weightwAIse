'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useChat } from '@/hooks/useChat';
import { useVoice } from '@/hooks/useVoice';
import { useLanguageStore, useAuthStore } from '@/lib/store';
import { Language, ChatMessage, SessionType } from '@/lib/types';
import { MessageBubble } from './MessageBubble';
import { VoiceButton } from './VoiceButton';
import { IntakeProgressBar } from './IntakeProgress';
import { SessionSummary } from './SessionSummary';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import {
  Send,
  StopCircle,
  Globe,
  LogOut,
  ClipboardCheck,
  Stethoscope,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const phaseConfig: Record<SessionType, { label: string; icon: React.ReactNode; color: string }> = {
  intake: {
    label: 'Intake',
    icon: <ClipboardCheck className="h-3 w-3" />,
    color: 'bg-blue-50 text-blue-700 border border-blue-200/60',
  },
  consultation: {
    label: 'Consultation',
    icon: <Stethoscope className="h-3 w-3" />,
    color: 'bg-teal-50 text-teal-700 border border-teal-200/60',
  },
  follow_up: {
    label: 'Follow-up',
    icon: <MessageSquare className="h-3 w-3" />,
    color: 'bg-purple-50 text-purple-700 border border-purple-200/60',
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
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  const isSessionCompleted = session?.status === 'completed';
  const phase = currentPhase ? phaseConfig[currentPhase] : phaseConfig.intake;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header - minimal top bar */}
      <header className="bg-background/80 backdrop-blur-md border-b px-4 py-2.5 shrink-0 z-10">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="WeightwAIse"
              width={100}
              height={44}
              className="h-8 w-auto"
              priority
            />
            <Separator orientation="vertical" className="h-5" />
            <span className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium',
              phase.color
            )}>
              {phase.icon}
              {phase.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
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
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Intake Progress - subtle and collapsible */}
      {intakeProgress && currentPhase === 'intake' && (
        <div className="px-4 py-2 shrink-0 max-w-3xl mx-auto w-full">
          <IntakeProgressBar progress={intakeProgress} />
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Welcome message when no messages */}
          {messages.length === 0 && !isStreaming && (
            <div className="text-center py-16 animate-fade-in">
              <Image
                src="/logo.png"
                alt="WeightwAIse"
                width={120}
                height={52}
                className="mx-auto mb-6 opacity-80"
              />
              <h2 className="text-lg font-semibold text-foreground mb-2">
                {language === 'en'
                  ? 'Welcome to weightwAIse'
                  : 'Bienvenido a weightwAIse'}
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
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

      {/* Input Area - pinned to bottom, ChatGPT-style */}
      {!isSessionCompleted && (
        <div className="bg-gradient-to-t from-background via-background to-transparent px-4 pb-4 pt-2 shrink-0">
          <div className="max-w-3xl mx-auto">
            {/* Voice transcript preview */}
            {isListening && currentTranscript && (
              <div className="mb-2 px-3 py-2 bg-red-50 border border-red-200/60 rounded-xl text-sm text-red-700 animate-fade-in">
                <span className="inline-block h-2 w-2 bg-red-500 rounded-full animate-pulse mr-2" />
                {currentTranscript}
              </div>
            )}

            <div className="flex items-end gap-2 bg-muted/50 border rounded-2xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all">
              {/* Voice Button */}
              <VoiceButton
                isListening={isListening}
                isSupported={sttSupported}
                onToggle={handleVoiceToggle}
                size="md"
              />

              {/* Text Input */}
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
                className="flex-1 resize-none bg-transparent px-2 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                disabled={isStreaming}
                aria-label="Chat message input"
              />

              {/* Send / Stop Button */}
              {isStreaming ? (
                <button
                  onClick={stopStreaming}
                  className="shrink-0 h-9 w-9 rounded-xl bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
                  aria-label="Stop response"
                >
                  <StopCircle className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => handleSend()}
                  disabled={!inputText.trim()}
                  className={cn(
                    'shrink-0 h-9 w-9 rounded-xl flex items-center justify-center transition-all',
                    inputText.trim()
                      ? 'bg-primary-800 text-white hover:bg-primary-900 shadow-sm'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  )}
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>

            <p className="text-[10px] text-muted-foreground text-center mt-2">
              WeightwAIse provides informational guidance only. Always consult a qualified surgeon.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
