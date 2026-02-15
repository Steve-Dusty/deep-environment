'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Odyssey } from '@odysseyml/odyssey';
import {
  type PinReport,
  THREAT_COLORS,
  CATEGORY_COLORS,
} from '../data/locations';

// ═══════════════════════════════════════════════════════════════════════════
// DECISION TREES — Telltale-style branching narrative per category
// ═══════════════════════════════════════════════════════════════════════════

interface Choice {
  label: string;
  sub: string;
  prompt: string;
  consequence: string;
  type: 'positive' | 'negative' | 'neutral';
}

interface Decision {
  narrative: string;
  choices: Choice[];
}

function generateDecisions(pin: PinReport): Decision[] {
  const trees: Record<string, Decision[]> = {
    Water: [
      {
        narrative: `Contamination detected in ${pin.neighborhood}. First responders await your orders.`,
        choices: [
          { label: 'DEPLOY CONTAINMENT', sub: 'Send booms and barriers immediately', prompt: `Emergency containment booms are being deployed across the contaminated water in ${pin.neighborhood}, ${pin.city}. Workers in hazmat suits stretch bright orange barriers across the waterway. The contamination is being contained.`, consequence: 'Containment teams mobilized', type: 'positive' },
          { label: 'TRACE THE SOURCE', sub: 'Find where it\'s coming from first', prompt: `Camera follows the contamination upstream through ${pin.neighborhood}, ${pin.city}, tracing pipes and drainage channels, revealing the industrial source of the pollution. Dark water flows from a cracked pipe.`, consequence: 'Source identified upstream', type: 'neutral' },
          { label: 'DO NOTHING', sub: 'Resources are limited — monitor only', prompt: `Time passes. The contamination in ${pin.neighborhood} spreads unchecked across the entire waterway. Dead fish float to the surface. The water turns dark and toxic. No intervention was made.`, consequence: 'The contamination spreads freely', type: 'negative' },
        ],
      },
      {
        narrative: 'The situation is escalating. Downstream communities are at risk.',
        choices: [
          { label: 'EMERGENCY CLEANUP', sub: 'Activate full hazmat response', prompt: 'Massive cleanup operation underway. Dozens of boats, vacuum trucks, and remediation crews work around the clock. Chemical neutralizers are being applied. The water is slowly clearing.', consequence: 'Cleanup operations in full swing', type: 'positive' },
          { label: 'EVACUATE WILDLIFE', sub: 'Relocate affected species', prompt: 'Wildlife rescue teams carefully capture and relocate fish, birds, and turtles from the contaminated zone. Portable tanks and crates line the shore. Animals being saved one by one.', consequence: 'Wildlife relocation underway', type: 'neutral' },
          { label: 'CUT LOSSES', sub: 'This zone is already gone', prompt: 'The contaminated zone is abandoned. Warning signs are posted. The water grows thick with algae and pollution. A once-vibrant waterway becomes a dead zone. Nature reclaims nothing here.', consequence: 'Zone declared unrecoverable', type: 'negative' },
        ],
      },
      {
        narrative: 'Six months later. Your decisions have shaped this place.',
        choices: [
          { label: 'FULL RESTORATION', sub: 'Invest everything in recovery', prompt: `${pin.neighborhood} transformed. Crystal clear water flows through restored wetlands. Native plants line the banks. Fish jump. Birds nest. The ecosystem has been fully restored through dedicated investment.`, consequence: 'Ecosystem fully restored', type: 'positive' },
          { label: 'MANAGED RETREAT', sub: 'Accept the new reality', prompt: `The waterway in ${pin.neighborhood} is partially recovered. Some areas remain off-limits. New barriers separate clean from contaminated zones. A compromise between nature and industry.`, consequence: 'Partial recovery achieved', type: 'neutral' },
        ],
      },
    ],
    Air: [
      {
        narrative: `Air quality plummeting over ${pin.city}. Millions of lungs at stake.`,
        choices: [
          { label: 'SHELTER IN PLACE', sub: 'Order everyone indoors now', prompt: `${pin.city} goes quiet. Streets empty. Windows sealed. Emergency broadcasts loop on every channel. The thick haze blankets empty roads. An eerie silence over the city as people shelter inside.`, consequence: 'City locked down', type: 'neutral' },
          { label: 'MASS EVACUATION', sub: 'Get people out of the danger zone', prompt: `Highways packed bumper to bumper leaving ${pin.city}. Emergency vehicles lead convoys. Buses evacuate neighborhoods. A river of headlights streaming away from the toxic cloud.`, consequence: 'Evacuation routes overwhelmed', type: 'neutral' },
          { label: 'DEPLOY MONITORS ONLY', sub: 'We need more data first', prompt: `Air quality monitoring stations are set up across ${pin.city} while the toxic cloud thickens. Scientists in masks take readings. The numbers are alarming and getting worse. People cough on the streets.`, consequence: 'Data collected but exposure continues', type: 'negative' },
        ],
      },
      {
        narrative: 'The source has been identified. It can be stopped — but at a cost.',
        choices: [
          { label: 'SHUT IT DOWN', sub: 'Close the source permanently', prompt: `The factory smokestacks go dark. Emergency shutdown initiated. Workers file out. The smoke plume thins and slowly dissipates over ${pin.city}. Clean blue sky begins to break through.`, consequence: 'Source eliminated — sky clearing', type: 'positive' },
          { label: 'NEGOTIATE REDUCTION', sub: 'Phase out over 6 months — save jobs', prompt: `Emissions slowly decrease over months. The haze thins gradually. Some days are clear, others awful. A compromise that satisfies no one fully. Workers keep their jobs but communities still suffer.`, consequence: 'Slow improvement, ongoing harm', type: 'neutral' },
          { label: 'IGNORE THE SOURCE', sub: 'It\'s not our jurisdiction', prompt: `Nothing changes. The smoke continues to pour. AQI readings hit new records. Hospitals fill with respiratory patients. The sky over ${pin.city} turns a permanent grey-brown.`, consequence: 'Health crisis deepens', type: 'negative' },
        ],
      },
      {
        narrative: 'One year later. The air tells the story of your choices.',
        choices: [
          { label: 'BREATHE FREELY', sub: 'Invest in permanent clean air', prompt: `Clear blue skies over ${pin.city}. Children play in parks. Mountains visible for the first time in years. Clean air monitors show green across the board. A city reborn.`, consequence: 'Clean air restored', type: 'positive' },
          { label: 'ACCEPT THE HAZE', sub: 'Some pollution is the price of progress', prompt: `${pin.city} adapts to permanent haze. Mask dispensers on street corners. Indoor air purifiers in every home. People check AQI apps like weather. A new normal no one wanted.`, consequence: 'A diminished future', type: 'negative' },
        ],
      },
    ],
    Bio: [
      {
        narrative: `Invasive threat detected near critical habitat in ${pin.neighborhood}.`,
        choices: [
          { label: 'REMOVAL OPERATION', sub: 'Deploy trained extraction teams', prompt: `Specialized wildlife removal teams move through ${pin.neighborhood}. Traps set carefully around nesting areas. Invasive species captured one by one. Native birds watch from protected zones nearby.`, consequence: 'Extraction teams deployed', type: 'positive' },
          { label: 'ESTABLISH BARRIER', sub: 'Build a protective perimeter', prompt: `Fencing and sensor networks erected around the endangered habitat in ${pin.neighborhood}. A technological fortress protecting native species. Cameras and motion sensors cover every angle.`, consequence: 'Protection perimeter active', type: 'neutral' },
          { label: 'LET NATURE DECIDE', sub: 'Evolution will find a way', prompt: `No intervention. The invasive species spreads rapidly through ${pin.neighborhood}. Native nests are raided. Eggs destroyed. The once-thriving colony dwindles. Nature's balance tips irreversibly.`, consequence: 'Native species declining fast', type: 'negative' },
        ],
      },
      {
        narrative: 'The ecosystem is approaching a tipping point. Every hour counts.',
        choices: [
          { label: 'EMERGENCY BREEDING', sub: 'Captive breeding for endangered species', prompt: 'Emergency breeding facility activated. Biologists carefully tend to endangered eggs and hatchlings. Incubators glow warmly. New life emerges under human protection. Hope in a controlled environment.', consequence: 'Breeding program launched', type: 'positive' },
          { label: 'GENETIC BIOCONTROL', sub: 'Release engineered countermeasures', prompt: 'Scientists release targeted biological agents that affect only the invasive species. Over weeks, the invasive population declines while native species thrive untouched. A surgical ecological strike.', consequence: 'Biocontrol agents deployed', type: 'neutral' },
          { label: 'DOCUMENT THE LOSS', sub: 'Record it for future generations', prompt: 'Camera drones document the collapse. The last native animals in the area are photographed and catalogued. An ecosystem obituary written in data. The habitat goes quiet forever.', consequence: 'Extinction documented', type: 'negative' },
        ],
      },
      {
        narrative: 'The long game. What kind of world do we leave behind?',
        choices: [
          { label: 'REWILD EVERYTHING', sub: 'Return this land to nature', prompt: `${pin.neighborhood} transformed into a thriving wildlife sanctuary. Fences removed. Native species repopulated. Dense vegetation, birdsong, clean water. An ecosystem restored to its pre-invasion glory.`, consequence: 'Wilderness restored', type: 'positive' },
          { label: 'MANAGED COEXISTENCE', sub: 'Humans and nature, side by side', prompt: `A carefully managed landscape in ${pin.neighborhood}. Boardwalks through wetlands. Viewing platforms for wildlife. Nature and community in balance. Not pristine, but alive and shared.`, consequence: 'Balance achieved', type: 'neutral' },
        ],
      },
    ],
    Soil: [
      {
        narrative: `The ground beneath ${pin.neighborhood} is shifting. Time is running out.`,
        choices: [
          { label: 'REINFORCE NOW', sub: 'Emergency seawalls and barriers', prompt: `Heavy machinery arrives at ${pin.neighborhood}. Concrete barriers and steel reinforcements are placed against the eroding coastline. Engineers race against the tide to stabilize the ground.`, consequence: 'Emergency barriers deployed', type: 'positive' },
          { label: 'NATURAL BARRIERS', sub: 'Plant mangroves and restore dunes', prompt: `Thousands of mangrove seedlings planted along the eroding shore of ${pin.neighborhood}. Sand dunes rebuilt with native grasses. A living wall of vegetation grows to protect the coast naturally.`, consequence: 'Living shoreline initiated', type: 'neutral' },
          { label: 'ABANDON THE COAST', sub: 'Retreat inland — this land is lost', prompt: `Buildings evacuated along the coast of ${pin.neighborhood}. Furniture carried out. Doors locked for the last time. The ocean claims another strip of human settlement. Waves crash through empty rooms.`, consequence: 'Strategic retreat executed', type: 'negative' },
        ],
      },
      {
        narrative: 'A major storm is approaching. Your defenses will be tested.',
        choices: [
          { label: 'FORTIFY DEFENSES', sub: 'Double down on protection', prompt: 'Sandbags stacked. Pumps activated. Storm surge barriers raised. The community braces as dark clouds gather. Wind howls but the barriers hold. Water rises and is redirected.', consequence: 'Defenses holding... for now', type: 'positive' },
          { label: 'EMERGENCY EVACUATION', sub: 'Get everyone to high ground', prompt: 'Sirens wail. Buses and trucks carry families to higher ground. Pets in carriers, children wrapped in blankets. The coast empties just as the storm surge crashes over the barriers.', consequence: 'Everyone safe — but at what cost', type: 'neutral' },
        ],
      },
      {
        narrative: 'After the storm. The landscape has changed forever.',
        choices: [
          { label: 'REBUILD STRONGER', sub: 'Invest in resilient infrastructure', prompt: `${pin.neighborhood} rises from the storm. New elevated buildings, green infrastructure, rain gardens. A community designed for the climate of the future. Stronger, smarter, sustainable.`, consequence: 'Resilient future built', type: 'positive' },
          { label: 'ACCEPT THE NEW SHORE', sub: 'The map has been redrawn', prompt: `The new coastline of ${pin.neighborhood}. Where buildings stood, now marshland. Where roads ran, now channels. Nature has redrawn the boundary. Humanity adapts to the new geography.`, consequence: 'Adaptation complete', type: 'neutral' },
        ],
      },
    ],
    Climate: [
      {
        narrative: `Extreme conditions gripping ${pin.city}. Infrastructure buckling under stress.`,
        choices: [
          { label: 'EMERGENCY COOLING', sub: 'Deploy misting stations and shelters', prompt: `Cooling stations spring up across ${pin.city}. Misting arcs spray over sidewalks. Public buildings open as refuges. The shimmering heat haze meets human ingenuity in a battle for survival.`, consequence: 'Cooling infrastructure deployed', type: 'positive' },
          { label: 'PROTECT THE GRID', sub: 'Prevent cascading power failure', prompt: `Engineers work frantically at the power plant. Load shedding begins across ${pin.city}. Rolling blackouts in some neighborhoods to prevent total grid collapse. A calculated sacrifice.`, consequence: 'Grid stabilized with tradeoffs', type: 'neutral' },
          { label: 'RIDE IT OUT', sub: 'It\'ll pass — it always does', prompt: `No action taken. The heat intensifies across ${pin.city}. Pavement buckles. Power lines sag. The grid fails completely. Darkness and heat. Emergency rooms overflow. A preventable catastrophe.`, consequence: 'Critical systems failing', type: 'negative' },
        ],
      },
      {
        narrative: 'Vulnerable communities are calling for help. Resources are limited.',
        choices: [
          { label: 'DEPLOY AID TEAMS', sub: 'Door-to-door wellness checks', prompt: 'Aid workers and volunteers fan out through neighborhoods. Knocking on doors. Delivering water. Checking on elderly residents. A human chain of compassion in the face of climate extremes.', consequence: 'Lives saved through action', type: 'positive' },
          { label: 'TRIAGE RESOURCES', sub: 'Focus on the most critical areas only', prompt: 'Resources concentrated in the hardest-hit zones. Some neighborhoods get everything they need. Others wait. The moral weight of choosing who gets help first.', consequence: 'Hard choices, uneven outcomes', type: 'neutral' },
        ],
      },
      {
        narrative: 'The crisis passes. But the next one is already forming. What now?',
        choices: [
          { label: 'GREEN TRANSFORMATION', sub: 'Rebuild the city around nature', prompt: `${pin.city} transformed. Every street lined with trees. Green roofs on every building. Solar canopies shade sidewalks. Temperature drops 10 degrees in the urban core. A city that breathes.`, consequence: 'A green future secured', type: 'positive' },
          { label: 'BUSINESS AS USUAL', sub: 'We survived — back to normal', prompt: `${pin.city} returns to normal. Same concrete. Same heat traps. Same vulnerable communities. Until next time. And next time comes sooner, and harder, and hotter.`, consequence: 'The cycle continues', type: 'negative' },
        ],
      },
    ],
  };

  return trees[pin.category] || trees.Water;
}

