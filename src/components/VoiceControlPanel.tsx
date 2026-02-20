'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

interface VoiceControlPanelProps {
  state: VoiceState;
  enabled: boolean;
  onToggle: () => void;
  transcript?: string;
  fullTranscript?: string;
  lastCommand?: string;
  lastAction?: string;
  lastResponse?: string;
  isTestMode?: boolean;
}

export default function VoiceControlPanel({
  state,
  enabled,
  onToggle,
  transcript,
  fullTranscript,
  lastCommand,
  lastAction,
  lastResponse,
  isTestMode = false,
}: VoiceControlPanelProps) {
  const [testLog, setTestLog] = useState<Array<{
    type: 'detection' | 'command' | 'action' | 'response' | 'error';
    message: string;
    timestamp: number;
  }>>([]);

  const stateConfig: Record<VoiceState, { color: string; label: string; icon: any }> = {
    idle: { color: 'var(--color-text-muted)', label: 'READY', icon: MicOff },
    listening: { color: 'var(--color-accent)', label: 'LISTENING', icon: Mic },
    processing: { color: 'var(--color-signal-amber)', label: 'PROCESSING', icon: Loader2 },
    speaking: { color: 'var(--color-signal-blue)', label: 'RESPONDING', icon: CheckCircle },
  };

  const { color, label, icon: StateIcon } = stateConfig[state];

  // Log test events
  useEffect(() => {
    if (!isTestMode) return;

    if (fullTranscript && state === 'listening') {
      setTestLog(prev => [...prev, {
        type: 'detection',
        message: `🎤 Detected: "${fullTranscript}"`,
        timestamp: Date.now(),
      }].slice(-10));
    }
  }, [fullTranscript, state, isTestMode]);

  useEffect(() => {
    if (!isTestMode) return;

    if (lastCommand) {
      setTestLog(prev => [...prev, {
        type: 'command',
        message: `📝 Command: "${lastCommand}"`,
        timestamp: Date.now(),
      }].slice(-10));
    }
  }, [lastCommand, isTestMode]);

  useEffect(() => {
    if (!isTestMode) return;

    if (lastAction) {
      setTestLog(prev => [...prev, {
        type: 'action',
        message: `⚡ Action: ${lastAction}`,
        timestamp: Date.now(),
      }].slice(-10));
    }
  }, [lastAction, isTestMode]);

  useEffect(() => {
    if (!isTestMode) return;

    if (lastResponse) {
      setTestLog(prev => [...prev, {
        type: 'response',
        message: `💬 Response: "${lastResponse}"`,
        timestamp: Date.now(),
      }].slice(-10));
    }
  }, [lastResponse, isTestMode]);

  return (
    <div className="flex flex-col items-end gap-2 max-w-[400px]">
      {/* Test Mode Panel */}
      {isTestMode && (
        <div
          className="glass-panel rounded p-3 w-full"
          style={{ borderColor: 'var(--color-signal-amber)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={12} style={{ color: 'var(--color-signal-amber)' }} />
            <span className="text-[8px] tracking-wider text-[var(--color-signal-amber)]">
              TEST MODE ACTIVE
            </span>
          </div>
          <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
            {testLog.map((log, i) => (
              <div
                key={i}
                className="text-[8px] text-[var(--color-text-primary)] px-2 py-1 rounded"
                style={{
                  backgroundColor: 'var(--color-void)',
                  borderLeft: `2px solid ${
                    log.type === 'error' ? 'var(--color-signal-red)' :
                    log.type === 'response' ? 'var(--color-signal-blue)' :
                    log.type === 'action' ? 'var(--color-accent)' :
                    log.type === 'command' ? 'var(--color-signal-amber)' :
                    'var(--color-border)'
                  }`,
                }}
              >
                {log.message}
              </div>
            ))}
            {testLog.length === 0 && (
              <div className="text-[8px] text-[var(--color-text-muted)] italic">
                Waiting for voice input...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Panel - Shows current state */}
      {enabled && (
        <div
          className="glass-panel rounded p-3 w-full"
          style={{ borderColor: color }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                {state === 'processing' ? (
                  <Loader2 size={14} style={{ color }} className="animate-spin" />
                ) : (
                  <StateIcon size={14} style={{ color }} />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] tracking-[0.2em]" style={{ color }}>
                  {label}
                </span>
                <span className="text-[6px] text-[var(--color-accent)]">
                  ● CONTINUOUS MODE
                </span>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="text-[7px] tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              DISABLE
            </button>
          </div>

          {/* Live Transcript */}
          <div className="space-y-2">
            <div>
              <div className="text-[7px] tracking-wider text-[var(--color-text-muted)] mb-1">
                HEARING:
              </div>
              <div
                className="text-[10px] text-[var(--color-text-primary)] min-h-[20px] px-2 py-1 rounded"
                style={{ backgroundColor: 'var(--color-void)' }}
              >
                {fullTranscript || (state === 'speaking' ? '🔊 Speaking response...' : '👂 Say "Hey Deep" + command...')}
              </div>
            </div>

            {/* Command Recognition */}
            {transcript && state !== 'idle' && (
              <div>
                <div className="text-[7px] tracking-wider text-[var(--color-text-muted)] mb-1">
                  COMMAND:
                </div>
                <div
                  className="text-[9px] text-[var(--color-accent)] px-2 py-1 rounded"
                  style={{ backgroundColor: 'var(--color-void)' }}
                >
                  {transcript}
                </div>
              </div>
            )}

            {/* Last Action */}
            {lastAction && (
              <div>
                <div className="text-[7px] tracking-wider text-[var(--color-text-muted)] mb-1">
                  ACTION:
                </div>
                <div
                  className="text-[9px] text-[var(--color-signal-amber)] px-2 py-1 rounded flex items-center gap-1"
                  style={{ backgroundColor: 'var(--color-void)' }}
                >
                  <CheckCircle size={10} />
                  {lastAction}
                </div>
              </div>
            )}

            {/* Response */}
            {lastResponse && (
              <div>
                <div className="text-[7px] tracking-wider text-[var(--color-text-muted)] mb-1">
                  RESPONSE:
                </div>
                <div
                  className="text-[8px] text-[var(--color-text-secondary)] px-2 py-1 rounded"
                  style={{ backgroundColor: 'var(--color-void)' }}
                >
                  {lastResponse}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mic Toggle Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          className="glass-panel rounded-full w-12 h-12 flex items-center justify-center cursor-pointer transition-all duration-300"
          style={{
            borderColor: enabled ? color : 'var(--color-border)',
            boxShadow: state === 'listening' ? `0 0 16px ${color}60` : 'none',
          }}
          title={enabled ? `Voice Active: ${label}` : 'Enable voice control'}
        >
          {enabled ? (
            state === 'processing' ? (
              <Loader2 size={18} style={{ color }} className="animate-spin" />
            ) : (
              <div className="relative">
                <Mic size={18} style={{ color }} />
                {state === 'listening' && (
                  <>
                    <div
                      className="absolute -inset-1 rounded-full"
                      style={{
                        border: `2px solid ${color}`,
                        animation: 'pulse-ring 1.5s ease-out infinite',
                      }}
                    />
                    <div
                      className="absolute -inset-2 rounded-full"
                      style={{
                        border: `1px solid ${color}40`,
                        animation: 'pulse-ring 1.5s ease-out 0.3s infinite',
                      }}
                    />
                  </>
                )}
              </div>
            )
          ) : (
            <MicOff size={18} style={{ color: 'var(--color-text-muted)' }} />
          )}
        </button>
        <div className="flex flex-col items-start">
          <span className="text-[8px] tracking-[0.2em]" style={{ color }}>
            {enabled ? label : 'OFF'}
          </span>
          {enabled && (
            <span className="text-[7px] text-[var(--color-text-muted)]">
              Say "Hey Deep"
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
