'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { type PinReport, THREAT_COLORS, CATEGORY_COLORS } from '@/data/locations';
import { getPinImage } from '@/data/images';

interface LocationCarouselProps {
  pins: PinReport[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function LocationCarousel({ pins, selectedId, onSelect }: LocationCarouselProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const filtered = useMemo(() => {
    if (!query.trim()) return pins;
    const q = query.toLowerCase();
    return pins.filter(
      (p) =>
        p.city.toLowerCase().includes(q) ||
        p.neighborhood.toLowerCase().includes(q) ||
        p.state.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [pins, query]);

  const severityOrder: Record<string, number> = { critical: 0, high: 1, elevated: 2, moderate: 3, low: 4 };

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => (severityOrder[a.severity] ?? 5) - (severityOrder[b.severity] ?? 5)),
    [filtered]
  );

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    const ro = new ResizeObserver(updateScrollButtons);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      ro.disconnect();
    };
  }, [updateScrollButtons, filtered]);

  useEffect(() => {
    if (!selectedId || !scrollRef.current) return;
    const idx = sorted.findIndex((p) => p.id === selectedId);
    if (idx < 0) return;
    const card = scrollRef.current.children[idx] as HTMLElement | undefined;
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [selectedId, sorted]);

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 glass-panel px-3 py-1.5 flex items-center gap-2 rounded-full cursor-pointer hover:border-[var(--color-accent-dim)] transition-colors"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <Search size={10} className="text-[var(--color-accent)]" />
        <span className="text-[9px] tracking-[0.15em] text-[var(--color-text-secondary)] uppercase">
          Locations
        </span>
        <span className="text-[8px] text-[var(--color-text-muted)]">{pins.length}</span>
      </button>
    );
  }

  return (
    <div
      className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20"
      style={{
        width: 'min(880px, calc(100vw - 200px))',
        animation: 'fade-in-up 0.25s ease-out forwards',
      }}
    >
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(12,14,20,0.88), rgba(17,19,24,0.85))',
          backdropFilter: 'blur(24px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.2)',
          border: '1px solid rgba(37,40,56,0.6)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.05) inset',
        }}
      >
        {/* Single row: search + cards + arrows */}
        <div className="flex items-center gap-2 px-2.5 py-2">
          {/* Search input */}
          <div className="relative flex-shrink-0" style={{ width: 150 }}>
            <Search
              size={9}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Location..."
              className="w-full bg-[var(--color-deep)] border border-[var(--color-border-subtle)] rounded-md pl-6 pr-6 py-1 text-[9px] tracking-[0.04em] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-dim)] transition-colors"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            {query ? (
              <button
                onClick={() => setQuery('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] cursor-pointer"
              >
                <X size={8} />
              </button>
            ) : (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[7px] text-[var(--color-text-muted)]">
                {sorted.length}
              </span>
            )}
          </div>

          {/* Left arrow */}
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="flex-shrink-0 p-1 rounded border border-[var(--color-border-subtle)] hover:border-[var(--color-border)] disabled:opacity-15 transition-all cursor-pointer disabled:cursor-default"
          >
            <ChevronLeft size={10} className="text-[var(--color-text-secondary)]" />
          </button>

          {/* Cards strip */}
          <div
            ref={scrollRef}
            className="flex gap-1.5 overflow-x-auto scrollbar-hide flex-1 min-w-0"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {sorted.length === 0 && (
              <div className="flex-1 flex items-center justify-center py-2 text-[8px] text-[var(--color-text-muted)] tracking-[0.1em]">
                NO MATCHES
              </div>
            )}
            {sorted.map((pin) => {
              const isSelected = pin.id === selectedId;
              const threatColor = THREAT_COLORS[pin.severity];
              const catColor = CATEGORY_COLORS[pin.category] || 'rgba(255,255,255,0.55)';
              const imgSrc = pin.imageUrl || getPinImage(pin.id);

              return (
                <div
                  key={pin.id}
                  onClick={() => onSelect(pin.id)}
                  className="flex-shrink-0 rounded-md overflow-hidden cursor-pointer transition-all duration-150 group relative"
                  style={{
                    width: 130,
                    height: 72,
                    scrollSnapAlign: 'start',
                    border: isSelected
                      ? `1.5px solid ${threatColor}99`
                      : '1px solid transparent',
                    boxShadow: isSelected ? `0 0 10px ${threatColor}25` : 'none',
                  }}
                >
                  {/* Image */}
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={pin.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-400 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(135deg, ${catColor}22, var(--color-abyss), ${catColor}11)`,
                      }}
                    />
                  )}

                  {/* Dark overlay */}
                  <div
                    className="absolute inset-0 transition-opacity duration-150"
                    style={{
                      background: 'linear-gradient(to top, rgba(8,9,12,0.92) 0%, rgba(8,9,12,0.3) 50%, rgba(8,9,12,0.15) 100%)',
                    }}
                  />

                  {/* Severity dot — top left */}
                  <div className="absolute top-1 left-1.5 flex items-center gap-1">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: threatColor, boxShadow: `0 0 4px ${threatColor}88` }}
                    />
                    <span
                      className="text-[6px] tracking-[0.12em] font-semibold uppercase"
                      style={{ color: threatColor }}
                    >
                      {pin.severity === 'critical' ? 'CRIT' : pin.severity === 'elevated' ? 'ELEV' : pin.severity.toUpperCase().slice(0, 4)}
                    </span>
                  </div>

                  {/* Category — top right */}
                  <span
                    className="absolute top-1 right-1.5 text-[6px] tracking-[0.08em]"
                    style={{ color: `${catColor}cc` }}
                  >
                    {pin.category}
                  </span>

                  {/* LIVE badge */}
                  {pin.source === 'slack' && (
                    <div
                      className="absolute top-1 right-1.5 text-[5px] tracking-[0.15em] px-1 py-px rounded"
                      style={{
                        background: 'rgba(0,212,255,0.15)',
                        color: 'var(--color-accent)',
                        border: '1px solid rgba(0,212,255,0.3)',
                      }}
                    >
                      LIVE
                    </div>
                  )}

                  {/* Title + location — bottom */}
                  <div className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5">
                    <div className="text-[8px] font-medium text-[var(--color-text-primary)] leading-tight truncate">
                      {pin.title}
                    </div>
                    <div className="text-[6.5px] text-[var(--color-text-secondary)] truncate leading-tight mt-px">
                      {pin.city}{pin.state ? `, ${pin.state}` : ''}
                    </div>
                  </div>

                  {/* Hover highlight */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none rounded-md"
                    style={{ boxShadow: `inset 0 0 0 1px ${catColor}33` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Right arrow */}
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="flex-shrink-0 p-1 rounded border border-[var(--color-border-subtle)] hover:border-[var(--color-border)] disabled:opacity-15 transition-all cursor-pointer disabled:cursor-default"
          >
            <ChevronRight size={10} className="text-[var(--color-text-secondary)]" />
          </button>

          {/* Close */}
          <button
            onClick={() => setIsOpen(false)}
            className="flex-shrink-0 p-1 rounded hover:bg-[var(--color-raised)] transition-colors cursor-pointer"
          >
            <X size={10} className="text-[var(--color-text-muted)]" />
          </button>
        </div>
      </div>
    </div>
  );
}
