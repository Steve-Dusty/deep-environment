// ============================================================================
// Location-Specific Knowledge Graph Data
// Each location has its own problem graph with hierarchical tree structures
// ============================================================================

import { ThreatLevel, THREAT_COLORS } from '@/data/locations';

export interface ProblemNode {
  id: string;
  name: string;
  category: 'pollution' | 'deforestation' | 'runoff' | 'wildfire' | 'litter' | 'erosion' | 'invasive' | 'drought' | 'contamination' | 'other';
  severity: ThreatLevel;
  description: string;
  causes?: string[];
  indicators?: string[];
  trend: 'improving' | 'stable' | 'worsening';
  confidence: number;
  lastUpdated: string;
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
  /** Pin IDs from pinReports that belong to this location (for images) */
  pinIds: string[];
}

export const PROBLEM_CATEGORY_COLORS: Record<ProblemNode['category'], string> = {
  pollution: '#ff4d6a',
  deforestation: '#ffaa00',
  runoff: '#06b6d4',
  wildfire: '#ffaa00',
  litter: 'rgba(255,255,255,0.55)',
  erosion: '#a78bfa',
  invasive: '#00e68a',
  drought: '#3b82f6',
  contamination: '#ff4d6a',
  other: 'rgba(255,255,255,0.4)',
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

// ── Location Summaries ──────────────────────────────────────────────────────

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
    pinIds: ['pin-1', 'pin-2'],
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
    pinIds: ['pin-3', 'pin-4'],
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
    pinIds: ['pin-5', 'pin-6', 'pin-15'],
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
    pinIds: ['pin-7', 'pin-8'],
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
    pinIds: ['pin-11', 'pin-16'],
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
    pinIds: ['pin-13', 'pin-18'],
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
    pinIds: ['pin-14'],
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
    pinIds: ['pin-12'],
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
    pinIds: [],
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
    pinIds: ['pin-17'],
  },
];

// ── Problem templates per location ──────────────────────────────────────────

