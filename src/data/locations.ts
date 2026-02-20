export type ThreatLevel = 'low' | 'moderate' | 'elevated' | 'high' | 'critical';

export interface EnvironmentalMetric {
  label: string;
  value: number;
  max: number;
  unit: string;
  status: ThreatLevel;
  description: string;
}

export interface PinReport {
  id: string;
  coordinates: [number, number];
  city: string;
  neighborhood: string;
  state: string;
  user: string;
  timestamp: string;
  title: string;
  summary: string;
  analysisDetails: string[];
  category: string;
  severity: ThreatLevel;
  confidence: number;
  metrics: EnvironmentalMetric[];
  impactStatement: string;
  agentsActive: number;
  correlatedWith: string[];
  source?: 'static' | 'slack';
  imageUrl?: string;
}

export const LOCATION_COORDS: Record<string, [number, number]> = {
  'loc-sf':   [-122.3912, 37.7955],
  'loc-la':   [-118.2850, 34.0901],
  'loc-gulf': [-95.3562, 29.7580],
  'loc-ever': [-80.8320, 25.8500],
  'loc-pnw':  [-122.3380, 47.6130],
  'loc-ny':   [-74.0060, 40.7128],
  'loc-chi':  [-87.6298, 41.8781],
  'loc-den':  [-104.9903, 39.7392],
  'loc-phx':  [-112.0740, 33.4484],
  'loc-atl':  [-84.3880, 33.7490],
};

export const THREAT_COLORS: Record<ThreatLevel, string> = {
  low: '#00d4ff',
  moderate: '#3b82f6',
  elevated: '#ffaa00',
  high: '#ff4d6a',
  critical: '#ff4d6a',
};

export const THREAT_LABELS: Record<ThreatLevel, string> = {
  low: 'LOW',
  moderate: 'MOD',
  elevated: 'ELEV',
  high: 'HIGH',
  critical: 'CRIT',
};

export const CATEGORY_COLORS: Record<string, string> = {
  Water: '#06b6d4',
  Air: '#a78bfa',
  Soil: '#ffaa00',
  Bio: '#00e68a',
  Climate: '#3b82f6',
};

