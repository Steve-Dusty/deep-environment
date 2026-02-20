'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Bot, Send, FileText, Loader2, Download, ExternalLink, X, ArrowLeft } from 'lucide-react';
import { queryGlobalKnowledgeGraph, generateGlobalPDF } from '@/data/globalAI';

export interface PDFViewData {
  url: string;
  filename: string;
  messages: { role: 'user' | 'ai'; text: string }[];
}

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

interface ChatViewProps {
  onClose: () => void;
  onOpenPDFView: (data: PDFViewData) => void;
}

export default function ChatView({ onClose, onOpenPDFView }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      text: "I'm your Deep Environment AI. I have real-time access to all knowledge graphs across every monitoring location.\n\nAsk me anything — environmental threats, cross-location patterns, severity analysis — or request a PDF report for any location.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfReady, setPdfReady] = useState<{ url: string; filename: string } | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const genIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, generatingPDF, pdfReady]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => { if (genIntervalRef.current) clearInterval(genIntervalRef.current); };
  }, []);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

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
        genIntervalRef.current = setInterval(() => {
          setGenProgress((p) => (p >= 90 ? p : p + Math.random() * 12));
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
            { role: 'ai', text: `Error generating PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown'}`, timestamp: new Date() },
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
        { role: 'ai', text: `Error: ${error instanceof Error ? error.message : 'Unknown'}`, timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const handleOpenPDF = useCallback(() => {
    if (!pdfReady) return;
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
    <div style={S.container}>
      {/* Background atmosphere */}
      <div style={S.bgGrad} />

      {/* ── Header ── */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <button onClick={onClose} style={{ ...S.btn, marginRight: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <ArrowLeft size={9} /> DASHBOARD
          </button>
          <div style={S.dot} />
          <span style={S.title}>DEEP ENVIRONMENT</span>
          <span style={S.headerLabel}>AI ASSISTANT</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={S.sub}>
            MODEL <span style={{ color: '#00d4ff' }}>MiniMax 2.1</span>
          </span>
          <span style={S.sub}>
            MESSAGES <span style={{ color: 'rgba(255,255,255,0.55)' }}>{messages.length}</span>
          </span>
        </div>
      </div>

      {/* ── Chat area ── */}
      <div style={S.chatScroll}>
        <div style={S.chatColumn}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                ...S.msgRow,
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                animationDelay: `${Math.min(idx * 0.05, 0.3)}s`,
              }}
              className="cv-msg-in"
            >
              {msg.role === 'ai' && <div style={S.aiAvatar}><Bot size={13} color="#0a0e1a" /></div>}

              <div style={{
                ...S.bubble,
                ...(msg.role === 'user' ? S.userBubble : S.aiBubble),
              }}>
                <div style={S.bubbleMeta}>
                  {msg.role === 'user' ? 'YOU' : 'DEEP ENVIRONMENT AI'}
                  <span style={{ marginLeft: 8, color: '#3a3d4e' }}>
                    {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </span>
                </div>
                <div style={S.bubbleText}>{msg.text}</div>
                {msg.pdfData && (
                  <div style={S.pdfTag}>
                    <FileText size={9} color="#00d4ff" />
                    <span>{msg.pdfData.locationName} — {msg.pdfData.type.replace('-', ' ')}</span>
                  </div>
                )}
              </div>

              {msg.role === 'user' && <div style={S.userAvatar}>U</div>}
            </div>
          ))}

          {/* Loading */}
          {loading && !generatingPDF && (
            <div style={{ ...S.msgRow, justifyContent: 'flex-start' }} className="cv-msg-in">
              <div style={S.aiAvatar}><Bot size={13} color="#0a0e1a" /></div>
              <div style={{ ...S.bubble, ...S.aiBubble, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: 5, height: 5, borderRadius: '50%', background: '#00d4ff',
                        animation: `cvPulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                        boxShadow: '0 0 6px rgba(0,212,255,0.5)',
                      }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: 10, color: '#00d4ff', letterSpacing: 2 }}>ANALYZING</span>
              </div>
            </div>
          )}

          {/* PDF Generating */}
          {generatingPDF && (
            <div style={{ ...S.msgRow, justifyContent: 'flex-start' }} className="cv-msg-in">
              <div style={S.aiAvatar}><FileText size={13} color="#0a0e1a" /></div>
              <div style={S.genCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{ position: 'relative', width: 36, height: 36 }}>
                    <svg viewBox="0 0 36 36" style={{ position: 'absolute', inset: 0, animation: 'cvSpin 2s linear infinite' }}>
                      <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(0,212,255,0.12)" strokeWidth="2.5" />
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#00d4ff" strokeWidth="2.5"
                        strokeDasharray="94.2" strokeDashoffset={94.2 - (94.2 * Math.min(genProgress, 100)) / 100}
                        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                      />
                    </svg>
                    <div style={{
                      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                      width: 8, height: 8, borderRadius: '50%', background: '#00d4ff',
                      boxShadow: '0 0 10px rgba(0,212,255,0.6)', animation: 'cvPulse 1.5s ease-in-out infinite',
                    }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#00d4ff', letterSpacing: 2.5, fontWeight: 600 }}>GENERATING PDF</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, marginTop: 2 }}>
                      {genProgress < 30 ? 'Collecting data...' : genProgress < 60 ? 'Building document...' : genProgress < 90 ? 'Formatting report...' : 'Finalizing...'}
                    </div>
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{ height: 3, borderRadius: 2, background: 'rgba(0,212,255,0.08)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${Math.min(genProgress, 100)}%`, borderRadius: 2,
                    background: 'linear-gradient(90deg, #00d4ff, #06b6d4)',
                    transition: 'width 0.3s ease', boxShadow: '0 0 10px rgba(0,212,255,0.4)',
                  }} />
                </div>
                {/* Phases */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  {['DATA', 'BUILD', 'FORMAT', 'DONE'].map((ph, i) => (
                    <div key={ph} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: genProgress >= (i + 1) * 25 ? '#00d4ff' : '#1e2a42',
                        boxShadow: genProgress >= (i + 1) * 25 ? '0 0 5px rgba(0,212,255,0.5)' : 'none',
                        transition: 'all 0.3s',
                      }} />
                      <span style={{
                        fontSize: 7, letterSpacing: 1.5, fontWeight: 600,
                        color: genProgress >= (i + 1) * 25 ? '#00d4ff' : 'rgba(255,255,255,0.4)',
                        transition: 'color 0.3s',
                      }}>{ph}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PDF Ready */}
          {pdfReady && !generatingPDF && (
            <div style={{ ...S.msgRow, justifyContent: 'flex-start' }} className="cv-msg-in">
              <div style={S.aiAvatar}><FileText size={13} color="#0a0e1a" /></div>
              <div style={S.pdfReadyCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%', background: '#00d4ff',
                    boxShadow: '0 0 8px rgba(0,212,255,0.5)',
                  }} />
                  <span style={{ fontSize: 10, color: '#00d4ff', letterSpacing: 2.5, fontWeight: 600 }}>PDF READY</span>
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pdfReady.filename}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={handleOpenPDF} style={S.pdfBtn}>
                    <ExternalLink size={10} /> OPEN PDF VIEW
                  </button>
                  <button onClick={handleDownloadPDF} style={S.pdfBtnSecondary}>
                    <Download size={9} /> SAVE
                  </button>
                  <button onClick={handleDismissPDF} style={S.pdfBtnDismiss}>
                    <X size={9} />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input bar ── */}
      <div style={S.inputBar}>
        <div style={S.inputInner}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Ask about environmental threats, request a report..."
            style={S.textarea}
            rows={1}
            disabled={loading}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || loading}
            style={{
              ...S.sendBtn,
              opacity: !input.trim() || loading ? 0.4 : 1,
              cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? <Loader2 size={14} style={{ animation: 'cvSpin 1s linear infinite' }} /> : <Send size={14} />}
          </button>
        </div>
        <div style={S.inputHint}>
          ENTER TO SEND · SHIFT+ENTER NEW LINE
        </div>
      </div>

      {/* ── Status bar ── */}
      <div style={S.statusBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#00d4ff' }}>●</span>
          <span>DEEP ENVIRONMENT AI ENGINE</span>
          <span style={{ color: '#1e2a42' }}>|</span>
          <span>SESSION <span style={{ color: 'rgba(255,255,255,0.55)' }}>{fmt(elapsed)}</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>MiniMax 2.1 · Bedrock · function calling · PDFKit</span>
          <span style={{ color: '#1e2a42' }}>|</span>
          <span style={{ color: '#00d4ff' }}>CONNECTED</span>
        </div>
      </div>

      {/* Scanline */}
      <div style={S.scanline} />

      <style>{`
        @keyframes cvPulse { 0%,100%{opacity:.4;transform:scale(0.9)} 50%{opacity:1;transform:scale(1.1)} }
        @keyframes cvSpin { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }
        @keyframes cvMsgIn { 0%{opacity:0;transform:translateY(10px)} 100%{opacity:1;transform:translateY(0)} }
        .cv-msg-in { animation: cvMsgIn 0.3s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes cvHeaderPulse { 0%,100%{opacity:.6;box-shadow:0 0 4px #00d4ff} 50%{opacity:1;box-shadow:0 0 12px #00d4ff} }
      `}</style>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const glass = {
  background: 'linear-gradient(135deg, rgba(12,14,20,0.93), rgba(17,19,24,0.89))',
  backdropFilter: 'blur(20px) saturate(1.2)',
  border: '1px solid #162035',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
};

const S: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed', inset: 0, background: '#0a0e1a',
    fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
    color: 'rgba(255,255,255,0.92)', overflow: 'hidden', zIndex: 50,
  },
  bgGrad: {
    position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
    background: `
      radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.04) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 100%, rgba(6,182,212,0.03) 0%, transparent 40%),
      linear-gradient(180deg, #0a0e1a 0%, #0d1120 50%, #0a0e1a 100%)
    `,
  },
  header: {
    position: 'fixed', top: 0, left: 0, right: 0, height: 44,
    ...glass, borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 16px', zIndex: 100,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  headerLabel: {
    fontSize: 9, color: '#00d4ff', letterSpacing: 2, fontWeight: 600,
    background: 'rgba(0,212,255,0.08)', padding: '2px 8px', borderRadius: 3,
    border: '1px solid rgba(0,212,255,0.2)',
  },
  dot: {
    width: 7, height: 7, borderRadius: '50%', background: '#00d4ff',
    boxShadow: '0 0 8px #00d4ff', animation: 'cvHeaderPulse 2s ease-in-out infinite',
  },
  title: { fontSize: 11, fontWeight: 600, letterSpacing: 3, color: 'rgba(255,255,255,0.92)' },
  sub: { fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
  btn: {
    padding: '5px 10px', background: 'rgba(0,212,255,0.1)',
    border: '1px solid rgba(0,212,255,0.3)', borderRadius: 4,
    color: '#00d4ff', fontSize: 8, fontWeight: 600, cursor: 'pointer',
    fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.5,
    transition: 'all 0.2s ease',
  },

  /* Chat area */
  chatScroll: {
    position: 'fixed', top: 44, left: 0, right: 0, bottom: 100,
    overflowY: 'auto', zIndex: 10,
  },
  chatColumn: {
    maxWidth: 700, margin: '0 auto', padding: '24px 20px 16px',
    display: 'flex', flexDirection: 'column', gap: 14,
    minHeight: '100%',
  },

  /* Messages */
  msgRow: {
    display: 'flex', gap: 10, alignItems: 'flex-start',
  },
  aiAvatar: {
    width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 2,
    background: 'linear-gradient(135deg, #00d4ff, #06b6d4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  userAvatar: {
    width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 2,
    background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, fontWeight: 700, color: '#00d4ff',
  },
  bubble: {
    maxWidth: '75%', borderRadius: 8, padding: '10px 14px',
  },
  userBubble: {
    background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.18)',
  },
  aiBubble: {
    background: 'rgba(255,255,255,0.025)', border: '1px solid #162035',
  },
  bubbleMeta: {
    fontSize: 7, fontWeight: 600, letterSpacing: 2, color: 'rgba(255,255,255,0.4)', marginBottom: 5,
  },
  bubbleText: {
    fontSize: 11, lineHeight: 1.7, color: 'rgba(255,255,255,0.72)', whiteSpace: 'pre-wrap' as const,
  },
  pdfTag: {
    marginTop: 8, paddingTop: 6, borderTop: '1px solid #162035',
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: 1,
  },

  /* PDF generating card */
  genCard: {
    maxWidth: '75%', borderRadius: 8, padding: '14px 16px',
    background: 'linear-gradient(135deg, rgba(0,212,255,0.06), rgba(6,182,212,0.03))',
    border: '1px solid rgba(0,212,255,0.18)',
    minWidth: 280,
  },

  /* PDF ready card */
  pdfReadyCard: {
    maxWidth: '75%', borderRadius: 8, padding: '14px 16px',
    background: 'linear-gradient(135deg, rgba(0,212,255,0.07), rgba(6,182,212,0.04))',
    border: '1px solid rgba(0,212,255,0.22)',
    minWidth: 280,
  },
  pdfBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 12px', borderRadius: 4, fontSize: 9, fontWeight: 600, letterSpacing: 1.5,
    background: 'linear-gradient(135deg, rgba(0,212,255,0.18), rgba(6,182,212,0.12))',
    border: '1px solid rgba(0,212,255,0.4)', color: '#00d4ff',
    cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
    transition: 'all 0.2s',
  },
  pdfBtnSecondary: {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '6px 10px', borderRadius: 4, fontSize: 8, fontWeight: 600, letterSpacing: 1.5,
    background: 'rgba(255,255,255,0.03)', border: '1px solid #1e2a42', color: 'rgba(255,255,255,0.55)',
    cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
    transition: 'all 0.2s',
  },
  pdfBtnDismiss: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, borderRadius: 4,
    background: 'rgba(255,255,255,0.03)', border: '1px solid #1e2a42', color: 'rgba(255,255,255,0.4)',
    cursor: 'pointer', transition: 'all 0.2s',
  },

  /* Input bar */
  inputBar: {
    position: 'fixed', left: 0, right: 0, bottom: 28,
    zIndex: 100, padding: '0 20px 8px',
    background: 'linear-gradient(180deg, transparent 0%, #0a0e1a 20%)',
  },
  inputInner: {
    maxWidth: 700, margin: '0 auto',
    display: 'flex', alignItems: 'flex-end', gap: 8,
  },
  textarea: {
    flex: 1, padding: '10px 14px',
    background: 'rgba(255,255,255,0.03)', border: '1px solid #162035',
    borderRadius: 6, color: 'rgba(255,255,255,0.92)', fontSize: 11,
    fontFamily: "'JetBrains Mono', monospace",
    resize: 'none' as const, outline: 'none',
    minHeight: 40, maxHeight: 100,
    transition: 'border-color 0.2s',
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 6, border: 'none',
    background: 'linear-gradient(135deg, #00d4ff, #06b6d4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#0a0e1a', flexShrink: 0,
    transition: 'all 0.2s',
  },
  inputHint: {
    maxWidth: 700, margin: '4px auto 0', textAlign: 'center' as const,
    fontSize: 7, color: '#3a3d4e', letterSpacing: 2,
  },

  /* Status bar */
  statusBar: {
    position: 'fixed', bottom: 0, left: 0, right: 0, height: 28,
    ...glass, borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderBottom: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 14px', zIndex: 100, fontSize: 9, color: 'rgba(255,255,255,0.4)',
  },
  scanline: {
    position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' as const,
    background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.03) 2px,rgba(0,0,0,.03) 4px)',
    mixBlendMode: 'multiply' as const,
  },
};
