// ============================================================================
// DEEP ENVIRONMENT — Knowledge Graph Data Model
// Focused environmental knowledge graph — fewer nodes, clearer relationships
// ============================================================================

export type NodeCategory =
  | 'location'
  | 'metric'
  | 'threat'
  | 'agent'
  | 'report'
  | 'correlation';

export type ThreatLevel = 'low' | 'moderate' | 'elevated' | 'high' | 'critical';

export interface GraphNode {
  id: string;
  name: string;
  category: NodeCategory;
  val: number;
  color?: string;
  threatLevel?: ThreatLevel;
  description?: string;
  metadata?: Record<string, string | number>;
  x?: number;
  y?: number;
  z?: number;
  fx?: number;
  fy?: number;
  fz?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  label?: string;
  color?: string;
  strength?: number;
  particles?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// ── Colors ─────────────────────────────────────────────────────────────────

export const CATEGORY_COLORS: Record<NodeCategory, string> = {
  location: '#0ff5c4',
  metric: '#3b82f6',
  threat: '#ff3b4f',
  agent: '#a78bfa',
  report: '#f5a623',
  correlation: '#06b6d4',
};

export const THREAT_COLORS: Record<ThreatLevel, string> = {
  low: '#0ff5c4',
  moderate: '#3b82f6',
  elevated: '#f5a623',
  high: '#ff6b35',
  critical: '#ff3b4f',
};

export const CATEGORY_LABELS: Record<NodeCategory, string> = {
  location: 'STATION',
  metric: 'METRIC',
  threat: 'THREAT',
  agent: 'AGENT',
  report: 'REPORT',
  correlation: 'LINK',
};

const metricColors: Record<string, string> = {
  air: '#a78bfa',
  water: '#06b6d4',
  bio: '#22c55e',
  soil: '#f5a623',
};

// ── Build a clean, readable graph ──────────────────────────────────────────

export function buildInitialGraph(): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  // ─── 5 core locations ───
  const locations = [
    { id: 'loc-sf', name: 'SF Bay', threat: 'moderate' as ThreatLevel, score: 72 },
    { id: 'loc-la', name: 'LA Basin', threat: 'elevated' as ThreatLevel, score: 48 },
    { id: 'loc-gulf', name: 'Gulf Coast', threat: 'high' as ThreatLevel, score: 35 },
    { id: 'loc-ever', name: 'Everglades', threat: 'critical' as ThreatLevel, score: 24 },
    { id: 'loc-pnw', name: 'Pacific NW', threat: 'low' as ThreatLevel, score: 84 },
  ];

  locations.forEach((loc) => {
    nodes.push({
      id: loc.id,
      name: loc.name,
      category: 'location',
      val: 20,
      color: THREAT_COLORS[loc.threat],
      threatLevel: loc.threat,
      description: `Monitoring station — Threat: ${loc.threat.toUpperCase()}`,
      metadata: { score: loc.score, threat: loc.threat },
    });
  });

  // ─── Key metrics — one per location, the most relevant one ───
  const keyMetrics = [
    { id: 'met-sf-water', name: 'Water Purity', loc: 'loc-sf', cat: 'water', value: 81 },
    { id: 'met-la-air', name: 'Air Quality', loc: 'loc-la', cat: 'air', value: 38 },
    { id: 'met-gulf-water', name: 'Water Purity', loc: 'loc-gulf', cat: 'water', value: 29 },
    { id: 'met-ever-bio', name: 'Biodiversity', loc: 'loc-ever', cat: 'bio', value: 21 },
    { id: 'met-pnw-air', name: 'Air Quality', loc: 'loc-pnw', cat: 'air', value: 86 },
    { id: 'met-gulf-air', name: 'Air Quality', loc: 'loc-gulf', cat: 'air', value: 32 },
    { id: 'met-ever-water', name: 'Water Purity', loc: 'loc-ever', cat: 'water', value: 18 },
  ];

  keyMetrics.forEach((m) => {
    nodes.push({
      id: m.id,
      name: m.name,
      category: 'metric',
      val: 10,
      color: metricColors[m.cat],
      description: `${m.name}: ${m.value}/100`,
      metadata: { value: m.value, location: m.loc },
    });
    links.push({
      source: m.loc,
      target: m.id,
      label: 'monitors',
      color: `${metricColors[m.cat]}55`,
      strength: 0.4,
      particles: 1,
    });
  });

  // ─── Threats — clear causal chains ───
  const threats = [
    { id: 'thr-algal', name: 'Algal Bloom', loc: 'loc-sf', severity: 'elevated' as ThreatLevel },
    { id: 'thr-smog', name: 'Wildfire Smoke', loc: 'loc-la', severity: 'critical' as ThreatLevel },
    { id: 'thr-refinery', name: 'SO2 Spike', loc: 'loc-gulf', severity: 'critical' as ThreatLevel },
    { id: 'thr-fishkill', name: 'Fish Kill', loc: 'loc-gulf', severity: 'high' as ThreatLevel },
    { id: 'thr-invasive', name: 'Invasive Species', loc: 'loc-ever', severity: 'critical' as ThreatLevel },
    { id: 'thr-drought', name: 'Drought Stress', loc: 'loc-ever', severity: 'high' as ThreatLevel },
  ];

