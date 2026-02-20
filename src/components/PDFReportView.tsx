'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Download, FileText, ArrowLeft, Shield, Clock, Layers } from 'lucide-react';

interface PDFMessage {
  role: 'user' | 'ai';
  text: string;
}

interface PDFReportViewProps {
  pdfUrl: string;
  pdfFilename: string;
  messages: PDFMessage[];
  onClose: () => void;
  onDownload: () => void;
}

export default function PDFReportView({
  pdfUrl,
  pdfFilename,
  messages,
  onClose,
  onDownload,
}: PDFReportViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [elapsed, setElapsed] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const ts = new Date().toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <div style={S.container}>
      {/* ── Header ── */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <button onClick={onClose} style={{ ...S.btn, marginRight: 8 }}>
            <ArrowLeft size={9} style={{ marginRight: 4 }} />
            DASHBOARD
          </button>
          <div style={S.dot} />
          <span style={S.title}>DEEP ENVIRONMENT</span>
          <span style={S.headerLabel}>PDF REPORT</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={S.sub}>
            GENERATED <span style={{ color: 'rgba(255,255,255,0.55)' }}>{ts}</span>
          </span>
          <button
            onClick={onDownload}
            style={{
              ...S.btn,
              background: 'rgba(0,212,255,0.12)',
              borderColor: 'rgba(0,212,255,0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Download size={9} />
            DOWNLOAD
          </button>
        </div>
      </div>

      {/* ── Main split ── */}
      <div style={S.splitContainer}>
        {/* ═══ LEFT: Chat Transcript ═══ */}
        <div style={S.leftPane}>
          {/* Left pane header */}
          <div style={S.paneHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Bot size={10} style={{ color: '#00d4ff' }} />
              <span style={S.paneTitle}>QUERY TRANSCRIPT</span>
            </div>
            <span style={S.paneCount}>{messages.length} MESSAGES</span>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={S.messagesArea}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  ...S.msgRow,
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  animationDelay: `${idx * 0.06}s`,
                }}
                className="pdf-msg-fadein"
              >
                {msg.role === 'ai' && <div style={S.aiAvatar}><Bot size={10} color="#0a0e1a" /></div>}
                <div
                  style={{
                    ...S.msgBubble,
                    ...(msg.role === 'user' ? S.userBubble : S.aiBubble),
                  }}
                >
                  <div style={S.msgMeta}>
                    {msg.role === 'user' ? 'YOU' : 'DEEP ENVIRONMENT AI'}
                  </div>
                  <div style={S.msgText}>{msg.text}</div>
                </div>
                {msg.role === 'user' && <div style={S.userAvatar}>U</div>}
              </div>
            ))}

            {/* Generation notice at bottom */}
            <div style={S.genNotice} className="pdf-msg-fadein">
              <div style={S.genNoticeLine} />
              <div style={S.genNoticeContent}>
                <FileText size={10} style={{ color: '#00d4ff' }} />
                <span>PDF GENERATED SUCCESSFULLY</span>
              </div>
              <div style={S.genNoticeLine} />
            </div>
          </div>

          {/* Left pane footer */}
          <div style={S.paneFooter}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={8} style={{ color: 'rgba(255,255,255,0.4)' }} />
              <span>AI-GENERATED REPORT</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={8} style={{ color: 'rgba(255,255,255,0.4)' }} />
              <span>{fmt(elapsed)}</span>
            </div>
          </div>
        </div>

        {/* ═══ Divider ═══ */}
        <div style={S.divider}>
          <div style={S.dividerLine} />
          <div style={S.dividerDot} />
          <div style={S.dividerLine} />
        </div>

        {/* ═══ RIGHT: PDF Viewer ═══ */}
        <div style={S.rightPane}>
          {/* Right pane header */}
          <div style={S.paneHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={10} style={{ color: '#00d4ff' }} />
              <span style={S.paneTitle}>DOCUMENT VIEWER</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 7,
                  letterSpacing: 1.5,
                  color: 'rgba(255,255,255,0.55)',
                  maxWidth: 160,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {pdfFilename}
              </span>
              <button
                onClick={onDownload}
                style={{ ...S.btnSmall, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Download size={8} />
                SAVE
              </button>
            </div>
          </div>

          {/* PDF iframe area */}
          <div style={S.pdfArea}>
            {!iframeLoaded && (
              <div style={S.pdfLoading}>
                <div style={S.pdfLoadingSpinner} className="pdf-spin" />
                <span
                  style={{
                    fontSize: 9,
                    letterSpacing: 2.5,
                    color: 'rgba(255,255,255,0.4)',
                    marginTop: 12,
                  }}
                >
                  RENDERING DOCUMENT
                </span>
              </div>
            )}
            <iframe
              src={pdfUrl}
              style={{
                ...S.iframe,
                opacity: iframeLoaded ? 1 : 0,
              }}
              title="PDF Report"
              onLoad={() => setIframeLoaded(true)}
            />
          </div>

          {/* Right pane footer */}
          <div style={S.paneFooter}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layers size={8} style={{ color: 'rgba(255,255,255,0.4)' }} />
              <span>PDFKit · DEEP ENVIRONMENT</span>
            </div>
            <span style={{ color: iframeLoaded ? '#00d4ff' : 'rgba(255,255,255,0.4)' }}>
              {iframeLoaded ? '● LOADED' : '○ LOADING'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Status bar ── */}
      <div style={S.statusBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#00d4ff' }}>●</span>
          <span>PDF REPORT ENGINE</span>
          <span style={{ color: '#1e2a42' }}>|</span>
          <span>
            SESSION <span style={{ color: 'rgba(255,255,255,0.55)' }}>{fmt(elapsed)}</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>PDFKit · MiniMax 2.1 · Bedrock</span>
          <span style={{ color: '#1e2a42' }}>|</span>
          <span style={{ color: '#00d4ff' }}>COMPLETE</span>
        </div>
      </div>

      {/* Scanline */}
      <div style={S.scanline} />

      <style>{`
        @keyframes pdfMsgFadeIn {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .pdf-msg-fadein {
          animation: pdfMsgFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes pdfSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .pdf-spin {
          animation: pdfSpin 1.5s linear infinite;
        }
        @keyframes pdfPulse {
          0%, 100% { opacity: 0.5; box-shadow: 0 0 4px #00d4ff; }
          50% { opacity: 1; box-shadow: 0 0 14px #00d4ff; }
        }
      `}</style>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const glass = {
  background: 'linear-gradient(135deg, rgba(12,14,20,0.95), rgba(17,19,24,0.92))',
  backdropFilter: 'blur(20px) saturate(1.2)',
  border: '1px solid #162035',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
};

const S: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    inset: 0,
    background: '#0a0e1a',
    fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
    color: 'rgba(255,255,255,0.92)',
    overflow: 'hidden',
    zIndex: 50,
  },
  header: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 44,
    ...glass,
    borderRadius: 0,
    borderLeft: 'none',
    borderRight: 'none',
    borderTop: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    zIndex: 100,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  headerLabel: {
    fontSize: 9,
    color: '#00d4ff',
    letterSpacing: 2,
    fontWeight: 600,
    background: 'rgba(0,212,255,0.08)',
    padding: '2px 8px',
    borderRadius: 3,
    border: '1px solid rgba(0,212,255,0.2)',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#00d4ff',
    boxShadow: '0 0 8px #00d4ff',
    animation: 'pdfPulse 2s ease-in-out infinite',
  },
  title: { fontSize: 11, fontWeight: 600, letterSpacing: 3, color: 'rgba(255,255,255,0.92)' },
  sub: { fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
  btn: {
    padding: '5px 10px',
    background: 'rgba(0,212,255,0.1)',
    border: '1px solid rgba(0,212,255,0.3)',
    borderRadius: 4,
    color: '#00d4ff',
    fontSize: 8,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: 1.5,
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
  },
  btnSmall: {
    padding: '3px 7px',
    background: 'rgba(0,212,255,0.08)',
    border: '1px solid rgba(0,212,255,0.25)',
    borderRadius: 3,
    color: '#00d4ff',
    fontSize: 7,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: 1.5,
    transition: 'all 0.2s ease',
  },
  splitContainer: {
    position: 'fixed',
    top: 44,
    left: 0,
    right: 0,
    bottom: 28,
    display: 'flex',
    flexDirection: 'row',
  },
  leftPane: {
    width: '50%',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #162035',
    background: 'linear-gradient(180deg, #0d1120 0%, #0a0e1a 100%)',
  },
  rightPane: {
    width: '50%',
    display: 'flex',
    flexDirection: 'column',
    background: '#0a0e1a',
  },
  paneHeader: {
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 14px',
    borderBottom: '1px solid #162035',
    background: 'rgba(12,14,20,0.8)',
    flexShrink: 0,
  },
  paneTitle: {
    fontSize: 8,
    fontWeight: 600,
    letterSpacing: 2.5,
    color: 'rgba(255,255,255,0.92)',
  },
  paneCount: {
    fontSize: 7,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.4)',
  },
  paneFooter: {
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 14px',
    borderTop: '1px solid #162035',
    background: 'rgba(12,14,20,0.8)',
    fontSize: 7,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.4)',
    flexShrink: 0,
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  msgRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
  },
  aiAvatar: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #00d4ff, #06b6d4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  userAvatar: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: 'rgba(0,212,255,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
    fontSize: 8,
    fontWeight: 700,
    color: '#00d4ff',
  },
  msgBubble: {
    maxWidth: '80%',
    borderRadius: 6,
    padding: '8px 10px',
  },
  userBubble: {
    background: 'rgba(0,212,255,0.08)',
    border: '1px solid rgba(0,212,255,0.2)',
  },
  aiBubble: {
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid #162035',
  },
  msgMeta: {
    fontSize: 6,
    fontWeight: 600,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 4,
  },
  msgText: {
    fontSize: 10,
    lineHeight: 1.65,
    color: 'rgba(255,255,255,0.72)',
    whiteSpace: 'pre-wrap' as const,
  },
  genNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 0',
    marginTop: 4,
  },
  genNoticeLine: {
    flex: 1,
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.2), transparent)',
  },
  genNoticeContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 7,
    letterSpacing: 2.5,
    color: '#00d4ff',
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
  },
  pdfArea: {
    flex: 1,
    position: 'relative',
    background: '#0c0d12',
  },
  pdfLoading: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  pdfLoadingSpinner: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: '2px solid #162035',
    borderTopColor: '#00d4ff',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    transition: 'opacity 0.4s ease',
  },
  statusBar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    ...glass,
    borderRadius: 0,
    borderLeft: 'none',
    borderRight: 'none',
    borderBottom: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 14px',
    zIndex: 100,
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
  },
  scanline: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    pointerEvents: 'none' as const,
    background:
      'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.03) 2px,rgba(0,0,0,.03) 4px)',
    mixBlendMode: 'multiply' as const,
  },
  divider: {
    width: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    flexShrink: 0,
  },
  dividerLine: {
    flex: 1,
    width: 1,
    background: 'linear-gradient(180deg, transparent, #162035 30%, #162035 70%, transparent)',
  },
  dividerDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: '#162035',
    border: '1px solid #1e2a42',
    flexShrink: 0,
  },
};
