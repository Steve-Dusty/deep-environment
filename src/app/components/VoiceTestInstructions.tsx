'use client';

import { useState } from 'react';
import { TestTube, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

export default function VoiceTestInstructions() {
  const [isExpanded, setIsExpanded] = useState(true);

  const tests = [
    {
      step: 1,
      title: 'Enable Voice Control',
      instruction: 'Click the microphone button in the bottom-right corner',
      expected: 'Mic button turns teal, "HEARING" panel appears',
    },
    {
      step: 2,
      title: 'Test Voice Detection',
      instruction: 'Say anything (e.g., "hello testing")',
      expected: 'Your words appear in the "HEARING" section in real-time',
    },
    {
      step: 3,
      title: 'Test Wake Word',
      instruction: 'Say "Hey Deep"',
      expected: 'Status changes to "LISTENING", test log shows "🎤 Detected: hey deep"',
    },
    {
      step: 4,
      title: 'Test Command',
      instruction: 'After "Hey Deep", say a command (e.g., "show knowledge graph")',
      expected: 'Test log shows: Detection → Command → Action → Response',
    },
    {
      step: 5,
      title: 'Verify Action',
      instruction: 'Check that the action was performed (e.g., knowledge graph opened)',
      expected: 'UI changes to match the command',
    },
  ];

  const exampleCommands = [
    '"Hey Deep, enable satellite"',
    '"Hey Deep, show knowledge graph"',
    '"Hey Deep, go to Miami"',
    '"Hey Deep, status report"',
    '"Hey Deep, zoom in"',
    '"Hey Deep, help"',
  ];

  return (
    <div
      className="fixed top-20 left-4 z-50 glass-panel rounded p-3 max-w-[350px]"
      style={{ borderColor: 'var(--color-signal-amber)' }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-2"
      >
        <div className="flex items-center gap-2">
          <TestTube size={14} style={{ color: 'var(--color-signal-amber)' }} />
          <span className="text-[9px] tracking-wider text-[var(--color-signal-amber)]">
            VOICE CONTROL TEST MODE
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp size={12} style={{ color: 'var(--color-text-muted)' }} />
        ) : (
          <ChevronDown size={12} style={{ color: 'var(--color-text-muted)' }} />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-3">
          {/* Test Steps */}
          <div>
            <div className="text-[7px] tracking-wider text-[var(--color-text-muted)] mb-2">
              TEST STEPS:
            </div>
            <div className="space-y-2">
              {tests.map((test) => (
                <div
                  key={test.step}
                  className="p-2 rounded"
                  style={{ backgroundColor: 'var(--color-void)' }}
                >
                  <div className="flex items-start gap-2 mb-1">
                    <div
                      className="min-w-[16px] h-[16px] rounded-full flex items-center justify-center text-[8px] font-bold"
                      style={{
                        backgroundColor: 'var(--color-signal-amber)20',
                        color: 'var(--color-signal-amber)',
                      }}
                    >
                      {test.step}
                    </div>
                    <div className="flex-1">
                      <div className="text-[8px] font-semibold text-[var(--color-text-primary)] mb-0.5">
                        {test.title}
                      </div>
                      <div className="text-[7px] text-[var(--color-text-secondary)]">
                        {test.instruction}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-1 ml-6">
                    <CheckCircle size={8} style={{ color: 'var(--color-signal-teal)', marginTop: '2px' }} />
                    <div className="text-[7px] italic text-[var(--color-signal-teal)]">
                      {test.expected}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Example Commands */}
          <div>
            <div className="text-[7px] tracking-wider text-[var(--color-text-muted)] mb-1.5">
              EXAMPLE COMMANDS:
            </div>
            <div className="space-y-0.5">
              {exampleCommands.map((cmd, i) => (
                <div
                  key={i}
                  className="text-[7px] text-[var(--color-text-primary)] px-2 py-1 rounded"
                  style={{ backgroundColor: 'var(--color-void)' }}
                >
                  {cmd}
                </div>
              ))}
            </div>
          </div>

          {/* Status Indicators */}
          <div>
            <div className="text-[7px] tracking-wider text-[var(--color-text-muted)] mb-1.5">
              STATUS COLORS:
            </div>
            <div className="grid grid-cols-2 gap-1">
              <div className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'var(--color-signal-teal)' }}
                />
                <span className="text-[7px] text-[var(--color-text-secondary)]">Listening</span>
              </div>
              <div className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'var(--color-signal-amber)' }}
                />
                <span className="text-[7px] text-[var(--color-text-secondary)]">Processing</span>
              </div>
              <div className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'var(--color-signal-blue)' }}
                />
                <span className="text-[7px] text-[var(--color-text-secondary)]">Speaking</span>
              </div>
              <div className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'var(--color-text-muted)' }}
                />
                <span className="text-[7px] text-[var(--color-text-secondary)]">Idle/Off</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