// ═══════════════════════════════════════════════════════════════════════════
// SCENE PROMPT — initial video generation prompt
// ═══════════════════════════════════════════════════════════════════════════

function generateScenePrompt(pin: PinReport): string {
  const scenery: Record<string, (p: PinReport) => string> = {
    Water: (p) => `Cinematic aerial drone shot of ${p.neighborhood} in ${p.city}. ${p.summary} Contaminated water, environmental crisis unfolding. Photorealistic, golden hour, 4K.`,
    Air: (p) => `Cinematic wide shot of ${p.neighborhood}, ${p.city}. ${p.summary} Thick haze, polluted sky, dramatic atmosphere. Photorealistic environmental footage.`,
    Soil: (p) => `Cinematic coastal view of ${p.neighborhood}, ${p.city}. ${p.summary} Eroding shoreline, environmental damage visible. Photorealistic, dramatic lighting.`,
    Bio: (p) => `Cinematic nature shot of ${p.neighborhood}, ${p.city}. ${p.summary} Wildlife habitat under threat. Photorealistic, intimate natural lighting.`,
    Climate: (p) => `Cinematic urban shot of ${p.neighborhood}, ${p.city}. ${p.summary} Extreme heat distortion, stressed infrastructure. Photorealistic, harsh sunlight.`,
  };
  return (scenery[pin.category] || scenery.Water)(pin);
}

