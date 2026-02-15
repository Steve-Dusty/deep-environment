# Knowledge Graph Section Implementation Notes

## Overview
The Knowledge Graph section has been refactored to be location-centric and problem-centric. The main screen is now a Locations Dashboard that lists all locations, and each location has its own knowledge graph where nodes represent micro-problems (not locations).

## Routing Structure

### Knowledge Graph Section Routes
- **Landing**: `/` → Click "Knowledge Graph" button → Shows `LocationsDashboard`
- **Location Detail**: `LocationsDashboard` → Select location → Shows `LocationDetailView` for that location
- **Navigation**: Users can exit back to `LocationsDashboard` and select another location

### Components

1. **LocationsDashboard** (`src/app/components/LocationsDashboard.tsx`)
   - Replaces the previous global Knowledge Graph main screen
   - Displays all locations with summaries (active problems count, severity, last updated, confidence)
   - Mapbox is NOT the primary focus (can be added as a secondary tab/panel if needed)
   - Users select a location to navigate to its detail view

2. **LocationDetailView** (`src/app/components/LocationDetailView.tsx`)
   - Shows the knowledge graph for a single selected location
   - Graph nodes represent micro-problems (Pollution, Deforestation, Runoff, Wildfire, etc.)
   - Includes AI/RL interaction panel that is context-aware of:
     - Which location is selected
     - Which problem node (if any) is selected
   - Can generate a "Plan to Fix" for the selected location/problem

3. **LocationGraph3D** (`src/app/components/LocationGraph3D.tsx`)
   - 3D force-directed graph visualization for location-specific problems
   - Based on `react-force-graph-3d` and `three.js`
   - Nodes represent problems, links represent relationships (causes, amplifies, mitigates, correlates)

## Data Structure

### Location Graphs (`src/app/data/locationGraphs.ts`)
- **LocationSummary**: High-level location info (id, name, coordinates, problem counts, severity, confidence)
- **ProblemNode**: Represents a micro-problem at a location
  - Properties: id, name, category, severity, description, causes, indicators, evidence, stakeholders, interventions, trend, confidence
- **ProblemLink**: Relationships between problems (causes, amplifies, mitigates, correlates)
- **LocationGraph**: Complete graph for a location (problems + links)

### Location-Specific Problem Categories
- pollution
- deforestation
- runoff
- wildfire
- litter
- erosion
- invasive
- drought
- contamination
- other

## AI/RL Integration

### Location-Aware AI (`src/app/data/locationAI.ts`)
- **queryLocationGraph**: Natural language queries about location problems (context-aware)
- **analyzeProblem**: Deep analysis of a selected problem at a location
- **generatePlanToFix**: Creates structured remediation plan with:
  - Steps (numbered, actionable)
  - Priorities
  - Expected impact
  - Timeline
  - Risks/tradeoffs

### RL Recommendations
- Shown in the Location Detail View right panel
- Provides policy suggestions and action priorities
- Currently stubbed but structured for future RL integration

## Extending Location/Problem Data

### Adding a New Location
1. Add a `LocationSummary` to `locationSummaries` array in `src/app/data/locationGraphs.ts`
2. Add problem templates in `buildLocationGraph()` function for the new location ID
3. Problems will automatically appear in the graph

### Adding Problems to a Location
1. Edit `buildLocationGraph()` in `src/app/data/locationGraphs.ts`
2. Add problem templates to the appropriate location's `problemTemplates` entry
3. Add links between problems as needed

### Example Problem Structure
```typescript
{
  id: 'prob-loc-name',
  name: 'Problem Name',
  category: 'pollution',
  severity: 'critical',
  description: 'Detailed description',
  causes: ['Cause 1', 'Cause 2'],
  indicators: ['Indicator 1', 'Indicator 2'],
  evidence: [
    { type: 'observation', description: 'Evidence description', timestamp: '2m ago' }
  ],
  trend: 'worsening',
  confidence: 95,
  lastUpdated: '2m ago',
}
```

## Key Design Decisions

1. **One Graph Per Location**: Each location has its own isolated knowledge graph
2. **Problems as Nodes**: Top-level nodes are micro-problems, not locations
3. **Context-Aware AI**: AI interactions know which location and problem are selected
4. **Dashboard-First UX**: Locations Dashboard is the entry point, not a global map
5. **No Multiple Graphs**: Only one location's graph is shown at a time

## Future Enhancements

- Add Mapbox as a secondary tab/panel in Locations Dashboard (not primary)
- Implement full RL agent recommendations with predicted outcomes
- Add drill-down subgraphs for problem details
- Support problem evidence images/observations display
- Add intervention tracking and status updates
