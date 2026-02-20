'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, X } from 'lucide-react';

interface ChatBoxProps {
  onCommand: (text: string) => void;
}

export default function ChatBox({ onCommand }: ChatBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const command = input.trim();
    setHistory(prev => [...prev, command]);
    onCommand(command);
    setInput('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="glass-panel rounded-full w-10 h-10 flex items-center justify-center cursor-pointer transition-all duration-300"
        style={{ borderColor: 'var(--color-border)' }}
        title="Open text chat"
      >
        <MessageSquare size={16} style={{ color: 'var(--color-text-muted)' }} />
      </button>
    );
  }

  return (
    <div className="glass-panel rounded p-3 w-[320px] flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} style={{ color: 'var(--color-accent)' }} />
          <span className="text-[8px] tracking-[0.2em] text-[var(--color-text-muted)]">
            TEXT COMMANDS
          </span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:opacity-70 transition-opacity"
        >
          <X size={14} style={{ color: 'var(--color-text-muted)' }} />
        </button>
      </div>

      {history.length > 0 && (
        <div className="flex flex-col gap-1 max-h-[120px] overflow-y-auto">
          {history.slice(-3).map((cmd, i) => (
            <div
              key={i}
              className="text-[9px] text-[var(--color-text-secondary)] px-2 py-1 rounded"
              style={{ backgroundColor: 'var(--color-void)' }}
            >
              {cmd}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a command..."
          className="flex-1 bg-transparent border-b text-[10px] text-[var(--color-text-primary)] px-1 py-1 outline-none placeholder-[var(--color-text-muted)]"
          style={{ borderColor: 'var(--color-border)' }}
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="flex items-center justify-center w-6 h-6 rounded hover:opacity-70 transition-opacity disabled:opacity-30"
          style={{ color: 'var(--color-accent)' }}
        >
          <Send size={12} />
        </button>
      </form>

      <div className="text-[7px] text-[var(--color-text-muted)] tracking-wider">
        Try: "show map", "go to Miami", "enable satellite"
      </div>
    </div>
  );
}
