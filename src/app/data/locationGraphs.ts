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
    activeProblemsCount: 8,
    criticalProblemsCount: 2,
    lastUpdated: '2m ago',
    overallSeverity: 'elevated',
    confidence: 87,
    description: 'Mission Creek and Ocean Beach monitoring zones',
  },
  {
    id: 'loc-la',
    name: 'LA Basin',
    coordinates: [-118.2850, 34.0901],
    city: 'Los Angeles',
    state: 'CA',
    activeProblemsCount: 9,
    criticalProblemsCount: 3,
    lastUpdated: '4m ago',
    overallSeverity: 'high',
    confidence: 95,
    description: 'Griffith Park and Long Beach Port areas',
  },
  {
    id: 'loc-gulf',
    name: 'Gulf Coast',
    coordinates: [-95.3562, 29.7580],
    city: 'Houston',
    state: 'TX',
    activeProblemsCount: 10,
    criticalProblemsCount: 4,
    lastUpdated: '1m ago',
    overallSeverity: 'critical',
    confidence: 92,
    description: 'Texas City and Galveston Bay region',
  },
  {
    id: 'loc-ever',
    name: 'Everglades',
    coordinates: [-80.8320, 25.8500],
    city: 'Miami',
    state: 'FL',
    activeProblemsCount: 8,
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
    activeProblemsCount: 7,
    criticalProblemsCount: 1,
    lastUpdated: '31m ago',
    overallSeverity: 'moderate',
    confidence: 90,
    description: 'Puget Sound and Portland metro',
  },
  {
    id: 'loc-ny',
    name: 'NY Harbor',
    coordinates: [-74.0060, 40.7128],
    city: 'New York',
    state: 'NY',
    activeProblemsCount: 9,
    criticalProblemsCount: 2,
    lastUpdated: '5m ago',
    overallSeverity: 'elevated',
    confidence: 88,
    description: 'Hudson River and East River estuary',
  },
  {
    id: 'loc-chi',
    name: 'Chicago River',
    coordinates: [-87.6298, 41.8781],
    city: 'Chicago',
    state: 'IL',
    activeProblemsCount: 6,
    criticalProblemsCount: 1,
    lastUpdated: '12m ago',
    overallSeverity: 'moderate',
    confidence: 85,
    description: 'Chicago River and Lake Michigan shoreline',
  },
  {
    id: 'loc-den',
    name: 'Denver Metro',
    coordinates: [-104.9903, 39.7392],
    city: 'Denver',
    state: 'CO',
    activeProblemsCount: 7,
    criticalProblemsCount: 2,
    lastUpdated: '8m ago',
    overallSeverity: 'elevated',
    confidence: 91,
    description: 'South Platte River and Front Range',
  },
  {
    id: 'loc-phx',
    name: 'Phoenix Valley',
    coordinates: [-112.0740, 33.4484],
    city: 'Phoenix',
    state: 'AZ',
    activeProblemsCount: 8,
    criticalProblemsCount: 3,
    lastUpdated: '6m ago',
    overallSeverity: 'high',
    confidence: 93,
    description: 'Salt River and Sonoran Desert',
  },
  {
    id: 'loc-atl',
    name: 'Atlanta Metro',
    coordinates: [-84.3880, 33.7490],
    city: 'Atlanta',
    state: 'GA',
    activeProblemsCount: 6,
    criticalProblemsCount: 1,
    lastUpdated: '15m ago',
    overallSeverity: 'moderate',
    confidence: 86,
    description: 'Chattahoochee River watershed',
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
      {
        id: 'prob-sf-microplastics',
        name: 'Microplastic Accumulation',
        category: 'pollution',
        severity: 'elevated',
        description: 'High microplastic concentrations in Bay waters, affecting marine life.',
        causes: ['Urban wastewater discharge', 'Plastic waste breakdown'],
        indicators: ['Microplastics: 12 particles/L', 'Bioaccumulation detected'],
        trend: 'worsening',
        confidence: 89,
        lastUpdated: '5m ago',
      },
      {
        id: 'prob-sf-sewage',
        name: 'Sewage Overflow',
        category: 'contamination',
        severity: 'critical',
        description: 'Combined sewer overflow during heavy rain events.',
        causes: ['Aging infrastructure', 'Heavy precipitation'],
        indicators: ['E. coli: 640 MPN', 'Overflow events: 3/month'],
        trend: 'worsening',
        confidence: 94,
        lastUpdated: '1m ago',
      },
      {
        id: 'prob-sf-sediment',
        name: 'Sediment Contamination',
        category: 'contamination',
        severity: 'moderate',
        description: 'Heavy metals in bay sediments affecting benthic organisms.',
        causes: ['Historical industrial discharge', 'Ongoing urban runoff'],
        indicators: ['Lead: 450 ppm', 'Mercury: 2.3 ppm'],
        trend: 'stable',
        confidence: 88,
        lastUpdated: '10m ago',
      },
      {
        id: 'prob-sf-noise',
        name: 'Marine Noise Pollution',
        category: 'pollution',
        severity: 'moderate',
        description: 'High underwater noise levels from shipping affecting marine mammals.',
        causes: ['Port traffic', 'Construction activities'],
        indicators: ['Noise: 120 dB', 'Whale sightings: -40%'],
        trend: 'worsening',
        confidence: 82,
        lastUpdated: '7m ago',
      },
      {
        id: 'prob-sf-habitat',
        name: 'Wetland Habitat Loss',
        category: 'other',
        severity: 'elevated',
        description: 'Coastal wetland degradation reducing biodiversity.',
        causes: ['Urban development', 'Sea level rise'],
        indicators: ['Wetland area: -15%', 'Species diversity: -22%'],
        trend: 'worsening',
        confidence: 85,
        lastUpdated: '14m ago',
      },
      {
        id: 'prob-sf-oil',
        name: 'Oil Sheen Detection',
        category: 'contamination',
        severity: 'moderate',
        description: 'Intermittent oil sheens detected near shipping lanes.',
        causes: ['Bilge discharge', 'Fuel leaks'],
        indicators: ['Sheen frequency: 2/week', 'Coverage: 50m² avg'],
        trend: 'stable',
        confidence: 79,
        lastUpdated: '9m ago',
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
      {
        id: 'prob-la-ozone',
        name: 'Ozone Exceedance',
        category: 'pollution',
        severity: 'high',
        description: 'Ground-level ozone exceeding federal standards across basin.',
        causes: ['Vehicle emissions', 'Sunlight + NOx'],
        indicators: ['O3: 0.095 ppm', 'Exceedance days: 45/year'],
        trend: 'worsening',
        confidence: 93,
        lastUpdated: '3m ago',
      },
      {
        id: 'prob-la-runoff',
        name: 'Urban Runoff Contamination',
        category: 'runoff',
        severity: 'elevated',
        description: 'Heavy metals and chemicals in stormwater reaching ocean.',
        causes: ['Street runoff', 'Industrial areas'],
        indicators: ['Zinc: 2.1 mg/L', 'Copper: 0.8 mg/L'],
        trend: 'worsening',
        confidence: 87,
        lastUpdated: '6m ago',
      },
      {
        id: 'prob-la-beach',
        name: 'Beach Water Quality',
        category: 'contamination',
        severity: 'moderate',
        description: 'Bacterial contamination closing beaches periodically.',
        causes: ['Sewage overflow', 'Stormwater discharge'],
        indicators: ['E. coli: 235 MPN', 'Beach closures: 8/year'],
        trend: 'stable',
        confidence: 84,
        lastUpdated: '13m ago',
      },
      {
        id: 'prob-la-drought',
        name: 'Water Scarcity',
        category: 'drought',
        severity: 'high',
        description: 'Severe drought conditions affecting water supply and ecosystems.',
        causes: ['Reduced precipitation', 'High demand'],
        indicators: ['Reservoir levels: 35%', 'Precipitation: -40%'],
        trend: 'worsening',
        confidence: 91,
        lastUpdated: '2m ago',
      },
      {
        id: 'prob-la-heat',
        name: 'Urban Heat Island',
        category: 'other',
        severity: 'elevated',
        description: 'Elevated temperatures in urban areas affecting air quality and health.',
        causes: ['Paved surfaces', 'Lack of vegetation'],
        indicators: ['Temp difference: +5°C', 'Energy demand: +15%'],
        trend: 'worsening',
        confidence: 88,
        lastUpdated: '7m ago',
      },
      {
        id: 'prob-la-wildlife',
        name: 'Wildlife Habitat Fragmentation',
        category: 'other',
        severity: 'moderate',
        description: 'Urban development fragmenting wildlife corridors.',
        causes: ['Urban sprawl', 'Infrastructure development'],
        indicators: ['Habitat connectivity: -30%', 'Species isolation'],
        trend: 'worsening',
        confidence: 83,
        lastUpdated: '16m ago',
      },
      {
        id: 'prob-la-noise',
        name: 'Noise Pollution',
        category: 'pollution',
        severity: 'moderate',
        description: 'High noise levels affecting human and wildlife health.',
        causes: ['Traffic', 'Aircraft', 'Construction'],
        indicators: ['Avg noise: 65 dB', 'Health impacts: documented'],
        trend: 'stable',
        confidence: 81,
        lastUpdated: '19m ago',
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
      {
        id: 'prob-gulf-algal',
        name: 'Harmful Algal Bloom',
        category: 'pollution',
        severity: 'high',
        description: 'Red tide affecting 50-mile stretch of coastline.',
        causes: ['Nutrient loading', 'Warm water'],
        indicators: ['Karenia brevis: 1M cells/L', 'Fish kills: ongoing'],
        trend: 'worsening',
        confidence: 89,
        lastUpdated: '3m ago',
      },
      {
        id: 'prob-gulf-oil',
        name: 'Chronic Oil Contamination',
        category: 'contamination',
        severity: 'high',
        description: 'Persistent oil contamination from multiple sources.',
        causes: ['Offshore drilling', 'Shipping accidents'],
        indicators: ['Oil sheens: frequent', 'Beach tar: 15% coverage'],
        trend: 'stable',
        confidence: 87,
        lastUpdated: '5m ago',
      },
      {
        id: 'prob-gulf-sediment',
        name: 'Sediment Toxicity',
        category: 'contamination',
        severity: 'elevated',
        description: 'Toxic chemicals in sediments affecting bottom-dwelling organisms.',
        causes: ['Historical contamination', 'Ongoing discharge'],
        indicators: ['PAHs: 450 ppm', 'Benthic diversity: -60%'],
        trend: 'stable',
        confidence: 85,
        lastUpdated: '11m ago',
      },
      {
        id: 'prob-gulf-habitat',
        name: 'Marsh Habitat Degradation',
        category: 'other',
        severity: 'elevated',
        description: 'Coastal marsh loss affecting storm protection and wildlife.',
        causes: ['Erosion', 'Subsidence', 'Development'],
        indicators: ['Marsh loss: 2% annually', 'Storm surge risk: +25%'],
        trend: 'worsening',
        confidence: 88,
        lastUpdated: '8m ago',
      },
      {
        id: 'prob-gulf-nutrients',
        name: 'Nutrient Overload',
        category: 'pollution',
        severity: 'high',
        description: 'Excessive nitrogen and phosphorus causing eutrophication.',
        causes: ['Agricultural runoff', 'Wastewater discharge'],
        indicators: ['Nitrogen: 2.5 mg/L', 'Phosphorus: 0.4 mg/L'],
        trend: 'worsening',
        confidence: 90,
        lastUpdated: '4m ago',
      },
      {
        id: 'prob-gulf-invasive',
        name: 'Invasive Species',
        category: 'invasive',
        severity: 'moderate',
        description: 'Invasive aquatic species disrupting native ecosystems.',
        causes: ['Ballast water', 'Aquaculture escapes'],
        indicators: ['Lionfish: established', 'Zebra mussels: spreading'],
        trend: 'worsening',
        confidence: 83,
        lastUpdated: '12m ago',
      },
      {
        id: 'prob-gulf-plastic',
        name: 'Marine Plastic Debris',
        category: 'litter',
        severity: 'elevated',
        description: 'High concentrations of plastic debris in Gulf waters.',
        causes: ['Land-based sources', 'Fishing gear'],
        indicators: ['Plastic density: 5 items/km²', 'Wildlife entanglement'],
        trend: 'worsening',
        confidence: 86,
        lastUpdated: '9m ago',
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
      {
        id: 'prob-ever-nutrients',
        name: 'Nutrient Pollution',
        category: 'pollution',
        severity: 'high',
        description: 'Excessive nutrients from agricultural runoff causing algal blooms.',
        causes: ['Sugar cane farming', 'Urban runoff'],
        indicators: ['Phosphorus: 0.15 mg/L', 'Algal blooms: frequent'],
        trend: 'worsening',
        confidence: 92,
        lastUpdated: '4m ago',
      },
      {
        id: 'prob-ever-mercury',
        name: 'Mercury Contamination',
        category: 'contamination',
        severity: 'elevated',
        description: 'Mercury in fish exceeding safe consumption levels.',
        causes: ['Atmospheric deposition', 'Wetland methylation'],
        indicators: ['Fish mercury: 1.2 ppm', 'Advisories: active'],
        trend: 'stable',
        confidence: 88,
        lastUpdated: '7m ago',
      },
      {
        id: 'prob-ever-habitat',
        name: 'Habitat Fragmentation',
        category: 'other',
        severity: 'elevated',
        description: 'Development and roads fragmenting wildlife habitat.',
        causes: ['Urban expansion', 'Infrastructure'],
        indicators: ['Habitat loss: 5% annually', 'Road mortality: high'],
        trend: 'worsening',
        confidence: 87,
        lastUpdated: '10m ago',
      },
      {
        id: 'prob-ever-water',
        name: 'Water Flow Disruption',
        category: 'other',
        severity: 'high',
        description: 'Altered water flow patterns affecting ecosystem health.',
        causes: ['Drainage canals', 'Water management'],
        indicators: ['Flow: -40%', 'Wetland drying'],
        trend: 'worsening',
        confidence: 90,
        lastUpdated: '5m ago',
      },
      {
        id: 'prob-ever-salt',
        name: 'Saltwater Intrusion',
        category: 'contamination',
        severity: 'moderate',
        description: 'Saltwater moving into freshwater areas due to sea level rise.',
        causes: ['Sea level rise', 'Reduced freshwater flow'],
        indicators: ['Salinity: +15%', 'Freshwater species: declining'],
        trend: 'worsening',
        confidence: 84,
        lastUpdated: '13m ago',
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
      {
        id: 'prob-pnw-salmon',
        name: 'Salmon Population Decline',
        category: 'other',
        severity: 'high',
        description: 'Declining salmon populations affecting ecosystem and fisheries.',
        causes: ['Habitat loss', 'Water temperature', 'Dams'],
        indicators: ['Returns: -35%', 'Spawning success: -20%'],
        trend: 'worsening',
        confidence: 91,
        lastUpdated: '6m ago',
      },
      {
        id: 'prob-pnw-acid',
        name: 'Ocean Acidification',
        category: 'pollution',
        severity: 'elevated',
        description: 'Increasing ocean acidity affecting shellfish and marine life.',
        causes: ['CO2 absorption', 'Upwelling'],
        indicators: ['pH: 7.8', 'Shellfish: declining'],
        trend: 'worsening',
        confidence: 89,
        lastUpdated: '8m ago',
      },
      {
        id: 'prob-pnw-runoff',
        name: 'Urban Runoff',
        category: 'runoff',
        severity: 'moderate',
        description: 'Polluted runoff from cities affecting Puget Sound.',
        causes: ['Stormwater', 'Industrial discharge'],
        indicators: ['Toxics: detected', 'Water quality: degraded'],
        trend: 'stable',
        confidence: 85,
        lastUpdated: '14m ago',
      },
      {
        id: 'prob-pnw-invasive',
        name: 'Invasive Species',
        category: 'invasive',
        severity: 'moderate',
        description: 'Non-native species disrupting native ecosystems.',
        causes: ['Ballast water', 'Aquaculture'],
        indicators: ['European green crab: established', 'Impact: documented'],
        trend: 'worsening',
        confidence: 83,
        lastUpdated: '11m ago',
      },
      {
        id: 'prob-pnw-habitat',
        name: 'Estuary Habitat Loss',
        category: 'other',
        severity: 'elevated',
        description: 'Loss of critical estuary habitat for juvenile fish.',
        causes: ['Development', 'Shoreline modification'],
        indicators: ['Habitat: -25%', 'Fish abundance: -30%'],
        trend: 'worsening',
        confidence: 87,
        lastUpdated: '9m ago',
      },
    ],
    'loc-ny': [
      {
        id: 'prob-ny-sewage',
        name: 'Combined Sewer Overflow',
        category: 'contamination',
        severity: 'high',
        description: 'Frequent CSO events during rain contaminating waterways.',
        causes: ['Aging infrastructure', 'Heavy rain'],
        indicators: ['Overflow events: 50/year', 'Bacteria: high'],
        trend: 'stable',
        confidence: 92,
        lastUpdated: '2m ago',
      },
      {
        id: 'prob-ny-sediment',
        name: 'Harbor Sediment Contamination',
        category: 'contamination',
        severity: 'high',
        description: 'Legacy contaminants in harbor sediments.',
        causes: ['Historical industry', 'Ongoing discharge'],
        indicators: ['PCBs: 450 ppm', 'Dioxins: detected'],
        trend: 'stable',
        confidence: 88,
        lastUpdated: '5m ago',
      },
      {
        id: 'prob-ny-runoff',
        name: 'Urban Runoff',
        category: 'runoff',
        severity: 'elevated',
        description: 'Polluted stormwater entering harbor.',
        causes: ['Street runoff', 'Industrial areas'],
        indicators: ['Heavy metals: high', 'Volume: 1B gallons/year'],
        trend: 'worsening',
        confidence: 86,
        lastUpdated: '7m ago',
      },
      {
        id: 'prob-ny-noise',
        name: 'Marine Noise Pollution',
        category: 'pollution',
        severity: 'moderate',
        description: 'High underwater noise from shipping affecting marine life.',
        causes: ['Port traffic', 'Construction'],
        indicators: ['Noise: 115 dB', 'Whale behavior: altered'],
        trend: 'worsening',
        confidence: 84,
        lastUpdated: '9m ago',
      },
      {
        id: 'prob-ny-habitat',
        name: 'Wetland Loss',
        category: 'other',
        severity: 'elevated',
        description: 'Coastal wetland degradation reducing ecosystem services.',
        causes: ['Development', 'Sea level rise'],
        indicators: ['Wetland area: -40%', 'Biodiversity: declining'],
        trend: 'worsening',
        confidence: 87,
        lastUpdated: '11m ago',
      },
      {
        id: 'prob-ny-plastic',
        name: 'Plastic Debris',
        category: 'litter',
        severity: 'moderate',
        description: 'High plastic debris in harbor and beaches.',
        causes: ['Urban waste', 'River transport'],
        indicators: ['Debris: 12 items/km²', 'Cleanup: ongoing'],
        trend: 'stable',
        confidence: 82,
        lastUpdated: '13m ago',
      },
      {
        id: 'prob-ny-water',
        name: 'Water Quality',
        category: 'contamination',
        severity: 'moderate',
        description: 'Periodic water quality issues affecting recreation.',
        causes: ['CSO', 'Runoff'],
        indicators: ['Beach closures: 15/year', 'Swimming advisories'],
        trend: 'stable',
        confidence: 85,
        lastUpdated: '8m ago',
      },
      {
        id: 'prob-ny-air',
        name: 'Air Quality',
        category: 'pollution',
        severity: 'elevated',
        description: 'Air pollution from port and traffic affecting health.',
        causes: ['Ship emissions', 'Vehicle traffic'],
        indicators: ['PM2.5: 12 µg/m³', 'NOx: elevated'],
        trend: 'stable',
        confidence: 83,
        lastUpdated: '10m ago',
      },
      {
        id: 'prob-ny-invasive',
        name: 'Invasive Species',
        category: 'invasive',
        severity: 'moderate',
        description: 'Non-native species in harbor ecosystem.',
        causes: ['Ballast water', 'Shipping'],
        indicators: ['Asian shore crab: established', 'Impact: documented'],
        trend: 'worsening',
        confidence: 81,
        lastUpdated: '15m ago',
      },
    ],
    'loc-chi': [
      {
        id: 'prob-chi-sewage',
        name: 'Sewage Discharge',
        category: 'contamination',
        severity: 'moderate',
        description: 'Sewage overflow during heavy rain events.',
        causes: ['Combined sewers', 'Heavy precipitation'],
        indicators: ['Overflow: 20/year', 'Bacteria: elevated'],
        trend: 'stable',
        confidence: 87,
        lastUpdated: '5m ago',
      },
      {
        id: 'prob-chi-runoff',
        name: 'Urban Runoff',
        category: 'runoff',
        severity: 'moderate',
        description: 'Polluted stormwater entering river and lake.',
        causes: ['Street runoff', 'Industrial areas'],
        indicators: ['Heavy metals: detected', 'Volume: high'],
        trend: 'stable',
        confidence: 84,
        lastUpdated: '8m ago',
      },
      {
        id: 'prob-chi-algal',
        name: 'Algal Blooms',
        category: 'pollution',
        severity: 'elevated',
        description: 'Harmful algal blooms in Lake Michigan near shore.',
        causes: ['Nutrient loading', 'Warm water'],
        indicators: ['Chlorophyll-a: 35 µg/L', 'Toxins: detected'],
        trend: 'worsening',
        confidence: 86,
        lastUpdated: '6m ago',
      },
      {
        id: 'prob-chi-sediment',
        name: 'Sediment Contamination',
        category: 'contamination',
        severity: 'moderate',
        description: 'Legacy contaminants in river sediments.',
        causes: ['Historical industry', 'Ongoing discharge'],
        indicators: ['PCBs: 280 ppm', 'Heavy metals: high'],
        trend: 'stable',
        confidence: 83,
        lastUpdated: '12m ago',
      },
      {
        id: 'prob-chi-habitat',
        name: 'Habitat Degradation',
        category: 'other',
        severity: 'moderate',
        description: 'River and lake habitat loss affecting wildlife.',
        causes: ['Development', 'Channelization'],
        indicators: ['Habitat: -30%', 'Species: declining'],
        trend: 'worsening',
        confidence: 85,
        lastUpdated: '9m ago',
      },
      {
        id: 'prob-chi-water',
        name: 'Water Quality',
        category: 'contamination',
        severity: 'moderate',
        description: 'Periodic water quality issues in river.',
        causes: ['Sewage', 'Runoff'],
        indicators: ['E. coli: elevated', 'Advisories: periodic'],
        trend: 'stable',
        confidence: 82,
        lastUpdated: '11m ago',
      },
    ],
    'loc-den': [
      {
        id: 'prob-den-air',
        name: 'Air Quality',
        category: 'pollution',
        severity: 'elevated',
        description: 'Ozone and PM2.5 exceedances affecting health.',
        causes: ['Vehicle emissions', 'Oil & gas'],
        indicators: ['O3: 0.075 ppm', 'PM2.5: 18 µg/m³'],
        trend: 'worsening',
        confidence: 89,
        lastUpdated: '3m ago',
      },
      {
        id: 'prob-den-water',
        name: 'Water Quality',
        category: 'contamination',
        severity: 'moderate',
        description: 'Contamination in South Platte River.',
        causes: ['Urban runoff', 'Industrial discharge'],
        indicators: ['Heavy metals: detected', 'Nutrients: elevated'],
        trend: 'stable',
        confidence: 85,
        lastUpdated: '7m ago',
      },
      {
        id: 'prob-den-drought',
        name: 'Drought Conditions',
        category: 'drought',
        severity: 'high',
        description: 'Severe drought affecting water supply and ecosystems.',
        causes: ['Reduced snowpack', 'High demand'],
        indicators: ['Snowpack: -35%', 'Reservoir: 42%'],
        trend: 'worsening',
        confidence: 91,
        lastUpdated: '2m ago',
      },
      {
        id: 'prob-den-wildfire',
        name: 'Wildfire Risk',
        category: 'wildfire',
        severity: 'elevated',
        description: 'High wildfire risk in Front Range.',
        causes: ['Drought', 'Fuel buildup'],
        indicators: ['Fire danger: extreme', 'Acres burned: +50%'],
        trend: 'worsening',
        confidence: 88,
        lastUpdated: '4m ago',
      },
      {
        id: 'prob-den-habitat',
        name: 'Habitat Fragmentation',
        category: 'other',
        severity: 'moderate',
        description: 'Urban development fragmenting wildlife habitat.',
        causes: ['Urban sprawl', 'Infrastructure'],
        indicators: ['Habitat loss: 3% annually', 'Connectivity: reduced'],
        trend: 'worsening',
        confidence: 84,
        lastUpdated: '10m ago',
      },
      {
        id: 'prob-den-runoff',
        name: 'Urban Runoff',
        category: 'runoff',
        severity: 'moderate',
        description: 'Polluted stormwater entering waterways.',
        causes: ['Street runoff', 'Construction'],
        indicators: ['Toxics: detected', 'Volume: high'],
        trend: 'stable',
        confidence: 83,
        lastUpdated: '8m ago',
      },
      {
        id: 'prob-den-noise',
        name: 'Noise Pollution',
        category: 'pollution',
        severity: 'low',
        description: 'Aircraft and traffic noise affecting communities.',
        causes: ['Airport', 'Highway traffic'],
        indicators: ['Noise: 60 dB', 'Complaints: moderate'],
        trend: 'stable',
        confidence: 79,
        lastUpdated: '14m ago',
      },
    ],
    'loc-phx': [
      {
        id: 'prob-phx-drought',
        name: 'Severe Drought',
        category: 'drought',
        severity: 'critical',
        description: 'Extreme drought conditions affecting water supply.',
        causes: ['Climate change', 'High demand'],
        indicators: ['Reservoir: 28%', 'Precipitation: -50%'],
        trend: 'worsening',
        confidence: 95,
        lastUpdated: '1m ago',
      },
      {
        id: 'prob-phx-heat',
        name: 'Extreme Heat',
        category: 'other',
        severity: 'high',
        description: 'Rising temperatures and heat island effects.',
        causes: ['Climate change', 'Urbanization'],
        indicators: ['Avg temp: +2.5°C', 'Heat deaths: increasing'],
        trend: 'worsening',
        confidence: 93,
        lastUpdated: '2m ago',
      },
      {
        id: 'prob-phx-air',
        name: 'Air Quality',
        category: 'pollution',
        severity: 'high',
        description: 'Ozone and PM exceedances during summer.',
        causes: ['Vehicle emissions', 'Heat'],
        indicators: ['O3: 0.085 ppm', 'PM10: 55 µg/m³'],
        trend: 'worsening',
        confidence: 90,
        lastUpdated: '3m ago',
      },
      {
        id: 'prob-phx-water',
        name: 'Water Scarcity',
        category: 'drought',
        severity: 'critical',
        description: 'Critical water shortage affecting supply.',
        causes: ['Drought', 'Overuse'],
        indicators: ['Groundwater: declining', 'Supply: critical'],
        trend: 'worsening',
        confidence: 94,
        lastUpdated: '1m ago',
      },
      {
        id: 'prob-phx-habitat',
        name: 'Desert Habitat Loss',
        category: 'other',
        severity: 'elevated',
        description: 'Urban development destroying desert habitat.',
        causes: ['Urban sprawl', 'Infrastructure'],
        indicators: ['Habitat loss: 4% annually', 'Species: declining'],
        trend: 'worsening',
        confidence: 87,
        lastUpdated: '6m ago',
      },
      {
        id: 'prob-phx-dust',
        name: 'Dust Storms',
        category: 'pollution',
        severity: 'moderate',
        description: 'Increasing frequency of dust storms affecting air quality.',
        causes: ['Drought', 'Land disturbance'],
        indicators: ['Events: +30%', 'PM10: extreme'],
        trend: 'worsening',
        confidence: 85,
        lastUpdated: '5m ago',
      },
      {
        id: 'prob-phx-runoff',
        name: 'Urban Runoff',
        category: 'runoff',
        severity: 'moderate',
        description: 'Polluted stormwater during monsoon season.',
        causes: ['Street runoff', 'Construction'],
        indicators: ['Toxics: detected', 'Volume: high'],
        trend: 'stable',
        confidence: 83,
        lastUpdated: '9m ago',
      },
      {
        id: 'prob-phx-invasive',
        name: 'Invasive Species',
        category: 'invasive',
        severity: 'moderate',
        description: 'Non-native plants and animals disrupting ecosystems.',
        causes: ['Urbanization', 'Irrigation'],
        indicators: ['Tamarix: widespread', 'Impact: documented'],
        trend: 'worsening',
        confidence: 81,
        lastUpdated: '11m ago',
      },
    ],
    'loc-atl': [
      {
        id: 'prob-atl-runoff',
        name: 'Urban Runoff',
        category: 'runoff',
        severity: 'elevated',
        description: 'Polluted stormwater entering Chattahoochee River.',
        causes: ['Street runoff', 'Industrial areas'],
        indicators: ['Heavy metals: detected', 'Volume: high'],
        trend: 'worsening',
        confidence: 86,
        lastUpdated: '4m ago',
      },
      {
        id: 'prob-atl-sewage',
        name: 'Sewage Overflow',
        category: 'contamination',
        severity: 'moderate',
        description: 'Sewage overflow during heavy rain.',
        causes: ['Aging infrastructure', 'Heavy rain'],
        indicators: ['Overflow: 15/year', 'Bacteria: elevated'],
        trend: 'stable',
        confidence: 84,
        lastUpdated: '7m ago',
      },
      {
        id: 'prob-atl-water',
        name: 'Water Quality',
        category: 'contamination',
        severity: 'moderate',
        description: 'Periodic water quality issues in river.',
        causes: ['Sewage', 'Runoff'],
        indicators: ['E. coli: elevated', 'Advisories: periodic'],
        trend: 'stable',
        confidence: 83,
        lastUpdated: '9m ago',
      },
      {
        id: 'prob-atl-habitat',
        name: 'Habitat Degradation',
        category: 'other',
        severity: 'moderate',
        description: 'River habitat loss affecting wildlife.',
        causes: ['Development', 'Channelization'],
        indicators: ['Habitat: -25%', 'Species: declining'],
        trend: 'worsening',
        confidence: 85,
        lastUpdated: '6m ago',
      },
      {
        id: 'prob-atl-algal',
        name: 'Algal Blooms',
        category: 'pollution',
        severity: 'moderate',
        description: 'Nutrient-driven algal blooms in reservoirs.',
        causes: ['Nutrient loading', 'Warm water'],
        indicators: ['Chlorophyll-a: 28 µg/L', 'Frequency: increasing'],
        trend: 'worsening',
        confidence: 82,
        lastUpdated: '10m ago',
      },
      {
        id: 'prob-atl-invasive',
        name: 'Invasive Species',
        category: 'invasive',
        severity: 'low',
        description: 'Non-native species in river ecosystem.',
        causes: ['Ballast water', 'Aquarium releases'],
        indicators: ['Asian carp: detected', 'Impact: moderate'],
        trend: 'worsening',
        confidence: 79,
        lastUpdated: '13m ago',
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

  // Create multiple constellations (clusters) with root nodes
  // Each constellation has dense internal connections and sparse cross-constellation links
  const createConstellations = (locationId: string, problemIds: string[]): ProblemLink[] => {
    const constellationLinks: ProblemLink[] = [];
    
    // Define constellations for each location (group problems into 2-4 clusters)
    const constellationConfigs: Record<string, string[][]> = {
      'loc-sf': [
        ['prob-sf-sewage', 'prob-sf-contamination', 'prob-sf-algal', 'prob-sf-sediment'], // Water quality cluster
        ['prob-sf-microplastics', 'prob-sf-oil', 'prob-sf-noise', 'prob-sf-habitat'], // Marine ecosystem cluster
      ],
      'loc-la': [
        ['prob-la-smog', 'prob-la-ozone', 'prob-la-heat', 'prob-la-air'], // Air quality cluster
        ['prob-la-runoff', 'prob-la-oil', 'prob-la-beach', 'prob-la-drought'], // Water/coastal cluster
        ['prob-la-wildlife', 'prob-la-noise'], // Wildlife cluster
      ],
      'loc-gulf': [
        ['prob-gulf-refinery', 'prob-gulf-nutrients', 'prob-gulf-algal', 'prob-gulf-fishkill'], // Industrial pollution cluster
        ['prob-gulf-oil', 'prob-gulf-sediment', 'prob-gulf-erosion', 'prob-gulf-habitat'], // Coastal degradation cluster
        ['prob-gulf-plastic', 'prob-gulf-invasive'], // Marine debris cluster
      ],
      'loc-ever': [
        ['prob-ever-drought', 'prob-ever-water', 'prob-ever-salt', 'prob-ever-habitat'], // Water flow cluster
        ['prob-ever-nutrients', 'prob-ever-bleaching', 'prob-ever-mercury'], // Water quality cluster
        ['prob-ever-invasive'], // Invasive species cluster (standalone but connected)
      ],
      'loc-pnw': [
        ['prob-pnw-logging', 'prob-pnw-smoke', 'prob-pnw-wildfire'], // Forest cluster
        ['prob-pnw-salmon', 'prob-pnw-habitat', 'prob-pnw-acid', 'prob-pnw-runoff'], // Marine/fisheries cluster
        ['prob-pnw-invasive', 'prob-pnw-algal'], // Ecosystem disruption cluster
      ],
      'loc-ny': [
        ['prob-ny-sewage', 'prob-ny-runoff', 'prob-ny-water', 'prob-ny-beach'], // Water quality cluster
        ['prob-ny-sediment', 'prob-ny-habitat', 'prob-ny-plastic', 'prob-ny-invasive'], // Harbor ecosystem cluster
        ['prob-ny-noise', 'prob-ny-air'], // Urban impacts cluster
      ],
      'loc-chi': [
        ['prob-chi-sewage', 'prob-chi-runoff', 'prob-chi-water'], // Water quality cluster
        ['prob-chi-algal', 'prob-chi-sediment', 'prob-chi-habitat'], // Lake ecosystem cluster
      ],
      'loc-den': [
        ['prob-den-drought', 'prob-den-wildfire', 'prob-den-water'], // Climate cluster
        ['prob-den-air', 'prob-den-runoff', 'prob-den-habitat', 'prob-den-noise'], // Urban impacts cluster
      ],
      'loc-phx': [
        ['prob-phx-drought', 'prob-phx-water', 'prob-phx-heat', 'prob-phx-dust'], // Climate cluster
        ['prob-phx-air', 'prob-phx-habitat', 'prob-phx-invasive', 'prob-phx-runoff'], // Urban ecosystem cluster
      ],
      'loc-atl': [
        ['prob-atl-runoff', 'prob-atl-sewage', 'prob-atl-water', 'prob-atl-algal'], // Water quality cluster
        ['prob-atl-habitat', 'prob-atl-invasive'], // Ecosystem cluster
      ],
    };

    const constellations = constellationConfigs[locationId] || [];
    
    // For each constellation, create dense internal connections
    constellations.forEach((constellation, clusterIdx) => {
      if (constellation.length < 2) return;
      
      // Find the root node (most critical or first problem)
      const rootNode = constellation[0];
      
      // Connect root to all other nodes in constellation
      for (let i = 1; i < constellation.length; i++) {
        constellationLinks.push({
          source: rootNode,
          target: constellation[i],
          label: 'connects to',
          type: 'causes',
          strength: 0.6 + (Math.random() * 0.2),
        });
      }
      
      // Create additional connections within constellation (mesh network)
      for (let i = 1; i < constellation.length; i++) {
        for (let j = i + 1; j < constellation.length; j++) {
          // 60% chance of connection between non-root nodes
          if (Math.random() < 0.6) {
            constellationLinks.push({
              source: constellation[i],
              target: constellation[j],
              label: 'relates to',
              type: Math.random() < 0.5 ? 'amplifies' : 'correlates',
              strength: 0.4 + (Math.random() * 0.3),
            });
          }
        }
      }
    });
    
    // Create sparse cross-constellation links (1-2 per pair of constellations)
    for (let i = 0; i < constellations.length; i++) {
      for (let j = i + 1; j < constellations.length; j++) {
        const cluster1 = constellations[i];
        const cluster2 = constellations[j];
        
        // 1-2 cross-constellation links
        const numCrossLinks = Math.min(2, Math.max(1, Math.floor(Math.random() * 2) + 1));
        for (let k = 0; k < numCrossLinks; k++) {
          const node1 = cluster1[Math.floor(Math.random() * cluster1.length)];
          const node2 = cluster2[Math.floor(Math.random() * cluster2.length)];
          constellationLinks.push({
            source: node1,
            target: node2,
            label: 'influences',
            type: 'correlates',
            strength: 0.3 + (Math.random() * 0.2),
          });
        }
      }
    }
    
    return constellationLinks;
  };

  // Create intricate causal links between problems (legacy - keeping for reference but using constellations)
  const linkConfigs: Record<string, Array<{ source: string; target: string; label: string; type: ProblemLink['type']; strength: number }>> = {
    'loc-sf': [
      { source: 'prob-sf-contamination', target: 'prob-sf-algal', label: 'contributes to', type: 'causes', strength: 0.7 },
      { source: 'prob-sf-sewage', target: 'prob-sf-contamination', label: 'causes', type: 'causes', strength: 0.8 },
      { source: 'prob-sf-sewage', target: 'prob-sf-algal', label: 'contributes to', type: 'causes', strength: 0.6 },
      { source: 'prob-sf-contamination', target: 'prob-sf-sediment', label: 'leads to', type: 'causes', strength: 0.7 },
      { source: 'prob-sf-sediment', target: 'prob-sf-habitat', label: 'degrades', type: 'causes', strength: 0.6 },
      { source: 'prob-sf-algal', target: 'prob-sf-habitat', label: 'affects', type: 'amplifies', strength: 0.5 },
      { source: 'prob-sf-microplastics', target: 'prob-sf-habitat', label: 'impacts', type: 'amplifies', strength: 0.5 },
      { source: 'prob-sf-noise', target: 'prob-sf-habitat', label: 'disturbs', type: 'amplifies', strength: 0.4 },
      { source: 'prob-sf-oil', target: 'prob-sf-contamination', label: 'adds to', type: 'correlates', strength: 0.5 },
    ],
    'loc-la': [
      { source: 'prob-la-smog', target: 'prob-la-ozone', label: 'contributes to', type: 'causes', strength: 0.7 },
      { source: 'prob-la-runoff', target: 'prob-la-oil', label: 'carries', type: 'causes', strength: 0.6 },
      { source: 'prob-la-runoff', target: 'prob-la-beach', label: 'contaminates', type: 'causes', strength: 0.8 },
      { source: 'prob-la-drought', target: 'prob-la-heat', label: 'exacerbates', type: 'amplifies', strength: 0.7 },
      { source: 'prob-la-heat', target: 'prob-la-ozone', label: 'increases', type: 'amplifies', strength: 0.6 },
      { source: 'prob-la-oil', target: 'prob-la-beach', label: 'affects', type: 'causes', strength: 0.7 },
      { source: 'prob-la-ozone', target: 'prob-la-wildlife', label: 'impacts', type: 'amplifies', strength: 0.5 },
      { source: 'prob-la-heat', target: 'prob-la-wildlife', label: 'stresses', type: 'amplifies', strength: 0.6 },
      { source: 'prob-la-noise', target: 'prob-la-wildlife', label: 'disturbs', type: 'amplifies', strength: 0.4 },
      { source: 'prob-la-smog', target: 'prob-la-air', label: 'correlates with', type: 'correlates', strength: 0.5 },
    ],
    'loc-gulf': [
      { source: 'prob-gulf-refinery', target: 'prob-gulf-fishkill', label: 'causes', type: 'causes', strength: 0.8 },
      { source: 'prob-gulf-refinery', target: 'prob-gulf-algal', label: 'contributes to', type: 'causes', strength: 0.7 },
      { source: 'prob-gulf-refinery', target: 'prob-gulf-erosion', label: 'contributes to', type: 'causes', strength: 0.6 },
      { source: 'prob-gulf-nutrients', target: 'prob-gulf-algal', label: 'causes', type: 'causes', strength: 0.9 },
      { source: 'prob-gulf-nutrients', target: 'prob-gulf-fishkill', label: 'contributes to', type: 'causes', strength: 0.7 },
      { source: 'prob-gulf-algal', target: 'prob-gulf-fishkill', label: 'causes', type: 'causes', strength: 0.8 },
      { source: 'prob-gulf-fishkill', target: 'prob-gulf-erosion', label: 'amplifies', type: 'amplifies', strength: 0.5 },
      { source: 'prob-gulf-oil', target: 'prob-gulf-sediment', label: 'contaminates', type: 'causes', strength: 0.7 },
      { source: 'prob-gulf-sediment', target: 'prob-gulf-habitat', label: 'degrades', type: 'causes', strength: 0.6 },
      { source: 'prob-gulf-erosion', target: 'prob-gulf-habitat', label: 'destroys', type: 'causes', strength: 0.8 },
      { source: 'prob-gulf-plastic', target: 'prob-gulf-habitat', label: 'impacts', type: 'amplifies', strength: 0.4 },
      { source: 'prob-gulf-invasive', target: 'prob-gulf-habitat', label: 'disrupts', type: 'amplifies', strength: 0.5 },
      { source: 'prob-gulf-nutrients', target: 'prob-gulf-sediment', label: 'enriches', type: 'correlates', strength: 0.5 },
    ],
    'loc-ever': [
      { source: 'prob-ever-drought', target: 'prob-ever-invasive', label: 'amplifies', type: 'amplifies', strength: 0.6 },
      { source: 'prob-ever-drought', target: 'prob-ever-bleaching', label: 'contributes to', type: 'causes', strength: 0.5 },
      { source: 'prob-ever-drought', target: 'prob-ever-water', label: 'causes', type: 'causes', strength: 0.8 },
      { source: 'prob-ever-nutrients', target: 'prob-ever-bleaching', label: 'contributes to', type: 'amplifies', strength: 0.6 },
      { source: 'prob-ever-nutrients', target: 'prob-ever-mercury', label: 'affects', type: 'correlates', strength: 0.4 },
      { source: 'prob-ever-bleaching', target: 'prob-ever-invasive', label: 'enables', type: 'amplifies', strength: 0.4 },
      { source: 'prob-ever-water', target: 'prob-ever-habitat', label: 'disrupts', type: 'causes', strength: 0.7 },
      { source: 'prob-ever-water', target: 'prob-ever-salt', label: 'allows', type: 'causes', strength: 0.6 },
      { source: 'prob-ever-salt', target: 'prob-ever-habitat', label: 'degrades', type: 'causes', strength: 0.7 },
      { source: 'prob-ever-invasive', target: 'prob-ever-habitat', label: 'disrupts', type: 'amplifies', strength: 0.6 },
      { source: 'prob-ever-mercury', target: 'prob-ever-habitat', label: 'contaminates', type: 'amplifies', strength: 0.5 },
    ],
    'loc-pnw': [
      { source: 'prob-pnw-logging', target: 'prob-pnw-smoke', label: 'correlates with', type: 'correlates', strength: 0.4 },
      { source: 'prob-pnw-logging', target: 'prob-pnw-salmon', label: 'affects', type: 'causes', strength: 0.7 },
      { source: 'prob-pnw-logging', target: 'prob-pnw-habitat', label: 'destroys', type: 'causes', strength: 0.8 },
      { source: 'prob-pnw-runoff', target: 'prob-pnw-salmon', label: 'contaminates', type: 'causes', strength: 0.6 },
      { source: 'prob-pnw-runoff', target: 'prob-pnw-acid', label: 'contributes to', type: 'amplifies', strength: 0.5 },
      { source: 'prob-pnw-acid', target: 'prob-pnw-salmon', label: 'affects', type: 'amplifies', strength: 0.6 },
      { source: 'prob-pnw-habitat', target: 'prob-pnw-salmon', label: 'reduces', type: 'causes', strength: 0.8 },
      { source: 'prob-pnw-invasive', target: 'prob-pnw-habitat', label: 'disrupts', type: 'amplifies', strength: 0.5 },
      { source: 'prob-pnw-algal', target: 'prob-pnw-habitat', label: 'degrades', type: 'amplifies', strength: 0.4 },
    ],
    'loc-ny': [
      { source: 'prob-ny-sewage', target: 'prob-ny-water', label: 'contaminates', type: 'causes', strength: 0.9 },
      { source: 'prob-ny-sewage', target: 'prob-ny-beach', label: 'closes', type: 'causes', strength: 0.8 },
      { source: 'prob-ny-runoff', target: 'prob-ny-sediment', label: 'contributes to', type: 'causes', strength: 0.7 },
      { source: 'prob-ny-runoff', target: 'prob-ny-water', label: 'contaminates', type: 'causes', strength: 0.7 },
      { source: 'prob-ny-sediment', target: 'prob-ny-habitat', label: 'degrades', type: 'causes', strength: 0.8 },
      { source: 'prob-ny-water', target: 'prob-ny-habitat', label: 'affects', type: 'amplifies', strength: 0.6 },
      { source: 'prob-ny-noise', target: 'prob-ny-habitat', label: 'disturbs', type: 'amplifies', strength: 0.5 },
      { source: 'prob-ny-plastic', target: 'prob-ny-habitat', label: 'impacts', type: 'amplifies', strength: 0.4 },
      { source: 'prob-ny-invasive', target: 'prob-ny-habitat', label: 'disrupts', type: 'amplifies', strength: 0.5 },
      { source: 'prob-ny-air', target: 'prob-ny-water', label: 'deposits to', type: 'correlates', strength: 0.4 },
    ],
    'loc-chi': [
      { source: 'prob-chi-sewage', target: 'prob-chi-water', label: 'contaminates', type: 'causes', strength: 0.8 },
      { source: 'prob-chi-runoff', target: 'prob-chi-algal', label: 'causes', type: 'causes', strength: 0.7 },
      { source: 'prob-chi-runoff', target: 'prob-chi-sediment', label: 'contributes to', type: 'causes', strength: 0.6 },
      { source: 'prob-chi-sediment', target: 'prob-chi-habitat', label: 'degrades', type: 'causes', strength: 0.7 },
      { source: 'prob-chi-algal', target: 'prob-chi-water', label: 'affects', type: 'amplifies', strength: 0.6 },
      { source: 'prob-chi-water', target: 'prob-chi-habitat', label: 'impacts', type: 'amplifies', strength: 0.5 },
    ],
    'loc-den': [
      { source: 'prob-den-air', target: 'prob-den-water', label: 'deposits to', type: 'correlates', strength: 0.4 },
      { source: 'prob-den-drought', target: 'prob-den-wildfire', label: 'increases', type: 'causes', strength: 0.8 },
      { source: 'prob-den-drought', target: 'prob-den-water', label: 'reduces', type: 'causes', strength: 0.7 },
      { source: 'prob-den-wildfire', target: 'prob-den-air', label: 'worsens', type: 'amplifies', strength: 0.7 },
      { source: 'prob-den-wildfire', target: 'prob-den-habitat', label: 'destroys', type: 'causes', strength: 0.8 },
      { source: 'prob-den-runoff', target: 'prob-den-water', label: 'contaminates', type: 'causes', strength: 0.6 },
      { source: 'prob-den-habitat', target: 'prob-den-water', label: 'affects', type: 'correlates', strength: 0.4 },
    ],
    'loc-phx': [
      { source: 'prob-phx-drought', target: 'prob-phx-water', label: 'causes', type: 'causes', strength: 0.9 },
      { source: 'prob-phx-drought', target: 'prob-phx-heat', label: 'exacerbates', type: 'amplifies', strength: 0.7 },
      { source: 'prob-phx-heat', target: 'prob-phx-air', label: 'increases', type: 'amplifies', strength: 0.7 },
      { source: 'prob-phx-heat', target: 'prob-phx-dust', label: 'contributes to', type: 'causes', strength: 0.6 },
      { source: 'prob-phx-dust', target: 'prob-phx-air', label: 'worsens', type: 'amplifies', strength: 0.8 },
      { source: 'prob-phx-water', target: 'prob-phx-habitat', label: 'reduces', type: 'causes', strength: 0.7 },
      { source: 'prob-phx-habitat', target: 'prob-phx-invasive', label: 'enables', type: 'amplifies', strength: 0.5 },
      { source: 'prob-phx-runoff', target: 'prob-phx-water', label: 'contaminates', type: 'causes', strength: 0.5 },
    ],
    'loc-atl': [
      { source: 'prob-atl-runoff', target: 'prob-atl-algal', label: 'causes', type: 'causes', strength: 0.7 },
      { source: 'prob-atl-runoff', target: 'prob-atl-water', label: 'contaminates', type: 'causes', strength: 0.7 },
      { source: 'prob-atl-sewage', target: 'prob-atl-water', label: 'contaminates', type: 'causes', strength: 0.8 },
      { source: 'prob-atl-algal', target: 'prob-atl-water', label: 'affects', type: 'amplifies', strength: 0.6 },
      { source: 'prob-atl-water', target: 'prob-atl-habitat', label: 'impacts', type: 'amplifies', strength: 0.6 },
      { source: 'prob-atl-habitat', target: 'prob-atl-invasive', label: 'enables', type: 'amplifies', strength: 0.4 },
    ],
  };

  // Use constellation-based linking for multiple root nodes
  const problemIds = problems.map(p => p.id);
  const constellationLinks = createConstellations(locationId, problemIds);
  links.push(...constellationLinks);

  // Also add some specific high-strength links from original config for key relationships
  const config = linkConfigs[locationId] || [];
  // Only add top 3-5 strongest links from original config to maintain some key relationships
  const topLinks = config
    .sort((a, b) => b.strength - a.strength)
    .slice(0, Math.min(5, config.length));
  
  topLinks.forEach((cfg) => {
    // Only add if not already in constellation links
    const exists = constellationLinks.some(
      l => (l.source === cfg.source && l.target === cfg.target) ||
           (l.source === cfg.target && l.target === cfg.source)
    );
    if (!exists) {
      links.push({
        source: cfg.source,
        target: cfg.target,
        label: cfg.label,
        type: cfg.type,
        strength: cfg.strength,
      });
    }
  });

  return { locationId, problems, links };
}
