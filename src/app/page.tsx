'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import TopBar from './components/TopBar';
import SidePanel from './components/SidePanel';
import LeftSidebar from './components/LeftSidebar';
import type { NavView } from './components/LeftSidebar';
import StatusBar from './components/StatusBar';
import { pinReports, type PinReport } from './data/locations';
import { useVoiceControl, type VoiceCommand } from './voice/useVoiceControl';
import { useTTS } from './voice/useTTS';
import VoiceIndicator from './voice/VoiceIndicator';

const MapView = dynamic(() => import('./components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-void)]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-[var(--color-signal-teal)] data-live" />
        <span className="text-[10px] tracking-[0.3em] text-[var(--color-text-muted)]">
          INITIALIZING DEEP ENVIRONMENT
        </span>
      </div>
    </div>
  ),
});

const KnowledgeGraphView = dynamic(() => import('./components/KnowledgeGraphView'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--color-void)] z-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-[var(--color-signal-teal)] data-live" />
        <span className="text-[10px] tracking-[0.3em] text-[var(--color-text-muted)]">
          INITIALIZING KNOWLEDGE GRAPH
        </span>
      </div>
    </div>
  ),
});

const OdysseyView = dynamic(() => import('./components/OdysseyView'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-black z-[60]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-[var(--color-signal-teal)] data-live" />
        <span className="text-[10px] tracking-[0.3em] text-[var(--color-text-muted)]">
          INITIALIZING ODYSSEY
        </span>
      </div>
    </div>
  ),
});

