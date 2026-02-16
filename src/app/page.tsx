'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import TopBar from './components/TopBar';
import SidePanel from './components/SidePanel';
import LeftSidebar from './components/LeftSidebar';
import LocationCarousel from './components/LocationCarousel';
import type { NavView } from './components/LeftSidebar';
import StatusBar from './components/StatusBar';
import { pinReports as staticPinReports, type PinReport, type ThreatLevel, CATEGORY_COLORS, LOCATION_COORDS } from './data/locations';
import type { PDFViewData } from './components/ChatView';
import { useVoiceControl, type VoiceCommand } from './voice/useVoiceControl';
import { useTTS } from './voice/useTTS';
import VoiceIndicator from './voice/VoiceIndicator';
import ChatBox from './components/ChatBox';
import { interpretVoiceCommand } from './data/ai';

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
  const [voiceFeedback, setVoiceFeedback] = useState('');
  
  const handleVoiceCommand = useCallback(async (cmd: VoiceCommand) => {
    const response = await interpretVoiceCommand(cmd.transcript, allPins);
    setVoiceFeedback(response);
    speak(response);
  }, [allPins, speak]);

  const { isListening, transcript } = useVoiceControl({ onCommand: handleVoiceCommand });

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

  const totalAgents = allPins.reduce((sum, p) => sum + p.agentsActive, 0);

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
            
            {/* Voice Control UI */}
            <VoiceIndicator isListening={isListening} transcript={transcript} />
            <ChatBox message={voiceFeedback} onClear={() => setVoiceFeedback('')} />
          </div>
        </>
      )}
    </div>
  );
}
