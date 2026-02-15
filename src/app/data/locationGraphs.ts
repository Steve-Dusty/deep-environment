// ============================================================================
// Location-Specific Knowledge Graph Data
// Each location has its own graph with micro-problems as nodes
// ============================================================================

import { ThreatLevel, THREAT_COLORS } from './locations';

export interface ProblemNode {
  id: string;
  name: string;
  category: 'pollution' | 'deforestation' | 'runoff' | 'wildfire' | 'litter' | 'erosion' | 'invasive' | 'drought' | 'contamination' | 'other';
  severity: ThreatLevel;
  description: string;
  causes?: string[];
  indicators?: string[];
  evidence?: {
    type: 'image' | 'observation' | 'sensor';
    description: string;
    timestamp?: string;
  }[];
  stakeholders?: string[];
  interventions?: {
    name: string;
    status: 'proposed' | 'active' | 'completed';
    impact?: string;
  }[];
  trend: 'improving' | 'stable' | 'worsening';
  confidence: number;
  lastUpdated: string;
  metadata?: Record<string, string | number>;
}

export interface ProblemLink {
  source: string;
  target: string;
  label: string;
  type: 'causes' | 'amplifies' | 'mitigates' | 'correlates';
  strength: number;
}

export interface LocationGraph {
  locationId: string;
  problems: ProblemNode[];
  links: ProblemLink[];
}

export interface LocationSummary {
  id: string;
  name: string;
  coordinates: [number, number];
  city: string;
  state: string;
  activeProblemsCount: number;
  criticalProblemsCount: number;
  lastUpdated: string;
  overallSeverity: ThreatLevel;
  confidence: number;
  description: string;
}

export const PROBLEM_CATEGORY_COLORS: Record<ProblemNode['category'], string> = {
  pollution: '#ff3b4f',
  deforestation: '#f5a623',
  runoff: '#06b6d4',
  wildfire: '#ff6b35',
  litter: '#8b8fa4',
  erosion: '#a78bfa',
  invasive: '#22c55e',
  drought: '#3b82f6',
  contamination: '#ff3b4f',
  other: '#555870',
};

export const PROBLEM_CATEGORY_LABELS: Record<ProblemNode['category'], string> = {
  pollution: 'POLLUTION',
  deforestation: 'DEFORESTATION',
  runoff: 'RUNOFF',
  wildfire: 'WILDFIRE',
  litter: 'LITTER',
  erosion: 'EROSION',
  invasive: 'INVASIVE',
  drought: 'DROUGHT',
  contamination: 'CONTAMINATION',
  other: 'OTHER',
};

// ── Mock location summaries ───────────────────────────────────────────────

export const locationSummaries: LocationSummary[] = [
  {
    id: 'loc-sf',
    name: 'SF Bay',
    coordinates: [-122.3912, 37.7955],
    city: 'San Francisco',
    state: 'CA',
    activeProblemsCount: 4,
    criticalProblemsCount: 0,
    lastUpdated: '2m ago',
    overallSeverity: 'moderate',
    confidence: 87,
    description: 'Mission Creek and Ocean Beach monitoring zones',
  },
  {
    id: 'loc-la',
    name: 'LA Basin',
    coordinates: [-118.2850, 34.0901],
    city: 'Los Angeles',
    state: 'CA',
    activeProblemsCount: 3,
    criticalProblemsCount: 1,
    lastUpdated: '4m ago',
    overallSeverity: 'elevated',
    confidence: 95,
    description: 'Griffith Park and Long Beach Port areas',
  },
  {
    id: 'loc-gulf',
    name: 'Gulf Coast',
    coordinates: [-95.3562, 29.7580],
    city: 'Houston',
    state: 'TX',
    activeProblemsCount: 5,
    criticalProblemsCount: 2,
    lastUpdated: '1m ago',
    overallSeverity: 'high',
    confidence: 92,
    description: 'Texas City and Galveston Bay region',
  },
  {
    id: 'loc-ever',
    name: 'Everglades',
    coordinates: [-80.8320, 25.8500],
    city: 'Miami',
    state: 'FL',
    activeProblemsCount: 6,
    criticalProblemsCount: 3,
    lastUpdated: '3m ago',
    overallSeverity: 'critical',
    confidence: 98,
    description: 'Everglades Entrance and Biscayne Bay',
  },
  {
    id: 'loc-pnw',
    name: 'Pacific NW',
    coordinates: [-122.3380, 47.6130],
    city: 'Seattle',
    state: 'WA',
    activeProblemsCount: 2,
    criticalProblemsCount: 0,
    lastUpdated: '31m ago',
    overallSeverity: 'low',
    confidence: 90,
    description: 'Puget Sound and Portland metro',
  },
];

