'use client';

import {
  Globe,
  Map as MapIcon,
  Mountain,
  Satellite,
  Flame,
  CloudRain,
  Activity,
} from 'lucide-react';

interface ToggleOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}

interface TopBarProps {
  toggles: Record<string, boolean>;
  onToggle: (key: string) => void;
}

export default function TopBar({ toggles, onToggle }: TopBarProps) {
  const options: ToggleOption[] = [
    {
      id: 'globe',
      label: 'GLOBE',
      icon: <Globe size={13} />,
      active: toggles.globe,
    },
    {
      id: 'terrain',
      label: 'TERRAIN',
      icon: <Mountain size={13} />,
      active: toggles.terrain,
    },
    {
      id: 'satellite',
      label: 'SAT',
      icon: <Satellite size={13} />,
      active: toggles.satellite,
    },
    {
      id: 'heatmap',
      label: 'THREAT',
      icon: <Flame size={13} />,
      active: toggles.heatmap,
    },
    {
      id: 'weather',
      label: 'PRECIP',
      icon: <CloudRain size={13} />,
      active: toggles.weather,
    },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-2.5">
      {/* Branding */}
      <div className="glass-panel rounded px-4 py-2 flex items-center gap-3">
        <div className="relative">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: '#0ff5c4' }}
          />
          <div
            className="absolute inset-0 w-2 h-2 rounded-full"
            style={{
              backgroundColor: '#0ff5c4',
              animation: 'pulse-ring 2s ease-out infinite',
            }}
          />
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className="text-xs tracking-[0.3em] font-semibold"
            style={{ fontFamily: 'var(--font-sans)', color: '#0ff5c4' }}
          >
            DEEP
          </span>
          <span
            className="text-xs tracking-[0.2em] font-medium"
            style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}
          >
            ENVIRONMENT
          </span>
        </div>
        <div className="ml-2 flex items-center gap-1.5 pl-3 border-l border-[var(--color-border)]">
          <Activity size={10} className="text-[var(--color-signal-teal)]" />
          <span className="text-[9px] text-[var(--color-text-muted)] tracking-wider">
            v2.4.1
          </span>
        </div>
      </div>

      {/* View Controls */}
      <div className="glass-panel rounded px-1.5 py-1.5 flex items-center gap-1">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onToggle(opt.id)}
            className={`toggle-btn flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] tracking-wider border border-transparent cursor-pointer ${
              opt.active ? 'toggle-btn-active' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
            style={{ background: opt.active ? undefined : 'transparent' }}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
