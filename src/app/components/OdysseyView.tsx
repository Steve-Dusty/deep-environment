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
  const loc = `${pin.neighborhood}, ${pin.city}`;

  const trees: Record<string, Decision[]> = {
    Water: [
      {
        narrative: `${pin.title} — what would ${pin.neighborhood} look like if the water was cleaned?`,
        choices: [
          { label: 'REMOVE POLLUTANTS', sub: 'Filter contaminants from the water', prompt: `The water in ${loc} is now clear and clean. All pollutants, oil sheens, and chemical runoff have been removed. Sunlight penetrates the surface revealing a sandy bottom. The waterway is pristine and reflective. Photorealistic, same location, clean water transformation.`, consequence: 'Water runs clear again', type: 'positive' },
          { label: 'RESTORE SHORELINE', sub: 'Rebuild the natural water\'s edge', prompt: `The shoreline of ${loc} has been restored. Trash and debris are gone. Native reeds, grasses, and wetland plants grow thick along the banks. The water meets a living green edge instead of concrete and garbage. Natural, lush, photorealistic.`, consequence: 'Natural shoreline restored', type: 'positive' },
          { label: 'NO INTERVENTION', sub: 'See how it continues to degrade', prompt: `The water in ${loc} deteriorates further. More pollutants accumulate. The surface becomes opaque, dark, and lifeless. Algae blooms choke the waterway. Dead fish float. The smell is visible as a green haze over the surface. Photorealistic environmental decline.`, consequence: 'Pollution accelerates unchecked', type: 'negative' },
        ],
      },
      {
        narrative: 'The water is responding. What happens if we restore the ecosystem around it?',
        choices: [
          { label: 'BRING BACK WILDLIFE', sub: 'Reintroduce native species', prompt: `${loc} waterway is now teeming with life. Fish swim in clear water. Herons and egrets wade in the shallows. Turtles sun on logs. Dragonflies hover. The entire aquatic ecosystem has been restored. Vibrant, alive, photorealistic nature scene.`, consequence: 'Ecosystem springs back to life', type: 'positive' },
          { label: 'BUILD WETLANDS', sub: 'Create natural water filtration', prompt: `A new constructed wetland stretches along ${loc}. Pools of filtered water cascade through layers of native marsh plants. The wetland acts as a living filter, cleaning water naturally. Lush green vegetation everywhere. Photorealistic restored wetland.`, consequence: 'Natural filtration system thriving', type: 'positive' },
        ],
      },
      {
        narrative: 'Full restoration complete. This is what recovery looks like.',
        choices: [
          { label: 'VIEW RESTORED SITE', sub: 'See the fully recovered environment', prompt: `${loc} fully restored. Crystal clear water flows through a thriving natural waterway. Dense native vegetation. Birds nesting. Fish jumping. People walking along clean, beautiful paths beside sparkling water. A complete environmental transformation. Golden hour, photorealistic.`, consequence: 'Complete environmental recovery', type: 'positive' },
          { label: 'COMPARE BEFORE/AFTER', sub: 'See the contrast of change', prompt: `Split view transformation of ${loc}. On one side, the polluted, degraded waterway as it was. On the other, the same location now — clean, green, alive. The dramatic difference between neglect and restoration. Photorealistic comparison.`, consequence: 'The power of restoration revealed', type: 'positive' },
        ],
      },
    ],
    Air: [
      {
        narrative: `${pin.title} — what would ${pin.city} look like with clean air?`,
        choices: [
          { label: 'CLEAR THE SKIES', sub: 'Remove the smoke and haze', prompt: `The skies over ${loc} are now completely clear. All smoke, haze, and pollution have dissipated. Deep blue sky stretches overhead. The sun shines clearly. Buildings, trees, and distant mountains are crisp and visible. The same location but with perfectly clean air. Photorealistic clear day.`, consequence: 'Skies are crystal clear', type: 'positive' },
          { label: 'ADD GREEN CANOPY', sub: 'Plant trees to filter the air', prompt: `${loc} is now lined with mature trees. A thick green canopy shades the streets. The air is filtered naturally by thousands of leaves. Where there was haze, there is now dappled green light. The urban landscape transformed by vegetation. Photorealistic urban forest.`, consequence: 'Urban forest filters the air', type: 'positive' },
          { label: 'NO INTERVENTION', sub: 'See how the pollution compounds', prompt: `The air quality in ${loc} worsens dramatically. Thick brown-grey smog blankets everything. Visibility drops to a few hundred feet. The sun is a dim orange disk behind toxic haze. Streets are barely visible. A suffocating atmosphere. Photorealistic severe air pollution.`, consequence: 'Air becomes hazardous', type: 'negative' },
        ],
      },
      {
        narrative: 'The air is clearing. What would this neighborhood look like fully transformed?',
        choices: [
          { label: 'SOLAR TRANSITION', sub: 'Replace all fossil fuel sources', prompt: `${loc} transformed with clean energy. Solar panels on every rooftop. No smokestacks, no exhaust. The air is pristine. Electric vehicles move silently through clean streets under blue skies. Renewable energy infrastructure gleaming. Photorealistic clean city.`, consequence: 'Zero emissions achieved', type: 'positive' },
          { label: 'GREEN INFRASTRUCTURE', sub: 'Living walls and rooftop gardens', prompt: `Every building in ${loc} covered with living green walls and rooftop gardens. Plants growing vertically up facades. Clean air flows between buildings. The neighborhood breathes. A green urban oasis under clear blue sky. Photorealistic sustainable architecture.`, consequence: 'The city itself cleans the air', type: 'positive' },
        ],
      },
      {
        narrative: 'Full recovery. This is the potential of clean air.',
        choices: [
          { label: 'VIEW CLEAN FUTURE', sub: 'See the pollution-free environment', prompt: `${loc} on a perfectly clear day. Brilliant blue sky. Distant mountains and skyline sharp and crisp on the horizon. Children playing outside. People jogging. The air is so clean you can see for miles. Vibrant colors, sharp shadows, pure atmosphere. Golden hour photorealism.`, consequence: 'A breathable future realized', type: 'positive' },
          { label: 'COMPARE BEFORE/AFTER', sub: 'Contrast the hazy past with the clear present', prompt: `The same view of ${loc} — before and after. One side choked in grey-brown haze, buildings fading into smog. The other side pristine, sharp, colorful under a vivid blue sky. The same place, utterly transformed by clean air. Photorealistic comparison.`, consequence: 'Clean air changes everything', type: 'positive' },
        ],
      },
    ],
    Bio: [
      {
        narrative: `${pin.title} — what would ${pin.neighborhood} look like with a thriving ecosystem?`,
        choices: [
          { label: 'REMOVE INVASIVE SPECIES', sub: 'Clear out what doesn\'t belong', prompt: `${loc} cleared of all invasive species. The overgrown, choking vegetation is gone. Native plants now have room to grow. The natural landscape emerges — the habitat as it should be. Open, balanced, healthy ground cover. Photorealistic restored habitat.`, consequence: 'Native habitat reclaimed', type: 'positive' },
          { label: 'RESTORE NATIVE PLANTS', sub: 'Replant the original ecosystem', prompt: `${loc} is now covered in native vegetation. Indigenous wildflowers, grasses, and shrubs grow in natural patterns. The landscape looks like it did before human disruption. Rich biodiversity everywhere. Butterflies, bees, and birds populate the thriving habitat. Photorealistic native ecosystem.`, consequence: 'Original ecosystem returns', type: 'positive' },
          { label: 'NO INTERVENTION', sub: 'Let the invasives spread', prompt: `${loc} overrun completely by invasive species. A monoculture of aggressive plants chokes out everything. No native birds, no butterflies, no diversity. A biological desert disguised as greenery. The habitat is functionally dead despite looking green. Photorealistic ecological collapse.`, consequence: 'Biodiversity collapses', type: 'negative' },
        ],
      },
      {
        narrative: 'The habitat is recovering. What about the wildlife?',
        choices: [
          { label: 'BRING BACK WILDLIFE', sub: 'Reintroduce native animal species', prompt: `${loc} alive with native wildlife. Birds nesting in restored trees. Foxes, rabbits, and deer visible in the underbrush. Pollinators swarm flowering plants. The food chain is complete and functioning. A living, breathing, balanced ecosystem. Photorealistic wildlife sanctuary.`, consequence: 'The food chain is whole again', type: 'positive' },
          { label: 'CREATE CORRIDORS', sub: 'Connect isolated habitat patches', prompt: `Green wildlife corridors stretch through ${loc}, connecting parks and natural areas. Bridges over roads for animals. Continuous strips of native vegetation. Wildlife moves freely through the landscape. An interconnected network of living spaces. Photorealistic ecological corridors.`, consequence: 'Habitats reconnected', type: 'positive' },
        ],
      },
      {
        narrative: 'Full ecological restoration. A vision of what\'s possible.',
        choices: [
          { label: 'VIEW THRIVING HABITAT', sub: 'See the fully recovered ecosystem', prompt: `${loc} is a thriving nature sanctuary. Dense, diverse native vegetation. Abundant wildlife at every level — insects, birds, mammals. Clean water flowing through. The air smells of wildflowers and earth. A complete, self-sustaining ecosystem in perfect balance. Sunset, photorealistic.`, consequence: 'Biodiversity fully restored', type: 'positive' },
          { label: 'COMPARE BEFORE/AFTER', sub: 'See degraded vs. restored', prompt: `${loc} before and after restoration. One side shows the degraded, invaded, lifeless habitat. The other shows the same spot thriving — native plants, wildlife, clean streams, rich soil. The dramatic potential of ecological restoration. Photorealistic comparison.`, consequence: 'Nature can recover', type: 'positive' },
        ],
      },
    ],
    Soil: [
      {
        narrative: `${pin.title} — what would ${pin.neighborhood} look like with healthy ground?`,
        choices: [
          { label: 'REMEDIATE THE SOIL', sub: 'Remove contaminants and toxins', prompt: `The soil in ${loc} is now clean and healthy. All industrial contaminants, heavy metals, and toxic waste have been removed. Rich, dark, fertile earth is visible. New grass and plants sprout from the remediated ground. The land is safe and productive again. Photorealistic soil restoration.`, consequence: 'Clean soil, new growth', type: 'positive' },
          { label: 'STOP THE EROSION', sub: 'Stabilize and rebuild the terrain', prompt: `The eroding landscape of ${loc} has been stabilized. Retaining walls of natural stone hold the soil. Deep-rooted native plants anchor the ground. Where land was washing away, it is now firm, green, and stable. Terraced vegetation prevents future erosion. Photorealistic erosion control.`, consequence: 'Ground stabilized naturally', type: 'positive' },
          { label: 'NO INTERVENTION', sub: 'Let degradation continue', prompt: `The soil in ${loc} continues to erode and degrade. Bare, cracked earth expands. Dust blows where plants once grew. The ground becomes barren and lifeless. Gullies deepen. Infrastructure tilts and cracks. Photorealistic land degradation.`, consequence: 'The ground keeps washing away', type: 'negative' },
        ],
      },
      {
        narrative: 'The ground is healing. What grows when the soil is healthy?',
        choices: [
          { label: 'PLANT A FOOD FOREST', sub: 'Grow productive trees and gardens', prompt: `${loc} transformed into a lush food forest. Fruit trees, vegetable gardens, and herb patches cover the once-barren ground. Layers of productive vegetation — tall canopy trees, understory shrubs, ground cover crops. A community growing food on restored land. Photorealistic urban agriculture.`, consequence: 'Productive land from barren ground', type: 'positive' },
          { label: 'RESTORE NATIVE GROUND COVER', sub: 'Let nature rebuild the soil layer', prompt: `${loc} covered in native ground vegetation. Thick grass, mosses, and low shrubs protect the soil surface. Fallen leaves decompose into rich humus. The soil darkens with organic matter. Earthworms and mycelium networks rebuild the underground ecosystem. Photorealistic natural soil recovery.`, consequence: 'Living soil ecosystem returns', type: 'positive' },
        ],
      },
      {
        narrative: 'Complete soil restoration. The foundation of everything else.',
        choices: [
          { label: 'VIEW RESTORED LAND', sub: 'See healthy ground supporting life', prompt: `${loc} with fully restored, healthy soil. Rich green vegetation everywhere. Tall trees with deep roots. Wildflowers blooming. The ground is dark, moist, and alive with organisms. A thriving landscape built on healthy soil. Everything grows from the ground up. Golden hour, photorealistic.`, consequence: 'Healthy soil supports all life', type: 'positive' },
          { label: 'COMPARE BEFORE/AFTER', sub: 'Barren ground vs. living soil', prompt: `${loc} before and after soil restoration. One side shows cracked, eroded, contaminated ground — lifeless and barren. The other shows the same land now — rich dark soil, dense vegetation, productive and alive. The transformation that starts underground. Photorealistic comparison.`, consequence: 'From barren to abundant', type: 'positive' },
        ],
      },
    ],
    Climate: [
      {
        narrative: `${pin.title} — what would ${pin.city} look like adapted and resilient?`,
        choices: [
          { label: 'COOL THE CITY', sub: 'Add shade, water features, and green space', prompt: `${loc} dramatically cooled. Mature shade trees line every street. Reflective cool roofs on buildings. Misting fountains in public spaces. Green parks replace concrete lots. The temperature drops visibly — no more heat shimmer on pavement. Cool, shaded, livable streets. Photorealistic urban cooling.`, consequence: 'Temperature drops significantly', type: 'positive' },
          { label: 'FLOOD-PROOF THE AREA', sub: 'Build for extreme weather resilience', prompt: `${loc} redesigned for resilience. Rain gardens absorb downpours. Permeable surfaces replace concrete. Bioswales channel water safely. Buildings elevated on stilts. Green infrastructure handles extreme rainfall gracefully. No flooding, no damage. The city works with water instead of fighting it. Photorealistic climate adaptation.`, consequence: 'Built to handle extremes', type: 'positive' },
          { label: 'NO ADAPTATION', sub: 'See what happens without action', prompt: `${loc} battered by worsening extreme weather. Flooded streets. Buckled pavement from heat. Cracked foundations. Overwhelmed storm drains. A city infrastructure failing under climate stress it was never designed for. Brown lawns, dried trees, crumbling roads. Photorealistic climate damage.`, consequence: 'Infrastructure keeps failing', type: 'negative' },
        ],
      },
      {
        narrative: 'The environment is responding. What does a climate-resilient community look like?',
        choices: [
          { label: 'RENEWABLE ENERGY', sub: 'Power everything with clean sources', prompt: `${loc} powered entirely by renewables. Solar panels gleam on every roof. Small wind turbines on buildings. Community battery storage. No power lines sagging in heat. The grid is resilient, clean, and independent. Blue sky, cool air, energy abundance. Photorealistic clean energy city.`, consequence: 'Energy independence achieved', type: 'positive' },
          { label: 'GREEN CORRIDORS', sub: 'Nature-based climate solutions', prompt: `${loc} interwoven with green corridors. Tree-lined boulevards connect parks. Urban streams flow through neighborhoods. Wetlands buffer against storms. The city is half-nature, half-infrastructure. Temperature regulated naturally. A cooler, greener, more livable place. Photorealistic green urbanism.`, consequence: 'Nature cools and protects the city', type: 'positive' },
        ],
      },
      {
        narrative: 'Full climate adaptation. A model for the future.',
        choices: [
          { label: 'VIEW RESILIENT FUTURE', sub: 'See the climate-adapted city', prompt: `${loc} fully adapted to climate change. Green everywhere. Cool streets under tree canopy. Solar roofs. Rain gardens. Thriving public spaces. People outdoors, comfortable, safe. A city that turned climate crisis into climate opportunity. Beautiful, livable, sustainable. Sunset, photorealistic.`, consequence: 'A city designed for the future', type: 'positive' },
          { label: 'COMPARE BEFORE/AFTER', sub: 'Climate-stressed vs. climate-adapted', prompt: `${loc} before and after climate adaptation. One side shows heat-stressed, flood-prone, crumbling infrastructure. The other shows the same place green, cool, resilient, thriving. The difference between denial and action. Photorealistic comparison.`, consequence: 'Adaptation transforms everything', type: 'positive' },
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
      ? { text: 'ENVIRONMENT RESTORED', color: '#0ff5c4', sub: `This is what ${pin.neighborhood} could look like with action.` }
      : negativeCount > positiveCount
        ? { text: 'DEGRADATION CONTINUES', color: '#ff3b4f', sub: 'Without intervention, the environment keeps declining.' }
        : { text: 'PARTIAL RECOVERY', color: '#f5a623', sub: 'Some improvement, but more action is needed.' };

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
                VISUALIZING TRANSFORMATION
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