const PROBLEM_DATA: Record<string, Omit<ProblemNode, 'id'>[]> = {
  'loc-sf': [
    { name: 'Algal Bloom', category: 'pollution', severity: 'elevated', description: 'Dense algal bloom in Mission Creek canal. Water discoloration consistent with harmful cyanobacteria.', causes: ['Nutrient loading from storm runoff', 'Warming water temperatures'], indicators: ['Chlorophyll-a: 45 µg/L', 'Water temp +3.2°C above baseline'], trend: 'worsening', confidence: 87, lastUpdated: '2m ago' },
    { name: 'Storm Drain Contamination', category: 'contamination', severity: 'high', description: 'Industrial runoff from storm drain outfall at Ocean Beach.', causes: ['Construction site discharge', 'Urban runoff'], indicators: ['Heavy metals detected', 'pH: 5.2'], trend: 'stable', confidence: 92, lastUpdated: '8m ago' },
    { name: 'Microplastic Accumulation', category: 'pollution', severity: 'elevated', description: 'High microplastic concentrations in Bay waters, affecting marine life.', causes: ['Urban wastewater discharge', 'Plastic waste breakdown'], indicators: ['Microplastics: 12 particles/L', 'Bioaccumulation detected'], trend: 'worsening', confidence: 89, lastUpdated: '5m ago' },
    { name: 'Sewage Overflow', category: 'contamination', severity: 'critical', description: 'Combined sewer overflow during heavy rain events.', causes: ['Aging infrastructure', 'Heavy precipitation'], indicators: ['E. coli: 640 MPN', 'Overflow events: 3/month'], trend: 'worsening', confidence: 94, lastUpdated: '1m ago' },
    { name: 'Sediment Contamination', category: 'contamination', severity: 'moderate', description: 'Heavy metals in bay sediments affecting benthic organisms.', causes: ['Historical industrial discharge', 'Ongoing urban runoff'], indicators: ['Lead: 450 ppm', 'Mercury: 2.3 ppm'], trend: 'stable', confidence: 88, lastUpdated: '10m ago' },
    { name: 'Marine Noise Pollution', category: 'pollution', severity: 'moderate', description: 'High underwater noise levels from shipping affecting marine mammals.', causes: ['Port traffic', 'Construction activities'], indicators: ['Noise: 120 dB', 'Whale sightings: -40%'], trend: 'worsening', confidence: 82, lastUpdated: '7m ago' },
    { name: 'Wetland Habitat Loss', category: 'other', severity: 'elevated', description: 'Coastal wetland degradation reducing biodiversity.', causes: ['Urban development', 'Sea level rise'], indicators: ['Wetland area: -15%', 'Species diversity: -22%'], trend: 'worsening', confidence: 85, lastUpdated: '14m ago' },
    { name: 'Oil Sheen Detection', category: 'contamination', severity: 'moderate', description: 'Intermittent oil sheens detected near shipping lanes.', causes: ['Bilge discharge', 'Fuel leaks'], indicators: ['Sheen frequency: 2/week', 'Coverage: 50m² avg'], trend: 'stable', confidence: 79, lastUpdated: '9m ago' },
  ],
  'loc-la': [
    { name: 'Wildfire Smoke Plume', category: 'wildfire', severity: 'critical', description: 'Heavy smoke plume reducing visibility. AQI in hazardous range.', causes: ['Wildfire in Angeles National Forest', 'Temperature inversion'], indicators: ['PM2.5: 285 µg/m³', 'Visibility: 0.8 miles'], trend: 'worsening', confidence: 95, lastUpdated: '4m ago' },
    { name: 'Oil Sheen', category: 'contamination', severity: 'high', description: 'Iridescent oil film covering harbor surface near container terminal.', causes: ['Bilge discharge', 'Fuel transfer spill'], indicators: ['Film thickness: 1-5 µm', 'Coverage: 400m²'], trend: 'worsening', confidence: 89, lastUpdated: '11m ago' },
    { name: 'Ozone Exceedance', category: 'pollution', severity: 'high', description: 'Ground-level ozone exceeding federal standards across basin.', causes: ['Vehicle emissions', 'Sunlight + NOx'], indicators: ['O3: 0.095 ppm', 'Exceedance days: 45/year'], trend: 'worsening', confidence: 93, lastUpdated: '3m ago' },
    { name: 'Urban Runoff Contamination', category: 'runoff', severity: 'elevated', description: 'Heavy metals and chemicals in stormwater reaching ocean.', causes: ['Street runoff', 'Industrial areas'], indicators: ['Zinc: 2.1 mg/L', 'Copper: 0.8 mg/L'], trend: 'worsening', confidence: 87, lastUpdated: '6m ago' },
    { name: 'Beach Water Quality', category: 'contamination', severity: 'moderate', description: 'Bacterial contamination closing beaches periodically.', causes: ['Sewage overflow', 'Stormwater discharge'], indicators: ['E. coli: 235 MPN', 'Beach closures: 8/year'], trend: 'stable', confidence: 84, lastUpdated: '13m ago' },
    { name: 'Water Scarcity', category: 'drought', severity: 'high', description: 'Severe drought conditions affecting water supply and ecosystems.', causes: ['Reduced precipitation', 'High demand'], indicators: ['Reservoir levels: 35%', 'Precipitation: -40%'], trend: 'worsening', confidence: 91, lastUpdated: '2m ago' },
    { name: 'Urban Heat Island', category: 'other', severity: 'elevated', description: 'Elevated temperatures in urban areas affecting air quality and health.', causes: ['Paved surfaces', 'Lack of vegetation'], indicators: ['Temp difference: +5°C', 'Energy demand: +15%'], trend: 'worsening', confidence: 88, lastUpdated: '7m ago' },
    { name: 'Wildlife Habitat Fragmentation', category: 'other', severity: 'moderate', description: 'Urban development fragmenting wildlife corridors.', causes: ['Urban sprawl', 'Infrastructure development'], indicators: ['Habitat connectivity: -30%', 'Species isolation'], trend: 'worsening', confidence: 83, lastUpdated: '16m ago' },
    { name: 'Noise Pollution', category: 'pollution', severity: 'moderate', description: 'High noise levels affecting human and wildlife health.', causes: ['Traffic', 'Aircraft', 'Construction'], indicators: ['Avg noise: 65 dB', 'Health impacts: documented'], trend: 'stable', confidence: 81, lastUpdated: '19m ago' },
  ],
  'loc-gulf': [
    { name: 'Refinery Flare Event', category: 'pollution', severity: 'critical', description: 'Abnormally large flare with black smoke. SO₂ odor detectable at 2-mile radius.', causes: ['Equipment malfunction', 'Incomplete combustion'], indicators: ['SO₂: 142 ppb', 'PM10: 195 µg/m³'], trend: 'worsening', confidence: 94, lastUpdated: '1m ago' },
    { name: 'Mass Fish Kill', category: 'pollution', severity: 'critical', description: '~5,000 dead fish along Galveston Bay. Dissolved oxygen at lethal levels.', causes: ['Hypoxia from nutrient loading', 'Elevated water temperature'], indicators: ['DO: 1.2 mg/L', 'Water temp: 34°C'], trend: 'worsening', confidence: 91, lastUpdated: '14m ago' },
    { name: 'Coastal Erosion', category: 'erosion', severity: 'critical', description: '18m of shoreline retreat in 6 months. Barrier island near breakthrough.', causes: ['Sea level rise', 'Reduced sediment supply'], indicators: ['Land loss: 3m/month', 'Island width: <100m'], trend: 'worsening', confidence: 92, lastUpdated: '7m ago' },
    { name: 'Harmful Algal Bloom', category: 'pollution', severity: 'high', description: 'Red tide affecting 50-mile stretch of coastline.', causes: ['Nutrient loading', 'Warm water'], indicators: ['Karenia brevis: 1M cells/L', 'Fish kills: ongoing'], trend: 'worsening', confidence: 89, lastUpdated: '3m ago' },
    { name: 'Chronic Oil Contamination', category: 'contamination', severity: 'high', description: 'Persistent oil contamination from multiple sources.', causes: ['Offshore drilling', 'Shipping accidents'], indicators: ['Oil sheens: frequent', 'Beach tar: 15% coverage'], trend: 'stable', confidence: 87, lastUpdated: '5m ago' },
    { name: 'Sediment Toxicity', category: 'contamination', severity: 'elevated', description: 'Toxic chemicals in sediments affecting bottom-dwelling organisms.', causes: ['Historical contamination', 'Ongoing discharge'], indicators: ['PAHs: 450 ppm', 'Benthic diversity: -60%'], trend: 'stable', confidence: 85, lastUpdated: '11m ago' },
    { name: 'Marsh Habitat Degradation', category: 'other', severity: 'elevated', description: 'Coastal marsh loss affecting storm protection and wildlife.', causes: ['Erosion', 'Subsidence', 'Development'], indicators: ['Marsh loss: 2% annually', 'Storm surge risk: +25%'], trend: 'worsening', confidence: 88, lastUpdated: '8m ago' },
    { name: 'Nutrient Overload', category: 'pollution', severity: 'high', description: 'Excessive nitrogen and phosphorus causing eutrophication.', causes: ['Agricultural runoff', 'Wastewater discharge'], indicators: ['Nitrogen: 2.5 mg/L', 'Phosphorus: 0.4 mg/L'], trend: 'worsening', confidence: 90, lastUpdated: '4m ago' },
    { name: 'Invasive Species', category: 'invasive', severity: 'moderate', description: 'Invasive aquatic species disrupting native ecosystems.', causes: ['Ballast water', 'Aquaculture escapes'], indicators: ['Lionfish: established', 'Zebra mussels: spreading'], trend: 'worsening', confidence: 83, lastUpdated: '12m ago' },
    { name: 'Marine Plastic Debris', category: 'litter', severity: 'elevated', description: 'High concentrations of plastic debris in Gulf waters.', causes: ['Land-based sources', 'Fishing gear'], indicators: ['Plastic density: 5 items/km²', 'Wildlife entanglement'], trend: 'worsening', confidence: 86, lastUpdated: '9m ago' },
  ],
  'loc-ever': [
    { name: 'Invasive Python Nest', category: 'invasive', severity: 'critical', description: 'Burmese python nest with 47 eggs in critical wading bird nesting area.', causes: ['Established invasive population', 'Favorable habitat'], indicators: ['Nest: 47 eggs', 'Proximity: 200m from bird colony'], trend: 'worsening', confidence: 98, lastUpdated: '3m ago' },
    { name: 'Coral Bleaching', category: 'pollution', severity: 'critical', description: 'Widespread coral bleaching across 2-acre patch reef. 80% of colonies affected.', causes: ['Elevated sea temperature', 'Thermal stress'], indicators: ['Reef temp: 31.8°C', 'Bleaching: 80%'], trend: 'worsening', confidence: 96, lastUpdated: '9m ago' },
    { name: 'Drought Stress', category: 'drought', severity: 'high', description: 'Below-average rainfall affecting freshwater flow to Everglades.', causes: ['Reduced precipitation', 'Water diversion'], indicators: ['Rainfall: 60% of normal', 'Water levels: -2.3ft'], trend: 'worsening', confidence: 85, lastUpdated: '12m ago' },
    { name: 'Nutrient Pollution', category: 'pollution', severity: 'high', description: 'Excessive nutrients from agricultural runoff causing algal blooms.', causes: ['Sugar cane farming', 'Urban runoff'], indicators: ['Phosphorus: 0.15 mg/L', 'Algal blooms: frequent'], trend: 'worsening', confidence: 92, lastUpdated: '4m ago' },
    { name: 'Mercury Contamination', category: 'contamination', severity: 'elevated', description: 'Mercury in fish exceeding safe consumption levels.', causes: ['Atmospheric deposition', 'Wetland methylation'], indicators: ['Fish mercury: 1.2 ppm', 'Advisories: active'], trend: 'stable', confidence: 88, lastUpdated: '7m ago' },
    { name: 'Habitat Fragmentation', category: 'other', severity: 'elevated', description: 'Development and roads fragmenting wildlife habitat.', causes: ['Urban expansion', 'Infrastructure'], indicators: ['Habitat loss: 5% annually', 'Road mortality: high'], trend: 'worsening', confidence: 87, lastUpdated: '10m ago' },
    { name: 'Water Flow Disruption', category: 'other', severity: 'high', description: 'Altered water flow patterns affecting ecosystem health.', causes: ['Drainage canals', 'Water management'], indicators: ['Flow: -40%', 'Wetland drying'], trend: 'worsening', confidence: 90, lastUpdated: '5m ago' },
    { name: 'Saltwater Intrusion', category: 'contamination', severity: 'moderate', description: 'Saltwater moving into freshwater areas due to sea level rise.', causes: ['Sea level rise', 'Reduced freshwater flow'], indicators: ['Salinity: +15%', 'Freshwater species: declining'], trend: 'worsening', confidence: 84, lastUpdated: '13m ago' },
  ],
  'loc-pnw': [
    { name: 'Old-Growth Logging', category: 'deforestation', severity: 'moderate', description: 'Fresh clear-cut 150m from designated old-growth preserve.', causes: ['Buffer zone violation', 'Commercial logging'], indicators: ['Area cleared: 8 acres', 'Tree age: 150-300 years'], trend: 'stable', confidence: 90, lastUpdated: '31m ago' },
    { name: 'Transboundary Smoke', category: 'wildfire', severity: 'elevated', description: 'BC wildfire smoke creating persistent haze. AQI fluctuating Unhealthy to Very Unhealthy.', causes: ['BC wildfires', 'Temperature inversion'], indicators: ['PM2.5: 124 µg/m³', 'Duration: 36 hours'], trend: 'stable', confidence: 87, lastUpdated: '19m ago' },
    { name: 'Salmon Population Decline', category: 'other', severity: 'high', description: 'Declining salmon populations affecting ecosystem and fisheries.', causes: ['Habitat loss', 'Water temperature', 'Dams'], indicators: ['Returns: -35%', 'Spawning success: -20%'], trend: 'worsening', confidence: 91, lastUpdated: '6m ago' },
    { name: 'Ocean Acidification', category: 'pollution', severity: 'elevated', description: 'Increasing ocean acidity affecting shellfish and marine life.', causes: ['CO2 absorption', 'Upwelling'], indicators: ['pH: 7.8', 'Shellfish: declining'], trend: 'worsening', confidence: 89, lastUpdated: '8m ago' },
    { name: 'Urban Runoff', category: 'runoff', severity: 'moderate', description: 'Polluted runoff from cities affecting Puget Sound.', causes: ['Stormwater', 'Industrial discharge'], indicators: ['Toxics: detected', 'Water quality: degraded'], trend: 'stable', confidence: 85, lastUpdated: '14m ago' },
    { name: 'Invasive Species', category: 'invasive', severity: 'moderate', description: 'Non-native species disrupting native ecosystems.', causes: ['Ballast water', 'Aquaculture'], indicators: ['European green crab: established', 'Impact: documented'], trend: 'worsening', confidence: 83, lastUpdated: '11m ago' },
    { name: 'Estuary Habitat Loss', category: 'other', severity: 'elevated', description: 'Loss of critical estuary habitat for juvenile fish.', causes: ['Development', 'Shoreline modification'], indicators: ['Habitat: -25%', 'Fish abundance: -30%'], trend: 'worsening', confidence: 87, lastUpdated: '9m ago' },
  ],
  'loc-ny': [
    { name: 'Combined Sewer Overflow', category: 'contamination', severity: 'high', description: 'Frequent CSO events during rain contaminating waterways.', causes: ['Aging infrastructure', 'Heavy rain'], indicators: ['Overflow events: 50/year', 'Bacteria: high'], trend: 'stable', confidence: 92, lastUpdated: '2m ago' },
    { name: 'Harbor Sediment Contamination', category: 'contamination', severity: 'high', description: 'Legacy contaminants in harbor sediments.', causes: ['Historical industry', 'Ongoing discharge'], indicators: ['PCBs: 450 ppm', 'Dioxins: detected'], trend: 'stable', confidence: 88, lastUpdated: '5m ago' },
    { name: 'Urban Runoff', category: 'runoff', severity: 'elevated', description: 'Polluted stormwater entering harbor.', causes: ['Street runoff', 'Industrial areas'], indicators: ['Heavy metals: high', 'Volume: 1B gallons/year'], trend: 'worsening', confidence: 86, lastUpdated: '7m ago' },
    { name: 'Marine Noise Pollution', category: 'pollution', severity: 'moderate', description: 'High underwater noise from shipping affecting marine life.', causes: ['Port traffic', 'Construction'], indicators: ['Noise: 115 dB', 'Whale behavior: altered'], trend: 'worsening', confidence: 84, lastUpdated: '9m ago' },
    { name: 'Wetland Loss', category: 'other', severity: 'elevated', description: 'Coastal wetland degradation reducing ecosystem services.', causes: ['Development', 'Sea level rise'], indicators: ['Wetland area: -40%', 'Biodiversity: declining'], trend: 'worsening', confidence: 87, lastUpdated: '11m ago' },
    { name: 'Plastic Debris', category: 'litter', severity: 'moderate', description: 'High plastic debris in harbor and beaches.', causes: ['Urban waste', 'River transport'], indicators: ['Debris: 12 items/km²', 'Cleanup: ongoing'], trend: 'stable', confidence: 82, lastUpdated: '13m ago' },
    { name: 'Water Quality', category: 'contamination', severity: 'moderate', description: 'Periodic water quality issues affecting recreation.', causes: ['CSO', 'Runoff'], indicators: ['Beach closures: 15/year', 'Swimming advisories'], trend: 'stable', confidence: 85, lastUpdated: '8m ago' },
    { name: 'Air Quality', category: 'pollution', severity: 'elevated', description: 'Air pollution from port and traffic affecting health.', causes: ['Ship emissions', 'Vehicle traffic'], indicators: ['PM2.5: 12 µg/m³', 'NOx: elevated'], trend: 'stable', confidence: 83, lastUpdated: '10m ago' },
    { name: 'Invasive Species', category: 'invasive', severity: 'moderate', description: 'Non-native species in harbor ecosystem.', causes: ['Ballast water', 'Shipping'], indicators: ['Asian shore crab: established', 'Impact: documented'], trend: 'worsening', confidence: 81, lastUpdated: '15m ago' },
  ],
  'loc-chi': [
    { name: 'Sewage Discharge', category: 'contamination', severity: 'moderate', description: 'Sewage overflow during heavy rain events.', causes: ['Combined sewers', 'Heavy precipitation'], indicators: ['Overflow: 20/year', 'Bacteria: elevated'], trend: 'stable', confidence: 87, lastUpdated: '5m ago' },
    { name: 'Urban Runoff', category: 'runoff', severity: 'moderate', description: 'Polluted stormwater entering river and lake.', causes: ['Street runoff', 'Industrial areas'], indicators: ['Heavy metals: detected', 'Volume: high'], trend: 'stable', confidence: 84, lastUpdated: '8m ago' },
    { name: 'Algal Blooms', category: 'pollution', severity: 'elevated', description: 'Harmful algal blooms in Lake Michigan near shore.', causes: ['Nutrient loading', 'Warm water'], indicators: ['Chlorophyll-a: 35 µg/L', 'Toxins: detected'], trend: 'worsening', confidence: 86, lastUpdated: '6m ago' },
    { name: 'Sediment Contamination', category: 'contamination', severity: 'moderate', description: 'Legacy contaminants in river sediments.', causes: ['Historical industry', 'Ongoing discharge'], indicators: ['PCBs: 280 ppm', 'Heavy metals: high'], trend: 'stable', confidence: 83, lastUpdated: '12m ago' },
    { name: 'Habitat Degradation', category: 'other', severity: 'moderate', description: 'River and lake habitat loss affecting wildlife.', causes: ['Development', 'Channelization'], indicators: ['Habitat: -30%', 'Species: declining'], trend: 'worsening', confidence: 85, lastUpdated: '9m ago' },
    { name: 'Water Quality', category: 'contamination', severity: 'moderate', description: 'Periodic water quality issues in river.', causes: ['Sewage', 'Runoff'], indicators: ['E. coli: elevated', 'Advisories: periodic'], trend: 'stable', confidence: 82, lastUpdated: '11m ago' },
  ],
  'loc-den': [
    { name: 'Air Quality', category: 'pollution', severity: 'elevated', description: 'Ozone and PM2.5 exceedances affecting health.', causes: ['Vehicle emissions', 'Oil & gas'], indicators: ['O3: 0.075 ppm', 'PM2.5: 18 µg/m³'], trend: 'worsening', confidence: 89, lastUpdated: '3m ago' },
    { name: 'Water Quality', category: 'contamination', severity: 'moderate', description: 'Contamination in South Platte River.', causes: ['Urban runoff', 'Industrial discharge'], indicators: ['Heavy metals: detected', 'Nutrients: elevated'], trend: 'stable', confidence: 85, lastUpdated: '7m ago' },
    { name: 'Drought Conditions', category: 'drought', severity: 'high', description: 'Severe drought affecting water supply and ecosystems.', causes: ['Reduced snowpack', 'High demand'], indicators: ['Snowpack: -35%', 'Reservoir: 42%'], trend: 'worsening', confidence: 91, lastUpdated: '2m ago' },
    { name: 'Wildfire Risk', category: 'wildfire', severity: 'elevated', description: 'High wildfire risk in Front Range.', causes: ['Drought', 'Fuel buildup'], indicators: ['Fire danger: extreme', 'Acres burned: +50%'], trend: 'worsening', confidence: 88, lastUpdated: '4m ago' },
    { name: 'Habitat Fragmentation', category: 'other', severity: 'moderate', description: 'Urban development fragmenting wildlife habitat.', causes: ['Urban sprawl', 'Infrastructure'], indicators: ['Habitat loss: 3% annually', 'Connectivity: reduced'], trend: 'worsening', confidence: 84, lastUpdated: '10m ago' },
    { name: 'Urban Runoff', category: 'runoff', severity: 'moderate', description: 'Polluted stormwater entering waterways.', causes: ['Street runoff', 'Construction'], indicators: ['Toxics: detected', 'Volume: high'], trend: 'stable', confidence: 83, lastUpdated: '8m ago' },
    { name: 'Noise Pollution', category: 'pollution', severity: 'low', description: 'Aircraft and traffic noise affecting communities.', causes: ['Airport', 'Highway traffic'], indicators: ['Noise: 60 dB', 'Complaints: moderate'], trend: 'stable', confidence: 79, lastUpdated: '14m ago' },
  ],
  'loc-phx': [
    { name: 'Severe Drought', category: 'drought', severity: 'critical', description: 'Extreme drought conditions affecting water supply.', causes: ['Climate change', 'High demand'], indicators: ['Reservoir: 28%', 'Precipitation: -50%'], trend: 'worsening', confidence: 95, lastUpdated: '1m ago' },
    { name: 'Extreme Heat', category: 'other', severity: 'high', description: 'Rising temperatures and heat island effects.', causes: ['Climate change', 'Urbanization'], indicators: ['Avg temp: +2.5°C', 'Heat deaths: increasing'], trend: 'worsening', confidence: 93, lastUpdated: '2m ago' },
    { name: 'Air Quality', category: 'pollution', severity: 'high', description: 'Ozone and PM exceedances during summer.', causes: ['Vehicle emissions', 'Heat'], indicators: ['O3: 0.085 ppm', 'PM10: 55 µg/m³'], trend: 'worsening', confidence: 90, lastUpdated: '3m ago' },
    { name: 'Water Scarcity', category: 'drought', severity: 'critical', description: 'Critical water shortage affecting supply.', causes: ['Drought', 'Overuse'], indicators: ['Groundwater: declining', 'Supply: critical'], trend: 'worsening', confidence: 94, lastUpdated: '1m ago' },
    { name: 'Desert Habitat Loss', category: 'other', severity: 'elevated', description: 'Urban development destroying desert habitat.', causes: ['Urban sprawl', 'Infrastructure'], indicators: ['Habitat loss: 4% annually', 'Species: declining'], trend: 'worsening', confidence: 87, lastUpdated: '6m ago' },
    { name: 'Dust Storms', category: 'pollution', severity: 'moderate', description: 'Increasing frequency of dust storms affecting air quality.', causes: ['Drought', 'Land disturbance'], indicators: ['Events: +30%', 'PM10: extreme'], trend: 'worsening', confidence: 85, lastUpdated: '5m ago' },
    { name: 'Urban Runoff', category: 'runoff', severity: 'moderate', description: 'Polluted stormwater during monsoon season.', causes: ['Street runoff', 'Construction'], indicators: ['Toxics: detected', 'Volume: high'], trend: 'stable', confidence: 83, lastUpdated: '9m ago' },
    { name: 'Invasive Species', category: 'invasive', severity: 'moderate', description: 'Non-native plants and animals disrupting ecosystems.', causes: ['Urbanization', 'Irrigation'], indicators: ['Tamarix: widespread', 'Impact: documented'], trend: 'worsening', confidence: 81, lastUpdated: '11m ago' },
  ],
  'loc-atl': [
    { name: 'Urban Runoff', category: 'runoff', severity: 'elevated', description: 'Polluted stormwater entering Chattahoochee River.', causes: ['Street runoff', 'Industrial areas'], indicators: ['Heavy metals: detected', 'Volume: high'], trend: 'worsening', confidence: 86, lastUpdated: '4m ago' },
    { name: 'Sewage Overflow', category: 'contamination', severity: 'moderate', description: 'Sewage overflow during heavy rain.', causes: ['Aging infrastructure', 'Heavy rain'], indicators: ['Overflow: 15/year', 'Bacteria: elevated'], trend: 'stable', confidence: 84, lastUpdated: '7m ago' },
    { name: 'Water Quality', category: 'contamination', severity: 'moderate', description: 'Periodic water quality issues in river.', causes: ['Sewage', 'Runoff'], indicators: ['E. coli: elevated', 'Advisories: periodic'], trend: 'stable', confidence: 83, lastUpdated: '9m ago' },
    { name: 'Habitat Degradation', category: 'other', severity: 'moderate', description: 'River habitat loss affecting wildlife.', causes: ['Development', 'Channelization'], indicators: ['Habitat: -25%', 'Species: declining'], trend: 'worsening', confidence: 85, lastUpdated: '6m ago' },
    { name: 'Algal Blooms', category: 'pollution', severity: 'moderate', description: 'Nutrient-driven algal blooms in reservoirs.', causes: ['Nutrient loading', 'Warm water'], indicators: ['Chlorophyll-a: 28 µg/L', 'Frequency: increasing'], trend: 'worsening', confidence: 82, lastUpdated: '10m ago' },
    { name: 'Invasive Species', category: 'invasive', severity: 'low', description: 'Non-native species in river ecosystem.', causes: ['Ballast water', 'Aquarium releases'], indicators: ['Asian carp: detected', 'Impact: moderate'], trend: 'worsening', confidence: 79, lastUpdated: '13m ago' },
  ],
};

