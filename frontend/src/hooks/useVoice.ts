'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  createSpeechRecognition,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  speak,
  stopSpeaking,
  cleanTextForSpeech,
} from '@/lib/voice';
import { useLanguageStore, useToastStore } from '@/lib/store';
import { Language } from '@/lib/types';

interface SpeechRecognitionInstance {
  start(): void;
  stop(): void;
  abort(): void;
}

export function useVoice() {
  const language = useLanguageStore((s) => s.language);
  const addToast = useToastStore((s) => s.addToast);

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [sttSupported, setSttSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    setSttSupported(isSpeechRecognitionSupported());
    setTtsSupported(isSpeechSynthesisSupported());
  }, []);

  // Start voice recording
  const startListening = useCallback(() => {
    if (isListening || !sttSupported) return;

    // Stop any ongoing speech synthesis
    stopSpeaking();

    setInterimText('');
    setFinalText('');

    const recognition = createSpeechRecognition(language, {
      onResult: (transcript: string, isFinal: boolean) => {
        if (isFinal) {
          setFinalText((prev) => (prev ? prev + ' ' + transcript : transcript));
          setInterimText('');
        } else {
          setInterimText(transcript);
        }
      },
      onError: (error: string) => {
        addToast('error', error);
        setIsListening(false);
      },
      onStart: () => {
        setIsListening(true);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (recognition) {
      recognitionRef.current = recognition;
      recognition.start();
    }
  }, [isListening, sttSupported, language, addToast]);

  // Stop voice recording
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  // Toggle voice recording
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Text-to-speech
  const speakText = useCallback(
    (text: string) => {
      if (!ttsSupported) {
        addToast('info', 'Text-to-speech is not supported in this browser.');
        return;
      }

      const cleanText = cleanTextForSpeech(text);
      setIsSpeaking(true);

      speak(cleanText, language, () => {
        setIsSpeaking(false);
      });
    },
    [ttsSupported, language, addToast]
  );

  // Stop TTS
  const stopSpeech = useCallback(() => {
    stopSpeaking();
    setIsSpeaking(false);
  }, []);

  // Get the current transcript (final + interim)
  const currentTranscript = finalText + (interimText ? ' ' + interimText : '');

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setFinalText('');
    setInterimText('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      stopSpeaking();
    };
  }, []);

  return {
    isListening,
    isSpeaking,
    interimText,
    finalText,
    currentTranscript,
    sttSupported,
    ttsSupported,
    startListening,
    stopListening,
    toggleListening,
    speakText,
    stopSpeech,
    resetTranscript,
  };
}
