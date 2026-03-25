'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Mic, MicOff, Square } from 'lucide-react';

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
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'relative rounded-full flex items-center justify-center transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        sizeStyles[size],
        isListening
          ? 'bg-red-500 text-white focus:ring-red-400 hover:bg-red-600'
          : 'bg-gray-100 text-medical-muted hover:bg-gray-200 focus:ring-primary-500',
        className
      )}
      aria-label={isListening ? 'Stop recording' : 'Start voice input'}
      title={isListening ? 'Stop recording' : 'Start voice input'}
    >
      {/* Recording animation rings */}
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-25" />
          <span className="absolute inset-[-4px] rounded-full border-2 border-red-300 animate-recording" />
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
