'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import TopBar from './components/TopBar';
import SidePanel from './components/SidePanel';
import LeftSidebar from './components/LeftSidebar';
import type { NavView } from './components/LeftSidebar';
import StatusBar from './components/StatusBar';
import { pinReports, type PinReport } from './data/locations';
import type { PDFViewData } from './components/ChatView';

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

  const totalAgents = pinReports.reduce((sum, p) => sum + p.agentsActive, 0);

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
                onShowChat={() => setShowChat(true)}
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
          </div>
        </>
      )}
    </div>
  );
}
