'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Constants ───────────────────────────────────────────────────────────────

const LOCATIONS = [
  { name: 'San Francisco', lat: 37.79, lng: -122.39, threats: 4, severity: 'elevated' },
  { name: 'Los Angeles', lat: 34.09, lng: -118.28, threats: 3, severity: 'critical' },
  { name: 'Houston', lat: 29.76, lng: -95.36, threats: 5, severity: 'critical' },
  { name: 'Miami', lat: 25.85, lng: -80.83, threats: 4, severity: 'critical' },
  { name: 'Seattle', lat: 47.61, lng: -122.34, threats: 2, severity: 'moderate' },
  { name: 'New York', lat: 40.71, lng: -74.01, threats: 3, severity: 'high' },
  { name: 'Chicago', lat: 41.88, lng: -87.63, threats: 2, severity: 'elevated' },
  { name: 'Atlanta', lat: 33.75, lng: -84.39, threats: 3, severity: 'high' },
  { name: 'Denver', lat: 39.74, lng: -105.0, threats: 2, severity: 'moderate' },
  { name: 'Portland', lat: 45.52, lng: -122.68, threats: 2, severity: 'elevated' },
];

const AGENT_NAMES = [
  'HYDRO-7', 'ATMOS-3', 'BIO-12', 'GEO-9', 'THERMO-5',
  'CHEM-4', 'ECO-8', 'FLUX-2', 'SENTINEL-1', 'NEXUS-6',
];

const AGENT_MESSAGES = [
  'Analyzing water contamination vectors in sector 7-G...',
  'Cross-referencing satellite thermal data with ground sensors...',
  'Updating knowledge graph: new correlation detected between nodes...',
  'Running predictive model: 94.2% confidence in 72-hour forecast...',
  'Deploying counterfactual simulation for intervention analysis...',
  'Integrating new field report from Slack upload pipeline...',
  'Consensus protocol: 4/5 agents agree on threat classification...',
  'Propagating environmental state changes across location network...',
  'Anomaly detected: PM2.5 readings diverge from model predictions...',
  'Rebalancing agent workloads across active monitoring zones...',
  'Knowledge graph updated: 12 new edges, 3 new entity nodes...',
  'Multi-location correlation: Gulf Coast + Southeast pattern emerging...',
];

const SEVERITY_COLORS: Record<string, string> = {
  low: '#0ff5c4',
  moderate: '#3b82f6',
  elevated: '#f5a623',
  high: '#ff6b35',
  critical: '#ff3b4f',
};

const FEATURES = [
  {
    tag: '3D KNOWLEDGE GRAPHS',
    title: 'Living knowledge networks',
    desc: 'Force-directed 3D graphs map every environmental relationship. Nodes pulse with real-time data. Edges reveal hidden correlations between pollutants, species, and climate systems that flat dashboards cannot show.',
    visual: 'graph',
  },
  {
    tag: 'ODYSSEY.ML WORLD MODEL',
    title: 'Immersive future prediction',
    desc: 'Step into AI-generated world models of environmental futures. Odyssey.ml renders photorealistic simulations showing what locations will look like under different intervention scenarios.',
    visual: 'odyssey',
  },
  {
    tag: 'MULTI-AGENT RL ANALYSIS',
    title: 'Swarm intelligence at work',
    desc: 'Watch specialized RL agents collaborate in real-time. Each agent masters a domain — water, air, soil, biodiversity — then they negotiate consensus on threat assessment and optimal response strategies.',
    visual: 'agents',
  },
  {
    tag: 'CROSS-LOCATION CORRELATION',
    title: 'Cascading impact detection',
    desc: 'Environmental events don\'t respect borders. Our system maps how a refinery flare in Houston connects to fish kills in Galveston, and how wildfire smoke in LA reaches Portland\'s air quality.',
    visual: 'correlation',
  },
];

const STATS = [
  { value: '18', label: 'Active Threat Zones', suffix: '' },
  { value: '47', label: 'RL Agents Online', suffix: '' },
  { value: '2.3', label: 'Data Points Analyzed', suffix: 'M' },
  { value: '94', label: 'Prediction Accuracy', suffix: '%' },
];

// ─── Canvas: Particle Field ─────────────────────────────────────────────────

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let w = 0, h = 0;

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      r: number;
      color: string;
      alpha: number;
      life: number;
      maxLife: number;
    }

    const particles: Particle[] = [];
    const COLORS = ['#0ff5c4', '#3b82f6', '#f5a623', '#a78bfa', '#22c55e'];

    function resize() {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;
    }

    function spawnParticle() {
      const maxLife = 300 + Math.random() * 400;
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: 0.5 + Math.random() * 1.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: 0,
        life: 0,
        maxLife,
      });
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);

      // Spawn
      while (particles.length < 120) spawnParticle();

      // Update + draw
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        // Fade in then out
        const progress = p.life / p.maxLife;
        if (progress < 0.1) {
          p.alpha = progress / 0.1;
        } else if (progress > 0.8) {
          p.alpha = (1 - progress) / 0.2;
        } else {
          p.alpha = 1;
        }

        if (p.life > p.maxLife || p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10) {
          particles.splice(i, 1);
          continue;
        }

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = p.color;
        ctx!.globalAlpha = p.alpha * 0.4;
        ctx!.fill();

        // Glow
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        const gradient = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, 'transparent');
        ctx!.fillStyle = gradient;
        ctx!.globalAlpha = p.alpha * 0.15;
        ctx!.fill();
      }

      // Connection lines between nearby particles
      ctx!.globalAlpha = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.strokeStyle = particles[i].color;
            ctx!.globalAlpha = (1 - dist / 100) * 0.06 * Math.min(particles[i].alpha, particles[j].alpha);
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }

      ctx!.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

