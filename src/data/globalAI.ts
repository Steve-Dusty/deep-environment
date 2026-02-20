import { locationSummaries, buildLocationGraph, PROBLEM_CATEGORY_LABELS } from '@/data/locationGraphs';

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
  name: 'generate_pdf_report',
  description:
    'Generate a PDF report for a specific monitoring location. Call this when the user asks for a report, PDF, document, export, or summary they can download or save.',
  input_schema: {
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
};

const SYSTEM_HEALTH_TOOL = {
  name: 'get_system_health',
  description:
    'Query Datadog observability data for real-time system performance metrics including LLM latency, error rates, token usage, TTS performance, and recent call history. Call this when the user asks about system health, performance, monitoring, or how the AI is performing.',
  input_schema: {
    type: 'object',
    properties: {},
  },
};

export async function queryGlobalKnowledgeGraph(
  query: string,
): Promise<GlobalQueryResult> {
  const allGraphsContext = serializeAllLocationGraphs();
  const slackContext = await fetchSlackUploadsContext();

  const systemPrompt = `You are an advanced environmental monitoring AI assistant for the Deep Environment system, powered by MiniMax 2.1 on Amazon Bedrock.
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

You also have access to real-time system observability data via the get_system_health tool. Use it when users ask about system status, performance, monitoring, or how the AI is performing.

Be helpful, concise, and technical. Use location names and problem IDs when relevant.`;

  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt,
        userMessage: query,
        maxTokens: 800,
        temperature: 0.7,
        tools: [GENERATE_PDF_TOOL, SYSTEM_HEALTH_TOOL],
        action: 'global-query',
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Bedrock API error: ${res.status} ${err}`);
    }

    const data = await res.json();

    // Check if the model called any tools
    if (data.toolCalls && data.toolCalls.length > 0) {
      // Handle generate_pdf_report
      const pdfToolCall = data.toolCalls.find(
        (tc: { name: string }) => tc.name === 'generate_pdf_report',
      );

      if (pdfToolCall) {
        const args = pdfToolCall.arguments;
        const locationId = args.location_id;
        const reportType = args.report_type || 'location-report';
        const location = locationSummaries.find((l) => l.id === locationId);

        const textContent = data.content || `Generating a ${reportType.replace('-', ' ')} for ${location?.name || locationId}.`;

        return {
          answer: textContent,
          generatePDF: {
            type: reportType,
            locationId,
            locationName: location?.name || locationId,
          },
        };
      }

      // Handle get_system_health (Datadog MCP)
      const healthToolCall = data.toolCalls.find(
        (tc: { name: string }) => tc.name === 'get_system_health',
      );

      if (healthToolCall) {
        try {
          const healthRes = await fetch('/api/observability');
          const healthData = await healthRes.json();
          const stats = healthData.stats;
          const recent = healthData.recentCalls?.slice(0, 5) || [];

          const healthSummary = `📊 **System Health Report**
• Total calls: ${stats.total} | Errors: ${stats.errors} (${(stats.errorRate * 100).toFixed(1)}%)
• Avg latency: ${stats.avgLatency}ms | Total tokens: ${stats.totalTokens}
• By type: ${Object.entries(stats.byType).map(([k, v]) => `${k}: ${v}`).join(', ')}
• Models: Text=${healthData.models.text}, Speech=${healthData.models.speech}, Narration=${healthData.models.narration}
${recent.length > 0 ? `• Recent: ${recent.map((r: any) => `[${r.type}] ${r.status} ${r.latencyMs}ms`).join(' | ')}` : '• No recent calls'}`;

          const textPart = data.content ? `${data.content}\n\n${healthSummary}` : healthSummary;
          return { answer: textPart };
        } catch {
          return { answer: data.content || 'System health data is currently unavailable.' };
        }
      }
    }

    // Normal text response
    return { answer: data.content?.trim() || '' };
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

const POSTER_ACCENTS = ['#00d4ff', '#00e68a', '#a78bfa', '#ffaa00', '#3b82f6'];

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
