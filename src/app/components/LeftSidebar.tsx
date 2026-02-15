'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Camera,
  Compass,
  Bot,
  Share2,
  Network,
  MapPin,
  User,
  Clock,
  Play,
  Eye,
  Zap,
  Droplets,
  TreePine,
  Thermometer,
  Sparkles,
  ArrowRight,
  Radar,
  Layers,
  MessageSquare,
  ImageIcon,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import GlobalChatbot from './GlobalChatbot';
import {
  type PinReport,
  type ThreatLevel,
  THREAT_COLORS,
  THREAT_LABELS,
  CATEGORY_COLORS,
} from '../data/locations';

export type NavView = 'feed' | 'odyssey' | 'slack' | 'chatbot' | null;

interface SlackUpload {
  filename: string;
  original_name: string;
  user: string;
  channel: string;
  timestamp: number;
  mimetype: string;
}

/* ── unique gradient "photo" per pin based on category + id hash ── */
function getPhotoStyle(pin: PinReport): React.CSSProperties {
  const palettes: Record<string, [string, string, string, string]> = {
    Water:   ['#041824', '#0a3a4a', '#064e5c', '#06b6d4'],
    Air:     ['#140d28', '#2a1a46', '#3d2a6e', '#a78bfa'],
    Soil:    ['#1a1005', '#30200a', '#4a3015', '#f5a623'],
    Bio:     ['#061408', '#0e2810', '#143a1a', '#22c55e'],
    Climate: ['#0a1228', '#152040', '#1e3058', '#3b82f6'],
  };
  const c = palettes[pin.category] || palettes.Water;
  const h = pin.id.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const a1 = (h * 47) % 360;
  const x1 = 15 + (h % 70);
  const y1 = 15 + ((h * 7) % 70);
  const x2 = 15 + ((h * 13) % 70);
  const y2 = 15 + ((h * 19) % 70);
  return {
    background: [
      `radial-gradient(ellipse at ${x1}% ${y1}%, ${c[3]}35 0%, transparent 45%)`,
      `radial-gradient(ellipse at ${x2}% ${y2}%, ${c[2]}50 0%, transparent 55%)`,
      `linear-gradient(${a1}deg, ${c[0]} 0%, ${c[1]} 40%, ${c[2]} 70%, ${c[0]} 100%)`,
    ].join(', '),
  };
}

const CAT_ICON: Record<string, React.ReactNode> = {
  Water:   <Droplets size={10} />,
  Air:     <Zap size={10} />,
  Soil:    <TreePine size={10} />,
  Bio:     <TreePine size={10} />,
  Climate: <Thermometer size={10} />,
};

