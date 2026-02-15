import { locationSummaries, buildLocationGraph, PROBLEM_CATEGORY_LABELS } from './locationGraphs';

const OPENAI_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY as string;
const API_URL = 'https://api.openai.com/v1/chat/completions';

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

  return `ALL LOCATIONS AND THEIR KNOWLEDGE GRAPHS:\n\n${summaries.join('\n\n')}`;
}

export interface GlobalQueryResult {
  answer: string;
  generatePDF?: {
    type: 'location-report' | 'knowledge-graph';
    locationId: string;
    locationName: string;
  };
}

const GENERATE_PDF_TOOL = {
  type: 'function' as const,
  function: {
    name: 'generate_pdf_report',
    description:
      'Generate a PDF report for a specific monitoring location. Call this when the user asks for a report, PDF, document, export, or summary they can download or save.',
    parameters: {
      type: 'object',
      properties: {
        location_id: {
          type: 'string',
          description: 'The location ID to generate the report for.',
          enum: locationSummaries.map((l) => l.id),
        },
        report_type: {
          type: 'string',
          enum: ['location-report', 'knowledge-graph'],
          description:
            'Type of report. Use "location-report" for general reports. Use "knowledge-graph" if the user specifically asks about graph structure or relationships.',
        },
      },
      required: ['location_id', 'report_type'],
    },
  },
};

export async function queryGlobalKnowledgeGraph(
  query: string,
): Promise<GlobalQueryResult> {
  if (!OPENAI_KEY) {
    return { answer: 'OpenAI API key not configured. Please set NEXT_PUBLIC_OPENAI_API_KEY.' };
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
- Generate PDF reports for locations when the user asks for one

You have a tool called generate_pdf_report. Use it whenever the user wants a report, PDF, document, export, or anything they'd want to download/save. Decide the best matching location based on context.

Be helpful, concise, and technical. Use location names and problem IDs when relevant.`;

  try {
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
          { role: 'user', content: query },
        ],
        tools: [GENERATE_PDF_TOOL],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error: ${res.status} ${err}`);
    }

    const data = await res.json();
    const choice = data.choices[0];
    const message = choice.message;

    // Check if the model called the generate_pdf_report tool
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls.find(
        (tc: { function: { name: string } }) => tc.function.name === 'generate_pdf_report',
      );

      if (toolCall) {
        const args = JSON.parse(toolCall.function.arguments);
        const locationId = args.location_id;
        const reportType = args.report_type || 'location-report';
        const location = locationSummaries.find((l) => l.id === locationId);

        // The model may also have content alongside the tool call
        const textContent = message.content || `Generating a ${reportType.replace('-', ' ')} for ${location?.name || locationId}.`;

        return {
          answer: textContent,
          generatePDF: {
            type: reportType,
            locationId,
            locationName: location?.name || locationId,
          },
        };
      }
    }

    // Normal text response
    return { answer: message.content?.trim() || '' };
  } catch (e) {
    console.error('Global query failed:', e);
    return {
      answer: `Error querying AI: ${e instanceof Error ? e.message : 'Unknown error'}`,
    };
  }
}

export async function generateGlobalPDF(
  locationId: string,
  type: 'location-report' | 'knowledge-graph',
): Promise<Blob> {
  const response = await fetch('/api/generate-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, locationId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate PDF');
  }

  return await response.blob();
}
