'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { buildLocationGraph, locationSummaries, PROBLEM_CATEGORY_COLORS, PROBLEM_CATEGORY_LABELS, type ProblemNode } from '../data/locationGraphs';
import { THREAT_COLORS } from '../data/locations';
import { queryLocationGraph, analyzeProblem, generatePlanToFix } from '../data/locationAI';

const LocationGraph3D = dynamic(() => import('./LocationGraph3D'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--color-void)] z-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-[var(--color-signal-teal)] data-live" />
        <span className="text-[10px] tracking-[0.3em] text-[var(--color-text-muted)]">
          LOADING LOCATION GRAPH
        </span>
      </div>
    </div>
  ),
});

interface LocationDetailViewProps {
  locationId: string;
  onClose: () => void;
}

export default function LocationDetailView({ locationId, onClose }: LocationDetailViewProps) {
  const graphRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const location = locationSummaries.find((l) => l.id === locationId);
  const graphData = buildLocationGraph(locationId);

  const [selectedProblem, setSelectedProblem] = useState<ProblemNode | null>(null);
  const [graphStats, setGraphStats] = useState({ nodes: graphData.problems.length, links: graphData.links.length });
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  // AI chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: `Ask me about problems at ${location?.name || 'this location'} or request a plan to fix.` },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // AI analysis state
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Plan to Fix state
  const [planToFix, setPlanToFix] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

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
      const result = await queryLocationGraph(q, locationId, graphData);
      setChatMessages((prev) => [...prev, { role: 'ai', text: result.answer }]);

      // Navigate to the problem if AI found one
      if (result.problemId) {
        const problem = graphData.problems.find((p) => p.id === result.problemId);
        if (problem) {
          setSelectedProblem(problem);
          graphRef.current?.navigateToNode(result.problemId);
        }
      }
    } catch (e) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'ai', text: `Error: ${e instanceof Error ? e.message : 'Unknown'}` },
      ]);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatLoading, locationId, graphData]);

  // ── Problem select → trigger AI analysis ────────────────────────────────

  const handleProblemSelect = useCallback(async (problem: ProblemNode | null) => {
    setSelectedProblem(problem);
    setAnalysis(null);
    setPlanToFix(null);

    if (!problem) return;

    setAnalysisLoading(true);
    try {
      const result = await analyzeProblem(problem, locationId, graphData);
      setAnalysis(result);
    } catch (e) {
      setAnalysis(`Analysis error: ${e instanceof Error ? e.message : 'Unknown'}`);
    } finally {
      setAnalysisLoading(false);
    }
  }, [locationId, graphData]);

  // ── Generate Plan to Fix ────────────────────────────────────────────────

  const handleGeneratePlan = useCallback(async () => {
    if (!selectedProblem || planLoading) return;

    setPlanLoading(true);
    try {
      const plan = await generatePlanToFix(selectedProblem, locationId, graphData);
      setPlanToFix(plan);
    } catch (e) {
      setPlanToFix(`Error generating plan: ${e instanceof Error ? e.message : 'Unknown'}`);
    } finally {
      setPlanLoading(false);
    }
  }, [selectedProblem, locationId, graphData, planLoading]);

  const handleGraphUpdate = useCallback((data: { nodes: number; links: number }) => {
    setGraphStats(data);
  }, []);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (!location) {
    return (
      <div style={S.container}>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ color: '#ff3b4f' }}>Location not found</p>
          <button onClick={onClose} style={S.backBtn}>
            ← BACK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.container}>
      {/* 3D graph */}
      <LocationGraph3D
        ref={graphRef}
        locationId={locationId}
        graphData={graphData}
        onProblemSelect={handleProblemSelect}
        onGraphUpdate={handleGraphUpdate}
        autoUpdate={autoUpdate}
      />

      {/* ── Header ── */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <button onClick={onClose} style={{ ...S.btn, marginRight: 8 }}>
            ← DASHBOARD
          </button>
          <div style={S.dot} />
          <span style={S.title}>{location.name.toUpperCase()}</span>
          <span style={{ ...S.sub, color: '#0ff5c4', marginLeft: 4 }}>KNOWLEDGE GRAPH</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={S.sub}>
            PROBLEMS <span style={{ color: '#0ff5c4' }}>{graphStats.nodes}</span>
          </span>
          <span style={S.sub}>
            LINKS <span style={{ color: '#3b82f6' }}>{graphStats.links}</span>
          </span>
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
            onClick={() => { graphRef.current?.resetView(); setSelectedProblem(null); setAnalysis(null); setPlanToFix(null); }}
            style={S.btn}
          >
            RESET VIEW
          </button>
        </div>
      </div>

      {/* ── Problem Detail + AI Analysis (left panel) ── */}
      {selectedProblem && (
        <div key={selectedProblem.id} style={S.leftPanel} className="kg-panel-slide-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <span
              style={{
                fontSize: 8,
                fontWeight: 600,
                letterSpacing: 2,
                color: PROBLEM_CATEGORY_COLORS[selectedProblem.category],
                background: `${PROBLEM_CATEGORY_COLORS[selectedProblem.category]}18`,
                padding: '2px 6px',
                borderRadius: 3,
                border: `1px solid ${PROBLEM_CATEGORY_COLORS[selectedProblem.category]}33`,
              }}
            >
              {PROBLEM_CATEGORY_LABELS[selectedProblem.category]}
            </span>
            <button
              onClick={() => { setSelectedProblem(null); setAnalysis(null); setPlanToFix(null); }}
              style={{ ...S.btn, padding: '2px 6px', fontSize: 8 }}
            >
              CLOSE
            </button>
          </div>

          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 3,
              color: PROBLEM_CATEGORY_COLORS[selectedProblem.category],
            }}
          >
            {selectedProblem.name}
          </div>
          <div style={{ fontSize: 9, color: '#555870', marginBottom: 8 }}>{selectedProblem.id}</div>

          {selectedProblem.description && (
            <div style={{ fontSize: 10, color: '#8b8fa4', marginBottom: 8, lineHeight: 1.5 }}>
              {selectedProblem.description}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: THREAT_COLORS[selectedProblem.severity],
                boxShadow: `0 0 6px ${THREAT_COLORS[selectedProblem.severity]}`,
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 600, color: THREAT_COLORS[selectedProblem.severity] }}>
              {selectedProblem.severity.toUpperCase()}
            </span>
            <span style={{ fontSize: 9, color: '#555870', marginLeft: 8 }}>
              Confidence: {selectedProblem.confidence}%
            </span>
          </div>

          {selectedProblem.causes && selectedProblem.causes.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 8, fontWeight: 600, color: '#555870', marginBottom: 4 }}>CAUSES</div>
              {selectedProblem.causes.map((cause, i) => (
                <div key={i} style={{ fontSize: 9, color: '#8b8fa4', marginBottom: 2 }}>
                  • {cause}
                </div>
              ))}
            </div>
          )}

          {selectedProblem.indicators && selectedProblem.indicators.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 8, fontWeight: 600, color: '#555870', marginBottom: 4 }}>INDICATORS</div>
              {selectedProblem.indicators.map((indicator, i) => (
                <div key={i} style={{ fontSize: 9, color: '#8b8fa4', marginBottom: 2 }}>
                  {indicator}
                </div>
              ))}
            </div>
          )}

          {/* AI Analysis */}
          <div style={S.divider} />
          <div
            style={{
              fontSize: 8,
              fontWeight: 600,
              letterSpacing: 2.5,
              color: '#0ff5c4',
              marginBottom: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>AI ANALYSIS</span>
            {analysisLoading && <span style={S.spinner}>●</span>}
          </div>

          {analysisLoading && !analysis && (
            <div style={{ fontSize: 10, color: '#555870', fontStyle: 'italic' }}>
              Analyzing problem context...
            </div>
          )}

          {analysis && (
            <div style={{ fontSize: 10, color: '#c4c6d0', lineHeight: 1.65, whiteSpace: 'pre-wrap', marginBottom: 12 }}>
              {analysis}
            </div>
          )}

          {/* Plan to Fix */}
          <div style={S.divider} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div
              style={{
                fontSize: 8,
                fontWeight: 600,
                letterSpacing: 2.5,
                color: '#a78bfa',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>PLAN TO FIX</span>
              {planLoading && <span style={S.spinner}>●</span>}
            </div>
            <button
              onClick={handleGeneratePlan}
              disabled={planLoading}
              style={{
                ...S.btn,
                padding: '3px 8px',
                fontSize: 7,
                background: 'rgba(167,139,250,0.1)',
                borderColor: 'rgba(167,139,250,0.3)',
                color: '#a78bfa',
              }}
            >
              GENERATE
            </button>
          </div>

          {planToFix && (
            <div style={{ fontSize: 10, color: '#c4c6d0', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
              {planToFix}
            </div>
          )}
        </div>
      )}

      {/* ── AI Chat Panel (right side) ── */}
      <div style={S.rightPanel}>
        <div
          style={{
            fontSize: 8,
            fontWeight: 600,
            letterSpacing: 2.5,
            color: '#0ff5c4',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>AI QUERY</span>
          <span style={{ color: '#555870', fontWeight: 400, letterSpacing: 1 }}>GPT-4o-mini</span>
        </div>

        {/* Chat messages */}
        <div style={S.chatArea}>
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              style={{
                marginBottom: 8,
                padding: '6px 8px',
                borderRadius: 4,
                fontSize: 10,
                lineHeight: 1.6,
                background: msg.role === 'user' ? 'rgba(15,245,196,0.08)' : 'rgba(255,255,255,0.03)',
                border: msg.role === 'user' ? '1px solid rgba(15,245,196,0.15)' : '1px solid #1a1d2a',
                color: msg.role === 'user' ? '#0ff5c4' : '#c4c6d0',
              }}
            >
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
            placeholder={`Ask about ${location.name}...`}
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
          'What is the most critical problem?',
          'Show me pollution issues',
          'Generate a plan to fix',
          'How are problems connected?',
        ].map((q) => (
          <div
            key={q}
            onClick={() => { setChatInput(q); }}
            style={{
              fontSize: 9,
              color: '#8b8fa4',
              cursor: 'pointer',
              padding: '3px 0',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#0ff5c4')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8b8fa4')}
          >
            → {q}
          </div>
        ))}

        <div style={S.divider} />

        {/* RL Recommendations */}
        <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2.5, color: '#a78bfa', marginBottom: 6 }}>
          RL RECOMMENDATIONS
        </div>
        <div style={{ fontSize: 9, color: '#8b8fa4', lineHeight: 1.6 }}>
          <div>• Prioritize {graphData.problems.filter((p) => p.severity === 'critical').length} critical problems</div>
          <div>• Address root causes first</div>
          <div>• Monitor trend indicators</div>
          <div>• Coordinate interventions</div>
        </div>
      </div>

      {/* ── Status Bar ── */}
      <div style={S.statsBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#0ff5c4' }}>●</span>
          <span>LOCATION GRAPH ENGINE</span>
          <span style={{ color: '#252838' }}>|</span>
          <span>UPTIME <span style={{ color: '#8b8fa4' }}>{fmt(elapsed)}</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>3D FORCE · d3 · three.js · OpenAI</span>
          <span style={{ color: '#252838' }}>|</span>
          {autoUpdate ? (
            <span style={{ color: '#0ff5c4' }}>STREAMING</span>
          ) : (
            <span style={{ color: '#ff3b4f' }}>PAUSED</span>
          )}
        </div>
      </div>

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
    position: 'fixed' as const,
    inset: 0,
    background: '#08090c',
    fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
    color: '#e4e6ef',
    overflow: 'hidden',
    zIndex: 50,
  },
  header: {
    position: 'fixed' as const,
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
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#0ff5c4',
    boxShadow: '0 0 8px #0ff5c4',
    animation: 'kg-pulse 2s ease-in-out infinite',
  },
  title: { fontSize: 11, fontWeight: 600, letterSpacing: 3, color: '#e4e6ef' },
  sub: { fontSize: 9, color: '#555870', letterSpacing: 1 },
  btn: {
    padding: '5px 10px',
    background: 'rgba(15,245,196,0.1)',
    border: '1px solid rgba(15,245,196,0.3)',
    borderRadius: 4,
    color: '#0ff5c4',
    fontSize: 8,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: 1.5,
    transition: 'all 0.2s ease',
  },
  backBtn: {
    padding: '5px 10px',
    background: 'rgba(15,245,196,0.1)',
    border: '1px solid rgba(15,245,196,0.3)',
    borderRadius: 4,
    color: '#0ff5c4',
    fontSize: 8,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: 1.5,
    transition: 'all 0.2s ease',
  },
  leftPanel: {
    position: 'fixed' as const,
    top: 52,
    left: 8,
    width: 300,
    maxHeight: 'calc(100vh - 90px)',
    overflowY: 'auto' as const,
    ...glass,
    padding: 14,
    zIndex: 90,
    fontSize: 10,
  },
  rightPanel: {
    position: 'fixed' as const,
    top: 52,
    right: 8,
    width: 290,
    maxHeight: 'calc(100vh - 90px)',
    overflowY: 'auto' as const,
    ...glass,
    padding: '12px 14px',
    zIndex: 90,
    fontSize: 10,
  },
  chatArea: {
    maxHeight: 280,
    overflowY: 'auto' as const,
    marginBottom: 8,
    paddingRight: 2,
  },
  chatInputRow: { display: 'flex', gap: 6 },
  input: {
    flex: 1,
    background: '#111318',
    border: '1px solid #252838',
    borderRadius: 4,
    padding: '6px 10px',
    color: '#e4e6ef',
    fontSize: 10,
    fontFamily: "'JetBrains Mono', monospace",
    outline: 'none',
  },
  statsBar: {
    position: 'fixed' as const,
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
    color: '#555870',
  },
  divider: { height: 1, background: '#1a1d2a', margin: '10px 0' },
  spinner: { animation: 'kg-blink 1s ease-in-out infinite', color: '#0ff5c4' },
};