// ── Generate location-specific problem graphs ──────────────────────────────

export function buildLocationGraph(locationId: string): LocationGraph {
  const location = locationSummaries.find((l) => l.id === locationId);
  if (!location) {
    throw new Error(`Location ${locationId} not found`);
  }

  const problems: ProblemNode[] = [];
  const links: ProblemLink[] = [];

  // Location-specific problems based on location ID
  const problemTemplates: Record<string, Partial<ProblemNode>[]> = {
    'loc-sf': [
      {
        id: 'prob-sf-algal',
        name: 'Algal Bloom',
        category: 'pollution',
        severity: 'elevated',
        description: 'Dense algal bloom in Mission Creek canal. Water discoloration consistent with harmful cyanobacteria.',
        causes: ['Nutrient loading from storm runoff', 'Warming water temperatures'],
        indicators: ['Chlorophyll-a: 45 µg/L', 'Water temp +3.2°C above baseline'],
        evidence: [
          { type: 'observation', description: 'Visible green discoloration spanning 200m', timestamp: '2m ago' },
          { type: 'sensor', description: 'Chlorophyll-a spike detected', timestamp: '5m ago' },
        ],
        trend: 'worsening',
        confidence: 87,
        lastUpdated: '2m ago',
      },
      {
        id: 'prob-sf-contamination',
        name: 'Storm Drain Contamination',
        category: 'contamination',
        severity: 'high',
        description: 'Industrial runoff from storm drain outfall at Ocean Beach.',
        causes: ['Construction site discharge', 'Urban runoff'],
        indicators: ['Heavy metals detected', 'pH: 5.2'],
        trend: 'stable',
        confidence: 92,
        lastUpdated: '8m ago',
      },
    ],
    'loc-la': [
      {
        id: 'prob-la-smog',
        name: 'Wildfire Smoke Plume',
        category: 'wildfire',
        severity: 'critical',
        description: 'Heavy smoke plume reducing visibility. AQI in hazardous range.',
        causes: ['Wildfire in Angeles National Forest', 'Temperature inversion'],
        indicators: ['PM2.5: 285 µg/m³', 'Visibility: 0.8 miles'],
        trend: 'worsening',
        confidence: 95,
        lastUpdated: '4m ago',
      },
      {
        id: 'prob-la-oil',
        name: 'Oil Sheen',
        category: 'contamination',
        severity: 'high',
        description: 'Iridescent oil film covering harbor surface near container terminal.',
        causes: ['Bilge discharge', 'Fuel transfer spill'],
        indicators: ['Film thickness: 1-5 µm', 'Coverage: 400m²'],
        trend: 'worsening',
        confidence: 89,
        lastUpdated: '11m ago',
      },
    ],
    'loc-gulf': [
      {
        id: 'prob-gulf-refinery',
        name: 'Refinery Flare Event',
        category: 'pollution',
        severity: 'critical',
        description: 'Abnormally large flare with black smoke. SO₂ odor detectable at 2-mile radius.',
        causes: ['Equipment malfunction', 'Incomplete combustion'],
        indicators: ['SO₂: 142 ppb', 'PM10: 195 µg/m³'],
        trend: 'worsening',
        confidence: 94,
        lastUpdated: '1m ago',
      },
      {
        id: 'prob-gulf-fishkill',
        name: 'Mass Fish Kill',
        category: 'pollution',
        severity: 'critical',
        description: '~5,000 dead fish along Galveston Bay. Dissolved oxygen at lethal levels.',
        causes: ['Hypoxia from nutrient loading', 'Elevated water temperature'],
        indicators: ['DO: 1.2 mg/L', 'Water temp: 34°C'],
        trend: 'worsening',
        confidence: 91,
        lastUpdated: '14m ago',
      },
      {
        id: 'prob-gulf-erosion',
        name: 'Coastal Erosion',
        category: 'erosion',
        severity: 'critical',
        description: '18m of shoreline retreat in 6 months. Barrier island near breakthrough.',
        causes: ['Sea level rise', 'Reduced sediment supply'],
        indicators: ['Land loss: 3m/month', 'Island width: <100m'],
        trend: 'worsening',
        confidence: 92,
        lastUpdated: '7m ago',
      },
    ],
    'loc-ever': [
      {
        id: 'prob-ever-invasive',
        name: 'Invasive Python Nest',
        category: 'invasive',
        severity: 'critical',
        description: 'Burmese python nest with 47 eggs in critical wading bird nesting area.',
        causes: ['Established invasive population', 'Favorable habitat'],
        indicators: ['Nest: 47 eggs', 'Proximity: 200m from bird colony'],
        trend: 'worsening',
        confidence: 98,
        lastUpdated: '3m ago',
      },
      {
        id: 'prob-ever-bleaching',
        name: 'Coral Bleaching',
        category: 'pollution',
        severity: 'critical',
        description: 'Widespread coral bleaching across 2-acre patch reef. 80% of colonies affected.',
        causes: ['Elevated sea temperature', 'Thermal stress'],
        indicators: ['Reef temp: 31.8°C', 'Bleaching: 80%'],
        trend: 'worsening',
        confidence: 96,
        lastUpdated: '9m ago',
      },
      {
        id: 'prob-ever-drought',
        name: 'Drought Stress',
        category: 'drought',
        severity: 'high',
        description: 'Below-average rainfall affecting freshwater flow to Everglades.',
        causes: ['Reduced precipitation', 'Water diversion'],
        indicators: ['Rainfall: 60% of normal', 'Water levels: -2.3ft'],
        trend: 'worsening',
        confidence: 85,
        lastUpdated: '12m ago',
      },
    ],
    'loc-pnw': [
      {
        id: 'prob-pnw-logging',
        name: 'Old-Growth Logging',
        category: 'deforestation',
        severity: 'moderate',
        description: 'Fresh clear-cut 150m from designated old-growth preserve.',
        causes: ['Buffer zone violation', 'Commercial logging'],
        indicators: ['Area cleared: 8 acres', 'Tree age: 150-300 years'],
        trend: 'stable',
        confidence: 90,
        lastUpdated: '31m ago',
      },
      {
        id: 'prob-pnw-smoke',
        name: 'Transboundary Smoke',
        category: 'wildfire',
        severity: 'elevated',
        description: 'BC wildfire smoke creating persistent haze. AQI fluctuating Unhealthy to Very Unhealthy.',
        causes: ['BC wildfires', 'Temperature inversion'],
        indicators: ['PM2.5: 124 µg/m³', 'Duration: 36 hours'],
        trend: 'stable',
        confidence: 87,
        lastUpdated: '19m ago',
      },
    ],
  };

  const templates = problemTemplates[locationId] || [];
  templates.forEach((template) => {
    const problem: ProblemNode = {
      id: template.id!,
      name: template.name!,
      category: template.category!,
      severity: template.severity!,
      description: template.description!,
      causes: template.causes || [],
      indicators: template.indicators || [],
      evidence: template.evidence || [],
      stakeholders: template.stakeholders || [],
      interventions: template.interventions || [],
      trend: template.trend!,
      confidence: template.confidence!,
      lastUpdated: template.lastUpdated!,
      metadata: template.metadata,
    };
    problems.push(problem);
  });

  // Create causal links between problems
  if (locationId === 'loc-sf') {
    links.push({
      source: 'prob-sf-contamination',
      target: 'prob-sf-algal',
      label: 'contributes to',
      type: 'causes',
      strength: 0.7,
    });
  }
  if (locationId === 'loc-la') {
    links.push({
      source: 'prob-la-smog',
      target: 'prob-la-oil',
      label: 'correlates with',
      type: 'correlates',
      strength: 0.5,
    });
  }
  if (locationId === 'loc-gulf') {
    links.push({
      source: 'prob-gulf-refinery',
      target: 'prob-gulf-fishkill',
      label: 'causes',
      type: 'causes',
      strength: 0.8,
    });
    links.push({
      source: 'prob-gulf-refinery',
      target: 'prob-gulf-erosion',
      label: 'contributes to',
      type: 'causes',
      strength: 0.6,
    });
    links.push({
      source: 'prob-gulf-fishkill',
      target: 'prob-gulf-erosion',
      label: 'amplifies',
      type: 'amplifies',
      strength: 0.5,
    });
  }
  if (locationId === 'loc-ever') {
    links.push({
      source: 'prob-ever-drought',
      target: 'prob-ever-invasive',
      label: 'amplifies',
      type: 'amplifies',
      strength: 0.6,
    });
    links.push({
      source: 'prob-ever-drought',
      target: 'prob-ever-bleaching',
      label: 'contributes to',
      type: 'causes',
      strength: 0.5,
    });
    links.push({
      source: 'prob-ever-bleaching',
      target: 'prob-ever-invasive',
      label: 'enables',
      type: 'amplifies',
      strength: 0.4,
    });
  }
  if (locationId === 'loc-pnw') {
    links.push({
      source: 'prob-pnw-logging',
      target: 'prob-pnw-smoke',
      label: 'correlates with',
      type: 'correlates',
      strength: 0.4,
    });
  }

  return { locationId, problems, links };
}
