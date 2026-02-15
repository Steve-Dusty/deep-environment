'use client';

import { Bot, Radio, Database, Signal, MapPin, Camera } from 'lucide-react';

interface StatusBarProps {
  coordinates: { lng: number; lat: number } | null;
  zoom: number;
  projection: string;
  agentsOnline: number;
  dataStreams: number;
  fieldReports: number;
}

export default function StatusBar({
  coordinates,
  zoom,
  projection,
  agentsOnline,
  dataStreams,
  fieldReports,
}: StatusBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 glass-panel rounded-none border-x-0 border-b-0 px-4 py-1.5 flex items-center justify-between">
      {/* Left: System Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-signal-teal)] data-live" />
          <span className="text-[9px] text-[var(--color-text-muted)] tracking-wider">
            SYSTEM NOMINAL
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Bot size={9} className="text-[var(--color-signal-teal-dim)]" />
          <span className="text-[9px] text-[var(--color-text-secondary)]">
            {agentsOnline}
          </span>
          <span className="text-[8px] text-[var(--color-text-muted)]">AGENTS</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Database size={9} className="text-[var(--color-signal-blue-dim)]" />
          <span className="text-[9px] text-[var(--color-text-secondary)]">
            {dataStreams}
          </span>
          <span className="text-[8px] text-[var(--color-text-muted)]">STREAMS</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Camera size={9} className="text-[var(--color-signal-amber-dim)]" />
          <span className="text-[9px] text-[var(--color-text-secondary)]">
            {fieldReports}
          </span>
          <span className="text-[8px] text-[var(--color-text-muted)]">REPORTS</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Signal size={9} className="text-[var(--color-signal-teal-dim)]" />
          <span className="text-[8px] text-[var(--color-text-muted)]">
            SYNC 2.4s
          </span>
        </div>
      </div>

      {/* Center: Coordinates */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <MapPin size={9} className="text-[var(--color-text-muted)]" />
          <span className="text-[9px] text-[var(--color-text-secondary)] font-medium tabular-nums w-36 text-center">
            {coordinates
              ? `${coordinates.lat.toFixed(4)}°  ${coordinates.lng.toFixed(4)}°`
              : '—  —'}
          </span>
        </div>
      </div>

      {/* Right: Map info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Radio size={9} className="text-[var(--color-text-muted)]" />
          <span className="text-[8px] text-[var(--color-text-muted)] tracking-wider uppercase">
            {projection}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[8px] text-[var(--color-text-muted)]">Z</span>
          <span className="text-[9px] text-[var(--color-text-secondary)] font-medium tabular-nums">
            {zoom.toFixed(1)}
          </span>
        </div>
        <span className="text-[8px] text-[var(--color-text-muted)] tracking-wider">
          MAPBOX GL
        </span>
      </div>
    </div>
  );
}