// ─── Canvas: Knowledge Graph Visual ─────────────────────────────────────────

function KnowledgeGraphCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const w = canvas.width = 520;
    const h = canvas.height = 360;

    interface GNode {
      x: number; y: number; z: number;
      r: number;
      color: string;
      label: string;
      vx: number; vy: number; vz: number;
    }

    const COLORS = ['#0ff5c4', '#3b82f6', '#f5a623', '#a78bfa', '#22c55e', '#ff3b4f', '#06b6d4'];
    const LABELS = ['Water', 'PM2.5', 'Temp', 'O₂', 'pH', 'Bio', 'CO₂', 'NOx', 'Coral', 'Flow', 'Wind', 'Soil'];

    const nodes: GNode[] = LABELS.map((label, i) => ({
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 140,
      z: (Math.random() - 0.5) * 100,
      r: 3 + Math.random() * 4,
      color: COLORS[i % COLORS.length],
      label,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      vz: (Math.random() - 0.5) * 0.2,
    }));

    const edges: [number, number][] = [];
    for (let i = 0; i < nodes.length; i++) {
      const numEdges = 1 + Math.floor(Math.random() * 3);
      for (let e = 0; e < numEdges; e++) {
        const j = Math.floor(Math.random() * nodes.length);
        if (j !== i) edges.push([i, j]);
      }
    }

    let angle = 0;

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      angle += 0.003;

      // Update positions slightly
      nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        n.z += n.vz;
        if (Math.abs(n.x) > 160) n.vx *= -1;
        if (Math.abs(n.y) > 100) n.vy *= -1;
        if (Math.abs(n.z) > 80) n.vz *= -1;
      });

      // Project 3D → 2D with rotation
      const projected = nodes.map(n => {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const rx = n.x * cos - n.z * sin;
        const rz = n.x * sin + n.z * cos;
        const scale = 300 / (300 + rz);
        return {
          px: w / 2 + rx * scale,
          py: h / 2 + n.y * scale,
          scale,
          color: n.color,
          r: n.r * scale,
          label: n.label,
        };
      });

      // Draw edges
      edges.forEach(([i, j]) => {
        const a = projected[i];
        const b = projected[j];
        ctx!.beginPath();
        ctx!.moveTo(a.px, a.py);
        ctx!.lineTo(b.px, b.py);
        ctx!.strokeStyle = a.color;
        ctx!.globalAlpha = 0.12;
        ctx!.lineWidth = 1;
        ctx!.stroke();

        // Animated particle along edge
        const t = (Date.now() * 0.001 + i * 0.7) % 1;
        const mx = a.px + (b.px - a.px) * t;
        const my = a.py + (b.py - a.py) * t;
        ctx!.beginPath();
        ctx!.arc(mx, my, 1.5, 0, Math.PI * 2);
        ctx!.fillStyle = a.color;
        ctx!.globalAlpha = 0.5;
        ctx!.fill();
      });

      // Draw nodes
      projected.forEach(n => {
        // Glow
        const g = ctx!.createRadialGradient(n.px, n.py, 0, n.px, n.py, n.r * 4);
        g.addColorStop(0, n.color);
        g.addColorStop(1, 'transparent');
        ctx!.beginPath();
        ctx!.arc(n.px, n.py, n.r * 4, 0, Math.PI * 2);
        ctx!.fillStyle = g;
        ctx!.globalAlpha = 0.2;
        ctx!.fill();

        // Node
        ctx!.beginPath();
        ctx!.arc(n.px, n.py, n.r, 0, Math.PI * 2);
        ctx!.fillStyle = n.color;
        ctx!.globalAlpha = 0.9;
        ctx!.fill();

        // Label
        ctx!.font = '9px monospace';
        ctx!.fillStyle = '#e4e6ef';
        ctx!.globalAlpha = 0.6;
        ctx!.textAlign = 'center';
        ctx!.fillText(n.label, n.px, n.py - n.r - 6);
      });

      ctx!.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animId);
  }, [active]);

  return <canvas ref={canvasRef} className="w-full h-full" style={{ maxWidth: 520, maxHeight: 360 }} />;
}

// ─── Canvas: Correlation Network ────────────────────────────────────────────

function CorrelationCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const w = canvas.width = 520;
    const h = canvas.height = 360;

    // City nodes positioned roughly on a US map layout
    const cities = [
      { name: 'SF', x: 60, y: 140, color: '#f5a623' },
      { name: 'LA', x: 80, y: 200, color: '#ff3b4f' },
      { name: 'SEA', x: 70, y: 70, color: '#3b82f6' },
      { name: 'PDX', x: 65, y: 95, color: '#f5a623' },
      { name: 'DEN', x: 200, y: 150, color: '#3b82f6' },
      { name: 'HOU', x: 260, y: 250, color: '#ff3b4f' },
      { name: 'CHI', x: 320, y: 110, color: '#f5a623' },
      { name: 'ATL', x: 360, y: 210, color: '#ff6b35' },
      { name: 'MIA', x: 410, y: 280, color: '#ff3b4f' },
      { name: 'NYC', x: 440, y: 100, color: '#ff6b35' },
    ];

    const links = [
      [0, 1], [0, 2], [2, 3], [1, 5], [5, 6],
      [5, 8], [6, 9], [7, 8], [7, 9], [4, 6],
      [3, 4], [1, 7], [0, 4],
    ];

    function draw() {
      ctx!.clearRect(0, 0, w, h);

      // Draw links with animated pulses
      links.forEach(([i, j], idx) => {
        const a = cities[i];
        const b = cities[j];

        // Base line
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(b.x, b.y);
        ctx!.strokeStyle = a.color;
        ctx!.globalAlpha = 0.08;
        ctx!.lineWidth = 1;
        ctx!.stroke();

        // Traveling pulse
        const t = (Date.now() * 0.0005 + idx * 0.3) % 1;
        const px = a.x + (b.x - a.x) * t;
        const py = a.y + (b.y - a.y) * t;

        const grd = ctx!.createRadialGradient(px, py, 0, px, py, 12);
        grd.addColorStop(0, a.color);
        grd.addColorStop(1, 'transparent');
        ctx!.beginPath();
        ctx!.arc(px, py, 12, 0, Math.PI * 2);
        ctx!.fillStyle = grd;
        ctx!.globalAlpha = 0.4;
        ctx!.fill();

        ctx!.beginPath();
        ctx!.arc(px, py, 2, 0, Math.PI * 2);
        ctx!.fillStyle = a.color;
        ctx!.globalAlpha = 0.9;
        ctx!.fill();
      });

      // Draw city nodes
      cities.forEach(c => {
        // Outer glow
        const g = ctx!.createRadialGradient(c.x, c.y, 0, c.x, c.y, 20);
        g.addColorStop(0, c.color);
        g.addColorStop(1, 'transparent');
        ctx!.beginPath();
        ctx!.arc(c.x, c.y, 20, 0, Math.PI * 2);
        ctx!.fillStyle = g;
        ctx!.globalAlpha = 0.15;
        ctx!.fill();

        // Pulsing ring
        const pulse = Math.sin(Date.now() * 0.002) * 0.3 + 0.7;
        ctx!.beginPath();
        ctx!.arc(c.x, c.y, 8 + pulse * 4, 0, Math.PI * 2);
        ctx!.strokeStyle = c.color;
        ctx!.globalAlpha = 0.15 * pulse;
        ctx!.lineWidth = 1;
        ctx!.stroke();

        // Node
        ctx!.beginPath();
        ctx!.arc(c.x, c.y, 4, 0, Math.PI * 2);
        ctx!.fillStyle = c.color;
        ctx!.globalAlpha = 0.9;
        ctx!.fill();

        // Label
        ctx!.font = '9px monospace';
        ctx!.fillStyle = '#e4e6ef';
        ctx!.globalAlpha = 0.7;
        ctx!.textAlign = 'center';
        ctx!.fillText(c.name, c.x, c.y - 12);
      });

      ctx!.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animId);
  }, [active]);

  return <canvas ref={canvasRef} className="w-full h-full" style={{ maxWidth: 520, maxHeight: 360 }} />;
}

// ─── Live Agent Feed ────────────────────────────────────────────────────────

