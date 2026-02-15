'use client';

import { Mic, MicOff, Loader2 } from 'lucide-react';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

interface VoiceIndicatorProps {
  state: VoiceState;
  enabled: boolean;
  onToggle: () => void;
  transcript?: string;
  fullTranscript?: string;
}

export default function VoiceIndicator({ state, enabled, onToggle, transcript, fullTranscript }: VoiceIndicatorProps) {
  const stateConfig: Record<VoiceState, { color: string; label: string }> = {
    idle: { color: 'var(--color-text-muted)', label: 'VOICE' },
    listening: { color: 'var(--color-signal-teal)', label: 'LISTENING' },
    processing: { color: 'var(--color-signal-amber)', label: 'PROCESSING' },
    speaking: { color: 'var(--color-signal-blue)', label: 'SPEAKING' },
  };

  const { color, label } = stateConfig[state];
  const supported = true;

  // Test TTS directly
  const testTTS = async () => {
    console.log('🔊 Testing TTS...');
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Voice control is working' }),
      });
      console.log('TTS Response:', res.status);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play();
        console.log('✅ TTS working!');
      } else {
        const err = await res.text();
        console.error('❌ TTS failed:', err);
      }
    } catch (e) {
      console.error('❌ TTS error:', e);
    }
  };

  return (
    <div className="fixed bottom-12 right-4 z-50 flex flex-col items-end gap-2">
      {/* Full transcript - ALWAYS VISIBLE when enabled */}
      {enabled && (
        <div
          className="glass-panel rounded px-3 py-2 max-w-[300px]"
          style={{ borderColor: 'var(--color-signal-teal)' }}
        >
          <div className="text-[8px] tracking-wider text-[var(--color-text-muted)] mb-1">
            HEARING: {supported ? '(Mic Active)' : '(Not Supported)'}
          </div>
          <span className="text-[10px] text-[var(--color-text-primary)]">
            {fullTranscript || 'Waiting for speech...'}
          </span>
        </div>
      )}
      
      {/* Command transcript bubble */}
      {transcript && state !== 'idle' && (
        <div
          className="glass-panel rounded px-3 py-1.5 max-w-[300px]"
          style={{ borderColor: color }}
        >
          <span className="text-[9px] tracking-wider text-[var(--color-text-secondary)]">
            {transcript}
          </span>
        </div>
      )}

      {/* Mic button */}
      <div className="flex gap-2">
        <button
          onClick={testTTS}
          className="glass-panel rounded px-2 py-1 text-[8px] tracking-wider cursor-pointer"
          style={{ borderColor: 'var(--color-signal-blue)' }}
          title="Test ElevenLabs TTS"
        >
          TEST TTS
        </button>
        <button
          onClick={onToggle}
          className="glass-panel rounded-full w-10 h-10 flex items-center justify-center cursor-pointer transition-all duration-300"
          style={{
            borderColor: enabled ? color : 'var(--color-border)',
            boxShadow: state === 'listening' ? `0 0 12px ${color}40` : 'none',
          }}
          title={enabled ? `Voice: ${label} — say "Hey Deep"` : 'Enable voice control'}
        >
          {state === 'processing' ? (
            <Loader2 size={16} style={{ color }} className="animate-spin" />
          ) : enabled ? (
            <div className="relative">
              <Mic size={16} style={{ color }} />
              {state === 'listening' && (
                <div
                  className="absolute -inset-1 rounded-full"
                  style={{
                    border: `1.5px solid ${color}`,
                    animation: 'pulse-ring 1.5s ease-out infinite',
                  }}
                />
              )}
            </div>
          ) : (
            <MicOff size={16} style={{ color: 'var(--color-text-muted)' }} />
          )}
        </button>
      </div>

      {/* State label */}
      <span
        className="text-[8px] tracking-[0.2em] mr-1"
        style={{ color }}
      >
        {enabled ? label : 'OFF'}
      </span>
    </div>
  );
}
