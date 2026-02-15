'use client';

import { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  MapPin,
  Zap,
  Droplets,
  TreePine,
  Thermometer,
  Clock,
  Bot,
  Camera,
  User,
  Shield,
  AlertTriangle,
  TrendingUp,
  Link,
  X,
} from 'lucide-react';
import {
  type PinReport,
  type ThreatLevel,
  THREAT_COLORS,
  THREAT_LABELS,
  CATEGORY_COLORS,
  pinReports,
} from '../data/locations';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Water: <Droplets size={14} />,
  Air: <Zap size={14} />,
  Soil: <TreePine size={14} />,
  Bio: <TreePine size={14} />,
  Climate: <Thermometer size={14} />,
};

function ThreatBadge({ level }: { level: ThreatLevel }) {
  const color = THREAT_COLORS[level];
  return (
    <span
      className="text-[8px] tracking-widest font-bold px-1.5 py-0.5 rounded"
      style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
    >
      {THREAT_LABELS[level]}
    </span>
  );
}

function MetricRow({
  label, value, max, unit, status, description,
}: {
  label: string; value: number; max: number; unit: string; status: ThreatLevel; description: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const color = THREAT_COLORS[status];
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[9px] tracking-wider uppercase text-[var(--color-text-secondary)]">{label}</span>
        <span className="text-[10px] font-medium" style={{ color }}>
          {value}<span className="text-[8px] text-[var(--color-text-muted)] ml-0.5">{unit}</span>
        </span>
      </div>
      <div className="threat-bar w-full" style={{ backgroundColor: `${color}15` }}>
        <div className="h-full rounded-sm transition-all duration-700 ease-out" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <p className="text-[7px] text-[var(--color-text-muted)] leading-relaxed italic">{description}</p>
    </div>
  );
}

