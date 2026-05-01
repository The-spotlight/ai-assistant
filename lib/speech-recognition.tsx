'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type SpeechRecognitionState = 'idle' | 'listening' | 'recognizing';

interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxDuration?: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const {
    lang = 'zh-CN',
    continuous = false,
    interimResults = true,
    maxDuration = 60000,
  } = options;

  const [state, setState] = useState<SpeechRecognitionState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalTranscriptRef = useRef('');
  const stateRef = useRef<SpeechRecognitionState>('idle');

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      setIsSupported(true);
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    clearTimer();
    
    if (recognitionRef.current && state === 'listening') {
      setState('recognizing');
      recognitionRef.current.stop();
    }
  }, [state, clearTimer]);

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setError('您的浏览器不支持语音识别功能');
      return;
    }

    if (state === 'listening' || state === 'recognizing') {
      stopListening();
      return;
    }

    setError(null);
    setTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';
    setState('listening');

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alternative = result[0];
        const transcript = alternative?.transcript || '';
        const isFinal = result.isFinal;
        if (isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (final) {
        finalTranscriptRef.current += final;
        setTranscript(finalTranscriptRef.current);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'no-speech') {
        setError('没有检测到语音，请重试');
      } else if (event.error === 'audio-capture') {
        setError('无法访问麦克风，请检查权限设置');
      } else if (event.error === 'not-allowed') {
        setError('麦克风权限被拒绝，请在浏览器设置中允许访问麦克风');
      } else {
        setError(`语音识别出错: ${event.error}`);
      }
      
      clearTimer();
      setState('idle');
    };

    recognition.onend = () => {
      clearTimer();
      
      if (stateRef.current === 'recognizing') {
        const finalText = finalTranscriptRef.current || interimTranscript;
        if (finalText) {
          setTranscript(finalText);
        }
        setState('idle');
      }
    };

    recognitionRef.current = recognition;
    recognition.start();

    timerRef.current = setTimeout(() => {
      stopListening();
    }, maxDuration);

    return () => {
      clearTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore stop errors
        }
      }
    };
  }, [lang, continuous, interimResults, maxDuration, state, stopListening, clearTimer]);

  const reset = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    finalTranscriptRef.current = '';
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore abort errors
        }
      }
    };
  }, [clearTimer]);

  return {
    isSupported,
    state,
    transcript,
    interimTranscript,
    error,
    isListening: state === 'listening',
    isRecognizing: state === 'recognizing',
    startListening,
    stopListening,
    reset,
  };
}
