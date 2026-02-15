// ============================================================================
// AI Service — OpenAI integration for graph queries and node analysis
// ============================================================================

import { GraphNode, GraphLink, GraphData, CATEGORY_LABELS } from './graphData';

const OPENAI_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY as string;
const API_URL = 'https://api.openai.com/v1/chat/completions';

async function chatCompletion(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 500,
): Promise<string> {
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

// ── Serialize graph state for AI context ───────────────────────────────────

function serializeGraph(graphData: GraphData): string {
  const nodeList = graphData.nodes.map((n) => {
    const parts = [`${n.id}: "${n.name}" (${CATEGORY_LABELS[n.category]})`];
    if (n.threatLevel) parts.push(`threat=${n.threatLevel}`);
    if (n.description) parts.push(n.description);
    if (n.metadata) {
      Object.entries(n.metadata).forEach(([k, v]) => parts.push(`${k}=${v}`));
    }
    return parts.join(' | ');
  });

  const linkList = graphData.links.map((l) => {
    const s = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
    const t = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;
    return `${s} --[${l.label || 'linked'}]--> ${t}`;
  });

  return `NODES:\n${nodeList.join('\n')}\n\nLINKS:\n${linkList.join('\n')}`;
}

// ── Query: find relevant node from natural language ────────────────────────

export interface QueryResult {
  nodeId: string | null;
  answer: string;
}

export async function queryGraph(
  query: string,
  graphData: GraphData,
): Promise<QueryResult> {
  const graphContext = serializeGraph(graphData);

  const systemPrompt = `You are an environmental monitoring AI assistant for the Deep Environment knowledge graph.
You have access to the current graph state below.

${graphContext}

When the user asks a question:
1. Identify the most relevant node ID to navigate to (if any).
2. Give a concise answer (2-3 sentences max).

IMPORTANT: Respond in this exact JSON format, nothing else:
{"nodeId": "the-node-id-or-null", "answer": "Your brief answer here"}

If no specific node is relevant, set nodeId to null.`;

  try {
    const raw = await chatCompletion(systemPrompt, query, 300);
    // Parse JSON from response (handle markdown wrapping)
    const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    return {
      nodeId: parsed.nodeId || null,
      answer: parsed.answer || 'No answer generated.',
    };
  } catch (e) {
    console.error('Query failed:', e);
    return {
      nodeId: null,
      answer: `Error querying AI: ${e instanceof Error ? e.message : 'Unknown error'}`,
    };
  }
}

// ── Deep analysis: rich breakdown of a selected node ───────────────────────

export async function analyzeNode(
  node: GraphNode,
  graphData: GraphData,
): Promise<string> {
  const graphContext = serializeGraph(graphData);

  // Find connected nodes
  const connections = graphData.links
    .filter((l) => {
      const s = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
      const t = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;
      return s === node.id || t === node.id;
    })
    .map((l) => {
      const s = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
      const t = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;
      const otherId = s === node.id ? t : s;
      const otherNode = graphData.nodes.find((n) => n.id === otherId);
      return `${l.label || 'linked'} → ${otherNode?.name || otherId}`;
    });

  const systemPrompt = `You are an environmental monitoring AI analyst for the Deep Environment system.
You have access to the full knowledge graph state:

${graphContext}

The user has selected a specific node. Provide a deep, expert analysis.`;

  const userMsg = `Analyze this node in depth:

Node: ${node.name} (${CATEGORY_LABELS[node.category]})
ID: ${node.id}
${node.threatLevel ? `Threat Level: ${node.threatLevel}` : ''}
${node.description || ''}
${node.metadata ? `Metadata: ${JSON.stringify(node.metadata)}` : ''}
Connections: ${connections.join(', ') || 'none'}

Provide:
1. A 1-sentence status summary
2. Key risk factors (2-3 bullets)
3. Connected impact — how this node affects others in the graph
4. Recommended action (1 sentence)

Keep it concise and technical. Use plain text, no markdown headers.`;

  try {
    return await chatCompletion(systemPrompt, userMsg, 500);
  } catch (e) {
    console.error('Analysis failed:', e);
    return `Analysis unavailable: ${e instanceof Error ? e.message : 'Unknown error'}`;
  }
}
