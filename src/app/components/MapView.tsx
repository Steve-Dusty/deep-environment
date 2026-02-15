'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import {
  pinReports,
  getHeatmapGeoJSON,
  getConnectionLines,
  getPinReportsGeoJSON,
  THREAT_COLORS,
  CATEGORY_COLORS,
} from '../data/locations';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || '';

interface MapViewProps {
  toggles: Record<string, boolean>;
  selectedPinId: string | null;
  onSelectPin: (id: string) => void;
  onCoordsChange: (coords: { lng: number; lat: number } | null) => void;
  onZoomChange: (zoom: number) => void;
  onReady?: () => void;
}

export default function MapView({
  toggles,
  selectedPinId,
  onSelectPin,
  onCoordsChange,
  onZoomChange,
  onReady,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const animFrameRef = useRef<number>(0);
  const userInteractedRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const togglesRef = useRef(toggles);
  togglesRef.current = toggles;

  const createPinMarker = useCallback(
    (pin: (typeof pinReports)[0]) => {
      const color = THREAT_COLORS[pin.severity];
      const catColor = CATEGORY_COLORS[pin.category] || '#8b8fa4';
      const isCritical = pin.severity === 'critical' || pin.severity === 'high';

      const container = document.createElement('div');
      container.className = 'marker-container';
      container.style.cssText =
        'cursor:pointer;position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;';

      // Outer ring
      const ring = document.createElement('div');
      ring.style.cssText = `position:absolute;width:32px;height:32px;border-radius:50%;border:1px solid ${color}35;`;

      // Pulse 1
      const pulse = document.createElement('div');
      pulse.style.cssText = `position:absolute;width:18px;height:18px;border-radius:50%;background:${color};opacity:0;top:50%;left:50%;transform:translate(-50%,-50%);`;
      pulse.style.animation = isCritical
        ? 'pulse-ring-critical 1.5s ease-out infinite'
        : 'pulse-ring 2.5s ease-out infinite';

      // Pulse 2 offset
      const pulse2 = document.createElement('div');
      pulse2.style.cssText = pulse.style.cssText;
      pulse2.style.animationDelay = isCritical ? '0.75s' : '1.25s';

      // Center dot
      const dot = document.createElement('div');
      dot.style.cssText = `width:10px;height:10px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.5);position:relative;z-index:2;box-shadow:0 0 14px ${color}, 0 0 28px ${color}60;`;

      // Category ring inside dot
      const catRing = document.createElement('div');
      catRing.style.cssText = `position:absolute;top:-4px;right:-4px;width:6px;height:6px;border-radius:50%;background:${catColor};border:1px solid rgba(0,0,0,0.4);z-index:3;`;

      // Label below
      const label = document.createElement('div');
      label.style.cssText = `position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:4px;white-space:nowrap;pointer-events:none;text-align:center;`;
      label.innerHTML = `
        <div style="font-size:7px;letter-spacing:0.12em;color:rgba(228,230,239,0.6);font-family:'JetBrains Mono',monospace;text-shadow:0 1px 6px rgba(0,0,0,0.95),0 0 20px rgba(0,0,0,0.8);font-weight:500;">${pin.city.toUpperCase()}</div>
        <div style="font-size:6px;letter-spacing:0.08em;color:${color}90;font-family:'JetBrains Mono',monospace;text-shadow:0 1px 4px rgba(0,0,0,0.9);margin-top:1px;">${pin.category.toUpperCase()}</div>
      `;

      container.appendChild(ring);
      container.appendChild(pulse);
      container.appendChild(pulse2);
      container.appendChild(dot);
      container.appendChild(catRing);
      container.appendChild(label);

      container.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectPin(pin.id);
      });

      return container;
    },
    [onSelectPin]
  );

  const applyToggles = useCallback((map: mapboxgl.Map, t: Record<string, boolean>) => {
    try { map.setProjection(t.globe ? 'globe' : 'mercator'); } catch {}
    try {
      if (t.terrain && map.getSource('mapbox-dem')) {
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.8 });
      } else {
        map.setTerrain(null);
      }
    } catch {}
    try {
      if (map.getLayer('satellite-layer'))
        map.setLayoutProperty('satellite-layer', 'visibility', t.satellite ? 'visible' : 'none');
    } catch {}
    try {
      if (map.getLayer('threat-heatmap-layer'))
        map.setLayoutProperty('threat-heatmap-layer', 'visibility', t.heatmap ? 'visible' : 'none');
    } catch {}
    try {
      if (t.weather) {
        (map as any).setRain?.({ density: 0.5, intensity: 0.8, opacity: 0.1, color: 'rgba(120,180,220,1)' });
      } else {
        (map as any).setRain?.(null);
        (map as any).setSnow?.(null);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-98, 39],
      zoom: 3.5,
      pitch: 30,
      bearing: -8,
      projection: 'globe',
      antialias: true,
      fadeDuration: 0,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: true, showZoom: true }), 'bottom-left');
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');

    const pauseRotation = () => {
      userInteractedRef.current = true;
      clearTimeout((pauseRotation as any)._t);
      (pauseRotation as any)._t = setTimeout(() => { userInteractedRef.current = false; }, 10000);
    };
    map.on('mousedown', pauseRotation);
    map.on('touchstart', pauseRotation);
    map.on('wheel', pauseRotation);

    map.on('mousemove', (e) => onCoordsChange({ lng: e.lngLat.lng, lat: e.lngLat.lat }));
    map.on('mouseout', () => onCoordsChange(null));
    map.on('zoom', () => onZoomChange(map.getZoom()));

    map.on('style.load', () => {
      // Fog
      map.setFog({
        color: 'rgba(10, 12, 18, 1)',
        'high-color': 'rgba(15, 50, 80, 1)',
        'horizon-blend': 0.06,
        'space-color': 'rgba(3, 4, 8, 1)',
        'star-intensity': 0.5,
      });

      // 3D Lighting
      try {
        (map as any).setLights([
          { type: 'ambient', id: 'env-light', properties: { color: 'rgba(180,200,220,1)', intensity: 0.4 } },
          { type: 'directional', id: 'sun-light', properties: { color: 'rgba(220,235,255,1)', intensity: 0.6, direction: [210, 40], 'cast-shadows': true, 'shadow-intensity': 0.8 } },
        ]);
      } catch {}

      // Terrain DEM
      if (!map.getSource('mapbox-dem')) {
        map.addSource('mapbox-dem', { type: 'raster-dem', url: 'mapbox://mapbox.mapbox-terrain-dem-v1', tileSize: 512, maxzoom: 14 });
      }

      // Satellite
      if (!map.getSource('satellite')) {
        map.addSource('satellite', { type: 'raster', url: 'mapbox://mapbox.satellite', tileSize: 256 });
      }

      const firstSymbolId = map.getStyle().layers.find((l) => l.type === 'symbol')?.id;

      if (!map.getLayer('satellite-layer')) {
        map.addLayer({ id: 'satellite-layer', type: 'raster', source: 'satellite', layout: { visibility: 'none' }, paint: { 'raster-opacity': 0.85, 'raster-fade-duration': 300 } }, firstSymbolId);
      }

      // Sky
      if (!map.getLayer('sky')) {
        map.addLayer({
          id: 'sky', type: 'sky',
          paint: { 'sky-type': 'atmosphere', 'sky-atmosphere-sun': [0, 85], 'sky-atmosphere-sun-intensity': 3, 'sky-atmosphere-halo-color': 'rgba(15,245,196,0.12)', 'sky-atmosphere-color': 'rgba(10,25,45,0.9)', 'sky-opacity': ['interpolate', ['exponential', 0.1], ['zoom'], 5, 0, 22, 1] },
        });
      }

      // Hillshade
      if (!map.getLayer('terrain-hillshade')) {
        map.addLayer({ id: 'terrain-hillshade', type: 'hillshade', source: 'mapbox-dem', paint: { 'hillshade-illumination-anchor': 'map', 'hillshade-exaggeration': 0.3, 'hillshade-shadow-color': '#080a10', 'hillshade-highlight-color': '#1a2030', 'hillshade-accent-color': '#0a1520' } }, firstSymbolId);
      }

      // 3D Buildings
      const labelLayerId = map.getStyle().layers.find((l) => l.type === 'symbol' && l.layout?.['text-field'])?.id;
      if (!map.getLayer('3d-buildings')) {
        map.addLayer({
          id: '3d-buildings', source: 'composite', 'source-layer': 'building', filter: ['==', 'extrude', 'true'], type: 'fill-extrusion', minzoom: 14,
          paint: {
            'fill-extrusion-color': ['interpolate', ['linear'], ['get', 'height'], 0, '#0e1018', 100, '#151a28', 300, '#1a2235'],
            'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'height']],
            'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'min_height']],
            'fill-extrusion-opacity': 0.75, 'fill-extrusion-vertical-gradient': true,
          },
        }, labelLayerId);
      }

      // Connection lines (correlations between pin reports)
      if (!map.getSource('connections')) {
        map.addSource('connections', { type: 'geojson', data: getConnectionLines() });
      }
      if (!map.getLayer('connection-lines-glow')) {
        map.addLayer({ id: 'connection-lines-glow', type: 'line', source: 'connections', paint: { 'line-color': 'rgba(15,245,196,0.06)', 'line-width': 6, 'line-blur': 4 }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
      }
      if (!map.getLayer('connection-lines')) {
        map.addLayer({ id: 'connection-lines', type: 'line', source: 'connections', paint: { 'line-color': 'rgba(15,245,196,0.25)', 'line-width': 1.2, 'line-dasharray': [2, 3] }, layout: { 'line-cap': 'round', 'line-join': 'round' } });
      }

      // Heatmap (triangulated from user-submitted pin reports)
      if (!map.getSource('threat-heatmap')) {
        map.addSource('threat-heatmap', { type: 'geojson', data: getHeatmapGeoJSON() });
      }
      if (!map.getLayer('threat-heatmap-layer')) {
        map.addLayer({
          id: 'threat-heatmap-layer', type: 'heatmap', source: 'threat-heatmap',
          paint: {
            'heatmap-weight': ['get', 'intensity'],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 2.5, 10, 4],
            'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0,0,0,0)', 0.1, 'rgba(15,245,196,0.08)', 0.2, 'rgba(15,245,196,0.2)', 0.35, 'rgba(59,130,246,0.35)', 0.5, 'rgba(245,166,35,0.45)', 0.65, 'rgba(255,107,53,0.55)', 0.8, 'rgba(255,59,79,0.65)', 1, 'rgba(255,59,79,0.8)'],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 20, 3, 40, 6, 65, 10, 85],
            'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 0, 0.9, 6, 0.65, 10, 0.35],
          },
        });
      }

      // Pin report glow circles
      if (!map.getSource('pin-points')) {
        map.addSource('pin-points', { type: 'geojson', data: getPinReportsGeoJSON(), promoteId: 'id' });
      }
      if (!map.getLayer('pin-glow-outer')) {
        map.addLayer({ id: 'pin-glow-outer', type: 'circle', source: 'pin-points', paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 18, 5, 30, 10, 45], 'circle-color': ['get', 'color'], 'circle-opacity': 0.06, 'circle-blur': 1 } });
      }
      if (!map.getLayer('pin-glow-inner')) {
        map.addLayer({ id: 'pin-glow-inner', type: 'circle', source: 'pin-points', paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 8, 5, 14, 10, 22], 'circle-color': ['get', 'color'], 'circle-opacity': 0.12, 'circle-blur': 0.8 } });
      }

      // HTML Markers for each pin report
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      pinReports.forEach((pin) => {
        const el = createPinMarker(pin);
        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat(pin.coordinates).addTo(map);
        markersRef.current.push(marker);
      });

      applyToggles(map, togglesRef.current);
      setMapReady(true);
      onReady?.();
    });

    // Auto rotation
    let lastTime = 0;
    function rotate(time: number) {
      if (lastTime) {
        const delta = time - lastTime;
        const isGlobe = (() => { try { return map.getProjection().name === 'globe'; } catch { return false; } })();
        if (!userInteractedRef.current && map.getZoom() < 4 && isGlobe) {
          map.setBearing((map.getBearing() + delta * 0.003) % 360);
        }
      }
      lastTime = time;
      animFrameRef.current = requestAnimationFrame(rotate);
    }
    animFrameRef.current = requestAnimationFrame(rotate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    applyToggles(map, toggles);
  }, [toggles, mapReady, applyToggles]);

  // Fly to selected pin
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedPinId) return;
    const pin = pinReports.find((p) => p.id === selectedPinId);
    if (!pin) return;

    userInteractedRef.current = true;
    clearTimeout((userInteractedRef as any)._flyTimeout);
    (userInteractedRef as any)._flyTimeout = setTimeout(() => { userInteractedRef.current = false; }, 12000);

    map.flyTo({ center: pin.coordinates, zoom: 8, pitch: 50, bearing: Math.random() * 40 - 20, duration: 3000, essential: true });
  }, [selectedPinId]);

  return <div ref={containerRef} className="absolute inset-0" style={{ width: '100%', height: '100%' }} />;
}