// ── Hierarchical tree structures per location ───────────────────────────────

type TreeConfig = { root: number; children: number[]; grandchildren?: Record<number, number[]> };

// Indices into each location's problem array
const TREE_CONFIGS: Record<string, TreeConfig[]> = {
  'loc-sf': [
    { root: 3, children: [1, 0, 4], grandchildren: { 1: [6], 0: [6], 4: [6] } },
    { root: 2, children: [7, 5, 6] },
  ],
  'loc-la': [
    { root: 0, children: [2, 6, 8], grandchildren: { 2: [7], 6: [7] } },
    { root: 3, children: [1, 4, 5] },
    { root: 8, children: [7] },
  ],
  'loc-gulf': [
    { root: 0, children: [7, 3, 1], grandchildren: { 7: [3, 1], 3: [1] } },
    { root: 4, children: [5, 2, 6], grandchildren: { 5: [6], 2: [6] } },
    { root: 9, children: [8, 6] },
  ],
  'loc-ever': [
    { root: 2, children: [6, 7, 5], grandchildren: { 6: [5], 7: [5] } },
    { root: 3, children: [1, 4] },
    { root: 0, children: [5] },
  ],
  'loc-pnw': [
    { root: 0, children: [1, 6, 2], grandchildren: { 6: [2] } },
    { root: 4, children: [3, 2] },
    { root: 5, children: [6] },
  ],
  'loc-ny': [
    { root: 0, children: [2, 6], grandchildren: { 6: [4], 2: [1] } },
    { root: 1, children: [4, 5, 8] },
    { root: 3, children: [7, 4] },
  ],
  'loc-chi': [
    { root: 0, children: [1, 5] },
    { root: 2, children: [3, 4], grandchildren: { 3: [4] } },
  ],
  'loc-den': [
    { root: 2, children: [3, 1], grandchildren: { 3: [0, 4] } },
    { root: 5, children: [1, 4] },
    { root: 0, children: [6] },
  ],
  'loc-phx': [
    { root: 0, children: [3, 1, 5], grandchildren: { 1: [2], 5: [2] } },
    { root: 4, children: [7, 6] },
  ],
  'loc-atl': [
    { root: 0, children: [1, 2, 4], grandchildren: { 2: [3], 4: [3] } },
    { root: 3, children: [5] },
  ],
};

