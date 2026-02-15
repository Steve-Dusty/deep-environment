'use client';

import { Mic } from 'lucide-react';

interface VoiceIndicatorProps {
  isListening: boolean;
  transcript?: string;
}

export default function VoiceIndicator({ isListening, transcript }: VoiceIndicatorProps) {
  if (!isListening && !transcript) return null;

  const color = isListening ? 'var(--color-signal-teal)' : 'var(--color-text-muted)';
  const label = isListening ? 'LISTENING' : 'IDLE';

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 pointer-events-auto">
      {/* Listening indicator */}
      {isListening && (
        <div
          className="glass-panel rounded px-3 py-2 max-w-[300px]"
          style={{ borderColor: color }}
        >
          <div className="text-[8px] tracking-wider text-[var(--color-text-muted)] mb-1">
            🎤 {label}
          </div>
          <span className="text-[10px] text-[var(--color-text-primary)]">
            {transcript || 'Listening...'}
          </span>
        </div>
      )}

      {/* Mic icon */}
      <div
        className="glass-panel rounded-full w-10 h-10 flex items-center justify-center"
        style={{
          borderColor: color,
          boxShadow: isListening ? `0 0 12px ${color}40` : 'none',
        }}
      >
        <Mic size={16} style={{ color }} />
      </div>
    </div>
  );
}
