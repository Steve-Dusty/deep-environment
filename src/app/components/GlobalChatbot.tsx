'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Send, X, FileText, Loader2, Sparkles, Bot, Download, ExternalLink } from 'lucide-react';
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

export interface PDFViewData {
  url: string;
  filename: string;
  messages: { role: 'user' | 'ai'; text: string }[];
}

interface GlobalChatbotProps {
  onOpenPDFView?: (data: PDFViewData) => void;
}

export default function GlobalChatbot({ onOpenPDFView }: GlobalChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      text: "Hello! I'm your Deep Environment AI assistant. I have access to all knowledge graphs across all locations. Ask me anything or request a PDF report.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfReady, setPdfReady] = useState<{ url: string; filename: string } | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const genIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom, generatingPDF, pdfReady]);

  // Cleanup progress interval
  useEffect(() => {
    return () => {
      if (genIntervalRef.current) clearInterval(genIntervalRef.current);
    };
  }, []);

  const handleSubmit = useCallback(async () => {
    const query = input.trim();
    if (!query || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: query, timestamp: new Date() }]);
    setLoading(true);

    try {
      const result = await queryGlobalKnowledgeGraph(query);

      if (result.generatePDF) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: result.answer,
            timestamp: new Date(),
            pdfData: {
              type: result.generatePDF!.type,
              locationId: result.generatePDF!.locationId,
              locationName: result.generatePDF!.locationName,
            },
          },
        ]);

        setGeneratingPDF(true);
        setGenProgress(0);

        // Animate progress bar
        genIntervalRef.current = setInterval(() => {
          setGenProgress((p) => {
            if (p >= 90) return p;
            return p + Math.random() * 12;
          });
        }, 200);

        try {
          const pdfBlob = await generateGlobalPDF(
            result.generatePDF.locationId,
            result.generatePDF.type,
          );

          if (genIntervalRef.current) clearInterval(genIntervalRef.current);
          setGenProgress(100);

          const pdfUrl = URL.createObjectURL(pdfBlob);
          const filename = `${result.generatePDF.type}-${result.generatePDF.locationId}-${Date.now()}.pdf`;

          // Brief pause at 100% before showing button
          setTimeout(() => {
            setGeneratingPDF(false);
            setGenProgress(0);
            setPdfReady({ url: pdfUrl, filename });
          }, 400);
        } catch (pdfError) {
          if (genIntervalRef.current) clearInterval(genIntervalRef.current);
          setGeneratingPDF(false);
          setGenProgress(0);
          setMessages((prev) => [
            ...prev,
            {
              role: 'ai',
              text: `Error generating PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`,
              timestamp: new Date(),
            },
          ]);
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

  const handleOpenPDFView = useCallback(() => {
    if (!pdfReady || !onOpenPDFView) return;
    onOpenPDFView({
      url: pdfReady.url,
      filename: pdfReady.filename,
      messages: messages.map((m) => ({ role: m.role, text: m.text })),
    });
  }, [pdfReady, onOpenPDFView, messages]);

  const handleDownloadPDF = useCallback(() => {
    if (!pdfReady) return;
    const a = document.createElement('a');
    a.href = pdfReady.url;
    a.download = pdfReady.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [pdfReady]);

  const handleDismissPDF = useCallback(() => {
    if (pdfReady?.url) URL.revokeObjectURL(pdfReady.url);
    setPdfReady(null);
  }, [pdfReady]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--color-signal-teal)] to-[#06b6d4] flex items-center justify-center">
            <Bot size={12} className="text-[var(--color-void)]" />
          </div>
          <div>
            <h3
              className="text-[10px] tracking-[0.15em] font-semibold text-[var(--color-text-primary)]"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              DEEP ENVIRONMENT AI
            </h3>
            <p className="text-[7px] text-[var(--color-text-muted)] flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-[var(--color-signal-teal)] data-live" />
              ALL KNOWLEDGE GRAPHS
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3 space-y-3"
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
            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'ai' && (
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[var(--color-signal-teal)] to-[#06b6d4] flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={10} className="text-[var(--color-void)]" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-lg px-2.5 py-2 ${
                msg.role === 'user'
                  ? 'bg-[rgba(15,245,196,0.1)] border border-[rgba(15,245,196,0.2)] text-[var(--color-text-primary)]'
                  : 'bg-[rgba(255,255,255,0.03)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]'
              }`}
            >
              <p className="text-[9px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              {msg.pdfData && (
                <div className="mt-1.5 pt-1.5 border-t border-[var(--color-border-subtle)]">
                  <div className="flex items-center gap-1.5">
                    <FileText size={9} className="text-[var(--color-signal-teal)]" />
                    <span className="text-[7px] text-[var(--color-text-muted)]">
                      {msg.pdfData.locationName} - {msg.pdfData.type.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-5 h-5 rounded-full bg-[rgba(15,245,196,0.15)] flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[7px] text-[var(--color-signal-teal)] font-semibold">U</span>
              </div>
            )}
          </div>
        ))}

        {loading && !generatingPDF && (
          <div className="flex gap-2 justify-start">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[var(--color-signal-teal)] to-[#06b6d4] flex items-center justify-center shrink-0 mt-0.5">
              <Bot size={10} className="text-[var(--color-void)]" />
            </div>
            <div className="bg-[rgba(255,255,255,0.03)] border border-[var(--color-border-subtle)] rounded-lg px-2.5 py-2">
              <div className="flex items-center gap-2">
                <div className="flex gap-1 items-center">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-[var(--color-signal-teal)]"
                      style={{
                        animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                        boxShadow: '0 0 6px rgba(15,245,196,0.5)',
                      }}
                    />
                  ))}
                </div>
                <span className="text-[8px] text-[var(--color-signal-teal)] tracking-wider">
                  ANALYZING...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ═══ PDF Generating — cool animated component ═══ */}
        {generatingPDF && (
          <div className="flex gap-2 justify-start">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[var(--color-signal-teal)] to-[#06b6d4] flex items-center justify-center shrink-0 mt-0.5">
              <FileText size={10} className="text-[var(--color-void)]" />
            </div>
            <div
              className="rounded-lg px-3 py-3 max-w-[85%]"
              style={{
                background: 'linear-gradient(135deg, rgba(15,245,196,0.06), rgba(6,182,212,0.04))',
                border: '1px solid rgba(15,245,196,0.2)',
                minWidth: 200,
              }}
            >
              {/* Spinner ring */}
              <div className="flex items-center gap-3 mb-2.5">
                <div
                  className="relative"
                  style={{ width: 28, height: 28 }}
                >
                  {/* Outer ring */}
                  <svg
                    viewBox="0 0 28 28"
                    className="absolute inset-0"
                    style={{ animation: 'spin 2s linear infinite' }}
                  >
                    <circle
                      cx="14" cy="14" r="12"
                      fill="none"
                      stroke="rgba(15,245,196,0.15)"
                      strokeWidth="2"
                    />
                    <circle
                      cx="14" cy="14" r="12"
                      fill="none"
                      stroke="#0ff5c4"
                      strokeWidth="2"
                      strokeDasharray="75.4"
                      strokeDashoffset={75.4 - (75.4 * Math.min(genProgress, 100)) / 100}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                    />
                  </svg>
                  {/* Inner dot */}
                  <div
                    className="absolute"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#0ff5c4',
                      boxShadow: '0 0 8px rgba(15,245,196,0.6)',
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }}
                  />
                </div>
                <div>
                  <div className="text-[8px] text-[var(--color-signal-teal)] tracking-[0.2em] font-semibold">
                    GENERATING PDF
                  </div>
                  <div className="text-[7px] text-[var(--color-text-muted)] tracking-wider mt-0.5">
                    {genProgress < 30 && 'Collecting data...'}
                    {genProgress >= 30 && genProgress < 60 && 'Building document...'}
                    {genProgress >= 60 && genProgress < 90 && 'Formatting report...'}
                    {genProgress >= 90 && 'Finalizing...'}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div
                style={{
                  height: 2,
                  borderRadius: 1,
                  background: 'rgba(15,245,196,0.1)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(genProgress, 100)}%`,
                    background: 'linear-gradient(90deg, #0ff5c4, #06b6d4)',
                    borderRadius: 1,
                    transition: 'width 0.3s ease',
                    boxShadow: '0 0 8px rgba(15,245,196,0.4)',
                  }}
                />
              </div>

              {/* Phase indicators */}
              <div className="flex items-center justify-between mt-2">
                {['DATA', 'BUILD', 'FORMAT', 'DONE'].map((phase, i) => (
                  <div key={phase} className="flex items-center gap-1">
                    <div
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: genProgress >= (i + 1) * 25 ? '#0ff5c4' : '#252838',
                        boxShadow: genProgress >= (i + 1) * 25 ? '0 0 4px rgba(15,245,196,0.5)' : 'none',
                        transition: 'all 0.3s ease',
                      }}
                    />
                    <span
                      className="text-[6px] tracking-wider"
                      style={{
                        color: genProgress >= (i + 1) * 25 ? '#0ff5c4' : '#555870',
                        transition: 'color 0.3s ease',
                      }}
                    >
                      {phase}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ PDF Ready — "Open PDF View" button ═══ */}
        {pdfReady && !generatingPDF && (
          <div className="flex gap-2 justify-start">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[var(--color-signal-teal)] to-[#06b6d4] flex items-center justify-center shrink-0 mt-0.5">
              <FileText size={10} className="text-[var(--color-void)]" />
            </div>
            <div
              className="rounded-lg px-3 py-2.5 max-w-[85%]"
              style={{
                background: 'linear-gradient(135deg, rgba(15,245,196,0.08), rgba(6,182,212,0.05))',
                border: '1px solid rgba(15,245,196,0.25)',
                minWidth: 200,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#0ff5c4',
                    boxShadow: '0 0 6px rgba(15,245,196,0.5)',
                  }}
                />
                <span className="text-[8px] text-[var(--color-signal-teal)] tracking-[0.2em] font-semibold">
                  PDF READY
                </span>
              </div>

              <div className="text-[7px] text-[var(--color-text-muted)] tracking-wider mb-2.5 truncate">
                {pdfReady.filename}
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={handleOpenPDFView}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[8px] font-semibold tracking-wider cursor-pointer transition-all hover:brightness-110 active:scale-[0.97]"
                  style={{
                    background: 'linear-gradient(135deg, rgba(15,245,196,0.2), rgba(6,182,212,0.15))',
                    border: '1px solid rgba(15,245,196,0.4)',
                    color: '#0ff5c4',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  <ExternalLink size={9} />
                  OPEN PDF VIEW
                </button>

                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-1 px-2 py-1.5 rounded text-[7px] font-semibold tracking-wider cursor-pointer transition-all hover:brightness-110"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid #252838',
                    color: '#8b8fa4',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  <Download size={8} />
                  SAVE
                </button>

                <button
                  onClick={handleDismissPDF}
                  className="flex items-center justify-center w-6 h-6 rounded cursor-pointer transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid #252838',
                    color: '#555870',
                  }}
                >
                  <X size={8} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 border-t border-[var(--color-border-subtle)] bg-[var(--color-abyss)]">
        <div className="flex items-end gap-1.5">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Ask anything or request a PDF..."
            className="flex-1 px-2.5 py-2 bg-[rgba(255,255,255,0.03)] border border-[var(--color-border-subtle)] rounded-lg text-[9px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] resize-none focus:outline-none focus:border-[var(--color-signal-teal)] focus:ring-1 focus:ring-[rgba(15,245,196,0.2)] transition-all"
            rows={1}
            style={{ minHeight: '32px', maxHeight: '80px' }}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-signal-teal)] to-[#06b6d4] flex items-center justify-center text-[var(--color-void)] disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all active:scale-95 cursor-pointer shrink-0"
          >
            {loading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Send size={12} />
            )}
          </button>
        </div>
        <p className="mt-1.5 text-[6px] text-[var(--color-text-muted)] text-center tracking-wider">
          ENTER TO SEND / SHIFT+ENTER NEW LINE / &quot;GENERATE PDF&quot; FOR EXPORTS
        </p>
      </div>
    </div>
  );
}