// ── Build location graph ────────────────────────────────────────────────────

export function buildLocationGraph(locationId: string): LocationGraph {
  const location = locationSummaries.find((l) => l.id === locationId);
  if (!location) throw new Error(`Location ${locationId} not found`);

  const templates = PROBLEM_DATA[locationId] || [];
  const problems: ProblemNode[] = templates.map((t, i) => ({
    ...t,
    id: `prob-${locationId.replace('loc-', '')}-${i}`,
  }));

  const links: ProblemLink[] = [];
  const trees = TREE_CONFIGS[locationId] || [];

  // Build tree links
  trees.forEach((tree) => {
    tree.children.forEach((childIdx) => {
      if (problems[tree.root] && problems[childIdx]) {
        links.push({
          source: problems[tree.root].id,
          target: problems[childIdx].id,
          label: 'causes',
          type: 'causes',
          strength: 0.7 + Math.random() * 0.2,
        });
      }
    });

    if (tree.grandchildren) {
      Object.entries(tree.grandchildren).forEach(([parentStr, gcIndices]) => {
        const parentIdx = Number(parentStr);
        gcIndices.forEach((gcIdx) => {
          if (problems[parentIdx] && problems[gcIdx]) {
            links.push({
              source: problems[parentIdx].id,
              target: problems[gcIdx].id,
              label: 'leads to',
              type: 'causes',
              strength: 0.5 + Math.random() * 0.2,
            });
          }
        });
      });
    }
  });

  // Cross-tree correlation links
  for (let i = 0; i < trees.length; i++) {
    for (let j = i + 1; j < trees.length; j++) {
      const leaves1 = trees[i].grandchildren
        ? Object.values(trees[i].grandchildren!).flat()
        : trees[i].children.slice(-2);
      const leaves2 = trees[j].grandchildren
        ? Object.values(trees[j].grandchildren!).flat()
        : trees[j].children.slice(-2);

      if (leaves1.length > 0 && leaves2.length > 0) {
        const l1 = leaves1[Math.floor(Math.random() * leaves1.length)];
        const l2 = leaves2[Math.floor(Math.random() * leaves2.length)];
        if (problems[l1] && problems[l2]) {
          links.push({
            source: problems[l1].id,
            target: problems[l2].id,
            label: 'correlates',
            type: 'correlates',
            strength: 0.3 + Math.random() * 0.2,
          });
        }
      }
    }
  }

  return { locationId, problems, links };
}