interface LeftSidebarProps {
  pins: PinReport[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  activeView: NavView;
  onViewChange: (v: NavView) => void;
  onShowGraph?: () => void;
  onEnterOdyssey?: (pin: PinReport, imageUrl?: string) => void;
}

export default function LeftSidebar({
  pins,
  selectedId,
  onSelect,
  activeView,
  onViewChange,
  onShowGraph,
  onEnterOdyssey,
}: LeftSidebarProps) {
  const [categoryFilter, setCategoryFilter] = useState('All');

  const filteredPins = useMemo(
    () => (categoryFilter === 'All' ? pins : pins.filter((p) => p.category === categoryFilter)),
    [pins, categoryFilter],
  );

  const categories = ['All', 'Water', 'Air', 'Soil', 'Bio', 'Climate'];

  // ── Slack uploads polling ──
  const [slackUploads, setSlackUploads] = useState<SlackUpload[]>([]);
  const [slackLoading, setSlackLoading] = useState(false);

  const fetchSlackUploads = useCallback(async () => {
    try {
      const res = await fetch('/api/slack-uploads');
      if (res.ok) {
        const data = await res.json();
        setSlackUploads(data);
      }
    } catch { /* silent */ }
  }, []);

  // Poll every 5 seconds when slack view is active
  useEffect(() => {
    fetchSlackUploads();
    if (activeView === 'slack') {
      const interval = setInterval(fetchSlackUploads, 5000);
      return () => clearInterval(interval);
    }
  }, [activeView, fetchSlackUploads]);

  const navItems: { id: NavView & string; icon: React.ReactNode; label: string; badge?: number }[] = [
    { id: 'feed', icon: <Camera size={18} />, label: 'Feed', badge: pins.length },
    { id: 'slack', icon: <MessageSquare size={18} />, label: 'Slack', badge: slackUploads.length || undefined },
    { id: 'odyssey', icon: <Compass size={18} />, label: 'Odyssey' },
  ];

  return (
    <div className="fixed top-14 left-3 bottom-12 z-30">
      <div className="glass-panel rounded flex h-full overflow-hidden">
        {/* ─── NAV RAIL ─── */}
        <div className="w-12 shrink-0 flex flex-col items-center py-3 gap-1 border-r border-[var(--color-border-subtle)]">
          {navItems.map((item) => {
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(active ? null : item.id)}
                className={`relative w-9 h-9 rounded flex items-center justify-center cursor-pointer transition-all duration-200 ${
                  active
                    ? 'bg-[rgba(15,245,196,0.1)] text-[var(--color-signal-teal)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.03)]'
                }`}
                title={item.label}
              >
                {item.icon}
                {item.badge != null && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 rounded-full bg-[var(--color-signal-teal)] text-[7px] font-bold text-[var(--color-void)] flex items-center justify-center px-0.5">
                    {item.badge}
                  </span>
                )}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-px w-[3px] h-4 rounded-r bg-[var(--color-signal-teal)]" />
                )}
              </button>
            );
          })}

          <div className="w-6 h-px bg-[var(--color-border-subtle)] my-2" />

          {/* AI Chatbot */}
          <button
            onClick={() => onViewChange(activeView === 'chatbot' ? null : 'chatbot')}
            className={`relative w-9 h-9 rounded flex items-center justify-center cursor-pointer transition-all duration-200 ${
              activeView === 'chatbot'
                ? 'bg-[rgba(15,245,196,0.1)] text-[var(--color-signal-teal)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.03)]'
            }`}
            title="AI Assistant"
          >
            <Bot size={18} />
            {activeView === 'chatbot' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-px w-[3px] h-4 rounded-r bg-[var(--color-signal-teal)]" />
            )}
          </button>
          <button
            className="w-9 h-9 rounded flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] cursor-pointer transition-colors hover:bg-[rgba(255,255,255,0.03)]"
            title="Correlations"
          >
            <Share2 size={18} />
          </button>

          <div className="w-6 h-px bg-[var(--color-border-subtle)] my-2" />

          {/* Knowledge Graph */}
          <button
            onClick={onShowGraph}
            className="w-9 h-9 rounded flex items-center justify-center text-[var(--color-signal-teal)] hover:bg-[rgba(15,245,196,0.1)] cursor-pointer transition-all"
            title="Knowledge Graph"
          >
            <Network size={18} />
          </button>
        </div>

        {/* ─── EXPANDED PANEL ─── */}
        {activeView && (
          <div className="w-80 flex flex-col overflow-hidden fade-in">
            {/* ══════════ FEED ══════════ */}
            {activeView === 'feed' && (
              <>
                {/* header */}
                <div className="px-3 py-2.5 border-b border-[var(--color-border-subtle)]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Camera size={10} className="text-[var(--color-signal-teal)]" />
                      <span
                        className="text-[10px] tracking-[0.15em] font-semibold"
                        style={{ fontFamily: 'var(--font-sans)' }}
                      >
                        FIELD REPORTS
                      </span>
                    </div>
                    <span className="text-[9px] text-[var(--color-text-muted)]">
                      {filteredPins.length} PUBLISHED
                    </span>
                  </div>

                  {/* category chips */}
                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`text-[8px] tracking-wider px-2 py-1 rounded-full whitespace-nowrap cursor-pointer transition-all ${
                          categoryFilter === cat
                            ? 'text-[var(--color-signal-teal)] bg-[rgba(15,245,196,0.1)] border border-[rgba(15,245,196,0.2)]'
                            : 'text-[var(--color-text-muted)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border)] hover:text-[var(--color-text-secondary)]'
                        }`}
                      >
                        {cat === 'All' ? 'ALL' : cat.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* card list */}
                <div className="flex-1 overflow-y-auto">
                  {filteredPins.map((pin) => {
                    const selected = pin.id === selectedId;
                    const catColor = CATEGORY_COLORS[pin.category] || '#8b8fa4';
                    const threatColor = THREAT_COLORS[pin.severity];

                    return (
                      <button
                        key={pin.id}
                        onClick={() => onSelect(pin.id)}
                        className={`w-full text-left p-2.5 border-b border-[var(--color-border-subtle)] transition-all cursor-pointer group ${
                          selected ? 'bg-[rgba(15,245,196,0.04)]' : 'hover:bg-[rgba(255,255,255,0.02)]'
                        }`}
                      >
                        {/* photo area */}
                        <div
                          className="relative w-full h-28 rounded overflow-hidden mb-2"
                          style={getPhotoStyle(pin)}
                        >
                          {/* grid */}
                          <div
                            className="absolute inset-0"
                            style={{
                              backgroundImage: `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
                                                linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
                              backgroundSize: '16px 16px',
                            }}
                          />
                          {/* noise dither */}
                          <div
                            className="absolute inset-0 opacity-40"
                            style={{
                              backgroundImage:
                                'repeating-conic-gradient(rgba(255,255,255,0.03) 0% 25%, transparent 25% 50%)',
                              backgroundSize: '2px 2px',
                            }}
                          />
                          {/* scan sweep on hover */}
                          <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 scan-sweep-bg"
                          />

                          {/* corners */}
                          {[
                            'top-1.5 left-1.5 border-t border-l',
                            'top-1.5 right-1.5 border-t border-r',
                            'bottom-1.5 left-1.5 border-b border-l',
                            'bottom-1.5 right-1.5 border-b border-r',
                          ].map((cls) => (
                            <div
                              key={cls}
                              className={`absolute w-2.5 h-2.5 ${cls}`}
                              style={{ borderColor: `${catColor}50` }}
                            />
                          ))}

                          {/* category pip */}
                          <div
                            className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${catColor}25`, color: catColor }}
                          >
                            {CAT_ICON[pin.category]}
                          </div>

                          {/* threat badge */}
                          <div className="absolute bottom-2 left-2">
                            <span
                              className="text-[7px] tracking-widest font-bold px-1.5 py-0.5 rounded"
                              style={{
                                color: threatColor,
                                backgroundColor: 'rgba(0,0,0,0.55)',
                                border: `1px solid ${threatColor}40`,
                              }}
                            >
                              {THREAT_LABELS[pin.severity]}
                            </span>
                          </div>

                          {/* selected overlay */}
                          {selected && (
                            <div
                              className="absolute inset-0 rounded"
                              style={{ border: '2px solid var(--color-signal-teal)' }}
                            >
                              <div className="absolute top-2 left-2 flex items-center gap-1">
                                <Eye size={8} className="text-[var(--color-signal-teal)]" />
                                <span className="text-[7px] text-[var(--color-signal-teal)] tracking-wider font-semibold">
                                  ACTIVE
                                </span>
                              </div>
                            </div>
                          )}

                          {/* timestamp overlay */}
                          <div className="absolute bottom-2 right-2">
                            <span className="text-[7px] text-[rgba(255,255,255,0.4)] tabular-nums">
                              {pin.timestamp}
                            </span>
                          </div>
                        </div>

                        {/* info */}
                        <div className="space-y-1">
                          <h4
                            className="text-[10px] font-medium text-[var(--color-text-primary)] leading-tight truncate"
                            style={{ fontFamily: 'var(--font-sans)' }}
                          >
                            {pin.title}
                          </h4>
                          <div className="flex items-center gap-1.5">
                            <MapPin size={7} className="text-[var(--color-text-muted)] shrink-0" />
                            <span className="text-[8px] text-[var(--color-text-muted)] truncate">
                              {pin.neighborhood}, {pin.city}
                            </span>
                          </div>
                          <p className="text-[8px] text-[var(--color-text-muted)] leading-relaxed feed-line-clamp">
                            {pin.summary}
                          </p>
                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="text-[7px] text-[var(--color-text-muted)] flex items-center gap-0.5">
                              <User size={7} /> @{pin.user}
                            </span>
                            <span className="text-[7px] text-[var(--color-text-muted)] flex items-center gap-0.5">
                              <Clock size={7} /> {pin.timestamp}
                            </span>
                            <span className="text-[7px] text-[var(--color-text-muted)] flex items-center gap-0.5 ml-auto">
                              <Bot size={7} /> {pin.agentsActive}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* ══════════ SLACK ══════════ */}
            {activeView === 'slack' && (
              <>
                {/* header */}
                <div className="px-3 py-2.5 border-b border-[var(--color-border-subtle)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare size={10} className="text-[var(--color-signal-teal)]" />
                      <span
                        className="text-[10px] tracking-[0.15em] font-semibold"
                        style={{ fontFamily: 'var(--font-sans)' }}
                      >
                        SLACK FEED
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-[var(--color-text-muted)]">
                        {slackUploads.length} UPLOAD{slackUploads.length !== 1 ? 'S' : ''}
                      </span>
                      <button
                        onClick={() => { setSlackLoading(true); fetchSlackUploads().finally(() => setSlackLoading(false)); }}
                        className="w-5 h-5 rounded flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-signal-teal)] hover:bg-[rgba(15,245,196,0.1)] cursor-pointer transition-all"
                        title="Refresh"
                      >
                        <RefreshCw size={9} className={slackLoading ? 'animate-spin' : ''} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-[var(--color-signal-teal)] data-live" />
                    <span className="text-[8px] text-[var(--color-text-muted)] tracking-wider">
                      AUTO-SYNC EVERY 5s
                    </span>
                  </div>
                </div>

                {/* upload list */}
                <div className="flex-1 overflow-y-auto">
                  {slackUploads.length === 0 ? (
                    <div className="px-3 py-8 text-center">
                      <ImageIcon size={24} className="text-[var(--color-text-muted)] mx-auto mb-2 opacity-40" />
                      <p className="text-[9px] text-[var(--color-text-muted)] leading-relaxed">
                        No images uploaded yet.<br />
                        Upload a photo in Slack to see it here.
                      </p>
                    </div>
                  ) : (
                    slackUploads.map((upload) => {
                      const dt = new Date(upload.timestamp * 1000);
                      const timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const dateStr = dt.toLocaleDateString([], { month: 'short', day: 'numeric' });
                      const isRecent = Date.now() / 1000 - upload.timestamp < 300; // within 5 min

                      return (
                        <div
                          key={upload.filename}
                          className="p-2.5 border-b border-[var(--color-border-subtle)] hover:bg-[rgba(255,255,255,0.02)] transition-all group"
                        >
                          {/* image */}
                          <div className="relative w-full h-36 rounded overflow-hidden mb-2 bg-[var(--color-abyss)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`/api/slack-uploads/image?f=${encodeURIComponent(upload.filename)}`}
                              alt={upload.original_name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            {/* scan overlay on hover */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 scan-sweep-bg" />
                            {/* corners */}
                            {[
                              'top-1.5 left-1.5 border-t border-l',
                              'top-1.5 right-1.5 border-t border-r',
                              'bottom-1.5 left-1.5 border-b border-l',
                              'bottom-1.5 right-1.5 border-b border-r',
                            ].map((cls) => (
                              <div
                                key={cls}
                                className={`absolute w-2.5 h-2.5 ${cls}`}
                                style={{ borderColor: 'rgba(15,245,196,0.3)' }}
                              />
                            ))}
                            {/* NEW badge */}
                            {isRecent && (
                              <div className="absolute top-2 left-2">
                                <span
                                  className="text-[7px] tracking-widest font-bold px-1.5 py-0.5 rounded"
                                  style={{
                                    color: '#0ff5c4',
                                    backgroundColor: 'rgba(0,0,0,0.55)',
                                    border: '1px solid rgba(15,245,196,0.4)',
                                  }}
                                >
                                  NEW
                                </span>
                              </div>
                            )}
                            {/* timestamp */}
                            <div className="absolute bottom-2 right-2">
                              <span className="text-[7px] text-[rgba(255,255,255,0.4)] tabular-nums">
                                {timeStr}
                              </span>
                            </div>
                          </div>

                          {/* info */}
                          <div className="space-y-1">
                            <h4
                              className="text-[10px] font-medium text-[var(--color-text-primary)] leading-tight truncate"
                              style={{ fontFamily: 'var(--font-sans)' }}
                            >
                              {upload.original_name}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="text-[7px] text-[var(--color-text-muted)] flex items-center gap-0.5">
                                <User size={7} /> {upload.user}
                              </span>
                              <span className="text-[7px] text-[var(--color-text-muted)] flex items-center gap-0.5">
                                <Clock size={7} /> {dateStr}
                              </span>
                              <span className="text-[7px] text-[var(--color-text-muted)] flex items-center gap-0.5 ml-auto">
                                <MessageSquare size={7} /> {upload.channel}
                              </span>
                            </div>
                            {/* Enter Odyssey with this photo */}
                            <button
                              onClick={() => {
                                const target = pins.find((p) => p.severity === 'critical') || pins[0];
                                if (target) {
                                  onEnterOdyssey?.(target, `/api/slack-uploads/image?f=${encodeURIComponent(upload.filename)}`);
                                }
                              }}
                              className="w-full mt-1.5 py-1.5 rounded flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:brightness-110 active:scale-[0.98]"
                              style={{
                                background: 'linear-gradient(135deg, rgba(167,139,250,0.12), rgba(167,139,250,0.05))',
                                border: '1px solid rgba(167,139,250,0.25)',
                              }}
                            >
                              <Eye size={9} style={{ color: '#a78bfa' }} />
                              <span
                                className="text-[8px] tracking-[0.12em] font-semibold"
                                style={{ fontFamily: 'var(--font-sans)', color: '#a78bfa' }}
                              >
                                ENTER ODYSSEY (I2V)
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* footer */}
                <div className="p-3 border-t border-[var(--color-border-subtle)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-signal-teal)] data-live" />
                      <span className="text-[8px] text-[var(--color-text-muted)] tracking-wider">
                        COMPOSIO + SLACK
                      </span>
                    </div>
                    <span className="text-[8px] text-[var(--color-text-muted)]">
                      BOT ONLINE
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* ══════════ AI CHATBOT ══════════ */}
            {activeView === 'chatbot' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <GlobalChatbot onClose={() => onViewChange(null)} />
              </div>
            )}

            {/* ══════════ ODYSSEY ══════════ */}
            {activeView === 'odyssey' && (
              <>
                {/* header */}
                <div className="px-3 py-2.5 border-b border-[var(--color-border-subtle)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Compass size={10} className="text-[var(--color-signal-teal)]" />
                      <span
                        className="text-[10px] tracking-[0.15em] font-semibold"
                        style={{ fontFamily: 'var(--font-sans)' }}
                      >
                        ODYSSEY
                      </span>
                    </div>
                    <span className="text-[9px] text-[var(--color-signal-teal)] flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-[var(--color-signal-teal)] data-live inline-block" />
                      ONLINE
                    </span>
                  </div>
                </div>

                {/* hero preview */}
                <div className="relative mx-3 mt-3 h-44 rounded overflow-hidden">
                  <div
                    className="absolute inset-0 odyssey-gradient"
                    style={{
                      background: `
                        radial-gradient(ellipse at 30% 50%, rgba(15,245,196,0.15) 0%, transparent 50%),
                        radial-gradient(ellipse at 70% 30%, rgba(59,130,246,0.12) 0%, transparent 50%),
                        radial-gradient(ellipse at 50% 80%, rgba(167,139,250,0.1) 0%, transparent 50%),
                        linear-gradient(135deg, #0a0e14, #111520, #0a0e14)
                      `,
                    }}
                  />
                  {/* perspective grid */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                  >
                    <div
                      className="absolute inset-x-0 bottom-0 h-[120%]"
                      style={{
                        backgroundImage: `
                          linear-gradient(rgba(15,245,196,0.05) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(15,245,196,0.05) 1px, transparent 1px)
                        `,
                        backgroundSize: '28px 28px',
                        transform: 'perspective(200px) rotateX(40deg)',
                        transformOrigin: 'center bottom',
                      }}
                    />
                  </div>
                  {/* viewfinder */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border border-[rgba(15,245,196,0.25)] flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full border border-[rgba(15,245,196,0.15)] flex items-center justify-center">
                          <Compass size={20} className="text-[var(--color-signal-teal)] spin-slow" />
                        </div>
                      </div>
                      <div className="absolute top-1/2 -left-4 -right-4 h-px bg-[rgba(15,245,196,0.12)]" />
                      <div className="absolute -top-4 -bottom-4 left-1/2 w-px bg-[rgba(15,245,196,0.12)]" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-0 right-0 text-center">
                    <span
                      className="text-[8px] tracking-[0.25em] text-[rgba(15,245,196,0.7)]"
                      style={{ fontFamily: 'var(--font-sans)' }}
                    >
                      WORLD MODEL VISUALIZATION
                    </span>
                  </div>
                </div>

                {/* description */}
                <div className="px-3 py-3">
                  <p className="text-[9px] text-[var(--color-text-secondary)] leading-relaxed">
                    Step into AI-predicted environmental futures. Odyssey uses multi-agent
                    world models to simulate and visualize change trajectories across
                    monitored locations.
                  </p>
                </div>

                {/* I2V status */}
                {slackUploads.length > 0 && (
                  <div className="mx-3 mb-2 px-2.5 py-2 rounded"
                    style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-1 h-1 rounded-full" style={{ background: '#a78bfa', boxShadow: '0 0 4px #a78bfa' }} />
                      <span className="text-[8px] tracking-wider font-semibold" style={{ color: '#a78bfa' }}>
                        IMAGE-TO-VIDEO READY
                      </span>
                    </div>
                    <p className="text-[8px] text-[var(--color-text-muted)] leading-relaxed">
                      {slackUploads.length} field photo{slackUploads.length !== 1 ? 's' : ''} available.
                      Simulations will use the latest photo as the starting frame for maximum accuracy.
                    </p>
                  </div>
                )}

                {/* simulations header */}
                <div className="px-3 pb-2">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[9px] tracking-[0.12em] font-semibold text-[var(--color-text-secondary)]"
                      style={{ fontFamily: 'var(--font-sans)' }}
                    >
                      AVAILABLE SIMULATIONS
                    </span>
                    <span className="text-[8px] text-[var(--color-text-muted)]">
                      {pins.filter((p) => p.severity === 'critical' || p.severity === 'high').length} READY
                    </span>
                  </div>
                </div>

                {/* simulation list */}
                <div className="flex-1 overflow-y-auto px-3 space-y-1.5 pb-3">
                  {pins
                    .filter((p) => p.severity === 'critical' || p.severity === 'high')
                    .map((pin) => {
                      const catColor = CATEGORY_COLORS[pin.category] || '#8b8fa4';
                      const threatColor = THREAT_COLORS[pin.severity];
                      return (
                        <button
                          key={pin.id}
                          onClick={() => {
                            // Use newest Slack photo if available for I2V
                            const img = slackUploads.length > 0
                              ? `/api/slack-uploads/image?f=${encodeURIComponent(slackUploads[0].filename)}`
                              : undefined;
                            onEnterOdyssey?.(pin, img);
                          }}
                          className="w-full text-left p-2 rounded border border-[var(--color-border-subtle)] hover:border-[var(--color-border)] hover:bg-[rgba(255,255,255,0.02)] cursor-pointer transition-all group"
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className="w-6 h-6 rounded flex items-center justify-center mt-0.5 shrink-0"
                              style={{ backgroundColor: `${catColor}15` }}
                            >
                              <Play size={10} style={{ color: catColor }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[9px] font-medium text-[var(--color-text-primary)] truncate">
                                  {pin.city}
                                </span>
                                <div
                                  className="w-1 h-1 rounded-full shrink-0"
                                  style={{ backgroundColor: threatColor, boxShadow: `0 0 4px ${threatColor}` }}
                                />
                              </div>
                              <span className="text-[8px] text-[var(--color-text-muted)] block truncate">
                                {pin.title}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className="text-[7px] px-1 py-px rounded"
                                  style={{ color: catColor, backgroundColor: `${catColor}15` }}
                                >
                                  {pin.category}
                                </span>
                                <span className="text-[7px] text-[var(--color-signal-teal)] flex items-center gap-0.5">
                                  <Sparkles size={7} /> {pin.confidence}%
                                </span>
                              </div>
                            </div>
                            <ArrowRight
                              size={10}
                              className="text-[var(--color-text-muted)] group-hover:text-[var(--color-signal-teal)] transition-colors shrink-0 mt-1"
                            />
                          </div>
                        </button>
                      );
                    })}
                </div>

                {/* CTA */}
                <div className="p-3 border-t border-[var(--color-border-subtle)]">
                  <button
                    onClick={() => {
                      const selected = selectedId ? pins.find((p) => p.id === selectedId) : null;
                      const target = selected || pins.find((p) => p.severity === 'critical') || pins[0];
                      const img = slackUploads.length > 0
                        ? `/api/slack-uploads/image?f=${encodeURIComponent(slackUploads[0].filename)}`
                        : undefined;
                      if (target) onEnterOdyssey?.(target, img);
                    }}
                    className="w-full py-2.5 rounded flex items-center justify-center gap-2 cursor-pointer transition-all hover:brightness-110 active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(15,245,196,0.15), rgba(15,245,196,0.06))',
                      border: '1px solid rgba(15,245,196,0.3)',
                    }}
                  >
                    <Eye size={12} className="text-[var(--color-signal-teal)]" />
                    <span
                      className="text-[10px] tracking-[0.15em] font-semibold text-[var(--color-signal-teal)]"
                      style={{ fontFamily: 'var(--font-sans)' }}
                    >
                      ENTER ODYSSEY
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