export const pinReports: PinReport[] = [
  {
    id: 'pin-1',
    coordinates: [-122.3912, 37.7955],
    city: 'San Francisco',
    neighborhood: 'Mission Creek',
    state: 'CA',
    user: 'sarah.chen',
    timestamp: '2m ago',
    title: 'Algal Bloom in Harbor Zone',
    summary: 'Dense algal bloom detected spanning approximately 200m of Mission Creek canal. Water discoloration consistent with harmful cyanobacteria.',
    analysisDetails: [
      'Chlorophyll-a concentration estimated at 45 µg/L (threshold: 10 µg/L)',
      'Water surface temperature anomaly of +3.2°C above seasonal baseline',
      'Dissolved oxygen likely depressed in bloom zone',
      'Potential microcystin toxin risk for local wildlife',
    ],
    category: 'Water',
    severity: 'elevated',
    confidence: 87,
    metrics: [
      { label: 'Chlorophyll-a', value: 45, max: 60, unit: 'µg/L', status: 'elevated', description: 'Bloom indicator 4.5x safe threshold' },
      { label: 'Water Temp', value: 68, max: 80, unit: '°F', status: 'moderate', description: '+3.2°F above 30-day average' },
      { label: 'Dissolved O₂', value: 3.2, max: 10, unit: 'mg/L', status: 'high', description: 'Below minimum for aquatic life' },
      { label: 'Turbidity', value: 42, max: 100, unit: 'NTU', status: 'elevated', description: 'Reduced visibility from bloom density' },
    ],
    impactStatement: 'Bloom correlates with 48-hour warming trend and upstream nutrient loading from recent storm runoff. Similar blooms at 3 other Bay Area sites this week.',
    agentsActive: 4,
    correlatedWith: ['pin-2', 'pin-14'],
  },
  {
    id: 'pin-2',
    coordinates: [-122.4786, 37.7582],
    city: 'San Francisco',
    neighborhood: 'Ocean Beach',
    state: 'CA',
    user: 'mike.torres',
    timestamp: '8m ago',
    title: 'Storm Drain Contamination',
    summary: 'Orange-brown discharge from storm drain outfall at south end of Ocean Beach. Industrial runoff characteristics with visible foam formation.',
    analysisDetails: [
      'Visible iron oxide coloration indicating metal-laden discharge',
      'Foam formation suggests surfactant contamination',
      'Discharge plume extending ~50m into surf zone',
      'No posted advisory at beach access points',
    ],
    category: 'Water',
    severity: 'high',
    confidence: 92,
    metrics: [
      { label: 'Heavy Metals', value: 78, max: 100, unit: 'idx', status: 'high', description: 'Iron and copper above EPA recreation limits' },
      { label: 'pH Level', value: 5.2, max: 14, unit: 'pH', status: 'elevated', description: 'Acidic runoff, normal ocean is 8.1' },
      { label: 'Surfactants', value: 0.8, max: 1, unit: 'mg/L', status: 'high', description: 'Detergent-class compounds detected' },
      { label: 'E. coli', value: 640, max: 1000, unit: 'MPN', status: 'elevated', description: 'Above 320 MPN swim advisory threshold' },
    ],
    impactStatement: 'Source traced to construction site 0.4mi upstream. Similar events increasing 23% year-over-year at Bay Area outfalls.',
    agentsActive: 3,
    correlatedWith: ['pin-1', 'pin-4'],
  },
  {
    id: 'pin-3',
    coordinates: [-118.2850, 34.0901],
    city: 'Los Angeles',
    neighborhood: 'Griffith Park',
    state: 'CA',
    user: 'jenna.wu',
    timestamp: '4m ago',
    title: 'Wildfire Smoke Plume',
    summary: 'Heavy smoke plume from foothill region reducing visibility to 0.8 miles. AQI readings in hazardous range across Griffith Park area.',
    analysisDetails: [
      'PM2.5 at 285 µg/m³ (hazardous threshold: 250)',
      'Visibility reduced to approximately 0.8 miles',
      'Smoke composition consistent with chaparral combustion',
      'Wind direction suggests plume will affect downtown by 6PM',
    ],
    category: 'Air',
    severity: 'critical',
    confidence: 95,
    metrics: [
      { label: 'PM2.5', value: 285, max: 500, unit: 'µg/m³', status: 'critical', description: 'Hazardous: 11x WHO daily limit' },
      { label: 'AQI', value: 342, max: 500, unit: 'AQI', status: 'critical', description: 'Emergency conditions, stay indoors' },
      { label: 'Visibility', value: 0.8, max: 10, unit: 'mi', status: 'critical', description: 'Near-zero in smoke zone' },
      { label: 'CO', value: 12, max: 35, unit: 'ppm', status: 'elevated', description: 'Carbon monoxide from incomplete combustion' },
    ],
    impactStatement: 'Wildfire started 6 hours ago in Angeles National Forest. 200+ acres burned. Smoke advisory for 2.3M residents in LA basin.',
    agentsActive: 6,
    correlatedWith: ['pin-4', 'pin-16'],
  },
  {
    id: 'pin-4',
    coordinates: [-118.1920, 33.7550],
    city: 'Long Beach',
    neighborhood: 'Port of Long Beach',
    state: 'CA',
    user: 'omar.hassan',
    timestamp: '11m ago',
    title: 'Oil Sheen on Harbor Water',
    summary: 'Iridescent oil film covering ~400m² of harbor surface near container terminal. Hydrocarbon rainbow patterns clearly visible in photo.',
    analysisDetails: [
      'Oil film thickness estimated 1-5 µm based on color patterns',
      'Rainbow sheen indicates petroleum-based hydrocarbon',
      'Source appears to be bilge discharge or fuel transfer spill',
      'No containment boom deployed at time of photo',
    ],
    category: 'Water',
    severity: 'high',
    confidence: 89,
    metrics: [
      { label: 'Oil Coverage', value: 400, max: 1000, unit: 'm²', status: 'high', description: 'Growing from initial 50m² over 2 hours' },
      { label: 'Film Thickness', value: 3, max: 10, unit: 'µm', status: 'elevated', description: 'Visible rainbow = petroleum source' },
      { label: 'Wind Speed', value: 4, max: 30, unit: 'mph', status: 'low', description: 'Low wind causing sheen to concentrate' },
      { label: 'Dissolved HC', value: 15, max: 50, unit: 'mg/L', status: 'high', description: 'Hydrocarbons above ambient levels' },
    ],
    impactStatement: 'Third oil sheen at this terminal in 60 days. Coast Guard investigation pending. Migratory bird habitat 0.5mi south.',
    agentsActive: 5,
    correlatedWith: ['pin-2', 'pin-3'],
  },
  {
    id: 'pin-5',
    coordinates: [-95.3562, 29.7580],
    city: 'Houston',
    neighborhood: 'Texas City',
    state: 'TX',
    user: 'tyler.james',
    timestamp: '1m ago',
    title: 'Refinery Flare Event',
    summary: 'Abnormally large flare at Texas City refinery complex. Black smoke indicates incomplete combustion. SO₂ odor detectable at 2-mile radius.',
    analysisDetails: [
      'Flare height estimated 40m, 3x normal operation',
      'Black smoke particulates suggest equipment malfunction',
      'SO₂ at fence line likely exceeding 75 ppb NAAQS',
      'Flare event duration: 45+ minutes and ongoing',
    ],
    category: 'Air',
    severity: 'critical',
    confidence: 94,
    metrics: [
      { label: 'SO₂', value: 142, max: 200, unit: 'ppb', status: 'critical', description: 'Nearly 2x EPA 1-hour standard' },
      { label: 'PM10', value: 195, max: 500, unit: 'µg/m³', status: 'high', description: 'Black particulate from incomplete burn' },
      { label: 'VOCs', value: 88, max: 100, unit: 'ppb', status: 'high', description: 'Benzene and toluene detectable downwind' },
      { label: 'H₂S', value: 35, max: 100, unit: 'ppb', status: 'elevated', description: 'Rotten egg odor at 2mi radius' },
    ],
    impactStatement: '3 schools within 5-mile downwind zone. 7th reportable flare event at this facility this year. Community health alert issued.',
    agentsActive: 7,
    correlatedWith: ['pin-6', 'pin-15'],
  },
  {
    id: 'pin-6',
    coordinates: [-94.8035, 29.3105],
    city: 'Galveston',
    neighborhood: 'Galveston Bay',
    state: 'TX',
    user: 'chris.doe',
    timestamp: '14m ago',
    title: 'Mass Fish Kill Event',
    summary: '~5,000 dead fish along 0.5-mile stretch of Galveston Bay. Multiple species affected. Dissolved oxygen at lethal levels.',
    analysisDetails: [
      'Dissolved oxygen at 1.2 mg/L (lethal below 2.0)',
      'Water temperature 34°C, well above seasonal norm',
      'No visible algal bloom — hypoxia from nutrient loading',
      'Fish showing no external lesions, consistent with suffocation',
    ],
    category: 'Water',
    severity: 'critical',
    confidence: 91,
    metrics: [
      { label: 'Dissolved O₂', value: 1.2, max: 10, unit: 'mg/L', status: 'critical', description: 'Fatal: below 2.0 minimum for fish' },
      { label: 'Water Temp', value: 93, max: 110, unit: '°F', status: 'critical', description: '+8°F above 10-year average' },
      { label: 'Nitrogen', value: 4.8, max: 10, unit: 'mg/L', status: 'high', description: 'Eutrophic from upstream runoff' },
      { label: 'Species', value: 5, max: 5, unit: 'affected', status: 'critical', description: 'Multi-species die-off = systemic' },
    ],
    impactStatement: 'Dead zone expanding. NOAA vessel dispatched. Coincides with record Gulf surface temps and spring fertilizer runoff.',
    agentsActive: 5,
    correlatedWith: ['pin-5', 'pin-7'],
  },
  {
    id: 'pin-7',
    coordinates: [-80.8320, 25.8500],
    city: 'Miami',
    neighborhood: 'Everglades Entrance',
    state: 'FL',
    user: 'ana.rivera',
    timestamp: '3m ago',
    title: 'Invasive Python Nest',
    summary: 'Burmese python nest with 47 eggs in critical wading bird nesting area. Adult female (16ft) captured. Within core wood stork breeding habitat.',
    analysisDetails: [
      'Nest 200m from active wood stork colony',
      'Egg count (47) indicates peak reproductive fitness',
      'GPS data shows individual traveled 12mi in 30 days',
      'Recent mammal predation evidence (raccoon remains) nearby',
    ],
    category: 'Bio',
    severity: 'critical',
    confidence: 98,
    metrics: [
      { label: 'Nest Size', value: 47, max: 60, unit: 'eggs', status: 'critical', description: 'Above-average = thriving population' },
      { label: 'Proximity', value: 200, max: 1000, unit: 'm', status: 'critical', description: 'Within endangered bird buffer zone' },
      { label: 'Pop. Density', value: 85, max: 100, unit: '/mi²', status: 'critical', description: '4x management target' },
      { label: 'Native Mammal', value: 12, max: 100, unit: '% left', status: 'critical', description: '88% decline since 2003' },
    ],
    impactStatement: 'Python population estimated at 100K+. Native mammals declined 90%+ in invaded areas. This nest threatens last wood stork breeding colony in South FL.',
    agentsActive: 6,
    correlatedWith: ['pin-8', 'pin-6'],
  },
  {
    id: 'pin-8',
    coordinates: [-80.1340, 25.7490],
    city: 'Miami',
    neighborhood: 'Biscayne Bay',
    state: 'FL',
    user: 'james.wright',
    timestamp: '9m ago',
    title: 'Coral Bleaching Event',
    summary: 'Widespread coral bleaching across 2-acre patch reef at 15ft depth. 80% of staghorn and elkhorn coral showing white skeletal exposure.',
    analysisDetails: [
      'Reef temp: 31.8°C (bleaching threshold: 29.5°C)',
      'Bleaching severity: 80% of colonies affected',
      'Staghorn coral — federally threatened species',
      'No disease signs; purely thermal stress bleaching',
    ],
    category: 'Bio',
    severity: 'critical',
    confidence: 96,
    metrics: [
      { label: 'Sea Temp', value: 89, max: 100, unit: '°F', status: 'critical', description: '4.1°F above bleaching threshold' },
      { label: 'Bleach Cover', value: 80, max: 100, unit: '%', status: 'critical', description: '4 of 5 colonies fully bleached' },
      { label: 'Recovery', value: 22, max: 100, unit: '%', status: 'critical', description: 'Low if temps stay elevated >2wk' },
      { label: 'ESA Species', value: 3, max: 3, unit: 'at risk', status: 'critical', description: 'Staghorn, elkhorn, pillar coral' },
    ],
    impactStatement: '3rd consecutive year of bleaching at this reef. NOAA Alert Level 2 for all South Florida. Recovery unlikely without cooling in 14 days.',
    agentsActive: 4,
    correlatedWith: ['pin-7'],
  },
  {
    id: 'pin-9',
    coordinates: [-76.0890, 38.9350],
    city: 'Annapolis',
    neighborhood: 'Kent Island',
    state: 'MD',
    user: 'maria.santos',
    timestamp: '5m ago',
    title: 'Agricultural Nutrient Runoff',
    summary: 'Green-brown nutrient plume extending 1.2 miles from Eastern Shore agricultural drainage into Chesapeake Bay. Phosphate 4x baseline.',
    analysisDetails: [
      'Plume visible in satellite imagery spanning 1.2mi',
      'Source: poultry farm drainage after 2-inch rainfall',
      'Phosphate at 0.8 mg/L, 4x bay ambient',
      'Nitrogen loading at 45 kg/day at this outfall',
    ],
    category: 'Water',
    severity: 'high',
    confidence: 88,
    metrics: [
      { label: 'Phosphate', value: 0.8, max: 1, unit: 'mg/L', status: 'high', description: '40x ambient — eutrophication driver' },
      { label: 'Nitrogen', value: 8.5, max: 10, unit: 'mg/L', status: 'high', description: 'Agricultural fertilizer confirmed' },
      { label: 'Plume Size', value: 1.2, max: 5, unit: 'mi', status: 'elevated', description: 'Expanding with outgoing tide' },
      { label: 'Sediment', value: 180, max: 500, unit: 'mg/L', status: 'elevated', description: 'Topsoil erosion from unprotected fields' },
    ],
    impactStatement: 'Chesapeake Bay receives 300M lbs of nitrogen annually. This drainage serves 12 poultry operations. Dead zone expanded 15% this summer.',
    agentsActive: 3,
    correlatedWith: ['pin-10', 'pin-13'],
  },
  {
    id: 'pin-10',
    coordinates: [-83.6500, 42.3420],
    city: 'Detroit',
    neighborhood: 'Belle Isle',
    state: 'MI',
    user: 'emma.clark',
    timestamp: '16m ago',
    title: 'Microplastic Contamination',
    summary: 'Water samples from Detroit River near Belle Isle show microplastic at 12,400 particles/m³ — 6x the Great Lakes average.',
    analysisDetails: [
      'Dominant types: polyethylene (45%), polypropylene (32%)',
      'Size range: 100µm-2mm (microplastic classification)',
      'Sources: tire wear, textile fibers, packaging',
      'Biofilm on particles = potential pathogen vector',
    ],
    category: 'Water',
    severity: 'elevated',
    confidence: 83,
    metrics: [
      { label: 'Microplastic', value: 12400, max: 20000, unit: '/m³', status: 'elevated', description: '6x Great Lakes regional average' },
      { label: 'Particle Size', value: 350, max: 5000, unit: 'µm', status: 'moderate', description: 'Ingestible by filter feeders' },
      { label: 'Biofilm', value: 68, max: 100, unit: '%', status: 'elevated', description: 'Bacteria colonizing 68% of particles' },
      { label: 'Flow Rate', value: 188000, max: 250000, unit: 'cfs', status: 'low', description: 'Normal flow dispersing contaminants' },
    ],
    impactStatement: 'Great Lakes hold 22M tons of plastic. Detroit River is a major transport corridor to Lake Erie. Microplastics found in 83% of regional tap water.',
    agentsActive: 3,
    correlatedWith: ['pin-9', 'pin-14'],
  },
  {
    id: 'pin-11',
    coordinates: [-122.3380, 47.6130],
    city: 'Seattle',
    neighborhood: 'Puget Sound',
    state: 'WA',
    user: 'noah.park',
    timestamp: '31m ago',
    title: 'Old-Growth Logging Encroachment',
    summary: 'Fresh clear-cut 150m from designated old-growth preserve. ~8 acres of 150-300yr Douglas fir removed in violation of buffer zone.',
    analysisDetails: [
      'Cut boundary violates 500m buffer zone requirement',
      'Trees estimated 150-300 years old from stump rings',
      'Northern spotted owl habitat in adjacent preserve',
      'Heavy equipment soil disturbance visible',
    ],
    category: 'Bio',
    severity: 'moderate',
    confidence: 90,
    metrics: [
      { label: 'Buffer Violation', value: 350, max: 500, unit: 'm', status: 'moderate', description: '350m inside required buffer zone' },
      { label: 'Area Cleared', value: 8, max: 50, unit: 'acres', status: 'moderate', description: '~200 mature trees removed' },
      { label: 'Tree Age', value: 225, max: 500, unit: 'years', status: 'elevated', description: 'Irreplaceable old-growth' },
      { label: 'ESA Species', value: 3, max: 10, unit: 'at risk', status: 'moderate', description: 'Spotted owl, murrelet, salmon' },
    ],
    impactStatement: 'Less than 10% of original PNW old-growth remains. This cut disrupts a wildlife corridor connecting two protected areas.',
    agentsActive: 2,
    correlatedWith: ['pin-16'],
  },
  {
    id: 'pin-12',
    coordinates: [-105.7800, 40.3770],
    city: 'Estes Park',
    neighborhood: 'Rocky Mountain NP',
    state: 'CO',
    user: 'zoe.miller',
    timestamp: '45m ago',
    title: 'Below-Average Snowpack',
    summary: 'Snowpack at 11,500ft measuring 62% of 30-year median. Early melt exposing alpine meadow at unprecedented rates for February.',
    analysisDetails: [
      'Snow depth: 38" vs. 61" median (62%)',
      'Snow water equivalent: 14.2" vs. 22.8" median',
      'Melt rate 3x faster than historical average',
      'Downstream reservoirs already 8% below target',
    ],
    category: 'Climate',
    severity: 'moderate',
    confidence: 86,
    metrics: [
      { label: 'Snowpack', value: 62, max: 100, unit: '% med', status: 'moderate', description: '38% below normal for this date' },
      { label: 'SWE', value: 14.2, max: 25, unit: 'in', status: 'moderate', description: 'Snow water equiv drives spring runoff' },
      { label: 'Melt Rate', value: 3, max: 5, unit: 'x norm', status: 'elevated', description: 'Above-average temps accelerating melt' },
      { label: 'Reservoir', value: 72, max: 100, unit: '%', status: 'moderate', description: 'Below target for irrigation season' },
    ],
    impactStatement: 'Colorado River serves 40M people. Low snowpack correlates with 60% increased summer wildfire risk. Water curtailment likely.',
    agentsActive: 2,
    correlatedWith: ['pin-16'],
  },
  {
    id: 'pin-13',
    coordinates: [-73.9857, 40.6782],
    city: 'New York City',
    neighborhood: 'Gowanus Canal',
    state: 'NY',
    user: 'dev.patel',
    timestamp: '15m ago',
    title: 'Combined Sewer Overflow',
    summary: 'Raw sewage overflow at Gowanus Canal outfall after 1.5-inch rain event. Brown turbid water with visible debris and sewage odor.',
    analysisDetails: [
      'CSO discharge duration: 4+ hours after rain stopped',
      'Estimated 30M gallons untreated sewage + stormwater',
      'E. coli: >24,000 MPN/100mL (beach standard: 235)',
      'Gowanus is an active Superfund site',
    ],
    category: 'Water',
    severity: 'high',
    confidence: 93,
    metrics: [
      { label: 'E. coli', value: 24000, max: 50000, unit: 'MPN', status: 'critical', description: '102x safe swimming standard' },
      { label: 'CSO Volume', value: 30, max: 100, unit: 'M gal', status: 'high', description: 'Raw sewage + stormwater mix' },
      { label: 'Duration', value: 4, max: 24, unit: 'hours', status: 'elevated', description: 'Continues after rain stops' },
      { label: 'DO', value: 2.1, max: 10, unit: 'mg/L', status: 'high', description: 'Anoxic from organic loading' },
    ],
    impactStatement: 'NYC has 460 CSO outfalls. Gowanus is an EPA Superfund site. CSO events negate $1.5B ongoing remediation.',
    agentsActive: 4,
    correlatedWith: ['pin-10', 'pin-9'],
  },
  {
    id: 'pin-14',
    coordinates: [-87.6298, 41.8960],
    city: 'Chicago',
    neighborhood: 'Montrose Beach',
    state: 'IL',
    user: 'alex.kim',
    timestamp: '23m ago',
    title: 'Lake Michigan Algae Bloom',
    summary: 'Green algae mat along 0.3-mile stretch of Montrose Beach shoreline. Distinct musty odor. No advisory posted.',
    analysisDetails: [
      'Cladophora algae 2-6 inches thick accumulation',
      'Decomposing algae creating hydrogen sulfide odor',
      'No confirmed blue-green cyanobacteria yet',
      'Growth linked to quagga mussel water clarity changes',
    ],
    category: 'Water',
    severity: 'elevated',
    confidence: 81,
    metrics: [
      { label: 'Coverage', value: 0.3, max: 2, unit: 'mi', status: 'elevated', description: 'Growing daily with onshore winds' },
      { label: 'Algae Depth', value: 4, max: 12, unit: 'in', status: 'moderate', description: 'Accumulating faster than decomposing' },
      { label: 'H₂S', value: 22, max: 100, unit: 'ppb', status: 'moderate', description: 'Odor from decomposition' },
      { label: 'Beach Score', value: 35, max: 100, unit: 'idx', status: 'elevated', description: 'Below advisory threshold' },
    ],
    impactStatement: 'Lake Michigan Cladophora up 5x since quagga mussel invasion. Mussels filter water, increase light, fuel algae — an invasive species cascade.',
    agentsActive: 3,
    correlatedWith: ['pin-10', 'pin-1'],
  },
  {
    id: 'pin-15',
    coordinates: [-89.9340, 29.9465],
    city: 'New Orleans',
    neighborhood: 'Plaquemines Parish',
    state: 'LA',
    user: 'lisa.tran',
    timestamp: '7m ago',
    title: 'Accelerating Coastal Erosion',
    summary: 'Comparison photos show 18m of shoreline retreat in 6 months. Infrastructure now at water edge. Barrier island near breakthrough.',
    analysisDetails: [
      'Land loss rate: 3m/month, 2x historical average',
      'Barrier island width reduced to <100m at narrowest',
      'Saltwater intrusion advancing into freshwater marsh',
      'Hurricane season vulnerability significantly increased',
    ],
    category: 'Soil',
    severity: 'critical',
    confidence: 92,
    metrics: [
      { label: 'Land Loss', value: 18, max: 30, unit: 'm/6mo', status: 'critical', description: '2x historical erosion rate' },
      { label: 'Island Width', value: 95, max: 500, unit: 'm', status: 'critical', description: 'Near breakthrough to open water' },
      { label: 'Saltwater', value: 3.2, max: 5, unit: 'mi in', status: 'high', description: 'Killing freshwater marsh' },
      { label: 'Elevation', value: 1.2, max: 10, unit: 'ft ASL', status: 'critical', description: 'Below storm surge threshold' },
    ],
    impactStatement: 'Louisiana loses a football field of land every 100 minutes. This island protects $2.8B infrastructure and 12K residents. Breakthrough expected in 18 months.',
    agentsActive: 5,
    correlatedWith: ['pin-5', 'pin-6'],
  },
  {
    id: 'pin-16',
    coordinates: [-122.6750, 45.5152],
    city: 'Portland',
    neighborhood: 'Downtown',
    state: 'OR',
    user: 'rachel.ng',
    timestamp: '19m ago',
    title: 'Transboundary Smoke Drift',
    summary: 'BC wildfire smoke creating persistent haze over Portland metro. AQI fluctuating Unhealthy to Very Unhealthy for 36 hours.',
    analysisDetails: [
      'Source: 3 large fires in BC, ~600 miles north',
      'Temperature inversion trapping smoke at surface',
      'PM2.5 oscillating 85-165 µg/m³ over 24 hours',
      'Entirely transboundary — no local fire source',
    ],
    category: 'Air',
    severity: 'elevated',
    confidence: 87,
    metrics: [
      { label: 'PM2.5', value: 124, max: 500, unit: 'µg/m³', status: 'high', description: 'Very Unhealthy for all groups' },
      { label: 'AQI', value: 186, max: 500, unit: 'AQI', status: 'high', description: 'Outdoor activity discouraged' },
      { label: 'Visibility', value: 2.5, max: 10, unit: 'mi', status: 'elevated', description: 'Haze layer 0-3000ft altitude' },
      { label: 'Duration', value: 36, max: 168, unit: 'hrs', status: 'elevated', description: 'Inversion preventing clearing' },
    ],
    impactStatement: 'PNW smoke seasons have doubled since 2000. Transboundary smoke affects 4.2M people with no fire management options.',
    agentsActive: 3,
    correlatedWith: ['pin-3', 'pin-11', 'pin-12'],
  },
  {
    id: 'pin-17',
    coordinates: [-84.3880, 33.7670],
    city: 'Atlanta',
    neighborhood: 'Midtown',
    state: 'GA',
    user: 'carlos.silva',
    timestamp: '28m ago',
    title: 'Urban Heat Island Extreme',
    summary: 'Surface temp mapping shows Midtown pavement at 147°F — 23°F above tree-canopy neighborhoods 2 miles away. Heat index 118°F.',
    analysisDetails: [
      'Asphalt surface: 147°F vs. 124°F in canopy areas',
      'Ambient air: 104°F (heat index 118°F)',
      'Zero shade on 6-block commercial corridor',
      'HVAC exhaust adding to urban heat canyon effect',
    ],
    category: 'Climate',
    severity: 'high',
    confidence: 85,
    metrics: [
      { label: 'Surface Temp', value: 147, max: 180, unit: '°F', status: 'critical', description: 'Burns in <1 sec contact' },
      { label: 'Heat Index', value: 118, max: 150, unit: '°F', status: 'critical', description: 'Extreme danger for outdoor workers' },
      { label: 'UHI Delta', value: 23, max: 30, unit: '°F', status: 'high', description: 'Urban vs. suburban temp gap' },
      { label: 'Tree Canopy', value: 8, max: 100, unit: '%', status: 'critical', description: 'vs. 45% metro Atlanta average' },
    ],
    impactStatement: 'Urban heat islands cause 1,300+ excess US deaths annually. Atlanta lost 15% tree canopy since 2008. Low-income areas 5-8°F hotter.',
    agentsActive: 3,
    correlatedWith: ['pin-5'],
  },
  {
    id: 'pin-18',
    coordinates: [-77.0369, 38.8977],
    city: 'Washington DC',
    neighborhood: 'Georgetown',
    state: 'DC',
    user: 'david.lee',
    timestamp: '22m ago',
    title: 'Potomac Sediment Plume',
    summary: 'Heavy sediment discharge into Potomac visible from Key Bridge. Brown turbidity plume 0.5mi downstream from Rock Creek outfall.',
    analysisDetails: [
      'Secchi disk visibility: 8" (normal: 36")',
      'Sediment load at 450 mg/L (4.5x ambient)',
      'Stormwater carrying oils, road salt, litter',
      'Plume reaching DC drinking water intake',
    ],
    category: 'Water',
    severity: 'elevated',
    confidence: 84,
    metrics: [
      { label: 'Turbidity', value: 85, max: 100, unit: 'NTU', status: 'high', description: 'Near-opaque, 10x normal' },
      { label: 'Sediment', value: 450, max: 1000, unit: 'mg/L', status: 'elevated', description: 'Heavy upstream soil erosion' },
      { label: 'Flow Rate', value: 28000, max: 50000, unit: 'cfs', status: 'elevated', description: '3x baseflow from storm' },
      { label: 'Pollutants', value: 12, max: 20, unit: 'types', status: 'elevated', description: 'PAHs, metals, bacteria found' },
    ],
    impactStatement: 'Rock Creek watershed is 75% impervious surface. Every 1-inch rain triggers CSO and sediment discharge. Green infrastructure 60% behind plan.',
    agentsActive: 3,
    correlatedWith: ['pin-9', 'pin-13'],
  },
];