// ── Dynamic nodes from Slack uploads ────────────────────────────────────────

interface SlackClassification {
  location_id: string;
  category: ProblemNode['category'];
  severity: ThreatLevel;
  problem_name: string;
  problem_description: string;
  indicators: string[];
  trend: 'improving' | 'stable' | 'worsening';
}

interface SlackUploadEntry {
  filename: string;
  original_name: string;
  user: string;
  channel: string;
  timestamp: number;
  mimetype: string;
  ai_description?: string;
  classification?: SlackClassification;
}

export async function fetchDynamicNodes(locationId: string): Promise<{
  problems: ProblemNode[];
  links: ProblemLink[];
  imageMap: Record<string, string>;
}> {
  try {
    const res = await fetch('/api/slack-uploads');
    if (!res.ok) return { problems: [], links: [], imageMap: {} };
    const uploads: SlackUploadEntry[] = await res.json();

    const matched = uploads.filter(
      (u) => u.classification && u.classification.location_id === locationId,
    );

    if (matched.length === 0) return { problems: [], links: [], imageMap: {} };

    // Build the static graph to find category-matching nodes for linking
    const staticGraph = buildLocationGraph(locationId);

    const problems: ProblemNode[] = [];
    const links: ProblemLink[] = [];
    const imageMap: Record<string, string> = {};

    for (const upload of matched) {
      const c = upload.classification!;
      const nodeId = `slack-${upload.timestamp}`;
      const ts = new Date(upload.timestamp * 1000);
      const timeAgo = formatTimeAgo(ts);

      problems.push({
        id: nodeId,
        name: c.problem_name,
        category: c.category,
        severity: c.severity as ThreatLevel,
        description: c.problem_description,
        indicators: c.indicators,
        trend: c.trend,
        confidence: 75,
        lastUpdated: timeAgo,
      });

      // Store image URL for this node
      imageMap[nodeId] = `/api/slack-uploads/image?f=${encodeURIComponent(upload.filename)}`;

      // Link to the most relevant static node (same category, or first root)
      const sameCat = staticGraph.problems.find((p) => p.category === c.category);
      const target = sameCat || staticGraph.problems[0];
      if (target) {
        links.push({
          source: nodeId,
          target: target.id,
          label: 'correlates',
          type: 'correlates',
          strength: 0.5,
        });
      }
    }

    return { problems, links, imageMap };
  } catch (e) {
    console.error('Failed to fetch dynamic nodes:', e);
    return { problems: [], links: [], imageMap: {} };
  }
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