// ═══════════════════════════════════════════════════════════════════════════
// BOOT SEQUENCE
// ═══════════════════════════════════════════════════════════════════════════

function getBootLines(pin: PinReport, hasImage: boolean): string[] {
  const lines = [
    'ODYSSEY WORLD MODEL v2.0',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    'SYSTEM INITIALIZATION',
    '▸ Loading neural weights.............. ✓',
    '▸ Calibrating world model............. ✓',
    '▸ Initializing physics engine......... ✓',
  ];
  if (hasImage) {
    lines.push('▸ Loading field photograph............ ✓');
    lines.push('▸ Image-to-video pipeline............. ✓');
  }
  lines.push(
    '',
    `TARGET: ${pin.city}, ${pin.neighborhood}`,
    `THREAT: ${pin.title.toUpperCase()}`,
    `SEVERITY: ${pin.severity.toUpperCase()}`,
    `CONFIDENCE: ${pin.confidence}%`,
    hasImage ? 'MODE: IMAGE-TO-VIDEO (I2V)' : 'MODE: TEXT-TO-VIDEO',
    '',
    '▸ Connecting to Odyssey stream........',
  );
  return lines;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

type Phase = 'boot' | 'connecting' | 'streaming' | 'error';
type StoryPhase = 'cinematic' | 'narrating' | 'choosing' | 'responding' | 'finale';

interface OdysseyViewProps {
  pin: PinReport;
  imageUrl?: string;
  onClose: () => void;
}

export default function OdysseyView({ pin, imageUrl, onClose }: OdysseyViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const clientRef = useRef<any>(null);
  const streamIdRef = useRef<string | null>(null);

  // Connection state
  const [phase, setPhase] = useState<Phase>('boot');
  const [bootLineIndex, setBootLineIndex] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [usingFieldPhoto, setUsingFieldPhoto] = useState(!!imageUrl);

  // Story state
  const [storyPhase, setStoryPhase] = useState<StoryPhase>('cinematic');
  const [decisionIndex, setDecisionIndex] = useState(0);
  const [choicesMade, setChoicesMade] = useState<{ label: string; type: string }[]>([]);
  const [consequenceText, setConsequenceText] = useState('');
  const [hudVisible, setHudVisible] = useState(false);
  const [timerPct, setTimerPct] = useState(100);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Custom prompt input
  const [promptInput, setPromptInput] = useState('');
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptSending, setPromptSending] = useState(false);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const promptInputRef = useRef<HTMLInputElement>(null);

  const bootLines = getBootLines(pin, !!imageUrl);
  const decisions = generateDecisions(pin);
  const threatColor = THREAT_COLORS[pin.severity];
  const currentDecision = decisions[decisionIndex] || null;

  // ── Boot sequence ────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'boot') return;
    if (bootLineIndex >= bootLines.length) {
      const t = setTimeout(() => {
        setPhase('connecting');
        connectToOdyssey();
      }, 400);
      return () => clearTimeout(t);
    }
    const delay = bootLines[bootLineIndex] === '' ? 100 : bootLines[bootLineIndex].startsWith('━') ? 50 : 80;
    const timer = setTimeout(() => setBootLineIndex((i) => i + 1), delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, bootLineIndex]);

  // ── Connect to Odyssey ───────────────────────────────────────────────

  // ── Fetch field photo as Blob for I2V ────────────────────────────────

  const fetchImageBlob = useCallback(async (url: string): Promise<Blob | null> => {
    try {
      setStatusText('Loading field photograph...');
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.blob();
    } catch {
      console.error('Failed to fetch image for I2V');
      return null;
    }
  }, []);

  const startEnvironmentStream = useCallback(
    async (client: any) => {
      try {
        // If we have a field photo, use image-to-video
        let imageBlob: Blob | null = null;
        if (imageUrl) {
          setStatusText('Processing field photograph for I2V...');
          imageBlob = await fetchImageBlob(imageUrl);
          if (imageBlob) {
            setUsingFieldPhoto(true);
            setStatusText('Generating world from photograph...');
          } else {
            setUsingFieldPhoto(false);
            setStatusText('Photo unavailable — falling back to text generation...');
          }
        } else {
          setStatusText('Generating environment...');
        }

        const streamId = await client.startStream({
          prompt: generateScenePrompt(pin),
          portrait: false,
          ...(imageBlob ? { image: imageBlob } : {}),
        });
        if (streamId) streamIdRef.current = streamId;
      } catch (err) {
        console.error('Stream start failed:', err);
        setStatusText(`Stream failed: ${err instanceof Error ? err.message : 'Unknown'}`);
        setPhase('error');
      }
    },
    [pin, imageUrl, fetchImageBlob],
  );

  const connectToOdyssey = useCallback(async () => {
    const apiKey = process.env.NEXT_PUBLIC_ODYSSEY_API_KEY;
    if (!apiKey) {
      setStatusText('ERROR: No API key configured');
      setPhase('error');
      return;
    }
    setStatusText('Establishing WebRTC connection...');

    const timeout = setTimeout(() => {
      setStatusText('Connection timed out — Odyssey API may be unavailable');
      setPhase('error');
    }, 15000);

    try {
      const client = new Odyssey({ apiKey });
      clientRef.current = client;

      await client.connect({
        onConnected: (mediaStream: MediaStream) => {
          clearTimeout(timeout);
          setStatusText('Connected — generating world...');
          // Use attachToVideo convenience method
          if (videoRef.current) {
            try { client.attachToVideo(videoRef.current); } catch {
              videoRef.current.srcObject = mediaStream;
            }
          }
          startEnvironmentStream(client);
        },
        onStreamStarted: (id: string) => {
          streamIdRef.current = id;
          setPhase('streaming');
          setStoryPhase('cinematic');
          setStatusText('');
          setTimeout(() => setHudVisible(true), 600);
          setTimeout(() => setStoryPhase('narrating'), 5000);
        },
        onInteractAcknowledged: (prompt: string) => {
          console.log('[Odyssey] Interact acknowledged:', prompt.slice(0, 60));
        },
        onStreamError: (reason: string, message: string) => {
          console.error('[Odyssey] Stream error:', reason, message);
          setStatusText(`Stream error: ${message}`);
        },
        onStreamEnded: () => setStatusText('Stream ended'),
        onDisconnected: () => {
          console.log('[Odyssey] Disconnected');
        },
        onStatusChange: (_s: string, msg?: string) => { if (msg) setStatusText(msg); },
        onError: (error: Error, fatal: boolean) => {
          clearTimeout(timeout);
          console.error('Odyssey error:', error.message);
          if (fatal) { setStatusText(`Connection failed: ${error.message}`); setPhase('error'); }
        },
      });
    } catch (err) {
      clearTimeout(timeout);
      console.error('Odyssey connect failed:', err);
      setStatusText(`Failed: ${err instanceof Error ? err.message : 'Unknown'}`);
      setPhase('error');
    }
  }, [pin, startEnvironmentStream]);

  // ── Story transitions ────────────────────────────────────────────────

  // Narrating → Choosing (after text is visible for 2s)
  useEffect(() => {
    if (storyPhase !== 'narrating') return;
    const t = setTimeout(() => {
      setStoryPhase('choosing');
      setTimerPct(100);
      // Start countdown timer (20 seconds)
      let pct = 100;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        pct -= 0.5;
        setTimerPct(Math.max(0, pct));
      }, 100);
    }, 2200);
    return () => clearTimeout(t);
  }, [storyPhase]);

  // Clean up timer when leaving choosing phase
  useEffect(() => {
    if (storyPhase !== 'choosing' && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [storyPhase]);

  // ── Make a choice ────────────────────────────────────────────────────

  const handleChoice = useCallback(
    (choice: Choice) => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setStoryPhase('responding');
      setConsequenceText(choice.consequence);
      setChoicesMade((prev) => [...prev, { label: choice.label, type: choice.type }]);

      // Send interact prompt to Odyssey
      const client = clientRef.current;
      if (client) {
        try { client.interact({ prompt: choice.prompt }); } catch (_) {}
      }

      // After 6s, advance to next decision or finale
      setTimeout(() => {
        const nextIdx = decisionIndex + 1;
        if (nextIdx >= decisions.length) {
          setStoryPhase('finale');
        } else {
          setDecisionIndex(nextIdx);
          setStoryPhase('cinematic');
          // Show next decision after 4s of cinematic
          setTimeout(() => setStoryPhase('narrating'), 4000);
        }
      }, 6000);
    },
    [decisionIndex, decisions.length],
  );

  // ── Custom prompt ──────────────────────────────────────────────────

  const sendCustomPrompt = useCallback(() => {
    const text = promptInput.trim();
    if (!text || !clientRef.current) return;
    setPromptSending(true);
    try {
      clientRef.current.interact({ prompt: text });
      setPromptHistory((prev) => [text, ...prev].slice(0, 20));
      setPromptInput('');
    } catch (err) {
      console.error('Interact failed:', err);
    }
    setTimeout(() => setPromptSending(false), 1500);
  }, [promptInput]);

  // Toggle prompt bar with T key
  useEffect(() => {
    if (phase !== 'streaming') return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 't' || e.key === 'T') {
        // Don't trigger if already typing in input
        if (document.activeElement?.tagName === 'INPUT') return;
        setPromptOpen((prev) => {
          if (!prev) setTimeout(() => promptInputRef.current?.focus(), 50);
          return !prev;
        });
      }
      if (e.key === 'Escape') setPromptOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase]);

  // ── Cleanup ──────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      const client = clientRef.current;
      if (client) { try { client.endStream?.(); client.disconnect?.(); } catch (_) {} }
    };
  }, []);

  // ── Finale summary ───────────────────────────────────────────────────

  const positiveCount = choicesMade.filter((c) => c.type === 'positive').length;
  const negativeCount = choicesMade.filter((c) => c.type === 'negative').length;
  const finaleVerdict =
    positiveCount > negativeCount
      ? { text: 'THE ECOSYSTEM RECOVERS', color: '#0ff5c4', sub: 'Your decisions gave this place a future.' }
      : negativeCount > positiveCount
        ? { text: 'THE DAMAGE IS DONE', color: '#ff3b4f', sub: 'Some choices can\'t be undone.' }
        : { text: 'AN UNCERTAIN FUTURE', color: '#f5a623', sub: 'The outcome hangs in the balance.' };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div style={S.container}>
      {/* Fullscreen video */}
      <video ref={videoRef} autoPlay playsInline muted style={S.video} />

      {/* ── BOOT ── */}
      {phase === 'boot' && (
        <div style={S.overlay}>
          <div style={S.bootTerminal}>
            {bootLines.slice(0, bootLineIndex).map((line, i) => (
              <div key={i} style={{
                color: line.startsWith('TARGET') || line.startsWith('THREAT') || line.startsWith('SEVERITY') ? threatColor
                  : line.startsWith('MODE') ? '#a78bfa'
                  : line.startsWith('CONFIDENCE') ? '#0ff5c4'
                  : line.startsWith('━') ? '#252838'
                  : line.includes('✓') ? '#0ff5c4'
                  : '#8b8fa4',
                fontWeight: line.startsWith('ODYSSEY') ? 600 : 400,
                fontSize: line.startsWith('ODYSSEY') ? 14 : 11,
                letterSpacing: line.startsWith('ODYSSEY') ? 4 : 1,
                opacity: 0, animation: 'ody-fade-in 0.15s ease forwards', animationDelay: `${i * 0.02}s`,
              }}>{line || '\u00A0'}</div>
            ))}
            {bootLineIndex >= bootLines.length && (
              <div style={{ color: '#0ff5c4', animation: 'ody-blink 1s infinite' }}>▸ Connecting... ●</div>
            )}
          </div>
          <div style={S.scanlineAnim} />
        </div>
      )}

      {/* ── CONNECTING ── */}
      {phase === 'connecting' && (
        <div style={S.overlay}>
          <div style={{ textAlign: 'center' }}>
            <div style={S.spinner}><div style={S.spinnerInner} /></div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: '#0ff5c4', marginTop: 24 }}>
              {statusText.toUpperCase()}
            </div>
            <div style={{ fontSize: 9, color: '#555870', marginTop: 8 }}>
              {pin.city} — {pin.title}
            </div>
          </div>
        </div>
      )}

      {/* ── ERROR ── */}
      {phase === 'error' && (
        <div style={S.overlay}>
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <div style={{ fontSize: 13, letterSpacing: 3, color: '#ff3b4f', marginBottom: 12 }}>CONNECTION FAILED</div>
            <div style={{ fontSize: 10, color: '#8b8fa4', marginBottom: 24, lineHeight: 1.6 }}>{statusText}</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => { setPhase('boot'); setBootLineIndex(0); }} style={S.retryBtn}>RETRY</button>
              <button onClick={onClose} style={{ ...S.retryBtn, borderColor: '#ff3b4f40', color: '#ff3b4f' }}>EXIT</button>
            </div>
          </div>
        </div>
      )}

      {/* ── STREAMING — STORY MODE ── */}
      {phase === 'streaming' && (
        <>
          {/* Vignette */}
          <div style={S.vignette} />

          {/* Minimal top HUD */}
          <div style={{ ...S.topBar, opacity: hudVisible ? 1 : 0, transition: 'opacity 0.8s ease' }}>
            <button onClick={onClose} style={S.exitBtn}>✕</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0ff5c4', boxShadow: '0 0 8px #0ff5c4' }} />
              <span style={{ fontSize: 10, letterSpacing: 2, fontWeight: 600 }}>ODYSSEY</span>
              {usingFieldPhoto && (
                <span style={{ fontSize: 7, letterSpacing: 1.5, padding: '2px 6px', borderRadius: 3, color: '#a78bfa', background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', fontWeight: 600 }}>
                  I2V
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 9, color: '#8b8fa4' }}>{pin.city}</span>
              <span style={{ fontSize: 8, letterSpacing: 1, padding: '2px 6px', borderRadius: 3, color: threatColor, background: `${threatColor}15`, border: `1px solid ${threatColor}30` }}>
                {pin.severity.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Decision counter */}
          <div style={{ ...S.decisionCounter, opacity: hudVisible ? 1 : 0, transition: 'opacity 0.8s ease 0.3s' }}>
            {decisions.map((_, i) => (
              <div key={i} style={{
                width: 24, height: 3, borderRadius: 2,
                background: i < decisionIndex ? (choicesMade[i]?.type === 'positive' ? '#0ff5c4' : choicesMade[i]?.type === 'negative' ? '#ff3b4f' : '#f5a623')
                  : i === decisionIndex ? '#e4e6ef'
                  : '#252838',
                transition: 'background 0.5s ease',
              }} />
            ))}
          </div>

          {/* ── NARRATIVE TEXT ── */}
          {(storyPhase === 'narrating' || storyPhase === 'choosing') && currentDecision && (
            <div style={S.narrativeContainer}>
              <div style={S.narrativeText}>
                {currentDecision.narrative}
              </div>

              {/* Timer bar */}
              {storyPhase === 'choosing' && (
                <div style={S.timerBar}>
                  <div style={{ ...S.timerFill, width: `${timerPct}%` }} />
                </div>
              )}
            </div>
          )}

          {/* ── CHOICES ── */}
          {storyPhase === 'choosing' && currentDecision && (
            <div style={S.choicesContainer}>
              {currentDecision.choices.map((choice, i) => {
                const cColor = choice.type === 'positive' ? '#0ff5c4' : choice.type === 'negative' ? '#ff3b4f' : '#f5a623';
                return (
                  <button
                    key={i}
                    onClick={() => handleChoice(choice)}
                    style={S.choiceBtn}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${cColor}15`;
                      e.currentTarget.style.borderColor = `${cColor}60`;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(8,9,12,0.7)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 16, color: cColor, width: 24, textAlign: 'center', flexShrink: 0 }}>
                        {choice.type === 'positive' ? '▲' : choice.type === 'negative' ? '▼' : '◆'}
                      </span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2, color: '#e4e6ef' }}>
                          {choice.label}
                        </div>
                        <div style={{ fontSize: 9, color: '#8b8fa4', marginTop: 2 }}>
                          {choice.sub}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: 9, color: '#555870', letterSpacing: 1 }}>{i + 1}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── CONSEQUENCE TEXT ── */}
          {storyPhase === 'responding' && (
            <div style={S.consequenceContainer}>
              <div style={S.consequenceFlash} />
              <div style={{ fontSize: 9, letterSpacing: 4, color: '#555870', marginBottom: 8 }}>
                THE ENVIRONMENT RESPONDS
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: 2, color: '#e4e6ef' }}>
                {consequenceText}
              </div>
            </div>
          )}

          {/* ── FINALE ── */}
          {storyPhase === 'finale' && (
            <div style={S.finaleContainer}>
              <div style={{ fontSize: 9, letterSpacing: 4, color: '#555870', marginBottom: 16 }}>
                {pin.city.toUpperCase()} — {pin.title.toUpperCase()}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 4, color: finaleVerdict.color, marginBottom: 12, textShadow: `0 0 40px ${finaleVerdict.color}40` }}>
                {finaleVerdict.text}
              </div>
              <div style={{ fontSize: 11, color: '#8b8fa4', marginBottom: 32 }}>
                {finaleVerdict.sub}
              </div>
              {/* Choices recap */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
                {choicesMade.map((c, i) => (
                  <span key={i} style={{
                    fontSize: 8, letterSpacing: 1.5, padding: '4px 10px', borderRadius: 3,
                    color: c.type === 'positive' ? '#0ff5c4' : c.type === 'negative' ? '#ff3b4f' : '#f5a623',
                    background: c.type === 'positive' ? 'rgba(15,245,196,0.1)' : c.type === 'negative' ? 'rgba(255,59,79,0.1)' : 'rgba(245,166,35,0.1)',
                    border: `1px solid ${c.type === 'positive' ? 'rgba(15,245,196,0.2)' : c.type === 'negative' ? 'rgba(255,59,79,0.2)' : 'rgba(245,166,35,0.2)'}`,
                  }}>
                    {c.label}
                  </span>
                ))}
              </div>
              <button onClick={onClose} style={S.finaleBtn}>
                RETURN TO DASHBOARD
              </button>
            </div>
          )}

          {/* ── CUSTOM PROMPT BAR ── */}
          {hudVisible && (
            <>
              {/* Toggle button */}
              {!promptOpen && (
                <button
                  onClick={() => { setPromptOpen(true); setTimeout(() => promptInputRef.current?.focus(), 50); }}
                  style={S.promptToggle}
                  title="Transform (T)"
                >
                  <span style={{ fontSize: 12 }}>⌘</span>
                  <span style={{ fontSize: 8, letterSpacing: 1.5 }}>TRANSFORM</span>
                </button>
              )}

              {/* Prompt input panel */}
              {promptOpen && (
                <div style={S.promptBar}>
                  <div style={S.promptHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#0ff5c4', boxShadow: '0 0 6px #0ff5c4' }} />
                      <span style={{ fontSize: 8, letterSpacing: 2, color: '#0ff5c4', fontWeight: 600 }}>TRANSFORM PROMPT</span>
                    </div>
                    <button onClick={() => setPromptOpen(false)} style={S.promptClose}>ESC</button>
                  </div>
                  <div style={S.promptInputRow}>
                    <input
                      ref={promptInputRef}
                      type="text"
                      value={promptInput}
                      onChange={(e) => setPromptInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') sendCustomPrompt(); }}
                      placeholder="Describe how to transform the scene..."
                      style={S.promptInputField}
                    />
                    <button
                      onClick={sendCustomPrompt}
                      disabled={!promptInput.trim() || promptSending}
                      style={{
                        ...S.promptSendBtn,
                        opacity: promptInput.trim() && !promptSending ? 1 : 0.3,
                      }}
                    >
                      {promptSending ? '●' : '→'}
                    </button>
                  </div>
                  {promptHistory.length > 0 && (
                    <div style={S.promptHistoryContainer}>
                      {promptHistory.slice(0, 3).map((h, i) => (
                        <button
                          key={i}
                          onClick={() => { setPromptInput(h); promptInputRef.current?.focus(); }}
                          style={S.promptHistoryItem}
                        >
                          <span style={{ fontSize: 7, color: '#555870', marginRight: 4 }}>↩</span>
                          <span style={{ fontSize: 8, color: '#8b8fa4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Corner brackets */}
          <div style={{ ...S.corner, top: 12, left: 12, borderTop: `2px solid ${threatColor}40`, borderLeft: `2px solid ${threatColor}40` }} />
          <div style={{ ...S.corner, top: 12, right: 12, borderTop: `2px solid ${threatColor}40`, borderRight: `2px solid ${threatColor}40` }} />
          <div style={{ ...S.corner, bottom: 12, left: 12, borderBottom: `2px solid ${threatColor}40`, borderLeft: `2px solid ${threatColor}40` }} />
          <div style={{ ...S.corner, bottom: 12, right: 12, borderBottom: `2px solid ${threatColor}40`, borderRight: `2px solid ${threatColor}40` }} />

          {/* Scanline */}
          <div style={S.scanline} />
        </>
      )}

      <style>{`
        @keyframes ody-blink { 0%,100%{opacity:.4} 50%{opacity:1} }
        @keyframes ody-fade-in { 0%{opacity:0;transform:translateY(4px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes ody-spin { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }
        @keyframes ody-scandown { 0%{top:-2px} 100%{top:100%} }
        @keyframes ody-pulse-ring { 0%{box-shadow:0 0 0 0 rgba(15,245,196,.4)} 70%{box-shadow:0 0 0 20px rgba(15,245,196,0)} 100%{box-shadow:0 0 0 0 rgba(15,245,196,0)} }
        @keyframes ody-flash { 0%{opacity:0.3} 100%{opacity:0} }
        @keyframes ody-slide-up { 0%{opacity:0;transform:translateY(30px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes ody-narrative-in { 0%{opacity:0;transform:translateY(10px)} 100%{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const S: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed', inset: 0, background: '#000',
    fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
    color: '#e4e6ef', overflow: 'hidden', zIndex: 60,
  },
  video: {
    position: 'absolute', inset: 0, width: '100%', height: '100%',
    objectFit: 'cover', background: '#000',
  },

  // Overlays (boot, connecting, error)
  overlay: {
    position: 'absolute', inset: 0, background: '#08090c',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  bootTerminal: { lineHeight: 2, maxWidth: 500 },
  scanlineAnim: {
    position: 'absolute', left: 0, right: 0, height: 2,
    background: 'rgba(15,245,196,0.15)', zIndex: 101,
    animation: 'ody-scandown 2.5s linear infinite',
  },
  spinner: {
    width: 80, height: 80, borderRadius: '50%',
    border: '2px solid rgba(15,245,196,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: 'ody-pulse-ring 2s ease infinite', margin: '0 auto',
  },
  spinnerInner: {
    width: 50, height: 50, borderRadius: '50%',
    border: '2px solid transparent', borderTopColor: '#0ff5c4',
    animation: 'ody-spin 1s linear infinite',
  },
  retryBtn: {
    padding: '8px 20px', background: 'rgba(15,245,196,0.1)',
    border: '1px solid rgba(15,245,196,0.3)', borderRadius: 4,
    color: '#0ff5c4', fontSize: 9, fontWeight: 600, cursor: 'pointer',
    fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.5,
  },

  // Streaming HUD
  vignette: {
    position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none',
    background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.75) 100%)',
  },
  topBar: {
    position: 'fixed', top: 0, left: 0, right: 0, height: 40,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 16px', zIndex: 100,
    background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
  },
  exitBtn: {
    width: 28, height: 28, borderRadius: 4,
    background: 'rgba(255,59,79,0.15)', border: '1px solid rgba(255,59,79,0.3)',
    color: '#ff3b4f', fontSize: 10, cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontFamily: "'JetBrains Mono', monospace",
  },
  decisionCounter: {
    position: 'fixed', top: 48, left: '50%', transform: 'translateX(-50%)',
    display: 'flex', gap: 6, zIndex: 100,
  },

  // Narrative
  narrativeContainer: {
    position: 'fixed', bottom: 220, left: '50%', transform: 'translateX(-50%)',
    maxWidth: 700, width: '90%', textAlign: 'center', zIndex: 100,
    animation: 'ody-narrative-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
  },
  narrativeText: {
    fontSize: 18, fontWeight: 400, lineHeight: 1.6, color: '#e4e6ef',
    textShadow: '0 2px 20px rgba(0,0,0,0.8), 0 0 40px rgba(0,0,0,0.5)',
    fontFamily: "'Instrument Sans', 'Inter', sans-serif",
  },
  timerBar: {
    width: '100%', height: 2, background: 'rgba(255,255,255,0.1)',
    borderRadius: 1, marginTop: 16, overflow: 'hidden',
  },
  timerFill: {
    height: '100%', background: '#0ff5c4', borderRadius: 1,
    transition: 'width 0.1s linear',
  },

  // Choices
  choicesContainer: {
    position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)',
    maxWidth: 600, width: '90%', display: 'flex', flexDirection: 'column',
    gap: 8, zIndex: 100,
    animation: 'ody-slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
  },
  choiceBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 20px', borderRadius: 6,
    background: 'rgba(8,9,12,0.7)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer', transition: 'all 0.25s ease',
    fontFamily: "'JetBrains Mono', monospace",
  },

  // Consequence
  consequenceContainer: {
    position: 'fixed', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center', zIndex: 100, maxWidth: 500,
    animation: 'ody-narrative-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
  },
  consequenceFlash: {
    position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.08)',
    animation: 'ody-flash 1s ease-out forwards', pointerEvents: 'none', zIndex: 99,
  },

  // Finale
  finaleContainer: {
    position: 'fixed', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center', zIndex: 100, maxWidth: 600, width: '90%',
    animation: 'ody-narrative-in 1s cubic-bezier(0.16, 1, 0.3, 1) both',
  },
  finaleBtn: {
    padding: '12px 32px', borderRadius: 6,
    background: 'rgba(15,245,196,0.1)', border: '1px solid rgba(15,245,196,0.3)',
    color: '#0ff5c4', fontSize: 10, fontWeight: 600, letterSpacing: 2,
    cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
    transition: 'all 0.2s ease',
  },

  // Corner brackets
  corner: {
    position: 'fixed', width: 36, height: 36, zIndex: 200, pointerEvents: 'none',
  },

  // Custom prompt
  promptToggle: {
    position: 'fixed', bottom: 16, right: 16, zIndex: 200,
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 14px', borderRadius: 6,
    background: 'rgba(8,9,12,0.7)', backdropFilter: 'blur(20px)',
    border: '1px solid rgba(15,245,196,0.25)',
    color: '#0ff5c4', cursor: 'pointer',
    fontFamily: "'JetBrains Mono', monospace",
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  promptBar: {
    position: 'fixed', bottom: 16, right: 16, zIndex: 200,
    width: 420, borderRadius: 8,
    background: 'rgba(8,9,12,0.85)', backdropFilter: 'blur(24px)',
    border: '1px solid rgba(15,245,196,0.2)',
    overflow: 'hidden',
    animation: 'ody-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
  } as React.CSSProperties,
  promptHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  } as React.CSSProperties,
  promptClose: {
    fontSize: 7, letterSpacing: 1.5, padding: '3px 8px', borderRadius: 3,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#8b8fa4', cursor: 'pointer',
    fontFamily: "'JetBrains Mono', monospace",
  } as React.CSSProperties,
  promptInputRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 12px',
  } as React.CSSProperties,
  promptInputField: {
    flex: 1, padding: '8px 12px', borderRadius: 4,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#e4e6ef', fontSize: 11, outline: 'none',
    fontFamily: "'JetBrains Mono', monospace",
  } as React.CSSProperties,
  promptSendBtn: {
    width: 32, height: 32, borderRadius: 4, flexShrink: 0,
    background: 'rgba(15,245,196,0.12)', border: '1px solid rgba(15,245,196,0.3)',
    color: '#0ff5c4', fontSize: 14, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'JetBrains Mono', monospace",
    transition: 'all 0.15s ease',
  } as React.CSSProperties,
  promptHistoryContainer: {
    padding: '0 12px 10px',
    display: 'flex', flexDirection: 'column', gap: 2,
  } as React.CSSProperties,
  promptHistoryItem: {
    display: 'flex', alignItems: 'center', padding: '4px 8px',
    borderRadius: 3, background: 'transparent',
    border: 'none', cursor: 'pointer', textAlign: 'left',
    fontFamily: "'JetBrains Mono', monospace",
    maxWidth: '100%', overflow: 'hidden',
    transition: 'background 0.15s ease',
  } as React.CSSProperties,

  // Scanline
  scanline: {
    position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none',
    background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.04) 2px,rgba(0,0,0,.04) 4px)',
    mixBlendMode: 'multiply' as const,
  },
};