  threats.forEach((t) => {
    nodes.push({
      id: t.id,
      name: t.name,
      category: 'threat',
      val: t.severity === 'critical' ? 14 : 10,
      color: THREAT_COLORS[t.severity],
      threatLevel: t.severity,
      description: `Detected threat — ${t.severity.toUpperCase()}`,
    });
    links.push({
      source: t.loc,
      target: t.id,
      label: 'detected',
      color: `${THREAT_COLORS[t.severity]}66`,
      strength: 0.4,
      particles: t.severity === 'critical' ? 3 : 1,
    });
  });

  // ─── Causal chains between threats (these make sense) ───
  links.push({ source: 'thr-refinery', target: 'thr-fishkill', label: 'causes', color: '#ff3b4f33', strength: 0.2 });
  links.push({ source: 'thr-drought', target: 'thr-invasive', label: 'amplifies', color: '#ff3b4f33', strength: 0.2 });

  // ─── Metric → Threat causal links ───
  links.push({ source: 'met-gulf-water', target: 'thr-fishkill', label: 'degrades', color: '#06b6d433', strength: 0.2 });
  links.push({ source: 'met-la-air', target: 'thr-smog', label: 'worsened by', color: '#a78bfa33', strength: 0.2 });
  links.push({ source: 'met-ever-bio', target: 'thr-invasive', label: 'threatened by', color: '#22c55e33', strength: 0.2 });

  // ─── Agents (just 2, clearly assigned) ───
  const agents = [
    { id: 'agt-coastal', name: 'Coastal Sentinel', locs: ['loc-sf', 'loc-gulf'] },
    { id: 'agt-eco', name: 'Eco Scanner', locs: ['loc-ever', 'loc-pnw'] },
  ];

  agents.forEach((a) => {
    nodes.push({
      id: a.id,
      name: a.name,
      category: 'agent',
      val: 10,
      color: CATEGORY_COLORS.agent,
      description: `RL Agent — ${a.locs.length} zones`,
    });
    a.locs.forEach((locId) => {
      links.push({
        source: a.id,
        target: locId,
        label: 'analyzes',
        color: `${CATEGORY_COLORS.agent}44`,
        strength: 0.15,
        particles: 1,
      });
    });
  });

  // ─── Cross-location correlations (geographic neighbors only) ───
  const correlations: [string, string][] = [
    ['loc-sf', 'loc-la'],       // California corridor
    ['loc-la', 'loc-gulf'],     // Southern US
    ['loc-gulf', 'loc-ever'],   // Gulf → Florida
    ['loc-sf', 'loc-pnw'],     // West coast
  ];

  correlations.forEach(([a, b]) => {
    links.push({
      source: a,
      target: b,
      label: 'correlates',
      color: `${CATEGORY_COLORS.correlation}33`,
      strength: 0.08,
      particles: 1,
    });
  });

  return { nodes, links };
}

// ── Live updates (slower, less noisy) ──────────────────────────────────────

let reportCounter = 0;

const REPORT_TEMPLATES = [
  { name: 'pH Anomaly', desc: 'Water pH deviated 2.1 units', cat: 'water' },
  { name: 'PM2.5 Spike', desc: 'Particulate exceeded threshold', cat: 'air' },
  { name: 'Vegetation Loss', desc: 'NDVI dropped 18%', cat: 'bio' },
  { name: 'Temp Anomaly', desc: 'Water temp +6C above avg', cat: 'water' },
  { name: 'Erosion Event', desc: 'Shoreline retreat 2.4m', cat: 'soil' },
];

const locationIds = ['loc-sf', 'loc-la', 'loc-gulf', 'loc-ever', 'loc-pnw'];

export function generateNewReport(): { node: GraphNode; link: GraphLink } {
  reportCounter++;
  const template = REPORT_TEMPLATES[Math.floor(Math.random() * REPORT_TEMPLATES.length)];
  const targetLoc = locationIds[Math.floor(Math.random() * locationIds.length)];
  const severities: ThreatLevel[] = ['moderate', 'elevated', 'high'];
  const severity = severities[Math.floor(Math.random() * severities.length)];

  const node: GraphNode = {
    id: `rpt-${reportCounter}-${Date.now()}`,
    name: template.name,
    category: 'report',
    val: 8,
    color: metricColors[template.cat] || CATEGORY_COLORS.report,
    threatLevel: severity,
    description: template.desc,
    metadata: { category: template.cat, severity, target: targetLoc },
  };

  const link: GraphLink = {
    source: targetLoc,
    target: node.id,
    label: 'reports',
    color: `${THREAT_COLORS[severity]}44`,
    strength: 0.3,
    particles: 1,
  };

  return { node, link };
}

export function generateNewThreat(): { node: GraphNode; links: GraphLink[] } {
  const threatNames = ['Thermal Plume', 'Methane Leak', 'Acid Rain', 'Sediment Surge'];
  const name = threatNames[Math.floor(Math.random() * threatNames.length)];
  const severity: ThreatLevel = Math.random() > 0.5 ? 'critical' : 'high';
  const targetLoc = locationIds[Math.floor(Math.random() * locationIds.length)];

  const node: GraphNode = {
    id: `thr-live-${Date.now()}`,
    name,
    category: 'threat',
    val: 12,
    color: THREAT_COLORS[severity],
    threatLevel: severity,
    description: `Emerging threat — ${severity.toUpperCase()}`,
  };

  return {
    node,
    links: [{
      source: targetLoc,
      target: node.id,
      label: 'detected',
      color: `${THREAT_COLORS[severity]}66`,
      strength: 0.4,
      particles: 2,
    }],
  };
}