interface SidePanelProps {
  pins: PinReport[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export default function SidePanel({ pins, selectedId, onSelect }: SidePanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const selected = pins.find((p) => p.id === selectedId);
  const correlatedPins = selected
    ? selected.correlatedWith.map((id) => pinReports.find((p) => p.id === id)).filter(Boolean) as PinReport[]
    : [];

  return (
    <div className={`fixed top-14 right-3 bottom-12 z-30 transition-all duration-300 flex ${collapsed ? 'w-8' : 'w-80'}`}>
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="self-center -ml-3 w-5 h-10 glass-panel rounded-l flex items-center justify-center cursor-pointer border-r-0 hover:bg-[var(--color-raised)] z-10"
        style={{ borderRight: 'none' }}
      >
        {collapsed ? <ChevronLeft size={10} className="text-[var(--color-text-muted)]" /> : <ChevronRight size={10} className="text-[var(--color-text-muted)]" />}
      </button>

      {!collapsed && (
        <div className="glass-panel rounded flex-1 flex flex-col overflow-hidden fade-in">
          {/* Header */}
          <div className="px-3 py-2.5 border-b border-[var(--color-border-subtle)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MapPin size={10} className="text-[var(--color-signal-teal)]" />
                <span className="text-[10px] tracking-[0.15em] font-semibold" style={{ fontFamily: 'var(--font-sans)' }}>
                  ACTIVE LOCATIONS
                </span>
              </div>
              <span className="text-[9px] text-[var(--color-text-muted)]">{pins.length} LIVE</span>
            </div>
          </div>

          {/* Pin report list OR detail view */}
          {selected ? (
            // ===== DETAIL DASHBOARD =====
            <div className="flex-1 overflow-y-auto">
              {/* Back / close button */}
              <button
                onClick={() => onSelect(null)}
                className="w-full flex items-center gap-1.5 px-3 py-2 border-b border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.02)] cursor-pointer transition-colors"
              >
                <ChevronLeft size={10} />
                <span className="text-[8px] tracking-wider">ALL LOCATIONS</span>
              </button>

              {/* Image / capture placeholder */}
              <div
                className="relative mx-3 mt-3 h-32 rounded overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${CATEGORY_COLORS[selected.category] || '#8b8fa4'}18, ${CATEGORY_COLORS[selected.category] || '#8b8fa4'}06)`,
                  border: `1px solid ${CATEGORY_COLORS[selected.category] || '#8b8fa4'}25`,
                }}
              >
                {/* Grid overlay for "analyzed" look */}
                <div className="absolute inset-0" style={{
                  backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                  backgroundSize: '20px 20px',
                }} />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                  <div style={{ color: CATEGORY_COLORS[selected.category] || '#8b8fa4' }}>
                    {CATEGORY_ICONS[selected.category] || <Camera size={14} />}
                  </div>
                  <span className="text-[9px] tracking-[0.15em] font-semibold" style={{ color: CATEGORY_COLORS[selected.category] || '#8b8fa4' }}>
                    FIELD CAPTURE
                  </span>
                  <span className="text-[7px] text-[var(--color-text-muted)]">
                    @{selected.user} &middot; {selected.timestamp}
                  </span>
                </div>
                {/* Corner brackets */}
                <div className="absolute top-2 left-2 w-3 h-3 border-t border-l" style={{ borderColor: `${CATEGORY_COLORS[selected.category] || '#8b8fa4'}40` }} />
                <div className="absolute top-2 right-2 w-3 h-3 border-t border-r" style={{ borderColor: `${CATEGORY_COLORS[selected.category] || '#8b8fa4'}40` }} />
                <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l" style={{ borderColor: `${CATEGORY_COLORS[selected.category] || '#8b8fa4'}40` }} />
                <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r" style={{ borderColor: `${CATEGORY_COLORS[selected.category] || '#8b8fa4'}40` }} />
              </div>

              {/* Title + location */}
              <div className="px-3 pt-3 pb-2">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-[11px] font-semibold text-[var(--color-text-primary)] leading-tight" style={{ fontFamily: 'var(--font-sans)' }}>
                    {selected.title}
                  </h3>
                  <ThreatBadge level={selected.severity} />
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin size={8} className="text-[var(--color-text-muted)]" />
                  <span className="text-[8px] text-[var(--color-text-secondary)]">
                    {selected.neighborhood}, {selected.city}, {selected.state}
                  </span>
                </div>
                <div className="text-[7px] text-[var(--color-text-muted)] tabular-nums">
                  {selected.coordinates[1].toFixed(4)}°N, {Math.abs(selected.coordinates[0]).toFixed(4)}°W
                </div>
              </div>

              {/* AI Analysis */}
              <div className="px-3 pb-3 border-t border-[var(--color-border-subtle)] pt-2.5">
                <div className="flex items-center gap-1.5 mb-2">
                  <Shield size={9} className="text-[var(--color-signal-teal)]" />
                  <span className="text-[9px] tracking-[0.12em] font-semibold" style={{ fontFamily: 'var(--font-sans)' }}>
                    AI ANALYSIS
                  </span>
                  <span className="text-[8px] text-[var(--color-signal-teal)] ml-auto tabular-nums">
                    {selected.confidence}% CONF
                  </span>
                </div>
                <p className="text-[9px] text-[var(--color-text-secondary)] leading-relaxed mb-2.5">
                  {selected.summary}
                </p>
                <div className="space-y-1.5">
                  {selected.analysisDetails.map((detail, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-[var(--color-signal-teal-dim)] mt-1 shrink-0" />
                      <span className="text-[8px] text-[var(--color-text-muted)] leading-relaxed">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Environmental Metrics */}
              <div className="px-3 pb-3 border-t border-[var(--color-border-subtle)] pt-2.5">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <TrendingUp size={9} className="text-[var(--color-signal-amber)]" />
                  <span className="text-[9px] tracking-[0.12em] font-semibold" style={{ fontFamily: 'var(--font-sans)' }}>
                    MEASUREMENTS
                  </span>
                </div>
                <div className="space-y-3">
                  {selected.metrics.map((m) => (
                    <MetricRow key={m.label} {...m} />
                  ))}
                </div>
              </div>

              {/* Impact Statement */}
              <div className="px-3 pb-3 border-t border-[var(--color-border-subtle)] pt-2.5">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle size={9} className="text-[var(--color-signal-red)]" />
                  <span className="text-[9px] tracking-[0.12em] font-semibold" style={{ fontFamily: 'var(--font-sans)' }}>
                    IMPACT ASSESSMENT
                  </span>
                </div>
                <p className="text-[8px] text-[var(--color-text-secondary)] leading-relaxed">
                  {selected.impactStatement}
                </p>
              </div>

              {/* Correlated locations */}
              {correlatedPins.length > 0 && (
                <div className="px-3 pb-3 border-t border-[var(--color-border-subtle)] pt-2.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Link size={9} className="text-[var(--color-signal-teal-dim)]" />
                    <span className="text-[9px] tracking-[0.12em] font-semibold" style={{ fontFamily: 'var(--font-sans)' }}>
                      CORRELATED REPORTS
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {correlatedPins.map((cp) => (
                      <button
                        key={cp.id}
                        onClick={() => onSelect(cp.id)}
                        className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-[rgba(255,255,255,0.03)] cursor-pointer transition-colors text-left"
                      >
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: THREAT_COLORS[cp.severity], boxShadow: `0 0 4px ${THREAT_COLORS[cp.severity]}` }} />
                        <div className="flex-1 min-w-0">
                          <span className="text-[8px] text-[var(--color-text-primary)] block truncate">{cp.title}</span>
                          <span className="text-[7px] text-[var(--color-text-muted)]">{cp.city}, {cp.state}</span>
                        </div>
                        <ThreatBadge level={cp.severity} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="px-3 py-2.5 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Bot size={9} className="text-[var(--color-signal-teal-dim)]" />
                  <span className="text-[8px] text-[var(--color-text-muted)] tracking-wider">{selected.agentsActive} AGENTS</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User size={9} className="text-[var(--color-text-muted)]" />
                  <span className="text-[8px] text-[var(--color-text-muted)]">@{selected.user}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={9} className="text-[var(--color-text-muted)]" />
                  <span className="text-[8px] text-[var(--color-text-muted)]">{selected.timestamp}</span>
                </div>
              </div>
            </div>
          ) : (
            // ===== PIN LIST =====
            <div className="flex-1 overflow-y-auto">
              {pins.map((pin) => {
                const color = THREAT_COLORS[pin.severity];
                const catColor = CATEGORY_COLORS[pin.category] || '#8b8fa4';
                return (
                  <button
                    key={pin.id}
                    onClick={() => onSelect(pin.id)}
                    className="w-full text-left px-3 py-2.5 border-b border-[var(--color-border-subtle)] transition-colors cursor-pointer hover:bg-[rgba(255,255,255,0.02)]"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
                        <span className="text-[10px] font-medium text-[var(--color-text-primary)] truncate max-w-[160px]">{pin.title}</span>
                      </div>
                      <ThreatBadge level={pin.severity} />
                    </div>
                    <div className="flex items-center gap-2 ml-3.5">
                      <span className="text-[8px] text-[var(--color-text-muted)] tracking-wider">{pin.city}, {pin.state}</span>
                      <span className="text-[7px] px-1 py-px rounded" style={{ color: catColor, backgroundColor: `${catColor}15` }}>{pin.category}</span>
                      <span className="text-[7px] text-[var(--color-text-muted)] ml-auto flex items-center gap-0.5">
                        <User size={7} /> @{pin.user}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
