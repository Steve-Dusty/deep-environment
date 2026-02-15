'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Send, X, FileText, Loader2, Sparkles, Bot, Download, Eye } from 'lucide-react';
import { locationSummaries, buildLocationGraph, type LocationGraph } from '../data/locationGraphs';
import { queryGlobalKnowledgeGraph, generateGlobalPDF } from '../data/globalAI';

interface Message {
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
  pdfData?: {
    type: 'location-report' | 'knowledge-graph';
    locationId: string;
    locationName: string;
  };
}

interface GlobalChatbotProps {
  onClose: () => void;
}

export default function GlobalChatbot({ onClose }: GlobalChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      text: 'Hello! I\'m your Deep Environment AI assistant. I have access to all knowledge graphs across all locations. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<{ url: string; filename: string } | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = useCallback(async () => {
    const query = input.trim();
    if (!query || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: query, timestamp: new Date() }]);
    setLoading(true);

    try {
      const result = await queryGlobalKnowledgeGraph(query);

      // Check if PDF generation was requested
      if (result.generatePDF) {
        setGeneratingPDF(true);
        try {
          const pdfBlob = await generateGlobalPDF(
            result.generatePDF.locationId,
            result.generatePDF.type
          );
          
          const pdfUrl = URL.createObjectURL(pdfBlob);
          setPdfPreview({
            url: pdfUrl,
            filename: `${result.generatePDF.type}-${result.generatePDF.locationId}-${Date.now()}.pdf`,
          });

          setMessages((prev) => [
            ...prev,
            {
              role: 'ai',
              text: result.answer + '\n\nPDF generated! Preview is available below.',
              timestamp: new Date(),
              pdfData: {
                type: result.generatePDF.type,
                locationId: result.generatePDF.locationId,
                locationName: result.generatePDF.locationName,
              },
            },
          ]);
        } catch (pdfError) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'ai',
              text: result.answer + `\n\nError generating PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`,
              timestamp: new Date(),
            },
          ]);
        } finally {
          setGeneratingPDF(false);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'ai', text: result.answer, timestamp: new Date() },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const handleDownloadPDF = useCallback(() => {
    if (!pdfPreview) return;
    const a = document.createElement('a');
    a.href = pdfPreview.url;
    a.download = pdfPreview.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [pdfPreview]);

  const handleClosePDF = useCallback(() => {
    if (pdfPreview?.url) {
      URL.revokeObjectURL(pdfPreview.url);
    }
    setPdfPreview(null);
  }, [pdfPreview]);

  return (
    <div className="w-full h-full flex flex-col bg-[var(--color-void)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-signal-teal)] to-[#06b6d4] flex items-center justify-center">
            <Bot size={16} className="text-[var(--color-void)]" />
          </div>
          <div>
            <h3 className="text-[11px] tracking-[0.15em] font-semibold text-[var(--color-text-primary)]">
              DEEP ENVIRONMENT AI
            </h3>
            <p className="text-[8px] text-[var(--color-text-muted)] flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-[var(--color-signal-teal)] data-live" />
              ACCESSING ALL KNOWLEDGE GRAPHS
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, rgba(15,245,196,0.03) 0%, transparent 50%),
            linear-gradient(180deg, var(--color-void) 0%, var(--color-abyss) 100%)
          `,
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'ai' && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--color-signal-teal)] to-[#06b6d4] flex items-center justify-center shrink-0 mt-1">
                <Bot size={12} className="text-[var(--color-void)]" />
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-lg px-3 py-2 ${
                msg.role === 'user'
                  ? 'bg-[rgba(15,245,196,0.1)] border border-[rgba(15,245,196,0.2)] text-[var(--color-text-primary)]'
                  : 'bg-[rgba(255,255,255,0.03)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]'
              }`}
            >
              <p className="text-[10px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              {msg.pdfData && (
                <div className="mt-2 pt-2 border-t border-[var(--color-border-subtle)]">
                  <div className="flex items-center gap-2">
                    <FileText size={10} className="text-[var(--color-signal-teal)]" />
                    <span className="text-[8px] text-[var(--color-text-muted)]">
                      {msg.pdfData.locationName} - {msg.pdfData.type.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-[rgba(15,245,196,0.15)] flex items-center justify-center shrink-0 mt-1">
                <span className="text-[8px] text-[var(--color-signal-teal)] font-semibold">U</span>
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--color-signal-teal)] to-[#06b6d4] flex items-center justify-center shrink-0 mt-1">
              <Bot size={12} className="text-[var(--color-void)]" />
            </div>
            <div className="bg-[rgba(255,255,255,0.03)] border border-[var(--color-border-subtle)] rounded-lg px-3 py-2">
              <LoadingAnimation />
            </div>
          </div>
        )}

        {generatingPDF && (
          <div className="flex gap-3 justify-start">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--color-signal-teal)] to-[#06b6d4] flex items-center justify-center shrink-0 mt-1">
              <FileText size={12} className="text-[var(--color-void)]" />
            </div>
            <div className="bg-[rgba(15,245,196,0.1)] border border-[rgba(15,245,196,0.2)] rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Loader2 size={12} className="text-[var(--color-signal-teal)] animate-spin" />
                <span className="text-[9px] text-[var(--color-signal-teal)] tracking-wider">
                  GENERATING PDF...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* PDF Preview */}
      {pdfPreview && (
        <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-abyss)]">
          <div className="px-4 py-2 flex items-center justify-between border-b border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2">
              <FileText size={12} className="text-[var(--color-signal-teal)]" />
              <span className="text-[9px] text-[var(--color-text-secondary)] truncate">
                {pdfPreview.filename}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleDownloadPDF}
                className="w-6 h-6 rounded flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-signal-teal)] hover:bg-[rgba(15,245,196,0.1)] transition-colors"
                title="Download"
              >
                <Download size={10} />
              </button>
              <button
                onClick={handleClosePDF}
                className="w-6 h-6 rounded flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                title="Close"
              >
                <X size={10} />
              </button>
            </div>
          </div>
          <div className="h-96 bg-[var(--color-void)]">
            <iframe
              src={pdfPreview.url}
              className="w-full h-full border-0"
              title="PDF Preview"
            />
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-abyss)]">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Ask about any location, problem, or request a PDF..."
              className="w-full px-3 py-2 pr-10 bg-[rgba(255,255,255,0.03)] border border-[var(--color-border-subtle)] rounded-lg text-[10px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] resize-none focus:outline-none focus:border-[var(--color-signal-teal)] focus:ring-1 focus:ring-[rgba(15,245,196,0.2)] transition-all"
              rows={1}
              style={{
                minHeight: '36px',
                maxHeight: '120px',
              }}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--color-signal-teal)] to-[#06b6d4] flex items-center justify-center text-[var(--color-void)] disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all active:scale-95"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
          </button>
        </div>
        <p className="mt-2 text-[7px] text-[var(--color-text-muted)] text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

// Cool loading animation component
function LoadingAnimation() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1.5 items-center">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-[var(--color-signal-teal)]"
            style={{
              animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
              boxShadow: `0 0 8px rgba(15, 245, 196, 0.5)`,
            }}
          />
        ))}
      </div>
      <div className="flex items-center gap-1">
        <Sparkles size={10} className="text-[var(--color-signal-teal)] animate-pulse" />
        <span className="text-[9px] text-[var(--color-signal-teal)] tracking-wider font-semibold">
          ANALYZING KNOWLEDGE GRAPHS...
        </span>
      </div>
    </div>
  );
}
