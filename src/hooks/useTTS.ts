'use client';

import { useCallback, useRef } from 'react';

export function useTTS() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isPlayingRef = useRef(false);

  const speak = useCallback(async (text: string) => {
    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;
    isPlayingRef.current = true;

    console.log('🔊 Fetching TTS for:', text);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('❌ TTS API error:', res.status, err);
        throw new Error('TTS request failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      console.log('▶️ Playing TTS audio...');

      return new Promise<void>((resolve) => {
        audio.onended = () => {
          console.log('✅ TTS playback finished');
          URL.revokeObjectURL(url);
          audioRef.current = null;
          isPlayingRef.current = false;
          resolve();
        };
        audio.onerror = (e) => {
          console.error('❌ Audio playback error:', e);
          URL.revokeObjectURL(url);
          audioRef.current = null;
          isPlayingRef.current = false;
          resolve();
        };
        audio.play().catch((e) => {
          console.error('❌ Audio play failed:', e);
          resolve();
        });
      });
    } catch (e) {
      console.error('❌ TTS error:', e);
      isPlayingRef.current = false;
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    isPlayingRef.current = false;
  }, []);

  return { speak, stop, isPlaying: isPlayingRef.current };
}
