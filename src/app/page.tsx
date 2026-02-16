'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import TopBar from '@/components/TopBar';
import SidePanel from '@/components/SidePanel';
import LeftSidebar from '@/components/LeftSidebar';
import LocationCarousel from '@/components/LocationCarousel';
import type { NavView } from '@/components/LeftSidebar';
import StatusBar from '@/components/StatusBar';
import { pinReports as staticPinReports, type PinReport, type ThreatLevel, CATEGORY_COLORS, LOCATION_COORDS } from '@/data/locations';
import type { PDFViewData } from '@/components/ChatView';
import { useVoiceControl, type VoiceCommand } from '@/hooks/useVoiceControl';
import { useTTS } from '@/hooks/useTTS';
import VoiceControlPanel from '@/components/VoiceControlPanel';
import VoiceTestInstructions from '@/components/VoiceTestInstructions';
import ChatBox from '@/components/ChatBox';
import { interpretVoiceCommand } from '@/data/ai';

// Map bot classification categories → dashboard categories
const CLASSIFY_TO_CATEGORY: Record<string, string> = {
  pollution: 'Water', deforestation: 'Bio', runoff: 'Water', wildfire: 'Air',
  litter: 'Soil', erosion: 'Soil', invasive: 'Bio', drought: 'Climate',
  contamination: 'Water', other: 'Climate',
};

/** Convert a Slack upload with classification into a PinReport */
// Hardcoded SF-area coordinates for Slack uploads — real neighborhoods on land
const SF_SPOTS: [number, number][] = [
  [-122.4194, 37.7749], // Downtown SF
  [-122.4089, 37.7836], // Chinatown
  [-122.4534, 37.7694], // Golden Gate Park
  [-122.3894, 37.7866], // Embarcadero
  [-122.4376, 37.7590], // Twin Peaks
  [-122.4862, 37.7694], // Ocean Beach
  [-122.4058, 37.8024], // Fisherman's Wharf
  [-122.3999, 37.7956], // North Beach
  [-122.4167, 37.7620], // Mission District
  [-122.4330, 37.7880], // Pacific Heights
];

const LA_SPOTS: [number, number][] = [
  [-118.2437, 34.0522], // Downtown LA
  [-118.3287, 34.0928], // Hollywood
  [-118.4965, 34.0195], // Santa Monica
  [-118.2508, 34.0566], // Arts District
  [-118.3525, 34.0689], // Beverly Hills
];

function slackUploadToPinReport(upload: any, index: number): PinReport | null {
  const c = upload.classification;
  if (!c) return null;

  // Place pins at real neighborhood coordinates based on location_id
  const locId = c.location_id || '';
  let coords: [number, number];
  if (locId === 'loc-la' || locId.includes('la')) {
    coords = LA_SPOTS[index % LA_SPOTS.length];
  } else {
    // Default to SF spots
    coords = SF_SPOTS[index % SF_SPOTS.length];
  }

  const severityMap: Record<string, ThreatLevel> = { low: 'low', moderate: 'moderate', elevated: 'elevated', high: 'high', critical: 'critical' };
  return {
    id: `slack-${upload.timestamp}`,
    coordinates: coords,
    city: c.resolved_location || upload.user_city || 'Field Report',
    neighborhood: c.resolved_location || upload.user_city || 'Field Report',
    state: '',
    user: upload.user || 'field-agent',
    timestamp: new Date(upload.timestamp * 1000).toLocaleString(),
    title: c.problem_name,
    summary: c.problem_description,
    analysisDetails: c.indicators || [],
    category: CLASSIFY_TO_CATEGORY[c.category] || 'Climate',
    severity: severityMap[c.severity] || 'moderate',
    confidence: 85,
    metrics: [],
    impactStatement: c.problem_description,
    agentsActive: 3,
    correlatedWith: [],
    source: 'slack',
    imageUrl: upload.filename ? `/api/slack-uploads/image?f=${encodeURIComponent(upload.filename)}` : undefined,
  };
}

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

const LocationsDashboard = dynamic(() => import('./components/LocationsDashboard'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--color-void)] z-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-[var(--color-signal-teal)] data-live" />
        <span className="text-[10px] tracking-[0.3em] text-[var(--color-text-muted)]">
          LOADING LOCATIONS
        </span>
      </div>
    </div>
  ),
});

const LocationDetailView = dynamic(() => import('./components/LocationDetailView'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--color-void)] z-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-[var(--color-signal-teal)] data-live" />
        <span className="text-[10px] tracking-[0.3em] text-[var(--color-text-muted)]">
          LOADING LOCATION GRAPH
        </span>
      </div>
    </div>
  ),
});

