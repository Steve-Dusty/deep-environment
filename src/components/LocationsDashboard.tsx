'use client';

import { useState } from 'react';
import { MapPin, ArrowRight, Eye } from 'lucide-react';
import { locationSummaries, type LocationSummary } from '@/data/locationGraphs';
import { THREAT_COLORS, THREAT_LABELS, pinReports, type PinReport } from '@/data/locations';
import { getPinImage } from '@/data/images';

interface LocationsDashboardProps {
  onSelectLocation: (locationId: string) => void;
  onEnterOdyssey: (pin: PinReport, imageUrl?: string) => void;
  onClose: () => void;
}

export default function LocationsDashboard({ onSelectLocation, onEnterOdyssey, onClose }: LocationsDashboardProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div style={S.container}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <button onClick={onClose} style={S.btn}>← MAP</button>
          <div style={S.dot} />
          <span style={S.title}>DEEP ENVIRONMENT</span>
          <span style={{ ...S.sub, color: '#00d4ff', marginLeft: 4 }}>KNOWLEDGE GRAPH</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={S.sub}>
            LOCATIONS <span style={{ color: '#00d4ff' }}>{locationSummaries.length}</span>
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={S.content}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={S.h1}>LOCATIONS DASHBOARD</h1>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: 1 }}>
            Select a location to explore its problem knowledge graph
          </p>
        </div>

        <div style={S.grid}>
          {locationSummaries.map((loc) => {
            const threatColor = THREAT_COLORS[loc.overallSeverity];
            const isHovered = hoveredId === loc.id;
            const heroImage = loc.pinIds.length > 0 ? getPinImage(loc.pinIds[0]) : null;

            return (
              <div
                key={loc.id}
                style={{
                  ...S.card,
                  borderColor: isHovered ? '#00d4ff' : '#162035',
                  background: isHovered
                    ? 'linear-gradient(135deg, rgba(12,14,20,0.98), rgba(17,19,24,0.95))'
                    : 'linear-gradient(135deg, rgba(12,14,20,0.93), rgba(17,19,24,0.89))',
                }}
                onMouseEnter={() => setHoveredId(loc.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Hero image */}
                <div style={S.imageContainer}>
                  {heroImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={heroImage}
                      alt={loc.name}
                      style={S.heroImg}
                      loading="lazy"
                    />
                  ) : (
                    <div style={{ ...S.heroPlaceholder, background: `linear-gradient(135deg, ${threatColor}15, ${threatColor}05)` }}>
                      <MapPin size={20} style={{ color: threatColor, opacity: 0.5 }} />
                    </div>
                  )}
                  <div style={S.imageOverlay} />
                  {/* Severity badge on image */}
                  <div style={{ position: 'absolute', top: 8, right: 8 }}>
                    <span style={{
                      ...S.severityBadge,
                      backgroundColor: `${threatColor}20`,
                      borderColor: `${threatColor}40`,
                      color: threatColor,
                    }}>
                      {THREAT_LABELS[loc.overallSeverity]}
                    </span>
                  </div>
                  {/* Location name on image */}
                  <div style={{ position: 'absolute', bottom: 8, left: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={12} style={{ color: '#00d4ff' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.92)' }}>{loc.name}</span>
                    </div>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', marginLeft: 18 }}>
                      {loc.city}, {loc.state}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p style={S.cardDesc}>{loc.description}</p>

                {/* Stats */}
                <div style={S.stats}>
                  <div style={S.stat}>
                    <span style={S.statLabel}>PROBLEMS</span>
                    <span style={{ ...S.statValue, color: '#00d4ff' }}>{loc.activeProblemsCount}</span>
                  </div>
                  <div style={S.stat}>
                    <span style={S.statLabel}>CRITICAL</span>
                    <span style={{ ...S.statValue, color: threatColor }}>{loc.criticalProblemsCount}</span>
                  </div>
                  <div style={S.stat}>
                    <span style={S.statLabel}>CONFIDENCE</span>
                    <span style={{ ...S.statValue, color: '#3b82f6' }}>{loc.confidence}%</span>
                  </div>
                </div>

                {/* Footer */}
                <div style={S.cardFooter}>
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)' }}>Updated {loc.lastUpdated}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const pin = loc.pinIds.length > 0 ? pinReports.find((p) => p.id === loc.pinIds[0]) : null;
                        if (pin) onEnterOdyssey(pin, heroImage || undefined);
                      }}
                      style={{
                        ...S.odysseyBtn,
                        opacity: isHovered ? 1 : 0,
                        transform: isHovered ? 'translateY(0)' : 'translateY(4px)',
                      }}
                    >
                      <Eye size={11} />
                      <span>ODYSSEY</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectLocation(loc.id); }}
                      style={{
                        ...S.viewBtn,
                        opacity: isHovered ? 1 : 0,
                        transform: isHovered ? 'translateY(0)' : 'translateY(4px)',
                      }}
                    >
                      <span>VIEW GRAPH</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Bar */}
      <div style={S.statusBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#00d4ff' }}>●</span>
          <span>KNOWLEDGE GRAPH DASHBOARD</span>
          <span style={{ color: '#1e2a42' }}>|</span>
          <span>{locationSummaries.length} LOCATIONS</span>
        </div>
        <span>LOCATION-CENTRIC · PROBLEM-FOCUSED</span>
      </div>

      <style>{`
        @keyframes kg-pulse { 0%,100%{opacity:.6;box-shadow:0 0 4px #00d4ff} 50%{opacity:1;box-shadow:0 0 12px #00d4ff} }
      `}</style>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const glass = {
  background: 'linear-gradient(135deg, rgba(12,14,20,0.93), rgba(17,19,24,0.89))',
  backdropFilter: 'blur(20px) saturate(1.2)',
  border: '1px solid #162035',
  borderRadius: 6,
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
};

const S: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed', inset: 0, background: '#0a0e1a',
    fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
    color: 'rgba(255,255,255,0.92)', overflow: 'hidden', zIndex: 50,
  },
  header: {
    position: 'fixed', top: 0, left: 0, right: 0, height: 44,
    ...glass, borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 16px', zIndex: 100,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  dot: {
    width: 7, height: 7, borderRadius: '50%', background: '#00d4ff',
    boxShadow: '0 0 8px #00d4ff', animation: 'kg-pulse 2s ease-in-out infinite',
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
  content: {
    padding: '60px 24px 40px', maxWidth: 1400, margin: '0 auto',
    overflowY: 'auto', height: '100%',
  },
  h1: { fontSize: 24, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,0.92)', marginBottom: 8 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 16, marginBottom: 60,
  },
  card: {
    ...glass, overflow: 'hidden', cursor: 'pointer',
    transition: 'all 0.3s ease', border: '1px solid #162035',
  },
  imageContainer: {
    position: 'relative', width: '100%', height: 140, overflow: 'hidden',
    background: '#0a0e1a',
  },
  heroImg: {
    width: '100%', height: '100%', objectFit: 'cover',
  },
  heroPlaceholder: {
    width: '100%', height: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  imageOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to top, rgba(8,9,12,0.85) 0%, transparent 50%, rgba(8,9,12,0.3) 100%)',
  },
  severityBadge: {
    padding: '3px 8px', borderRadius: 3, fontSize: 7,
    fontWeight: 700, letterSpacing: 1.5, border: '1px solid',
  },
  cardDesc: {
    fontSize: 10, color: 'rgba(255,255,255,0.72)', lineHeight: 1.5,
    padding: '12px 14px 0', marginBottom: 12,
  },
  stats: {
    display: 'flex', gap: 16, padding: '0 14px 12px',
    borderTop: '1px solid #162035', paddingTop: 12, marginTop: 4,
  },
  stat: { display: 'flex', flexDirection: 'column', gap: 4 },
  statLabel: { fontSize: 7, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, textTransform: 'uppercase' },
  statValue: { fontSize: 16, fontWeight: 700, letterSpacing: 1 },
  cardFooter: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0 14px 12px',
  },
  viewBtn: {
    padding: '6px 12px',
    background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.06))',
    border: '1px solid rgba(0,212,255,0.3)', borderRadius: 4,
    color: '#00d4ff', fontSize: 8, fontWeight: 600, cursor: 'pointer',
    fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.2,
    transition: 'all 0.25s ease',
    display: 'flex', alignItems: 'center', gap: 6,
  },
  odysseyBtn: {
    padding: '6px 12px',
    background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.06))',
    border: '1px solid rgba(139,92,246,0.4)', borderRadius: 4,
    color: '#a78bfa', fontSize: 8, fontWeight: 600, cursor: 'pointer',
    fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.2,
    transition: 'all 0.25s ease',
    display: 'flex', alignItems: 'center', gap: 5,
  },
  statusBar: {
    position: 'fixed', bottom: 0, left: 0, right: 0, height: 28,
    ...glass, borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderBottom: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 14px', zIndex: 100, fontSize: 9, color: 'rgba(255,255,255,0.4)',
  },
};
