'use client';

import React, { useState } from 'react';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { SessionSidebar } from '@/components/chat/SessionSidebar';
import { useChat } from '@/hooks/useChat';

export default function ChatPage() {
  const {
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
    getOrCreateSession,
    switchSession,
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <SessionSidebar
        currentSessionId={sessionId}
        onSelectSession={switchSession}
        onNewSession={startSession}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <ChatWindow
          session={session ?? null}
          sessionId={sessionId}
          messages={messages}
          streamingMessage={streamingMessage}
          intakeProgress={intakeProgress}
          currentPhase={currentPhase}
          isStreaming={isStreaming}
          sendMessage={sendMessage}
          stopStreaming={stopStreaming}
          startSession={startSession}
          getOrCreateSession={getOrCreateSession}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
      </div>
    </>
  );
}
