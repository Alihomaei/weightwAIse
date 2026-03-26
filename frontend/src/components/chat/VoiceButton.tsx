'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Mic, Square } from 'lucide-react';

interface VoiceButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function VoiceButton({
  isListening,
  isSupported,
  onToggle,
  size = 'md',
  className,
}: VoiceButtonProps) {
  if (!isSupported) return null;

  const sizeStyles = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
  };

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'relative rounded-xl flex items-center justify-center transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        sizeStyles[size],
        isListening
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
        className
      )}
      aria-label={isListening ? 'Stop recording' : 'Start voice input'}
      title={isListening ? 'Stop recording' : 'Start voice input'}
    >
      {/* Recording animation rings */}
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-xl bg-red-400 animate-ping opacity-20" />
          <span className="absolute inset-[-3px] rounded-xl border-2 border-red-300 animate-recording" />
        </>
      )}

      {/* Icon */}
      <span className="relative z-10">
        {isListening ? (
          <Square className={cn(iconSizes[size], 'fill-current')} />
        ) : (
          <Mic className={iconSizes[size]} />
        )}
      </span>
    </button>
  );
}
