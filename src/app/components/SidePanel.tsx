'use client';

import { useState, useEffect } from 'react';
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
import { getPinImages } from '../data/images';

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
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const selected = pins.find((p) => p.id === selectedId);
  const images = selected ? getPinImages(selected.id) : [];

  // Reset image index when switching pins
  useEffect(() => { setActiveImageIdx(0); }, [selectedId]);

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

              {/* Field capture image */}
              <div className="mx-3 mt-3">
                <div
                  className="relative w-full h-40 rounded overflow-hidden bg-[var(--color-abyss)]"
                  style={{ border: `1px solid ${CATEGORY_COLORS[selected.category] || '#8b8fa4'}25` }}
                >
                  {images.length > 0 ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={images[activeImageIdx] || images[0]}
                        alt={selected.title}
                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0" style={{
                        background: `linear-gradient(135deg, ${CATEGORY_COLORS[selected.category] || '#8b8fa4'}18, ${CATEGORY_COLORS[selected.category] || '#8b8fa4'}06)`,
                      }} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                        <div style={{ color: CATEGORY_COLORS[selected.category] || '#8b8fa4' }}>
                          {CATEGORY_ICONS[selected.category] || <Camera size={14} />}
                        </div>
                        <span className="text-[9px] tracking-[0.15em] font-semibold" style={{ color: CATEGORY_COLORS[selected.category] || '#8b8fa4' }}>
                          FIELD CAPTURE
                        </span>
                      </div>
                    </>
                  )}
                  {/* Image counter */}
                  {images.length > 1 && (
                    <div className="absolute top-2 right-2 text-[7px] tracking-wider px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.7)' }}>
                      {activeImageIdx + 1}/{images.length}
                    </div>
                  )}
                  {/* User + time overlay */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-2">
                    <span className="text-[7px] text-[rgba(255,255,255,0.7)]">@{selected.user}</span>
                    <span className="text-[7px] text-[rgba(255,255,255,0.5)]">{selected.timestamp}</span>
                  </div>
                  {/* Corner brackets */}
                  {['top-2 left-2 border-t border-l', 'top-2 right-2 border-t border-r', 'bottom-2 left-2 border-b border-l', 'bottom-2 right-2 border-b border-r'].map((cls) => (
                    <div key={cls} className={`absolute w-3 h-3 ${cls}`} style={{ borderColor: `${CATEGORY_COLORS[selected.category] || '#8b8fa4'}40` }} />
                  ))}
                </div>

                {/* Thumbnail strip */}
                {images.length > 1 && (
                  <div className="flex gap-1 mt-1.5 overflow-x-auto scrollbar-hide">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImageIdx(i)}
                        className={`shrink-0 w-12 h-8 rounded overflow-hidden cursor-pointer transition-all ${
                          i === activeImageIdx
                            ? 'ring-1 ring-[var(--color-signal-teal)] opacity-100'
                            : 'opacity-50 hover:opacity-80'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt={`${selected.title} ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
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