function AgentFeed({ active }: { active: boolean }) {
  const [messages, setMessages] = useState<Array<{ agent: string; msg: string; time: string; id: number }>>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (!active) return;

    // Seed initial messages
    const initial = Array.from({ length: 5 }, (_, i) => ({
      agent: AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)],
      msg: AGENT_MESSAGES[Math.floor(Math.random() * AGENT_MESSAGES.length)],
      time: `${Math.floor(Math.random() * 59)}s ago`,
      id: idRef.current++,
    }));
    setMessages(initial);

    const interval = setInterval(() => {
      setMessages(prev => {
        const newMsg = {
          agent: AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)],
          msg: AGENT_MESSAGES[Math.floor(Math.random() * AGENT_MESSAGES.length)],
          time: 'just now',
          id: idRef.current++,
        };
        return [newMsg, ...prev.slice(0, 6)];
      });
    }, 2200);

    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className="w-full max-w-[520px] h-[360px] overflow-hidden relative">
      <div className="absolute inset-0 flex flex-col gap-1 p-3">
        {messages.map((m, i) => (
          <div
            key={m.id}
            className="flex gap-3 py-2 px-3 rounded border transition-all duration-500"
            style={{
              background: i === 0 ? 'rgba(15, 245, 196, 0.04)' : 'rgba(24, 26, 34, 0.6)',
              borderColor: i === 0 ? 'rgba(15, 245, 196, 0.15)' : 'rgba(37, 40, 56, 0.5)',
              opacity: i === 0 ? 1 : 1 - i * 0.1,
              transform: `translateY(${i === 0 ? 0 : 0}px)`,
              animation: i === 0 ? 'slideIn 0.4s ease-out' : undefined,
            }}
          >
            <div className="shrink-0">
              <div
                className="w-2 h-2 rounded-full mt-1.5"
                style={{
                  background: '#0ff5c4',
                  boxShadow: i === 0 ? '0 0 8px rgba(15, 245, 196, 0.5)' : 'none',
                  animation: i === 0 ? 'pulse 1.5s ease-in-out infinite' : undefined,
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span style={{ color: '#0ff5c4', fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                  {m.agent}
                </span>
                <span style={{ color: '#555870', fontSize: 9 }}>{m.time}</span>
              </div>
              <p style={{ color: '#8b8fa4', fontSize: 11, fontFamily: 'var(--font-mono)', lineHeight: 1.4, margin: 0 }}>
                {m.msg}
              </p>
            </div>
          </div>
        ))}
      </div>
      {/* Fade out at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none" style={{
        background: 'linear-gradient(transparent, #08090c)',
      }} />
    </div>
  );
}

// ─── Odyssey Visual ─────────────────────────────────────────────────────────

function OdysseyVisual({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const w = canvas.width = 520;
    const h = canvas.height = 360;

    // Terrain-like visualization
    const cols = 40;
    const rows = 25;
    const cellW = w / cols;
    const cellH = h / rows;

    // Height map
    const heightMap: number[][] = [];
    for (let y = 0; y < rows; y++) {
      heightMap[y] = [];
      for (let x = 0; x < cols; x++) {
        heightMap[y][x] = Math.random();
      }
    }

    // Smooth it
    for (let pass = 0; pass < 3; pass++) {
      for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
          heightMap[y][x] = (
            heightMap[y-1][x] + heightMap[y+1][x] +
            heightMap[y][x-1] + heightMap[y][x+1] +
            heightMap[y][x] * 2
          ) / 6;
        }
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      const time = Date.now() * 0.001;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const hVal = heightMap[y][x];
          const wave = Math.sin(x * 0.3 + time) * 0.1 + Math.sin(y * 0.2 + time * 0.7) * 0.1;
          const val = Math.max(0, Math.min(1, hVal + wave));

          let r: number, g: number, b: number;
          if (val < 0.3) {
            // Deep water
            r = 6; g = 100 + val * 200; b = 180 + val * 100;
          } else if (val < 0.5) {
            // Shallow / coast
            r = 15; g = 160 + val * 100; b = 140;
          } else if (val < 0.7) {
            // Land
            r = 30 + val * 50; g = 140 + val * 60; b = 60;
          } else {
            // Elevated
            r = 100 + val * 80; g = 80 + val * 40; b = 40;
          }

          ctx!.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx!.globalAlpha = 0.7;
          ctx!.fillRect(x * cellW, y * cellH, cellW + 1, cellH + 1);
        }
      }

      // Overlay scan lines
      for (let y = 0; y < h; y += 3) {
        ctx!.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx!.globalAlpha = 0.3;
        ctx!.fillRect(0, y, w, 1);
      }

      // Scanning beam
      const scanY = (time * 30) % h;
      const scanG = ctx!.createLinearGradient(0, scanY - 20, 0, scanY + 20);
      scanG.addColorStop(0, 'transparent');
      scanG.addColorStop(0.5, 'rgba(15, 245, 196, 0.15)');
      scanG.addColorStop(1, 'transparent');
      ctx!.fillStyle = scanG;
      ctx!.globalAlpha = 1;
      ctx!.fillRect(0, scanY - 20, w, 40);

      // Grid overlay
      ctx!.strokeStyle = 'rgba(15, 245, 196, 0.05)';
      ctx!.lineWidth = 0.5;
      ctx!.globalAlpha = 1;
      for (let x = 0; x < w; x += cellW * 4) {
        ctx!.beginPath();
        ctx!.moveTo(x, 0);
        ctx!.lineTo(x, h);
        ctx!.stroke();
      }
      for (let y = 0; y < h; y += cellH * 4) {
        ctx!.beginPath();
        ctx!.moveTo(0, y);
        ctx!.lineTo(w, y);
        ctx!.stroke();
      }

      // HUD elements
      ctx!.font = '9px monospace';
      ctx!.fillStyle = '#0ff5c4';
      ctx!.globalAlpha = 0.6;
      ctx!.textAlign = 'left';
      ctx!.fillText('ODYSSEY.ML // WORLD MODEL v3.2', 12, 20);
      ctx!.fillText(`FRAME ${Math.floor(time * 30)}`, 12, 34);
      ctx!.textAlign = 'right';
      ctx!.fillText('RENDERING: PHOTOREALISTIC', w - 12, 20);
      ctx!.fillText(`CONFIDENCE: ${(92 + Math.sin(time) * 3).toFixed(1)}%`, w - 12, 34);

      ctx!.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animId);
  }, [active]);

  return <canvas ref={canvasRef} className="w-full h-full" style={{ maxWidth: 520, maxHeight: 360 }} />;
}

// ─── Feature Visual Renderer ────────────────────────────────────────────────

function FeatureVisual({ type, active }: { type: string; active: boolean }) {
  switch (type) {
    case 'graph': return <KnowledgeGraphCanvas active={active} />;
    case 'odyssey': return <OdysseyVisual active={active} />;
    case 'agents': return <AgentFeed active={active} />;
    case 'correlation': return <CorrelationCanvas active={active} />;
    default: return null;
  }
}

// ─── Intersection Observer Hook ─────────────────────────────────────────────

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, inView };
}

// ─── Threat Ticker ──────────────────────────────────────────────────────────

function ThreatTicker() {
  const threats = [
    { location: 'Houston TX', threat: 'SO₂ levels critical near refinery complex', severity: 'critical' },
    { location: 'Miami FL', threat: 'Coral bleaching event — 3rd consecutive year', severity: 'critical' },
    { location: 'San Francisco CA', threat: 'Algal bloom detected in Mission Creek', severity: 'elevated' },
    { location: 'New York NY', threat: 'Combined sewer overflow — 30M gallons discharged', severity: 'high' },
    { location: 'Los Angeles CA', threat: 'Wildfire smoke — AQI 342, hazardous conditions', severity: 'critical' },
    { location: 'New Orleans LA', threat: 'Barrier island erosion — breakthrough in 18 months', severity: 'critical' },
    { location: 'Portland OR', threat: 'Transboundary smoke drift from BC wildfires', severity: 'elevated' },
    { location: 'Atlanta GA', threat: 'Urban heat island — surface temp 147°F', severity: 'high' },
  ];

  return (
    <div className="w-full overflow-hidden" style={{ borderTop: '1px solid rgba(255, 59, 79, 0.2)', borderBottom: '1px solid rgba(255, 59, 79, 0.2)', background: 'rgba(255, 59, 79, 0.03)' }}>
      <div className="flex animate-ticker py-2">
        {[...threats, ...threats].map((t, i) => (
          <div key={i} className="flex items-center gap-3 shrink-0 px-6">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: SEVERITY_COLORS[t.severity] }} />
            <span style={{ color: SEVERITY_COLORS[t.severity], fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
              {t.location.toUpperCase()}
            </span>
            <span style={{ color: '#8b8fa4', fontSize: 10, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
              {t.threat}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Landing Page ──────────────────────────────────────────────────────

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setMounted(true);
    // Override the global overflow:hidden from globals.css so landing page scrolls
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    document.documentElement.style.height = 'auto';
    document.body.style.height = 'auto';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.documentElement.style.height = '';
      document.body.style.height = '';
    };
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % FEATURES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const heroRef = useInView(0.1);
  const statsRef = useInView(0.3);
  const featuresRef = useInView(0.1);
  const ctaRef = useInView(0.3);
  const locationsRef = useInView(0.2);

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden overflow-y-auto" style={{ background: '#08090c' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap');

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .animate-ticker {
          animation: ticker 40s linear infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes revealUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes revealLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes revealRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes borderGlow {
          0%, 100% { border-color: rgba(15, 245, 196, 0.1); }
          50% { border-color: rgba(15, 245, 196, 0.3); }
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .font-display {
          font-family: 'Outfit', system-ui, sans-serif;
        }

        .font-mono {
          font-family: 'JetBrains Mono', monospace;
        }

        .reveal-up {
          animation: revealUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .reveal-left {
          animation: revealLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .reveal-right {
          animation: revealRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        .delay-500 { animation-delay: 500ms; }
        .delay-600 { animation-delay: 600ms; }
        .delay-700 { animation-delay: 700ms; }

        .landing-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .landing-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .landing-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(37, 40, 56, 0.5);
          border-radius: 2px;
        }
      `}} />

      <ParticleField />

      {/* ─── NAV ───────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 py-4"
        style={{
          background: 'linear-gradient(180deg, rgba(8, 9, 12, 0.95) 0%, rgba(8, 9, 12, 0.8) 60%, transparent 100%)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <div className="relative w-8 h-8">
            <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
              <circle cx="16" cy="16" r="14" stroke="#0ff5c4" strokeWidth="1" opacity="0.3" />
              <circle cx="16" cy="16" r="8" stroke="#0ff5c4" strokeWidth="1.5" opacity="0.6" />
              <circle cx="16" cy="16" r="3" fill="#0ff5c4" opacity="0.9" />
              <line x1="16" y1="2" x2="16" y2="8" stroke="#0ff5c4" strokeWidth="1" opacity="0.4" />
              <line x1="16" y1="24" x2="16" y2="30" stroke="#0ff5c4" strokeWidth="1" opacity="0.4" />
              <line x1="2" y1="16" x2="8" y2="16" stroke="#0ff5c4" strokeWidth="1" opacity="0.4" />
              <line x1="24" y1="16" x2="30" y2="16" stroke="#0ff5c4" strokeWidth="1" opacity="0.4" />
            </svg>
            <div className="absolute inset-0 rounded-full" style={{
              background: 'radial-gradient(circle, rgba(15, 245, 196, 0.15) 0%, transparent 70%)',
              animation: 'pulse 3s ease-in-out infinite',
            }} />
          </div>
          <div>
            <span className="font-display text-sm font-semibold tracking-wide" style={{ color: '#e4e6ef' }}>
              DEEP
            </span>
            <span className="font-display text-sm font-light tracking-wide" style={{ color: '#0ff5c4' }}>
              {' '}ENVIRONMENT
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {['Platform', 'Technology', 'Data', 'Research'].map(item => (
            <a
              key={item}
              href="#"
              className="font-mono text-xs tracking-widest uppercase transition-colors duration-200"
              style={{ color: '#555870' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#e4e6ef')}
              onMouseLeave={e => (e.currentTarget.style.color = '#555870')}
            >
              {item}
            </a>
          ))}
        </div>

        <a
          href="/"
          className="font-mono text-xs tracking-widest uppercase px-5 py-2 rounded transition-all duration-300"
          style={{
            border: '1px solid rgba(15, 245, 196, 0.3)',
            color: '#0ff5c4',
            background: 'rgba(15, 245, 196, 0.05)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(15, 245, 196, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(15, 245, 196, 0.6)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(15, 245, 196, 0.15)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(15, 245, 196, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(15, 245, 196, 0.3)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Launch Dashboard
        </a>
      </nav>

      {/* ─── HERO ──────────────────────────────────────────────────────── */}
      <section
        ref={heroRef.ref}
        className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-24 pb-12"
      >
        {/* Radial glow behind hero */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] pointer-events-none" style={{
          background: 'radial-gradient(ellipse at center, rgba(15, 245, 196, 0.06) 0%, rgba(59, 130, 246, 0.03) 40%, transparent 70%)',
        }} />

        <div className={`flex flex-col items-center text-center max-w-4xl ${heroRef.inView ? 'opacity-100' : 'opacity-0'}`}>
          {/* Status badge */}
          <div
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 ${heroRef.inView ? 'reveal-up' : ''}`}
            style={{
              border: '1px solid rgba(15, 245, 196, 0.15)',
              background: 'rgba(15, 245, 196, 0.03)',
              opacity: heroRef.inView ? undefined : 0,
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#0ff5c4', boxShadow: '0 0 8px rgba(15, 245, 196, 0.5)', animation: 'pulse 2s ease-in-out infinite' }} />
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: '#0ff5c4' }}>
              47 agents monitoring 18 zones globally
            </span>
          </div>

          {/* Main headline */}
          <h1
            className={`font-display font-extralight leading-[0.95] mb-6 ${heroRef.inView ? 'reveal-up delay-200' : ''}`}
            style={{
              fontSize: 'clamp(2.5rem, 7vw, 5.5rem)',
              color: '#e4e6ef',
              opacity: heroRef.inView ? undefined : 0,
              letterSpacing: '-0.02em',
            }}
          >
            See the planet&apos;s
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #0ff5c4 0%, #3b82f6 50%, #a78bfa 100%)',
              backgroundSize: '200% 200%',
              animation: 'gradientShift 6s ease infinite',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 500,
            }}>
              invisible threats
            </span>
          </h1>

          {/* Subline */}
          <p
            className={`font-mono text-sm leading-relaxed max-w-2xl mb-10 ${heroRef.inView ? 'reveal-up delay-300' : ''}`}
            style={{
              color: '#8b8fa4',
              opacity: heroRef.inView ? undefined : 0,
            }}
          >
            Crowdsourced environmental photos. AI-powered analysis.
            <br className="hidden sm:block" />
            3D knowledge graphs. Multi-agent intelligence. Real predictions.
          </p>

          {/* CTA buttons */}
          <div className={`flex flex-col sm:flex-row items-center gap-4 ${heroRef.inView ? 'reveal-up delay-400' : ''}`} style={{ opacity: heroRef.inView ? undefined : 0 }}>
            <a
              href="/"
              className="font-mono text-xs tracking-[0.15em] uppercase px-8 py-3.5 rounded transition-all duration-300 relative overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, rgba(15, 245, 196, 0.15) 0%, rgba(15, 245, 196, 0.08) 100%)',
                border: '1px solid rgba(15, 245, 196, 0.4)',
                color: '#0ff5c4',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(15, 245, 196, 0.25) 0%, rgba(15, 245, 196, 0.15) 100%)';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(15, 245, 196, 0.2), inset 0 1px 0 rgba(15, 245, 196, 0.2)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(15, 245, 196, 0.15) 0%, rgba(15, 245, 196, 0.08) 100%)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Enter the dashboard
            </a>
            <a
              href="#features"
              className="font-mono text-xs tracking-[0.15em] uppercase px-8 py-3.5 rounded transition-all duration-200"
              style={{
                border: '1px solid rgba(37, 40, 56, 0.8)',
                color: '#8b8fa4',
                background: 'rgba(24, 26, 34, 0.3)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(139, 143, 164, 0.3)';
                e.currentTarget.style.color = '#e4e6ef';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(37, 40, 56, 0.8)';
                e.currentTarget.style.color = '#8b8fa4';
              }}
            >
              How it works
            </a>
          </div>

          {/* Scroll indicator */}
          <div className={`mt-16 flex flex-col items-center gap-2 ${heroRef.inView ? 'reveal-up delay-600' : ''}`} style={{ opacity: heroRef.inView ? undefined : 0 }}>
            <div className="w-px h-8" style={{ background: 'linear-gradient(180deg, rgba(15, 245, 196, 0.4) 0%, transparent 100%)' }} />
            <span className="font-mono text-[9px] tracking-[0.3em] uppercase" style={{ color: '#555870' }}>Scroll</span>
          </div>
        </div>
      </section>

      {/* ─── THREAT TICKER ─────────────────────────────────────────────── */}
      <ThreatTicker />

      {/* ─── STATS ─────────────────────────────────────────────────────── */}
      <section
        ref={statsRef.ref}
        className="relative z-10 py-20 px-6"
      >
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={`text-center py-6 px-4 rounded-lg transition-all duration-300 ${statsRef.inView ? 'reveal-up' : ''}`}
              style={{
                background: 'rgba(17, 19, 24, 0.6)',
                border: '1px solid rgba(37, 40, 56, 0.5)',
                animationDelay: `${i * 100}ms`,
                opacity: statsRef.inView ? undefined : 0,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(15, 245, 196, 0.2)';
                e.currentTarget.style.background = 'rgba(17, 19, 24, 0.8)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(37, 40, 56, 0.5)';
                e.currentTarget.style.background = 'rgba(17, 19, 24, 0.6)';
              }}
            >
              <div className="font-display text-3xl md:text-4xl font-light mb-1" style={{ color: '#0ff5c4' }}>
                {stat.value}<span className="text-lg">{stat.suffix}</span>
              </div>
              <div className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: '#555870' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES ──────────────────────────────────────────────────── */}
      <section
        ref={featuresRef.ref}
        id="features"
        className="relative z-10 py-24 px-6"
      >
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className={`text-center mb-16 ${featuresRef.inView ? 'reveal-up' : ''}`} style={{ opacity: featuresRef.inView ? undefined : 0 }}>
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase block mb-3" style={{ color: '#0ff5c4' }}>
              Core Technology
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-extralight" style={{ color: '#e4e6ef', letterSpacing: '-0.01em' }}>
              Intelligence architecture
            </h2>
          </div>

          {/* Feature tabs + content */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Tab list */}
            <div className="lg:w-[380px] shrink-0 flex flex-col gap-2">
              {FEATURES.map((f, i) => (
                <button
                  key={f.tag}
                  onClick={() => setActiveFeature(i)}
                  className={`text-left p-5 rounded-lg transition-all duration-300 ${featuresRef.inView ? 'reveal-left' : ''}`}
                  style={{
                    background: activeFeature === i ? 'rgba(15, 245, 196, 0.04)' : 'rgba(17, 19, 24, 0.3)',
                    border: `1px solid ${activeFeature === i ? 'rgba(15, 245, 196, 0.15)' : 'rgba(37, 40, 56, 0.3)'}`,
                    animationDelay: `${i * 100 + 200}ms`,
                    opacity: featuresRef.inView ? undefined : 0,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full transition-all duration-300" style={{
                      background: activeFeature === i ? '#0ff5c4' : '#555870',
                      boxShadow: activeFeature === i ? '0 0 8px rgba(15, 245, 196, 0.5)' : 'none',
                    }} />
                    <span className="font-mono text-[9px] tracking-[0.2em] uppercase" style={{
                      color: activeFeature === i ? '#0ff5c4' : '#555870',
                    }}>
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-light mb-1 transition-colors duration-300" style={{
                    color: activeFeature === i ? '#e4e6ef' : '#8b8fa4',
                  }}>
                    {f.title}
                  </h3>
                  {activeFeature === i && (
                    <p className="font-mono text-xs leading-relaxed mt-2" style={{ color: '#8b8fa4' }}>
                      {f.desc}
                    </p>
                  )}
                </button>
              ))}
            </div>

            {/* Visual */}
            <div className={`flex-1 flex items-center justify-center ${featuresRef.inView ? 'reveal-right delay-300' : ''}`} style={{ opacity: featuresRef.inView ? undefined : 0 }}>
              <div
                className="w-full rounded-xl overflow-hidden relative"
                style={{
                  background: 'rgba(12, 14, 20, 0.8)',
                  border: '1px solid rgba(37, 40, 56, 0.5)',
                  maxWidth: 560,
                  aspectRatio: '520 / 360',
                }}
              >
                {/* Terminal-style top bar */}
                <div className="flex items-center gap-2 px-4 py-2" style={{
                  background: 'rgba(17, 19, 24, 0.8)',
                  borderBottom: '1px solid rgba(37, 40, 56, 0.3)',
                }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: '#ff3b4f', opacity: 0.6 }} />
                  <div className="w-2 h-2 rounded-full" style={{ background: '#f5a623', opacity: 0.6 }} />
                  <div className="w-2 h-2 rounded-full" style={{ background: '#22c55e', opacity: 0.6 }} />
                  <span className="font-mono text-[9px] tracking-[0.15em] ml-2" style={{ color: '#555870' }}>
                    {FEATURES[activeFeature].tag}
                  </span>
                </div>
                <div className="flex items-center justify-center p-4">
                  <FeatureVisual type={FEATURES[activeFeature].visual} active={featuresRef.inView} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-6" style={{ background: 'rgba(12, 14, 20, 0.5)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase block mb-3" style={{ color: '#3b82f6' }}>
              Pipeline
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-extralight" style={{ color: '#e4e6ef' }}>
              From photo to prediction
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-px" style={{
              background: 'linear-gradient(90deg, rgba(15, 245, 196, 0.3), rgba(59, 130, 246, 0.3), rgba(167, 139, 250, 0.3), rgba(245, 166, 35, 0.3))',
            }} />

            {[
              {
                step: '01',
                title: 'Capture',
                desc: 'Users snap photos of environmental concerns and upload via Slack. Location, time, and context are automatically tagged.',
                color: '#0ff5c4',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M3 16l4-4a2 2 0 012.8 0L16 18" />
                  </svg>
                ),
              },
              {
                step: '02',
                title: 'Classify',
                desc: 'AI analyzes each image — identifying pollutants, species, weather events, and environmental anomalies with 94% accuracy.',
                color: '#3b82f6',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'Correlate',
                desc: 'Knowledge graphs update with new data. Multi-agent RL systems detect cross-location patterns and cascading effects.',
                color: '#a78bfa',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                    <circle cx="6" cy="6" r="2" />
                    <circle cx="18" cy="6" r="2" />
                    <circle cx="6" cy="18" r="2" />
                    <circle cx="18" cy="18" r="2" />
                    <path d="M8 6h8M6 8v8M18 8v8M8 18h8" />
                    <path d="M8 8l8 8M16 8l-8 8" />
                  </svg>
                ),
              },
              {
                step: '04',
                title: 'Predict',
                desc: 'Odyssey.ml generates immersive world models. See what environmental futures look like — and what interventions can change them.',
                color: '#f5a623',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                ),
              },
            ].map((s, i) => (
              <div key={s.step} className="flex flex-col items-center text-center relative">
                {/* Step number circle */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-4 relative z-10"
                  style={{
                    background: `rgba(${s.color === '#0ff5c4' ? '15,245,196' : s.color === '#3b82f6' ? '59,130,246' : s.color === '#a78bfa' ? '167,139,250' : '245,166,35'}, 0.1)`,
                    border: `1px solid ${s.color}40`,
                    color: s.color,
                  }}
                >
                  {s.icon}
                </div>
                <span className="font-mono text-[9px] tracking-[0.2em] uppercase mb-1" style={{ color: s.color }}>
                  Step {s.step}
                </span>
                <h3 className="font-display text-lg font-light mb-2" style={{ color: '#e4e6ef' }}>
                  {s.title}
                </h3>
                <p className="font-mono text-[11px] leading-relaxed" style={{ color: '#8b8fa4' }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ACTIVE LOCATIONS ──────────────────────────────────────────── */}
      <section
        ref={locationsRef.ref}
        className="relative z-10 py-24 px-6"
      >
        <div className="max-w-5xl mx-auto">
          <div className={`text-center mb-12 ${locationsRef.inView ? 'reveal-up' : ''}`} style={{ opacity: locationsRef.inView ? undefined : 0 }}>
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase block mb-3" style={{ color: '#f5a623' }}>
              Live Monitoring
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-extralight" style={{ color: '#e4e6ef' }}>
              Active threat zones
            </h2>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 ${locationsRef.inView ? 'reveal-up delay-200' : ''}`} style={{ opacity: locationsRef.inView ? undefined : 0 }}>
            {LOCATIONS.map((loc, i) => (
              <div
                key={loc.name}
                className="p-4 rounded-lg transition-all duration-300 cursor-default"
                style={{
                  background: 'rgba(17, 19, 24, 0.6)',
                  border: '1px solid rgba(37, 40, 56, 0.3)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = `${SEVERITY_COLORS[loc.severity]}30`;
                  e.currentTarget.style.background = 'rgba(17, 19, 24, 0.9)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(37, 40, 56, 0.3)';
                  e.currentTarget.style.background = 'rgba(17, 19, 24, 0.6)';
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{
                    background: SEVERITY_COLORS[loc.severity],
                    boxShadow: `0 0 6px ${SEVERITY_COLORS[loc.severity]}50`,
                  }} />
                  <span className="font-mono text-[10px] tracking-[0.1em] uppercase" style={{ color: SEVERITY_COLORS[loc.severity] }}>
                    {loc.severity}
                  </span>
                </div>
                <h4 className="font-display text-sm font-medium mb-1" style={{ color: '#e4e6ef' }}>
                  {loc.name}
                </h4>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-[10px]" style={{ color: '#555870' }}>
                    {loc.threats} active threats
                  </span>
                </div>
                {/* Severity bar */}
                <div className="mt-2 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(37, 40, 56, 0.5)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${loc.threats * 20}%`,
                      background: SEVERITY_COLORS[loc.severity],
                      opacity: 0.6,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────────────── */}
      <section
        ref={ctaRef.ref}
        className="relative z-10 py-32 px-6"
      >
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none" style={{
          background: 'radial-gradient(ellipse at center, rgba(15, 245, 196, 0.05) 0%, transparent 60%)',
        }} />

        <div className={`text-center max-w-2xl mx-auto ${ctaRef.inView ? 'reveal-up' : ''}`} style={{ opacity: ctaRef.inView ? undefined : 0 }}>
          <h2 className="font-display text-3xl md:text-5xl font-extralight mb-6" style={{ color: '#e4e6ef', letterSpacing: '-0.01em' }}>
            The environment can&apos;t wait.
            <br />
            <span style={{ color: '#0ff5c4', fontWeight: 300 }}>Neither should we.</span>
          </h2>
          <p className="font-mono text-sm mb-10" style={{ color: '#8b8fa4' }}>
            Every photo uploaded makes the model smarter. Every correlation discovered makes predictions more accurate.
          </p>
          <a
            href="/"
            className="inline-block font-mono text-xs tracking-[0.15em] uppercase px-10 py-4 rounded transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 245, 196, 0.2) 0%, rgba(15, 245, 196, 0.08) 100%)',
              border: '1px solid rgba(15, 245, 196, 0.4)',
              color: '#0ff5c4',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(15, 245, 196, 0.3) 0%, rgba(15, 245, 196, 0.15) 100%)';
              e.currentTarget.style.boxShadow = '0 0 40px rgba(15, 245, 196, 0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(15, 245, 196, 0.2) 0%, rgba(15, 245, 196, 0.08) 100%)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Start monitoring now
          </a>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="relative z-10 py-12 px-6" style={{
        borderTop: '1px solid rgba(37, 40, 56, 0.3)',
        background: 'rgba(8, 9, 12, 0.9)',
      }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#0ff5c4', boxShadow: '0 0 6px rgba(15, 245, 196, 0.5)', animation: 'pulse 3s ease-in-out infinite' }} />
            <span className="font-display text-xs tracking-wide" style={{ color: '#555870' }}>
              DEEP ENVIRONMENT
            </span>
          </div>
          <div className="flex items-center gap-6">
            {['Privacy', 'Terms', 'API', 'GitHub'].map(link => (
              <a
                key={link}
                href="#"
                className="font-mono text-[10px] tracking-[0.15em] uppercase transition-colors duration-200"
                style={{ color: '#555870' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#8b8fa4')}
                onMouseLeave={e => (e.currentTarget.style.color = '#555870')}
              >
                {link}
              </a>
            ))}
          </div>
          <span className="font-mono text-[9px] tracking-[0.1em]" style={{ color: '#252838' }}>
            SF HACKS 2026
          </span>
        </div>
      </footer>
    </div>
  );
}
