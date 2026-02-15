// ============================================================================
// Global AI Service
// AI assistant with access to all knowledge graphs across all locations
// ============================================================================

import { locationSummaries, buildLocationGraph, type LocationGraph, PROBLEM_CATEGORY_LABELS } from './locationGraphs';

const OPENAI_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY as string;
const API_URL = 'https://api.openai.com/v1/chat/completions';

async function chatCompletion(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 800,
): Promise<string> {
  if (!OPENAI_KEY) {
    return 'OpenAI API key not configured. Please set NEXT_PUBLIC_OPENAI_API_KEY.';
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.choices[0]?.message?.content?.trim() || '';
}

// ── Serialize all location graphs for AI context ─────────────────────────

function serializeAllLocationGraphs(): string {
  const summaries = locationSummaries.map((loc) => {
    const graph = buildLocationGraph(loc.id);
    const problemList = graph.problems.map((p) => {
      const parts = [`${p.id}: "${p.name}" (${PROBLEM_CATEGORY_LABELS[p.category]})`];
      parts.push(`severity=${p.severity}`);
      if (p.description) parts.push(p.description);
      return parts.join(' | ');
    });

    return `LOCATION: ${loc.name} (${loc.id})
  Problems: ${graph.problems.length}
  Severity: ${loc.overallSeverity}
  Confidence: ${loc.confidence}%
  Problems:
${problemList.map((p) => `    - ${p}`).join('\n')}`;
  });

  return `ALL LOCATIONS AND THEIR KNOWLEDGE GRAPHS:

${summaries.join('\n\n')}`;
}

// ── Global Query Result ───────────────────────────────────────────────────

export interface GlobalQueryResult {
  answer: string;
  generatePDF?: {
    type: 'location-report' | 'knowledge-graph';
    locationId: string;
    locationName: string;
  };
}

// Check if query is requesting PDF generation
function isPDFRequest(query: string): { isPDF: boolean; locationId?: string; type?: 'location-report' | 'knowledge-graph' } {
  const lowerQuery = query.toLowerCase();
  const pdfKeywords = ['generate pdf', 'create pdf', 'export pdf', 'download pdf', 'pdf report', 'pdf document', 'make pdf'];
  const isPDF = pdfKeywords.some(keyword => lowerQuery.includes(keyword));
  
  if (!isPDF) {
    return { isPDF: false };
  }

  // Try to find location mentioned in query
  let locationId: string | undefined;
  for (const loc of locationSummaries) {
    if (lowerQuery.includes(loc.name.toLowerCase()) || lowerQuery.includes(loc.id.toLowerCase())) {
      locationId = loc.id;
      break;
    }
  }

  // If no location specified, use first location as default
  if (!locationId && locationSummaries.length > 0) {
    locationId = locationSummaries[0].id;
  }

  // Determine PDF type
  const type = (lowerQuery.includes('knowledge graph') || lowerQuery.includes('graph pdf'))
    ? 'knowledge-graph'
    : 'location-report';

  return { isPDF: true, locationId, type };
}

export async function queryGlobalKnowledgeGraph(
  query: string,
): Promise<GlobalQueryResult> {
  // Check if this is a PDF generation request
  const pdfCheck = isPDFRequest(query);
  if (pdfCheck.isPDF && pdfCheck.locationId) {
    const location = locationSummaries.find((l) => l.id === pdfCheck.locationId);
    return {
      answer: `I'll generate a ${pdfCheck.type === 'knowledge-graph' ? 'knowledge graph' : 'location report'} PDF for ${location?.name || pdfCheck.locationId}. Generating now...`,
      generatePDF: {
        type: pdfCheck.type || 'location-report',
        locationId: pdfCheck.locationId,
        locationName: location?.name || pdfCheck.locationId,
      },
    };
  }

  const allGraphsContext = serializeAllLocationGraphs();

  const systemPrompt = `You are an advanced environmental monitoring AI assistant for the Deep Environment system.
You have access to ALL knowledge graphs across ALL locations in the system.

${allGraphsContext}

You can:
- Answer questions about any location, problem, or relationship
- Compare problems across different locations
- Identify patterns and correlations
- Generate insights about environmental issues
- Help users understand the knowledge graph structure

When users request PDFs, you should identify which location they want and what type of PDF (location report or knowledge graph visualization).

Be helpful, concise, and technical. Use the location names and problem IDs when relevant.`;

  try {
    const raw = await chatCompletion(systemPrompt, query, 800);
    
    // Check if AI detected PDF request in response
    const lowerAnswer = raw.toLowerCase();
    if (lowerAnswer.includes('pdf') || lowerAnswer.includes('generate') || lowerAnswer.includes('export')) {
      // Try to extract location from answer
      let locationId: string | undefined;
      for (const loc of locationSummaries) {
        if (lowerAnswer.includes(loc.name.toLowerCase())) {
          locationId = loc.id;
          break;
        }
      }
      
      if (locationId) {
        const location = locationSummaries.find((l) => l.id === locationId);
        const type = lowerAnswer.includes('knowledge graph') || lowerAnswer.includes('graph')
          ? 'knowledge-graph'
          : 'location-report';
        
        return {
          answer: raw,
          generatePDF: {
            type,
            locationId,
            locationName: location?.name || locationId,
          },
        };
      }
    }

    return {
      answer: raw,
    };
  } catch (e) {
    console.error('Global query failed:', e);
    return {
      answer: `Error querying AI: ${e instanceof Error ? e.message : 'Unknown error'}`,
    };
  }
}

// ── Generate PDF ──────────────────────────────────────────────────────────

export async function generateGlobalPDF(
  locationId: string,
  type: 'location-report' | 'knowledge-graph',
): Promise<Blob> {
  const response = await fetch('/api/generate-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type,
      locationId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate PDF');
  }

  return await response.blob();
}
