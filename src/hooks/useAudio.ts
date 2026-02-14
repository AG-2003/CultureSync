import { useState, useCallback, useRef } from 'react';
import { initAudioSession } from '@/lib/api';
import { LiveAudioSession } from '@/lib/gemini-live';
import { startMicCapture, playPcmAudio, stopPlayback } from '@/lib/audio-utils';
import { log } from '@/lib/logger';

export type AudioDirection = 'outgoing' | 'incoming';

export interface AudioMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export function useAudio() {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState<AudioMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const liveSessionRef = useRef<LiveAudioSession | null>(null);
  const micCleanupRef = useRef<(() => void) | null>(null);
  const msgCounterRef = useRef(0);

  const lastDirectionRef = useRef<'input' | 'output' | null>(null);
  const currentMsgIdRef = useRef<string | null>(null);
  const bufferRef = useRef('');

  const cleanup = useCallback(() => {
    log.debug('[useAudio] cleanup()');
    if (micCleanupRef.current) {
      micCleanupRef.current();
      micCleanupRef.current = null;
    }
    if (liveSessionRef.current) {
      liveSessionRef.current.disconnect();
      liveSessionRef.current = null;
    }
    stopPlayback();
    lastDirectionRef.current = null;
    currentMsgIdRef.current = null;
    bufferRef.current = '';
  }, []);

  const handleTranscription = useCallback((text: string, isInput: boolean) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const direction = isInput ? 'input' : 'output';

    if (direction !== lastDirectionRef.current) {
      lastDirectionRef.current = direction;
      bufferRef.current = '';
      currentMsgIdRef.current = null;
    }

    if (!currentMsgIdRef.current) {
      msgCounterRef.current++;
      const id = `audio-${direction}-${msgCounterRef.current}`;
      currentMsgIdRef.current = id;
      bufferRef.current = trimmed;

      setMessages((prev) => [
        ...prev,
        {
          id,
          type: isInput ? 'user' : 'ai',
          content: trimmed,
          timestamp: new Date(),
        },
      ]);
    } else {
      bufferRef.current += ' ' + trimmed;
      const id = currentMsgIdRef.current;
      const accumulated = bufferRef.current;

      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, content: accumulated } : m))
      );
    }
  }, []);

  const stopSession = useCallback(() => {
    log.info('[useAudio] Stopping session');
    cleanup();
    setIsActive(false);
  }, [cleanup]);

  const startSession = useCallback(
    async (city: string, targetLanguage: string, direction: AudioDirection) => {
      log.info(`[useAudio] Starting session (city=${city}, lang=${targetLanguage}, dir=${direction})`);
      setIsConnecting(true);
      setError(null);

      try {
        // Step 1: Get ephemeral token
        log.debug('[useAudio] Fetching ephemeral token...');
        const { token } = await initAudioSession({ city, targetLanguage, direction });

        if (!token) {
          throw new Error('No token returned. Check GEMINI_API_KEY in .env.local');
        }
        log.debug('[useAudio] Ephemeral token received');

        // Step 2: Create & connect Gemini Live session
        const liveSession = new LiveAudioSession(
          token,
          (audioData) => playPcmAudio(audioData),
          handleTranscription,
          () => {
            log.warn('[useAudio] Session disconnected by server');
            if (micCleanupRef.current) {
              micCleanupRef.current();
              micCleanupRef.current = null;
            }
            stopPlayback();
            liveSessionRef.current = null;
            setIsActive(false);
          }
        );

        await liveSession.connect(city, targetLanguage);
        liveSessionRef.current = liveSession;

        // Step 3: Start mic capture
        const micStop = await startMicCapture((pcmData) => {
          liveSession.sendAudio(pcmData);
        });
        micCleanupRef.current = micStop;

        setIsActive(true);
        setIsConnecting(false);
        log.info('[useAudio] Session active — speak now');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to start audio session';
        log.error('[useAudio] Failed:', err);
        setError(errorMessage);
        cleanup();
        setIsActive(false);
        setIsConnecting(false);
      }
    },
    [handleTranscription, cleanup]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    msgCounterRef.current = 0;
  }, []);

  return {
    isActive,
    isConnecting,
    messages,
    setMessages,
    error,
    startSession,
    stopSession,
    clearMessages,
  };
}
