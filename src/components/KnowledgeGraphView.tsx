'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import KnowledgeGraph3D, { GraphHandle } from './KnowledgeGraph3D';
import { queryGraph, analyzeNode } from '@/data/ai';
import {
  GraphNode,
  GraphData,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  THREAT_COLORS,
} from '@/data/graphData';

interface KnowledgeGraphViewProps {
  onClose: () => void;
}

export default function KnowledgeGraphView({ onClose }: KnowledgeGraphViewProps) {
  const graphRef = useRef<GraphHandle>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [graphStats, setGraphStats] = useState({ nodes: 0, links: 0 });
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  // AI chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<
    { role: 'user' | 'ai'; text: string }[]
  >([{ role: 'ai', text: 'Ask me about any node, threat, or location in the graph.' }]);
  const [chatLoading, setChatLoading] = useState(false);

  // AI analysis state
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── AI query handler ─────────────────────────────────────────────────

  const handleChatSubmit = useCallback(async () => {
    const q = chatInput.trim();
    if (!q || chatLoading) return;

    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text: q }]);
    setChatLoading(true);

    try {
      const graphData = graphRef.current?.getGraphData();
      if (!graphData) throw new Error('Graph not ready');

      const result = await queryGraph(q, graphData);
      setChatMessages((prev) => [...prev, { role: 'ai', text: result.answer }]);

      // Navigate to the node if AI found one
      if (result.nodeId) {
        graphRef.current?.navigateToNode(result.nodeId);
        const node = graphData.nodes.find((n) => n.id === result.nodeId);
        if (node) setSelectedNode(node);
      }
    } catch (e) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'ai', text: `Error: ${e instanceof Error ? e.message : 'Unknown'}` },
      ]);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatLoading]);

  // ── Node select → trigger AI analysis ────────────────────────────────

  const handleNodeSelect = useCallback(async (node: GraphNode | null) => {
    setSelectedNode(node);
    setAnalysis(null);

    if (!node) return;

    setAnalysisLoading(true);
    try {
      const graphData = graphRef.current?.getGraphData();
      if (!graphData) throw new Error('Graph not ready');
      const result = await analyzeNode(node, graphData);
      setAnalysis(result);
    } catch (e) {
      setAnalysis(`Analysis error: ${e instanceof Error ? e.message : 'Unknown'}`);
    } finally {
      setAnalysisLoading(false);
    }
  }, []);

  const handleGraphUpdate = useCallback((data: GraphData) => {
    setGraphStats({ nodes: data.nodes.length, links: data.links.length });
  }, []);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div style={S.container}>
      {/* 3D graph */}
      <KnowledgeGraph3D
        ref={graphRef}
        onNodeSelect={handleNodeSelect}
        onGraphUpdate={handleGraphUpdate}
        autoUpdate={autoUpdate}
      />

      {/* ── Header ── */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <button onClick={onClose} style={{ ...S.btn, marginRight: 8 }}>
            ← MAP
          </button>
          <div style={S.dot} />
          <span style={S.title}>DEEP ENVIRONMENT</span>
          <span style={{ ...S.sub, color: '#0ff5c4', marginLeft: 4 }}>KNOWLEDGE GRAPH</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={S.sub}>NODES <span style={{ color: '#0ff5c4' }}>{graphStats.nodes}</span></span>
          <span style={S.sub}>LINKS <span style={{ color: '#3b82f6' }}>{graphStats.links}</span></span>
          <button
            onClick={() => setAutoUpdate((a) => !a)}
            style={{
              ...S.btn,
              background: autoUpdate ? 'rgba(15,245,196,0.15)' : 'rgba(255,59,79,0.1)',
              borderColor: autoUpdate ? 'rgba(15,245,196,0.4)' : 'rgba(255,59,79,0.3)',
              color: autoUpdate ? '#0ff5c4' : '#ff3b4f',
            }}
          >
            {autoUpdate ? '● LIVE' : '○ PAUSED'}
          </button>
          <button
            onClick={() => { graphRef.current?.resetView(); setSelectedNode(null); setAnalysis(null); }}
            style={S.btn}
          >
            RESET VIEW
          </button>
        </div>
      </div>

      {/* ── Node Detail + AI Analysis (left panel) ── */}
      {selectedNode && (
        <div key={selectedNode.id} style={S.leftPanel} className="kg-panel-slide-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <span style={{
              fontSize: 8, fontWeight: 600, letterSpacing: 2,
              color: selectedNode.color || CATEGORY_COLORS[selectedNode.category],
              background: `${selectedNode.color || CATEGORY_COLORS[selectedNode.category]}18`,
              padding: '2px 6px', borderRadius: 3,
              border: `1px solid ${selectedNode.color || CATEGORY_COLORS[selectedNode.category]}33`,
            }}>
              {CATEGORY_LABELS[selectedNode.category]}
            </span>
            <button onClick={() => { setSelectedNode(null); setAnalysis(null); }} style={{ ...S.btn, padding: '2px 6px', fontSize: 8 }}>
              CLOSE
            </button>
          </div>

          <div style={{
            fontSize: 14, fontWeight: 600, marginBottom: 3,
            color: selectedNode.color || CATEGORY_COLORS[selectedNode.category],
          }}>
            {selectedNode.name}
          </div>
          <div style={{ fontSize: 9, color: '#555870', marginBottom: 8 }}>{selectedNode.id}</div>

          {selectedNode.description && (
            <div style={{ fontSize: 10, color: '#8b8fa4', marginBottom: 8, lineHeight: 1.5 }}>
              {selectedNode.description}
            </div>
          )}

          {selectedNode.threatLevel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: THREAT_COLORS[selectedNode.threatLevel],
                boxShadow: `0 0 6px ${THREAT_COLORS[selectedNode.threatLevel]}`,
              }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: THREAT_COLORS[selectedNode.threatLevel] }}>
                {selectedNode.threatLevel.toUpperCase()}
              </span>
            </div>
          )}

          {selectedNode.metadata && (
            <div style={{ marginBottom: 8 }}>
              {Object.entries(selectedNode.metadata).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, fontSize: 9 }}>
                  <span style={{ color: '#555870' }}>{k}</span>
                  <span style={{ color: '#8b8fa4' }}>{String(v)}</span>
                </div>
              ))}
            </div>
          )}

          {/* AI Analysis */}
          <div style={S.divider} />
          <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2.5, color: '#0ff5c4', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>AI ANALYSIS</span>
            {analysisLoading && <span style={S.spinner}>●</span>}
          </div>

          {analysisLoading && !analysis && (
            <div style={{ fontSize: 10, color: '#555870', fontStyle: 'italic' }}>
              Analyzing node context...
            </div>
          )}

          {analysis && (
            <div style={{ fontSize: 10, color: '#c4c6d0', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
              {analysis}
            </div>
          )}
        </div>
      )}

      {/* ── AI Chat Panel (right side) ── */}
      <div style={S.rightPanel}>
        <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2.5, color: '#0ff5c4', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>AI QUERY</span>
          <span style={{ color: '#555870', fontWeight: 400, letterSpacing: 1 }}>Gemini-2.0-flash</span>
        </div>

        {/* Chat messages */}
        <div style={S.chatArea}>
          {chatMessages.map((msg, i) => (
            <div key={i} style={{
              marginBottom: 8,
              padding: '6px 8px',
              borderRadius: 4,
              fontSize: 10,
              lineHeight: 1.6,
              background: msg.role === 'user' ? 'rgba(15,245,196,0.08)' : 'rgba(255,255,255,0.03)',
              border: msg.role === 'user' ? '1px solid rgba(15,245,196,0.15)' : '1px solid #1a1d2a',
              color: msg.role === 'user' ? '#0ff5c4' : '#c4c6d0',
            }}>
              <div style={{ fontSize: 7, letterSpacing: 2, color: '#555870', marginBottom: 3 }}>
                {msg.role === 'user' ? 'YOU' : 'AI'}
              </div>
              {msg.text}
            </div>
          ))}
          {chatLoading && (
            <div style={{ fontSize: 10, color: '#555870', padding: '4px 8px' }}>
              <span style={S.spinner}>●</span> Thinking...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div style={S.chatInputRow}>
          <input
            style={S.input}
            placeholder="Ask about the graph..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
            disabled={chatLoading}
          />
          <button
            style={{ ...S.btn, opacity: chatLoading ? 0.4 : 1 }}
            onClick={handleChatSubmit}
            disabled={chatLoading}
          >
            ASK
          </button>
        </div>

        <div style={S.divider} />

        {/* Quick queries */}
        <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2.5, color: '#555870', marginBottom: 6 }}>
          QUICK QUERIES
        </div>
        {[
          'What is the most critical threat?',
          'Show me the Gulf Coast',
          'Which locations are at risk?',
          'How are threats connected?',
        ].map((q) => (
          <div
            key={q}
            onClick={() => { setChatInput(q); }}
            style={{
              fontSize: 9, color: '#8b8fa4', cursor: 'pointer', padding: '3px 0',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#0ff5c4')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8b8fa4')}
          >
            → {q}
          </div>
        ))}

        <div style={S.divider} />

        {/* Controls hint */}
        <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2.5, color: '#555870', marginBottom: 4 }}>CONTROLS</div>
        <div style={{ fontSize: 9, color: '#555870', lineHeight: 1.8 }}>
          <div><span style={{ color: '#0ff5c4' }}>ORBIT</span> — drag to rotate</div>
          <div><span style={{ color: '#0ff5c4' }}>SCROLL</span> — zoom</div>
          <div><span style={{ color: '#0ff5c4' }}>CLICK</span> — select node</div>
        </div>
      </div>

      {/* ── Status Bar ── */}
      <div style={S.statsBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#0ff5c4' }}>●</span>
          <span>GRAPH ENGINE</span>
          <span style={{ color: '#252838' }}>|</span>
          <span>UPTIME <span style={{ color: '#8b8fa4' }}>{fmt(elapsed)}</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>3D FORCE · d3 · three.js · Gemini</span>
          <span style={{ color: '#252838' }}>|</span>
          {autoUpdate
            ? <span style={{ color: '#0ff5c4' }}>STREAMING</span>
            : <span style={{ color: '#ff3b4f' }}>PAUSED</span>}
        </div>
      </div>

      {/* Scanline */}
      <div style={S.scanline} />

      <style>{`
        @keyframes kg-pulse { 0%,100%{opacity:.6;box-shadow:0 0 4px #0ff5c4} 50%{opacity:1;box-shadow:0 0 12px #0ff5c4} }
        @keyframes kg-blink { 0%,100%{opacity:.3} 50%{opacity:1} }
        @keyframes kgPanelSlideIn {
          0% { opacity: 0; transform: translateX(-24px) scale(0.97); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        .kg-panel-slide-in { animation: kgPanelSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
      `}</style>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const glass = {
  background: 'linear-gradient(135deg, rgba(12,14,20,0.93), rgba(17,19,24,0.89))',
  backdropFilter: 'blur(20px) saturate(1.2)',
  border: '1px solid #1a1d2a',
  borderRadius: 6,
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
};

const S = {
  container: {
    position: 'fixed' as const, inset: 0, background: '#08090c',
    fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
    color: '#e4e6ef', overflow: 'hidden', zIndex: 50,
  },
  header: {
    position: 'fixed' as const, top: 0, left: 0, right: 0, height: 44,
    ...glass, borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 16px', zIndex: 100,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  dot: {
    width: 7, height: 7, borderRadius: '50%', background: '#0ff5c4',
    boxShadow: '0 0 8px #0ff5c4', animation: 'kg-pulse 2s ease-in-out infinite',
  },
  title: { fontSize: 11, fontWeight: 600, letterSpacing: 3, color: '#e4e6ef' },
  sub: { fontSize: 9, color: '#555870', letterSpacing: 1 },
  btn: {
    padding: '5px 10px', background: 'rgba(15,245,196,0.1)',
    border: '1px solid rgba(15,245,196,0.3)', borderRadius: 4,
    color: '#0ff5c4', fontSize: 8, fontWeight: 600, cursor: 'pointer',
    fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.5,
    transition: 'all 0.2s ease',
  },
  leftPanel: {
    position: 'fixed' as const, top: 52, left: 8, width: 300,
    maxHeight: 'calc(100vh - 90px)', overflowY: 'auto' as const,
    ...glass, padding: 14, zIndex: 90, fontSize: 10,
  },
  rightPanel: {
    position: 'fixed' as const, top: 52, right: 8, width: 290,
    maxHeight: 'calc(100vh - 90px)', overflowY: 'auto' as const,
    ...glass, padding: '12px 14px', zIndex: 90, fontSize: 10,
  },
  chatArea: {
    maxHeight: 280, overflowY: 'auto' as const, marginBottom: 8,
    paddingRight: 2,
  },
  chatInputRow: { display: 'flex', gap: 6 },
  input: {
    flex: 1, background: '#111318', border: '1px solid #252838',
    borderRadius: 4, padding: '6px 10px', color: '#e4e6ef', fontSize: 10,
    fontFamily: "'JetBrains Mono', monospace", outline: 'none',
  },
  statsBar: {
    position: 'fixed' as const, bottom: 0, left: 0, right: 0, height: 28,
    ...glass, borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderBottom: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 14px', zIndex: 100, fontSize: 9, color: '#555870',
  },
  divider: { height: 1, background: '#1a1d2a', margin: '10px 0' },
  spinner: { animation: 'kg-blink 1s ease-in-out infinite', color: '#0ff5c4' },
  scanline: {
    position: 'fixed' as const, inset: 0, zIndex: 9999, pointerEvents: 'none' as const,
    background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.03) 2px,rgba(0,0,0,.03) 4px)',
    mixBlendMode: 'multiply' as const,
  },
};
