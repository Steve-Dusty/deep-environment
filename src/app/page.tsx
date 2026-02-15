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
import ChatBox from './components/ChatBox';
import { interpretVoiceCommand } from './data/ai';

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
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('all');

  const totalAgents = pinReports.reduce((sum, p) => sum + p.agentsActive, 0);

  const { speak } = useTTS();

  const handleVoiceCommand = useCallback((cmd: VoiceCommand) => {
    console.log('🎯 Processing command:', cmd);
    let response = '';

    // Add AI interpretation acknowledgment
    if (cmd.fromAI) {
      console.log('✨ Command interpreted by AI');
    }

    switch (cmd.action) {
      case 'error': {
        response = `Sorry, ${cmd.target || 'something went wrong'}. Please try again.`;
        break;
      }
      
      case 'stop': {
        response = 'Voice commands stopped. Say "Hey Deep" to resume.';
        break;
      }
      
      case 'enable':
      case 'disable': {
        const key = cmd.target || '';
        const validKeys = ['globe', 'terrain', 'satellite', 'heatmap', 'weather'];
        if (validKeys.includes(key)) {
          setToggles(prev => ({ ...prev, [key]: cmd.action === 'enable' }));
          const friendlyNames: Record<string, string> = {
            globe: 'globe view',
            terrain: '3D terrain',
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

      case 'enable-all':
        setToggles({ globe: true, terrain: true, satellite: true, heatmap: true, weather: true });
        response = 'Enabling all overlays. Globe, terrain, satellite, threat overlay, and precipitation.';
        break;

      case 'disable-all':
        setToggles({ globe: false, terrain: false, satellite: false, heatmap: false, weather: false });
        response = 'Disabling all overlays.';
        break;
      
      case 'view-graph':
      case 'show-graph':
        setShowGraph(true);
        response = 'Opening knowledge graph.';
        break;
      
      case 'view-map':
      case 'show-map':
        setShowGraph(false);
        setOdysseyPin(null);
        setSelectedPinId(null);
        response = 'Returning to map view.';
        break;
        
      case 'view-odyssey':
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

      case 'navigate':
      case 'select-location': {
        const target = cmd.target?.toLowerCase() || '';
        // Try to match by ID first (from AI), then by name
        let match = pinReports.find(p => p.id === cmd.target);
        if (!match) {
          match = pinReports.find(p =>
            p.city.toLowerCase().includes(target) ||
            p.neighborhood.toLowerCase().includes(target) ||
            p.title.toLowerCase().includes(target) ||
            p.state.toLowerCase().includes(target) ||
            p.id.toLowerCase().includes(target)
          );
        }
        if (match) {
          setSelectedPinId(match.id);
          setShowGraph(false);
          setOdysseyPin(null);
          response = `Navigating to ${match.neighborhood}. ${match.title}.`;
        } else {
          response = `Location ${cmd.target} not found.`;
        }
        break;
      }

      case 'odyssey-location': {
        const target = cmd.target?.toLowerCase() || '';
        let match = pinReports.find(p => p.id === cmd.target);
        if (!match) {
          match = pinReports.find(p =>
            p.city.toLowerCase().includes(target) ||
            p.neighborhood.toLowerCase().includes(target) ||
            p.title.toLowerCase().includes(target)
          );
        }
        if (match) {
          setSelectedPinId(match.id);
          setOdysseyPin(match);
          response = `Entering Odyssey world model for ${match.city}. ${match.title}.`;
        } else {
          response = `Location ${cmd.target} not found.`;
        }
        break;
      }

      case 'view-feed':
      case 'show-feed':
        setActiveView('feed');
        response = 'Opening location feed.';
        break;

      case 'show-slack':
        setActiveView('slack');
        response = 'Opening Slack uploads.';
        break;

      case 'close-sidebar':
        setActiveView(null);
        response = 'Closing sidebar.';
        break;

      case 'filter-category': {
        const cat = cmd.target || 'All';
        setActiveView('feed');
        setCategoryFilter(cat);
        if (cat === 'All') {
          response = `Showing all categories. ${pinReports.length} locations.`;
        } else {
          const count = pinReports.filter(p => p.category === cat).length;
          response = `Filtering by ${cat}. ${count} locations found.`;
        }
        break;
      }

      case 'filter-severity': {
        const sev = cmd.target || 'all';
        setActiveView('feed');
        setSeverityFilter(sev);
        if (sev === 'all') {
          response = `Showing all severity levels.`;
        } else {
          const count = pinReports.filter(p => p.severity === sev).length;
          response = `Filtering by ${sev} severity. ${count} locations found.`;
        }
        break;
      }
        
      case 'zoom-in':
        setZoom(prev => Math.min(prev + 1, 20));
        response = 'Zooming in.';
        break;
        
      case 'zoom-out':
        setZoom(prev => Math.max(prev - 1, 1));
        response = 'Zooming out.';
        break;

      case 'zoom-level': {
        const level = parseInt(cmd.target || '5', 10);
        if (level >= 1 && level <= 20) {
          setZoom(level);
          response = `Setting zoom to level ${level}.`;
        } else {
          response = 'Zoom level must be between 1 and 20.';
        }
        break;
      }
        
      case 'reset-view':
        setZoom(3.5);
        setSelectedPinId(null);
        setToggles({ globe: true, terrain: false, satellite: false, heatmap: true, weather: false });
        response = 'Resetting view to defaults.';
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
          response = `Selecting ${match.city}, ${match.state}. ${match.title}. Severity: ${match.severity}.`;
        } else {
          response = `Location ${cmd.target} not found.`;
        }
        break;
      }

      case 'describe-location': {
        const target = cmd.target?.toLowerCase() || '';
        const match = pinReports.find(p =>
          p.city.toLowerCase().includes(target) ||
          p.neighborhood.toLowerCase().includes(target) ||
          p.title.toLowerCase().includes(target)
        );
        if (match) {
          setSelectedPinId(match.id);
          const topMetric = match.metrics[0];
          response = `${match.title} in ${match.city}. ${match.summary.split('.')[0]}. ${topMetric.label} at ${topMetric.value} ${topMetric.unit}. Severity: ${match.severity}. ${match.agentsActive} agents analyzing.`;
        } else {
          response = `Location ${cmd.target} not found.`;
        }
        break;
      }

      case 'next-pin': {
        const currentIdx = selectedPinId ? pinReports.findIndex(p => p.id === selectedPinId) : -1;
        const nextIdx = (currentIdx + 1) % pinReports.length;
        const next = pinReports[nextIdx];
        setSelectedPinId(next.id);
        response = `${next.city}. ${next.title}. Severity: ${next.severity}.`;
        break;
      }

      case 'prev-pin': {
        const currentIdx = selectedPinId ? pinReports.findIndex(p => p.id === selectedPinId) : 0;
        const prevIdx = (currentIdx - 1 + pinReports.length) % pinReports.length;
        const prev = pinReports[prevIdx];
        setSelectedPinId(prev.id);
        response = `${prev.city}. ${prev.title}. Severity: ${prev.severity}.`;
        break;
      }
      
      case 'clear-selection':
        setSelectedPinId(null);
        response = 'Clearing selection.';
        break;
        
      case 'status': {
        const critical = pinReports.filter(p => p.severity === 'critical').length;
        const high = pinReports.filter(p => p.severity === 'high').length;
        const elevated = pinReports.filter(p => p.severity === 'elevated').length;
        response = `${pinReports.length} active locations. ${critical} critical, ${high} high, ${elevated} elevated severity. ${totalAgents} agents online. System nominal.`;
        break;
      }
      
      case 'list-critical': {
        const critical = pinReports.filter(p => p.severity === 'critical');
        if (critical.length === 0) {
          response = 'No critical threats detected.';
        } else {
          const details = critical.slice(0, 4).map(p => `${p.city}: ${p.title}`).join('. ');
          response = `${critical.length} critical threats. ${details}.`;
        }
        break;
      }

      case 'list-high': {
        const high = pinReports.filter(p => p.severity === 'high');
        if (high.length === 0) {
          response = 'No high severity threats detected.';
        } else {
          const details = high.slice(0, 4).map(p => `${p.city}: ${p.title}`).join('. ');
          response = `${high.length} high severity threats. ${details}.`;
        }
        break;
      }

      case 'list-category': {
        const cat = cmd.target || '';
        const matches = pinReports.filter(p => p.category === cat);
        if (matches.length === 0) {
          response = `No ${cat} threats detected.`;
        } else {
          const details = matches.slice(0, 4).map(p => `${p.city}: ${p.title}`).join('. ');
          response = `${matches.length} ${cat} threats. ${details}.`;
        }
        break;
      }

      case 'list-agents': {
        response = `${totalAgents} agents active across ${pinReports.length} locations. Average ${(totalAgents / pinReports.length).toFixed(1)} agents per location.`;
        break;
      }
      
      case 'list-locations': {
        const cities = pinReports.map(p => p.city).slice(0, 5).join(', ');
        response = `${pinReports.length} locations monitored. Including ${cities}, and more.`;
        break;
      }
      
      case 'list-all': {
        const states = new Set(pinReports.map(p => p.state)).size;
        const categories = new Set(pinReports.map(p => p.category)).size;
        response = `Monitoring ${pinReports.length} locations across ${states} states. ${categories} threat categories active.`;
        break;
      }
      
      case 'help':
        response = 'Voice commands available. Map controls: enable satellite, enable terrain, enable precipitation, show threat overlay, globe view, zoom in, zoom out, reset view. Navigation: go to Miami, next location, previous location, select Houston. Views: show knowledge graph, show map, enter odyssey. Filters: show water threats, filter by critical, show all categories. Info: status report, list critical threats, describe Miami, list all agents. Sidebar: open feed, open slack, close sidebar.';
        break;
        
      default:
        response = 'Command not recognized. Say help for a list of available commands.';
    }

    console.log('🔊 Speaking response:', response);
    if (response) {
      voiceState.setState('speaking');
      speak(response).then(() => voiceState.setState('idle'));
    }
  }, [speak, totalAgents, selectedPinId, pinReports]);

  const handleAIFallback = useCallback(async (speech: string): Promise<VoiceCommand> => {
    console.log('🤖 AI fallback triggered for command:', speech);

    try {
      const aiResult = await interpretVoiceCommand(speech);
      console.log('✨ AI result:', aiResult);
      return {
        raw: speech,
        action: aiResult.action,
        target: aiResult.target,
        fromAI: true,
      };
    } catch (error) {
      console.error('❌ AI fallback error:', error);
      throw error;
    }
  }, []);

  const handleTextCommand = useCallback(async (text: string) => {
    console.log('💬 Text command:', text);
    try {
      const aiResult = await interpretVoiceCommand(text);
      console.log('✨ AI interpreted text:', aiResult);
      const cmd: VoiceCommand = {
        raw: text,
        action: aiResult.action,
        target: aiResult.target,
        fromAI: true,
      };
      handleVoiceCommand(cmd);
    } catch (error) {
      console.error('❌ Text command error:', error);
      handleVoiceCommand({
        raw: text,
        action: 'error',
        target: 'AI unavailable',
      });
    }
  }, [handleVoiceCommand]);

  const voiceState = useVoiceControl({
    onCommand: handleVoiceCommand,
    onAIFallback: handleAIFallback,
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
                categoryFilter={categoryFilter}
                onCategoryFilterChange={setCategoryFilter}
                severityFilter={severityFilter}
                onSeverityFilterChange={setSeverityFilter}
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
            <div className="pointer-events-auto fixed bottom-12 right-4 z-50 flex flex-col items-end gap-3">
              <ChatBox onCommand={handleTextCommand} />
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