// ===== GeoJSON helpers =====

export function getPinReportsGeoJSON(pins?: PinReport[]) {
  const data = pins ?? pinReports;
  return {
    type: 'FeatureCollection' as const,
    features: data.map((pin) => ({
      type: 'Feature' as const,
      properties: {
        id: pin.id,
        city: pin.city,
        severity: pin.severity,
        category: pin.category,
        color: THREAT_COLORS[pin.severity],
        categoryColor: CATEGORY_COLORS[pin.category] || 'rgba(255,255,255,0.55)',
        title: pin.title,
        user: pin.user,
        timestamp: pin.timestamp,
        source: pin.source || 'static',
      },
      geometry: { type: 'Point' as const, coordinates: pin.coordinates },
    })),
  };
}

export function getHeatmapGeoJSON(pins?: PinReport[]) {
  const data = pins ?? pinReports;
  const features: any[] = [];
  const sevWeight: Record<ThreatLevel, number> = { low: 0.2, moderate: 0.4, elevated: 0.6, high: 0.8, critical: 1.0 };

  function seededRandom(seed: number) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  data.forEach((pin, pinIdx) => {
    const intensity = sevWeight[pin.severity];
    features.push({
      type: 'Feature',
      properties: { intensity },
      geometry: { type: 'Point', coordinates: pin.coordinates },
    });
    for (let i = 0; i < 12; i++) {
      const seed = pinIdx * 100 + i;
      const angle = (i / 12) * Math.PI * 2 + seededRandom(seed) * 0.3;
      const dist = (0.3 + seededRandom(seed + 1) * 1.2) * intensity;
      features.push({
        type: 'Feature',
        properties: { intensity: intensity * (0.3 + seededRandom(seed + 2) * 0.5) },
        geometry: {
          type: 'Point',
          coordinates: [
            pin.coordinates[0] + Math.cos(angle) * dist,
            pin.coordinates[1] + Math.sin(angle) * dist,
          ],
        },
      });
    }
  });

  return { type: 'FeatureCollection' as const, features };
}

export function getConnectionLines(pins?: PinReport[]) {
  const data = pins ?? pinReports;
  const seen = new Set<string>();
  const features = data.flatMap((pin) =>
    pin.correlatedWith
      .map((targetId) => {
        const key = [pin.id, targetId].sort().join('-');
        if (seen.has(key)) return null;
        seen.add(key);
        const target = data.find((p) => p.id === targetId);
        if (!target) return null;
        return {
          type: 'Feature' as const,
          properties: { source: pin.id, target: targetId },
          geometry: {
            type: 'LineString' as const,
            coordinates: [pin.coordinates, target.coordinates],
          },
        };
      })
      .filter((f): f is NonNullable<typeof f> => f !== null)
  );

  return { type: 'FeatureCollection' as const, features };
}