export default function DashboardPage() {
  const [toggles, setToggles] = useState({
    globe: true,
    terrain: false,
    satellite: false,
    heatmap: true,
    weather: false,
  });
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lng: number; lat: number } | null>(null);
  const [zoom, setZoom] = useState(3.5);
  const [mapReady, setMapReady] = useState(false);
  const [activeView, setActiveView] = useState<NavView>(null);
  const [showGraph, setShowGraph] = useState(false);
  const [odysseyPin, setOdysseyPin] = useState<PinReport | null>(null);
  const [odysseyImageUrl, setOdysseyImageUrl] = useState<string | undefined>(undefined);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const totalAgents = pinReports.reduce((sum, p) => sum + p.agentsActive, 0);

  const { speak } = useTTS();

  const handleVoiceCommand = useCallback((cmd: VoiceCommand) => {
    console.log('🎯 Processing command:', cmd);
    let response = '';

    switch (cmd.action) {
      case 'enable':
      case 'disable': {
        const key = cmd.target || '';
        const validKeys = ['globe', 'terrain', 'satellite', 'heatmap', 'weather'];
        if (validKeys.includes(key)) {
          setToggles(prev => ({ ...prev, [key]: cmd.action === 'enable' }));
          const friendlyNames: Record<string, string> = {
            globe: 'globe view',
            terrain: 'terrain',
            satellite: 'satellite imagery',
            heatmap: 'threat overlay',
            weather: 'precipitation data',
          };
          response = `${cmd.action === 'enable' ? 'Enabling' : 'Disabling'} ${friendlyNames[key] || key}.`;
        } else {
          response = `Unknown overlay: ${key}.`;
        }
        break;
      }
      
      case 'show-graph':
        setShowGraph(true);
        response = 'Opening knowledge graph.';
        break;
        
      case 'show-map':
        setShowGraph(false);
        setOdysseyPin(null);
        setSelectedPinId(null);
        response = 'Returning to map view.';
        break;
        
      case 'show-odyssey':
        if (selectedPinId) {
          const pin = pinReports.find(p => p.id === selectedPinId);
          if (pin) {
            setOdysseyPin(pin);
            response = `Entering Odyssey world model for ${pin.city}.`;
          } else {
            response = 'Please select a location first.';
          }
        } else {
          response = 'Please select a location first to view in Odyssey.';
        }
        break;
        
      case 'zoom-in':
        setZoom(prev => Math.min(prev + 1, 20));
        response = 'Zooming in.';
        break;
        
      case 'zoom-out':
        setZoom(prev => Math.max(prev - 1, 1));
        response = 'Zooming out.';
        break;
        
      case 'reset-view':
        setZoom(3.5);
        setSelectedPinId(null);
        response = 'Resetting view.';
        break;
        
      case 'select-location': {
        const target = cmd.target?.toLowerCase() || '';
        const match = pinReports.find(p =>
          p.city.toLowerCase().includes(target) ||
          p.neighborhood.toLowerCase().includes(target) ||
          p.state.toLowerCase().includes(target) ||
          p.title.toLowerCase().includes(target)
        );
        if (match) {
          setSelectedPinId(match.id);
          response = `Selecting ${match.city}, ${match.state}. ${match.title}.`;
        } else {
          response = `Location ${cmd.target} not found.`;
        }
        break;
      }
      
      case 'clear-selection':
        setSelectedPinId(null);
        response = 'Clearing selection.';
        break;
        
      case 'status': {
        const critical = pinReports.filter(p => p.severity === 'critical').length;
        const high = pinReports.filter(p => p.severity === 'high').length;
        response = `${pinReports.length} active locations. ${critical} critical, ${high} high severity. ${totalAgents} agents online.`;
        break;
      }
      
      case 'list-critical': {
        const critical = pinReports.filter(p => p.severity === 'critical');
        if (critical.length === 0) {
          response = 'No critical threats detected.';
        } else {
          const cities = critical.map(p => p.city).slice(0, 3).join(', ');
          response = `${critical.length} critical threats. Including ${cities}.`;
        }
        break;
      }
      
      case 'list-locations': {
        const cities = pinReports.map(p => p.city).slice(0, 5).join(', ');
        response = `${pinReports.length} locations monitored. Including ${cities}, and more.`;
        break;
      }
      
      case 'list-all': {
        response = `Monitoring ${pinReports.length} locations across ${new Set(pinReports.map(p => p.state)).size} states.`;
        break;
      }
      
      case 'help':
        response = 'Try saying: show graph, enable satellite, go to Miami, zoom in, status report, or list critical threats.';
        break;
        
      default:
        response = 'Command not recognized. Say help for options.';
    }

    console.log('🔊 Speaking response:', response);
    if (response) {
      voiceState.setState('speaking');
      speak(response).then(() => voiceState.setState('idle'));
    }
  }, [speak, totalAgents, selectedPinId, pinReports]);

  const voiceState = useVoiceControl({
    onCommand: handleVoiceCommand,
    enabled: voiceEnabled,
  });

  const handleToggle = useCallback((key: string) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  }, []);

  const handleEnterOdyssey = useCallback((pin: PinReport, imageUrl?: string) => {
    setOdysseyPin(pin);
    setOdysseyImageUrl(imageUrl);
  }, []);

  // Odyssey fullscreen takes priority
  if (odysseyPin) {
    return <OdysseyView pin={odysseyPin} imageUrl={odysseyImageUrl} onClose={() => { setOdysseyPin(null); setOdysseyImageUrl(undefined); }} />;
  }

  if (showGraph) {
    return <KnowledgeGraphView onClose={() => setShowGraph(false)} />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <MapView
          toggles={toggles}
          selectedPinId={selectedPinId}
          onSelectPin={setSelectedPinId}
          onCoordsChange={setCoordinates}
          onZoomChange={setZoom}
          onReady={() => setMapReady(true)}
        />
      </div>

      {mapReady && (
        <>
          <div className="absolute inset-0 z-10 pointer-events-none">
            <div className="pointer-events-auto">
              <TopBar toggles={toggles} onToggle={handleToggle} />
            </div>
            <div className="pointer-events-auto">
              <LeftSidebar
                pins={pinReports}
                selectedId={selectedPinId}
                onSelect={setSelectedPinId}
                activeView={activeView}
                onViewChange={setActiveView}
                onShowGraph={() => setShowGraph(true)}
                onEnterOdyssey={handleEnterOdyssey}
              />
            </div>
            <div className="pointer-events-auto">
              <SidePanel
                pins={pinReports}
                selectedId={selectedPinId}
                onSelect={setSelectedPinId}
              />
            </div>
            <div className="pointer-events-auto">
              <StatusBar
                coordinates={coordinates}
                zoom={zoom}
                projection={toggles.globe ? 'GLOBE' : 'MERCATOR'}
                agentsOnline={totalAgents}
                dataStreams={pinReports.length * 4}
                fieldReports={pinReports.length}
              />
            </div>
            <div className="pointer-events-auto">
              <VoiceIndicator
                state={voiceState.state}
                enabled={voiceEnabled}
                onToggle={() => setVoiceEnabled(v => !v)}
                transcript={voiceState.transcript}
                fullTranscript={voiceState.fullTranscript}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
