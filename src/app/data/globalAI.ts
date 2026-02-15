import { locationSummaries, buildLocationGraph, PROBLEM_CATEGORY_LABELS } from './locationGraphs';

const OPENAI_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY as string;
const API_URL = 'https://api.openai.com/v1/chat/completions';

// ── Fetch live Slack upload data ────────────────────────────────────────────

async function fetchSlackUploadsContext(): Promise<string> {
  try {
    const res = await fetch('/api/slack-uploads');
    if (!res.ok) return '';
    const uploads = await res.json();
    if (!uploads || uploads.length === 0) return '';

    const lines = ['LIVE FIELD REPORTS (uploaded via Slack):'];
    for (const u of uploads) {
      const dt = new Date(u.timestamp * 1000).toLocaleString();
      const c = u.classification;
      if (c) {
        lines.push(
          `- [${dt}] ${c.problem_name} at ${c.resolved_location || u.user_city || 'Unknown'} ` +
          `(${c.latitude}, ${c.longitude}) | ${c.category} | severity: ${c.severity} | trend: ${c.trend} | ` +
          `${c.problem_description} | indicators: ${(c.indicators || []).join(', ')} | ` +
          `reported by: ${u.user} | location_id: ${c.location_id}`
        );
      } else {
        lines.push(
          `- [${dt}] ${u.original_name} uploaded by ${u.user}` +
          (u.user_city ? ` from ${u.user_city}` : '') +
          (u.ai_description ? ` — ${u.ai_description.slice(0, 200)}` : ' (pending classification)')
        );
      }
    }
    return '\n' + lines.join('\n');
  } catch {
    return '';
  }
}

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
  const slackContext = await fetchSlackUploadsContext();

  const systemPrompt = `You are an advanced environmental monitoring AI assistant for the Deep Environment system.
You have access to ALL knowledge graphs across ALL locations in the system, plus live field reports uploaded via Slack.

${allGraphsContext}
${slackContext}

You can:
- Answer questions about any location, problem, or relationship
- Reference live field reports uploaded by users (including specific places like universities, parks, neighborhoods)
- Compare problems across different locations
- Identify patterns and correlations
- Generate insights about environmental issues
- Generate PDF reports for locations when the user asks for one

When a user asks about a specific place (e.g. "SFSU", "Golden Gate Park"), check the live field reports first — they contain real data from that exact location.

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

// ── Poster Generation (Nano Banana Pro) ────────────────────────────────────

export interface PosterCard {
  id: string;
  imageDataUrl: string;
  text: string;
  accentColor: string;
}

const POSTER_ACCENTS = ['#06b6d4', '#22c55e', '#a78bfa', '#f59e0b', '#3b82f6'];

export async function generatePosterContent(topic: string): Promise<PosterCard[]> {
  const res = await fetch('/api/generate-posters', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `API error: ${res.status}`);
  }

  const data = await res.json();

  return (data.posters || []).map(
    (p: { imageData: string; mimeType: string; text: string; index: number }) => ({
      id: `poster-${Date.now()}-${p.index}`,
      imageDataUrl: `data:${p.mimeType};base64,${p.imageData}`,
      text: p.text || '',
      accentColor: POSTER_ACCENTS[p.index % POSTER_ACCENTS.length],
    }),
  );
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
