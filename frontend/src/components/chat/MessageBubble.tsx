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

// Strip JSON wrapper if the LLM returned raw JSON instead of just response_text
function cleanContent(content: string): string {
  if (!content) return '';
  const trimmed = content.trim();
  // Check if the content is a JSON object with response_text
  if (trimmed.startsWith('{') && trimmed.includes('"response_text"')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.response_text) return parsed.response_text;
    } catch {
      // Try to extract response_text with regex as fallback
      const match = trimmed.match(/"response_text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (match) return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    }
  }
  // Also handle ```json wrapped responses
  if (trimmed.startsWith('```')) {
    const inner = trimmed.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    if (inner.startsWith('{') && inner.includes('"response_text"')) {
      try {
        const parsed = JSON.parse(inner);
        if (parsed.response_text) return parsed.response_text;
      } catch { /* fall through */ }
    }
  }
  return content;
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
          <div className="prose prose-sm max-w-none text-sm leading-relaxed prose-headings:text-foreground prose-headings:font-semibold prose-h1:text-base prose-h2:text-[15px] prose-h3:text-sm prose-p:my-1.5 prose-li:my-0.5 prose-strong:font-semibold prose-strong:text-foreground prose-table:my-2 prose-th:text-left prose-th:text-xs prose-th:font-semibold prose-td:text-xs">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="my-1.5">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 my-1.5">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 my-1.5">{children}</ol>,
                li: ({ children }) => <li className="my-0.5 leading-relaxed">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                h1: ({ children }) => <h2 className="text-base font-semibold mt-3 mb-1.5 text-foreground">{children}</h2>,
                h2: ({ children }) => <h3 className="text-[15px] font-semibold mt-3 mb-1.5 text-foreground">{children}</h3>,
                h3: ({ children }) => <h4 className="text-sm font-semibold mt-2 mb-1 text-foreground">{children}</h4>,
                table: ({ children }) => (
                  <div className="overflow-x-auto my-2 rounded-lg border border-border/60">
                    <table className="min-w-full text-xs">{children}</table>
                  </div>
                ),
                thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
                th: ({ children }) => <th className="px-3 py-1.5 text-left text-xs font-semibold text-foreground border-b border-border/60">{children}</th>,
                td: ({ children }) => <td className="px-3 py-1.5 text-xs border-b border-border/30">{children}</td>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-teal-400 pl-3 my-2 text-muted-foreground italic">{children}</blockquote>
                ),
                hr: () => <hr className="my-3 border-border/40" />,
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary-700 hover:underline">
                    {children}
                  </a>
                ),
                code: ({ children, className }) => {
                  const isInline = !className;
                  return isInline
                    ? <code className="bg-muted/80 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                    : <code className={className}>{children}</code>;
                },
              }}
            >
              {cleanContent(message.content)}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-teal-500 animate-pulse ml-0.5 rounded-sm align-text-bottom" />
            )}
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        )}

        {/* Model indicator for assistant messages */}
        {isAssistant && !isStreaming && message.model_used && message.model_used !== 'system' && (
          <div className="mt-2 pt-1.5 border-t border-border/30">
            <span className="text-[10px] text-muted-foreground/50">
              {message.model_used}
            </span>
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