const ChatView = dynamic(() => import('./components/ChatView'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--color-void)] z-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-[var(--color-signal-teal)] data-live" />
        <span className="text-[10px] tracking-[0.3em] text-[var(--color-text-muted)]">
          INITIALIZING AI ASSISTANT
        </span>
      </div>
    </div>
  ),
});

const PDFReportView = dynamic(() => import('./components/PDFReportView'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--color-void)] z-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-[var(--color-signal-teal)] data-live" />
        <span className="text-[10px] tracking-[0.3em] text-[var(--color-text-muted)]">
          LOADING PDF VIEWER
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
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [odysseyPin, setOdysseyPin] = useState<PinReport | null>(null);
  const [odysseyImageUrl, setOdysseyImageUrl] = useState<string | undefined>(undefined);
  const [showChat, setShowChat] = useState(false);
  const [pdfViewData, setPdfViewData] = useState<PDFViewData | null>(null);
  const [slackPins, setSlackPins] = useState<PinReport[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>('');
  const [lastAction, setLastAction] = useState<string>('');
  const [lastResponse, setLastResponse] = useState<string>('');
  const [isTestMode, setIsTestMode] = useState(false); // Test mode disabled

  // Poll Slack uploads and convert to PinReports
  useEffect(() => {
    let cancelled = false;
    async function fetchSlackPins() {
      try {
        const res = await fetch('/api/slack-uploads', { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const uploads = await res.json();
        const pins = uploads
          .map((u: any, i: number) => slackUploadToPinReport(u, i))
          .filter((p: PinReport | null): p is PinReport => p !== null);
        setSlackPins(pins);
      } catch { /* silent */ }
    }
    fetchSlackPins();
    const interval = setInterval(fetchSlackPins, 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Merge static + live pins
  const allPins = useMemo(() => [...staticPinReports, ...slackPins], [slackPins]);

  // Voice control hooks
  const { speak } = useTTS();

  const totalAgents = allPins.reduce((sum, p) => sum + p.agentsActive, 0);

  const handleVoiceCommand = useCallback((cmd: VoiceCommand) => {
    console.log('🎯 Processing command:', cmd);
    setLastCommand(cmd.raw); // Track the command
    let response = '';
    let actionTaken = '';

    // Add AI interpretation acknowledgment
    if (cmd.fromAI) {
      console.log('✨ Command interpreted by AI');
    }

    switch (cmd.action) {
      case 'error': {
        actionTaken = 'Error handling';
        response = `Sorry, ${cmd.target || 'something went wrong'}. Please try again.`;
        break;
      }

      case 'stop': {
        actionTaken = 'Voice control paused';
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
          actionTaken = `${cmd.action === 'enable' ? 'Enabled' : 'Disabled'} ${friendlyNames[key] || key}`;
          response = `${cmd.action === 'enable' ? 'Enabling' : 'Disabling'} ${friendlyNames[key] || key}.`;
        } else {
          actionTaken = 'Invalid overlay';
          response = `Unknown overlay: ${key}.`;
        }
        break;
      }

      case 'enable-all':
        setToggles({ globe: true, terrain: true, satellite: true, heatmap: true, weather: true });
        actionTaken = 'Enabled all overlays';
        response = 'Enabling all overlays. Globe, terrain, satellite, threat overlay, and precipitation.';
        break;

      case 'disable-all':
        setToggles({ globe: false, terrain: false, satellite: false, heatmap: false, weather: false });
        actionTaken = 'Disabled all overlays';
        response = 'Disabling all overlays.';
        break;

      case 'view-graph':
      case 'show-graph':
        setShowGraph(true);
        actionTaken = 'Switched to knowledge graph';
        response = 'Opening knowledge graph.';
        break;

      case 'view-map':
      case 'show-map':
        setShowGraph(false);
        setOdysseyPin(null);
        setSelectedPinId(null);
        actionTaken = 'Switched to map view';
        response = 'Returning to map view.';
        break;

      case 'view-odyssey':
      case 'show-odyssey':
        if (selectedPinId) {
          const pin = allPins.find(p => p.id === selectedPinId);
          if (pin) {
            setOdysseyPin(pin);
            actionTaken = `Entered Odyssey for ${pin.city}`;
            response = `Entering Odyssey world model for ${pin.city}.`;
          } else {
            actionTaken = 'Location not found';
            response = 'Please select a location first.';
          }
        } else {
          actionTaken = 'No location selected';
          response = 'Please select a location first to view in Odyssey.';
        }
        break;

      case 'navigate':
      case 'select-location': {
        const target = cmd.target?.toLowerCase() || '';
        // Try to match by ID first (from AI), then by name
        let match = allPins.find(p => p.id === cmd.target);
        if (!match) {
          match = allPins.find(p =>
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
          actionTaken = `Navigated to ${match.neighborhood}`;
          response = `Navigating to ${match.neighborhood}. ${match.title}.`;
        } else {
          actionTaken = 'Location not found';
          response = `Location ${cmd.target} not found.`;
        }
        break;
      }

      case 'odyssey-location': {
        const target = cmd.target?.toLowerCase() || '';
        let match = allPins.find(p => p.id === cmd.target);
        if (!match) {
          match = allPins.find(p =>
            p.city.toLowerCase().includes(target) ||
            p.neighborhood.toLowerCase().includes(target) ||
            p.title.toLowerCase().includes(target)
          );
        }
        if (match) {
          setSelectedPinId(match.id);
          setOdysseyPin(match);
          actionTaken = `Odyssey: ${match.city}`;
          response = `Entering Odyssey world model for ${match.city}. ${match.title}.`;
        } else {
          actionTaken = 'Location not found';
          response = `Location ${cmd.target} not found.`;
        }
        break;
      }

      case 'view-feed':
      case 'show-feed':
        setActiveView('feed');
        actionTaken = 'Opened location feed';
        response = 'Opening location feed.';
        break;

      case 'show-slack':
        setActiveView('slack');
        actionTaken = 'Opened Slack uploads';
        response = 'Opening Slack uploads.';
        break;

      case 'close-sidebar':
        setActiveView(null);
        actionTaken = 'Closed sidebar';
        response = 'Closing sidebar.';
        break;

      case 'zoom-in':
        setZoom(prev => Math.min(prev + 1, 20));
        actionTaken = 'Zoomed in';
        response = 'Zooming in.';
        break;

      case 'zoom-out':
        setZoom(prev => Math.max(prev - 1, 1));
        actionTaken = 'Zoomed out';
        response = 'Zooming out.';
        break;

      case 'zoom-level': {
        const level = parseInt(cmd.target || '5', 10);
        if (level >= 1 && level <= 20) {
          setZoom(level);
          actionTaken = `Set zoom to ${level}`;
          response = `Zoom set to level ${level}.`;
        } else {
          actionTaken = 'Invalid zoom level';
          response = 'Zoom level must be between 1 and 20.';
        }
        break;
      }

      case 'clear-selection':
        setSelectedPinId(null);
        actionTaken = 'Cleared selection';
        response = 'Clearing selection.';
        break;

      case 'status': {
        const critical = allPins.filter(p => p.severity === 'critical').length;
        const high = allPins.filter(p => p.severity === 'high').length;
        const elevated = allPins.filter(p => p.severity === 'elevated').length;
        actionTaken = 'Generated status report';
        response = `${allPins.length} active locations. ${critical} critical, ${high} high, ${elevated} elevated severity. ${totalAgents} agents online. System nominal.`;
        break;
      }

      case 'list-critical': {
        const critical = allPins.filter(p => p.severity === 'critical');
        actionTaken = `Listed ${critical.length} critical threats`;
        if (critical.length === 0) {
          response = 'No critical threats detected.';
        } else {
          const details = critical.slice(0, 4).map(p => `${p.city}: ${p.title}`).join('. ');
          response = `${critical.length} critical threats. ${details}.`;
        }
        break;
      }

      case 'list-high': {
        const high = allPins.filter(p => p.severity === 'high');
        actionTaken = `Listed ${high.length} high severity threats`;
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
        const matches = allPins.filter(p => p.category === cat);
        actionTaken = `Filtered by ${cat} category`;
        if (matches.length === 0) {
          response = `No ${cat} threats detected.`;
        } else {
          const details = matches.slice(0, 4).map(p => `${p.city}: ${p.title}`).join('. ');
          response = `${matches.length} ${cat} threats. ${details}.`;
        }
        break;
      }

      case 'list-agents': {
        actionTaken = 'Listed active agents';
        response = `${totalAgents} agents active across ${allPins.length} locations. Average ${(totalAgents / allPins.length).toFixed(1)} agents per location.`;
        break;
      }

      case 'list-locations': {
        const cities = allPins.map(p => p.city).slice(0, 5).join(', ');
        actionTaken = 'Listed locations';
        response = `${allPins.length} locations monitored. Including ${cities}, and more.`;
        break;
      }

      case 'list-all': {
        const states = new Set(allPins.map(p => p.state)).size;
        const categories = new Set(allPins.map(p => p.category)).size;
        actionTaken = 'Listed all locations';
        response = `Monitoring ${allPins.length} locations across ${states} states. ${categories} threat categories active.`;
        break;
      }

      case 'help':
        actionTaken = 'Showing help';
        response = 'Voice commands available. Map controls: enable satellite, enable terrain, enable precipitation, show threat overlay, globe view, zoom in, zoom out, reset view. Navigation: go to Miami, next location, previous location, select Houston. Views: show knowledge graph, show map, enter odyssey. Filters: show water threats, filter by critical, show all categories. Info: status report, list critical threats, describe Miami, list all agents. Sidebar: open feed, open slack, close sidebar.';
        break;

      default:
        actionTaken = 'Unknown command';
        response = 'Command not recognized. Say help for a list of available commands.';
    }

    // Update tracking states
    if (actionTaken) setLastAction(actionTaken);
    if (response) setLastResponse(response);

    console.log('🔊 Speaking response:', response);
    // Just speak the response - voice control hook manages state
    if (response) {
      speak(response);
      console.log('✅ Speaking response, voice control continues listening');
    }

    console.log('✅ Command executed, voice control remains active');
  }, [speak, totalAgents, selectedPinId, allPins, setToggles, setShowGraph, setOdysseyPin, setSelectedPinId, setActiveView, setZoom, setLastAction, setLastResponse]);

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

  const handleOpenPDFView = useCallback((data: PDFViewData) => {
    setPdfViewData(data);
  }, []);

  const handleDownloadPDF = useCallback(() => {
    if (!pdfViewData) return;
    const a = document.createElement('a');
    a.href = pdfViewData.url;
    a.download = pdfViewData.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [pdfViewData]);

  const handleClosePDFView = useCallback(() => {
    setPdfViewData(null);
  }, []);

  // Odyssey fullscreen takes priority
  if (odysseyPin) {
    return <OdysseyView pin={odysseyPin} imageUrl={odysseyImageUrl} onClose={() => { setOdysseyPin(null); setOdysseyImageUrl(undefined); }} />;
  }

  // PDF Report fullscreen view
  if (pdfViewData) {
    return <PDFReportView pdfUrl={pdfViewData.url} pdfFilename={pdfViewData.filename} messages={pdfViewData.messages} onClose={handleClosePDFView} onDownload={handleDownloadPDF} />;
  }

  // Full-page AI chat
  if (showChat) {
    return <ChatView onClose={() => setShowChat(false)} onOpenPDFView={handleOpenPDFView} />;
  }

  if (showGraph && selectedLocationId) {
    return <LocationDetailView locationId={selectedLocationId} onEnterOdyssey={handleEnterOdyssey} onClose={() => setSelectedLocationId(null)} />;
  }

  if (showGraph) {
    return <LocationsDashboard onSelectLocation={setSelectedLocationId} onEnterOdyssey={handleEnterOdyssey} onClose={() => setShowGraph(false)} />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <MapView
          toggles={toggles}
          pins={allPins}
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
                pins={allPins}
                selectedId={selectedPinId}
                onSelect={setSelectedPinId}
                activeView={activeView}
                onViewChange={setActiveView}
                onShowGraph={() => setShowGraph(true)}
                onEnterOdyssey={handleEnterOdyssey}
                onShowChat={() => setShowChat(true)}
              />
            </div>
            <div className="pointer-events-auto">
              <SidePanel
                pins={allPins}
                selectedId={selectedPinId}
                onSelect={setSelectedPinId}
              />
            </div>
            <div className="pointer-events-auto">
              <LocationCarousel
                pins={allPins}
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
                dataStreams={allPins.length * 4}
                fieldReports={allPins.length}
              />
            </div>
            
            {/* Voice Test Instructions */}
            {isTestMode && <VoiceTestInstructions />}

            {/* Voice Control UI */}
            <div className="pointer-events-auto fixed bottom-12 right-4 z-50 flex flex-col items-end gap-3">
              <ChatBox onCommand={handleTextCommand} />
              <VoiceControlPanel
                state={voiceState.state}
                enabled={voiceEnabled}
                onToggle={() => setVoiceEnabled(v => !v)}
                transcript={voiceState.transcript}
                fullTranscript={voiceState.fullTranscript}
                lastCommand={lastCommand}
                lastAction={lastAction}
                lastResponse={lastResponse}
                isTestMode={isTestMode}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
