'use client';

import { useState } from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import { locationSummaries, type LocationSummary } from '../data/locationGraphs';
import { THREAT_COLORS, THREAT_LABELS } from '../data/locations';

interface LocationsDashboardProps {
  onSelectLocation: (locationId: string) => void;
  onClose: () => void;
}

export default function LocationsDashboard({ onSelectLocation, onClose }: LocationsDashboardProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  return (
    <div style={S.container}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <button onClick={onClose} style={S.backBtn}>
            ← MAP
          </button>
          <div style={S.dot} />
          <span style={S.title}>DEEP ENVIRONMENT</span>
          <span style={{ ...S.sub, color: '#0ff5c4', marginLeft: 4 }}>KNOWLEDGE GRAPH</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={S.sub}>
            LOCATIONS <span style={{ color: '#0ff5c4' }}>{locationSummaries.length}</span>
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div style={S.content}>
        <div style={S.dashboardTitle}>
          <h1 style={S.h1}>LOCATIONS DASHBOARD</h1>
          <p style={S.subtitle}>Select a location to view its problem knowledge graph</p>
        </div>

        {/* Location Cards Grid */}
        <div style={S.grid}>
          {locationSummaries.map((location) => {
            const threatColor = THREAT_COLORS[location.overallSeverity];

            return (
              <div
                key={location.id}
                style={{
                  ...S.card,
                  borderColor: selectedLocation === location.id ? '#0ff5c4' : '#1a1d2a',
                  background: selectedLocation === location.id 
                    ? 'linear-gradient(135deg, rgba(12,14,20,0.98), rgba(17,19,24,0.95))' 
                    : 'linear-gradient(135deg, rgba(12,14,20,0.93), rgba(17,19,24,0.89))',
                }}
                onClick={() => setSelectedLocation(location.id)}
                onMouseEnter={() => setSelectedLocation(location.id)}
                onMouseLeave={() => setSelectedLocation(null)}
              >
                {/* Card Header */}
                <div style={S.cardHeader}>
                  <div style={S.cardHeaderLeft}>
                    <MapPin size={14} style={{ color: '#0ff5c4' }} />
                    <div>
                      <h3 style={S.cardTitle}>{location.name}</h3>
                      <p style={S.cardLocation}>{location.city}, {location.state}</p>
                    </div>
                  </div>
                  <div
                    style={{
                      ...S.severityBadge,
                      backgroundColor: `${threatColor}20`,
                      borderColor: `${threatColor}40`,
                      color: threatColor,
                    }}
                  >
                    {THREAT_LABELS[location.overallSeverity]}
                  </div>
                </div>

                {/* Description */}
                <p style={S.cardDescription}>{location.description}</p>

                {/* Stats */}
                <div style={S.stats}>
                  <div style={S.stat}>
                    <span style={S.statLabel}>ACTIVE PROBLEMS</span>
                    <span style={{ ...S.statValue, color: '#0ff5c4' }}>
                      {location.activeProblemsCount}
                    </span>
                  </div>
                  <div style={S.stat}>
                    <span style={S.statLabel}>CRITICAL</span>
                    <span style={{ ...S.statValue, color: threatColor }}>
                      {location.criticalProblemsCount}
                    </span>
                  </div>
                  <div style={S.stat}>
                    <span style={S.statLabel}>CONFIDENCE</span>
                    <span style={{ ...S.statValue, color: '#3b82f6' }}>
                      {location.confidence}%
                    </span>
                  </div>
                </div>

                {/* Last Updated */}
                <div style={S.footer}>
                  <span style={S.lastUpdated}>Updated {location.lastUpdated}</span>
                  <ChevronRight size={12} style={{ color: '#555870' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        {selectedLocation && (
          <div style={S.actionBar}>
            <button
              onClick={() => onSelectLocation(selectedLocation)}
              style={S.viewGraphBtn}
            >
              VIEW KNOWLEDGE GRAPH →
            </button>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div style={S.statsBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#0ff5c4' }}>●</span>
          <span>KNOWLEDGE GRAPH DASHBOARD</span>
          <span style={{ color: '#252838' }}>|</span>
          <span>TOTAL LOCATIONS <span style={{ color: '#8b8fa4' }}>{locationSummaries.length}</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>LOCATION-CENTRIC · PROBLEM-FOCUSED</span>
        </div>
      </div>
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
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: '0 16px',
    zIndex: 100,
  },
  headerLeft: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#0ff5c4',
    boxShadow: '0 0 8px #0ff5c4',
    animation: 'kg-pulse 2s ease-in-out infinite',
  },
  title: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 3,
    color: '#e4e6ef',
  },
  sub: {
    fontSize: 9,
    color: '#555870',
    letterSpacing: 1,
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
  content: {
    padding: '60px 24px 40px',
    maxWidth: 1400,
    margin: '0 auto',
    overflowY: 'auto' as const,
    height: '100%',
  },
  dashboardTitle: {
    marginBottom: 32,
  },
  h1: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: 2,
    color: '#e4e6ef',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 11,
    color: '#8b8fa4',
    letterSpacing: 1,
  },
  grid: {
    display: 'grid' as const,
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 16,
    marginBottom: 24,
  },
  card: {
    ...glass,
    padding: 16,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: '1px solid #1a1d2a',
  },
  cardHeader: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  cardHeaderLeft: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 8,
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#e4e6ef',
    marginBottom: 2,
  },
  cardLocation: {
    fontSize: 9,
    color: '#8b8fa4',
    letterSpacing: 0.5,
  },
  severityBadge: {
    padding: '3px 8px',
    borderRadius: 3,
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 1.5,
    border: '1px solid',
  },
  cardDescription: {
    fontSize: 10,
    color: '#c4c6d0',
    lineHeight: 1.5,
    marginBottom: 16,
  },
  stats: {
    display: 'flex' as const,
    gap: 16,
    marginBottom: 12,
    paddingTop: 12,
    borderTop: '1px solid #1a1d2a',
  },
  stat: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: 4,
  },
  statLabel: {
    fontSize: 7,
    color: '#555870',
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: 1,
  },
  footer: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingTop: 12,
    borderTop: '1px solid #1a1d2a',
  },
  lastUpdated: {
    fontSize: 8,
    color: '#555870',
    letterSpacing: 0.5,
  },
  actionBar: {
    position: 'fixed' as const,
    bottom: 32,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 90,
  },
  viewGraphBtn: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, rgba(15,245,196,0.15), rgba(15,245,196,0.06))',
    border: '1px solid rgba(15,245,196,0.3)',
    borderRadius: 6,
    color: '#0ff5c4',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 1.5,
    cursor: 'pointer',
    fontFamily: "'JetBrains Mono', monospace",
    transition: 'all 0.2s ease',
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
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: '0 14px',
    zIndex: 100,
    fontSize: 9,
    color: '#555870',
  },
};
