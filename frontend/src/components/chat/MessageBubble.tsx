'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { ChatMessage, Citation } from '@/lib/types';
import { Volume2, Mic } from 'lucide-react';
import { CitationPopover } from './CitationPopover';

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onSpeak?: (text: string) => void;
  isVoiceInput?: boolean;
}

export function MessageBubble({ message, isStreaming = false, onSpeak, isVoiceInput }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const [activeCitation, setActiveCitation] = useState<{ citation: Citation; rect: DOMRect } | null>(null);

  const handleCitationClick = (e: React.MouseEvent, index: number) => {
    const citation = message.citations[index];
    if (citation) {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setActiveCitation({ citation, rect });
    }
  };

  // Replace citation markers [N] with clickable elements
  const renderContent = (content: string) => {
    const parts = content.split(/(\[\d+\])/g);

    return parts.map((part, i) => {
      const citationMatch = part.match(/\[(\d+)\]/);
      if (citationMatch) {
        const idx = parseInt(citationMatch[1]) - 1;
        if (idx >= 0 && idx < message.citations.length) {
          return (
            <button
              key={i}
              onClick={(e) => handleCitationClick(e, idx)}
              className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 mx-0.5 text-[10px] font-semibold text-primary-700 bg-primary-50 border border-primary-200/60 rounded hover:bg-primary-100 transition-colors align-super cursor-pointer"
              aria-label={`Citation ${idx + 1}`}
            >
              {idx + 1}
            </button>
          );
        }
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div
      className={cn(
        'flex gap-3 animate-fade-in',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Message Content */}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary-800 text-white'
            : 'bg-muted/60 text-foreground'
        )}
      >
        {/* Voice input indicator */}
        {isUser && isVoiceInput && (
          <div className="flex items-center gap-1 text-primary-200 text-xs mb-1">
            <Mic className="h-3 w-3" />
            <span>Voice input</span>
          </div>
        )}

        {/* Content */}
        {isAssistant ? (
          <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-li:my-0.5 prose-headings:my-2 prose-headings:text-foreground text-sm leading-relaxed">
            {message.citations.length > 0 ? (
              <div>{renderContent(message.content)}</div>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="my-1.5">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-4 my-1.5">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 my-1.5">{children}</ol>,
                  li: ({ children }) => <li className="my-0.5">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary-700 hover:underline">
                      {children}
                    </a>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-teal-500 animate-pulse ml-0.5 rounded-sm align-text-bottom" />
            )}
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        )}

        {/* Actions for assistant messages */}
        {isAssistant && !isStreaming && onSpeak && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/40">
            <button
              onClick={() => onSpeak(message.content)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-teal-600 transition-colors"
              aria-label="Read message aloud"
            >
              <Volume2 className="h-3 w-3" />
              <span>Listen</span>
            </button>
            {message.model_used && (
              <span className="text-[10px] text-muted-foreground/60 ml-auto">
                {message.model_used}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Citation Popover */}
      {activeCitation && (
        <CitationPopover
          citation={activeCitation.citation}
          anchorRect={activeCitation.rect}
          onClose={() => setActiveCitation(null)}
        />
      )}
    </div>
  );
}
