'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type SpeechRecognitionState = 'idle' | 'listening' | 'recognizing';

interface UseSpeechRecognitionOptions {
  lang?: string;
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
  onstart: (() => void) | null;
  onaudiostart: (() => void) | null;
  onsoundstart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
  onsoundend: (() => void) | null;
  onaudioend: (() => void) | null;
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

type AudioState = 'silent' | 'detecting' | 'speaking';

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const {
    lang = 'zh-CN',
    maxDuration = 60000,
  } = options;

  const [state, setState] = useState<SpeechRecognitionState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>('silent');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalTranscriptRef = useRef('');
  const stateRef = useRef<SpeechRecognitionState>('idle');
  const isManuallyStoppedRef = useRef(false);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSpeechRef = useRef(false);

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
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    clearTimer();
    isManuallyStoppedRef.current = true;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore stop errors
      }
    }

    if (stateRef.current === 'listening') {
      setState('recognizing');
    }
  }, [clearTimer]);

  const createRecognition = useCallback(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      return null;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      hasSpeechRef.current = true;
      setAudioState('speaking');
      
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alternative = result[0];
        const text = alternative?.transcript || '';
        
        if (result.isFinal) {
          final += text;
        } else {
          interim += text;
        }
      }

      if (final) {
        finalTranscriptRef.current += final;
        setTranscript(finalTranscriptRef.current);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.log('[SpeechRecognition] error:', event.error);
      
      if (event.error === 'not-allowed') {
        setError('麦克风权限被拒绝，请在浏览器设置中允许访问麦克风');
        clearTimer();
        setState('idle');
        setAudioState('silent');
      } else if (event.error === 'audio-capture') {
        setError('无法访问麦克风，请检查设备连接');
        clearTimer();
        setState('idle');
        setAudioState('silent');
      } else if (event.error === 'no-speech') {
        setAudioState('silent');
      } else if (event.error === 'network') {
        setAudioState('silent');
      } else if (event.error === 'aborted') {
        // 正常中止，不处理
      } else {
        console.warn('Unhandled speech recognition error:', event.error);
      }
    };

    recognition.onend = () => {
      console.log('[SpeechRecognition] onend, state:', stateRef.current, 'isManuallyStopped:', isManuallyStoppedRef.current);
      
      if (isManuallyStoppedRef.current) {
        if (stateRef.current === 'recognizing') {
          const finalText = finalTranscriptRef.current || interimTranscript;
          if (finalText) {
            setTranscript(finalText);
          }
          setState('idle');
          setAudioState('silent');
        }
        return;
      }

      if (stateRef.current === 'listening') {
        setAudioState('detecting');
        
        restartTimeoutRef.current = setTimeout(() => {
          if (stateRef.current === 'listening' && !isManuallyStoppedRef.current) {
            startRecognitionInternal();
          }
        }, 100);
      }
    };

    recognition.onstart = () => {
      console.log('[SpeechRecognition] onstart');
      setAudioState('detecting');
    };

    recognition.onaudiostart = () => {
      console.log('[SpeechRecognition] onaudiostart');
      setAudioState('detecting');
    };

    recognition.onsoundstart = () => {
      console.log('[SpeechRecognition] onsoundstart');
      setAudioState('detecting');
    };

    recognition.onspeechstart = () => {
      console.log('[SpeechRecognition] onspeechstart');
      hasSpeechRef.current = true;
      setAudioState('speaking');
    };

    recognition.onspeechend = () => {
      console.log('[SpeechRecognition] onspeechend');
      setAudioState('detecting');
    };

    recognition.onsoundend = () => {
      console.log('[SpeechRecognition] onsoundend');
      setAudioState('silent');
    };

    recognition.onaudioend = () => {
      console.log('[SpeechRecognition] onaudioend');
      setAudioState('silent');
    };

    return recognition;
  }, [lang]);

  const startRecognitionInternal = useCallback(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setError('您的浏览器不支持语音识别功能');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore abort errors
        }
      }

      const recognition = createRecognition();
      if (!recognition) {
        return;
      }

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  }, [createRecognition]);

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setError('您的浏览器不支持语音识别功能');
      return;
    }

    if (stateRef.current === 'listening') {
      stopListening();
      return;
    }

    if (stateRef.current === 'recognizing') {
      return;
    }

    clearTimer();
    isManuallyStoppedRef.current = false;
    hasSpeechRef.current = false;
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';
    setState('listening');
    setAudioState('detecting');

    startRecognitionInternal();

    timerRef.current = setTimeout(() => {
      console.log('[SpeechRecognition] max duration reached, stopping');
      stopListening();
    }, maxDuration);
  }, [stopListening, startRecognitionInternal, clearTimer, maxDuration]);

  const reset = useCallback(() => {
    clearTimer();
    isManuallyStoppedRef.current = false;
    hasSpeechRef.current = false;
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    finalTranscriptRef.current = '';
    setAudioState('silent');
  }, [clearTimer]);

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
    audioState,
    isListening: state === 'listening',
    isRecognizing: state === 'recognizing',
    isSilent: audioState === 'silent',
    isDetecting: audioState === 'detecting',
    isSpeaking: audioState === 'speaking',
    startListening,
    stopListening,
    reset,
  };
}
