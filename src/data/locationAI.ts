// ============================================================================
// Location-Aware AI Service
// Context-aware AI for location-specific problem graphs
// ============================================================================

import { type ProblemNode, type LocationGraph, PROBLEM_CATEGORY_LABELS, locationSummaries } from '@/data/locationGraphs';

const OPENAI_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY as string;
const API_URL = 'https://api.openai.com/v1/chat/completions';

async function chatCompletion(systemPrompt: string, userMessage: string, maxTokens = 500): Promise<string> {
  if (!OPENAI_KEY) return 'OpenAI API key not configured. Set NEXT_PUBLIC_OPENAI_API_KEY.';

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
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

function serializeLocationGraph(locationId: string, graphData: LocationGraph): string {
  const location = locationSummaries.find((l) => l.id === locationId);
  const problemList = graphData.problems.map((p) => {
    const parts = [`${p.id}: "${p.name}" (${PROBLEM_CATEGORY_LABELS[p.category]})`];
    parts.push(`severity=${p.severity}`);
    if (p.description) parts.push(p.description);
    if (p.causes?.length) parts.push(`causes: ${p.causes.join(', ')}`);
    if (p.indicators?.length) parts.push(`indicators: ${p.indicators.join(', ')}`);
    return parts.join(' | ');
  });

  const linkList = graphData.links.map((l) => `${l.source} --[${l.label}]--> ${l.target}`);

  return `LOCATION: ${location?.name || locationId}\nPROBLEMS:\n${problemList.join('\n')}\n\nLINKS:\n${linkList.join('\n')}`;
}

// ── Query location graph ────────────────────────────────────────────────────

export interface LocationQueryResult {
  problemId: string | null;
  answer: string;
}

export async function queryLocationGraph(
  query: string,
  locationId: string,
  graphData: LocationGraph,
): Promise<LocationQueryResult> {
  const graphContext = serializeLocationGraph(locationId, graphData);
  const location = locationSummaries.find((l) => l.id === locationId);

  const systemPrompt = `You are an environmental monitoring AI for Deep Environment.
You are analyzing problems at ${location?.name || locationId}.

${graphContext}

When the user asks a question:
1. Identify the most relevant problem ID to navigate to (if any).
2. Give a concise answer (2-3 sentences max).

Respond in this exact JSON format, nothing else:
{"problemId": "the-problem-id-or-null", "answer": "Your brief answer here"}`;

  try {
    const raw = await chatCompletion(systemPrompt, query, 300);
    const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    return { problemId: parsed.problemId || null, answer: parsed.answer || 'No answer generated.' };
  } catch (e) {
    return { problemId: null, answer: `Error: ${e instanceof Error ? e.message : 'Unknown'}` };
  }
}

// ── Analyze problem ─────────────────────────────────────────────────────────

export async function analyzeProblem(
  problem: ProblemNode,
  locationId: string,
  graphData: LocationGraph,
): Promise<string> {
  const graphContext = serializeLocationGraph(locationId, graphData);
  const location = locationSummaries.find((l) => l.id === locationId);

  const connections = graphData.links
    .filter((l) => l.source === problem.id || l.target === problem.id)
    .map((l) => {
      const otherId = l.source === problem.id ? l.target : l.source;
      const other = graphData.problems.find((p) => p.id === otherId);
      return `${l.label} → ${other?.name || otherId}`;
    });

  const systemPrompt = `You are an environmental monitoring AI analyst for Deep Environment.
Analyzing a problem at ${location?.name || locationId}.

${graphContext}`;

  const userMsg = `Analyze this problem:

Problem: ${problem.name} (${PROBLEM_CATEGORY_LABELS[problem.category]})
Location: ${location?.name || locationId}
Severity: ${problem.severity}
Description: ${problem.description}
${problem.causes?.length ? `Causes: ${problem.causes.join(', ')}` : ''}
${problem.indicators?.length ? `Indicators: ${problem.indicators.join(', ')}` : ''}
Connections: ${connections.join(', ') || 'none'}

Provide:
1. A 1-sentence status summary
2. Key risk factors (2-3 bullets)
3. Connected impact — how this problem affects others
4. Recommended action (1 sentence)

Keep it concise and technical. Use plain text, no markdown headers.`;

  try {
    return await chatCompletion(systemPrompt, userMsg, 500);
  } catch (e) {
    return `Analysis unavailable: ${e instanceof Error ? e.message : 'Unknown'}`;
  }
}

// ── Generate Plan to Fix ────────────────────────────────────────────────────

export async function generatePlanToFix(
  problem: ProblemNode,
  locationId: string,
  graphData: LocationGraph,
): Promise<string> {
  const graphContext = serializeLocationGraph(locationId, graphData);
  const location = locationSummaries.find((l) => l.id === locationId);

  const systemPrompt = `You are an environmental remediation AI planner for Deep Environment.
Creating a plan to fix a problem at ${location?.name || locationId}.

${graphContext}`;

  const userMsg = `Generate a Plan to Fix for:

Problem: ${problem.name}
Location: ${location?.name || locationId}
Severity: ${problem.severity}
Description: ${problem.description}
${problem.causes?.length ? `Causes: ${problem.causes.join(', ')}` : ''}

Provide a structured plan with:
1. STEPS (numbered list of actions)
2. PRIORITIES (order of execution)
3. EXPECTED IMPACT (metrics/outcomes)
4. TIMELINE (short-term and long-term)
5. RISKS (challenges to consider)

Use clear section headers and bullet points.`;

  try {
    return await chatCompletion(systemPrompt, userMsg, 800);
  } catch (e) {
    return `Plan generation unavailable: ${e instanceof Error ? e.message : 'Unknown'}`;
  }
}
