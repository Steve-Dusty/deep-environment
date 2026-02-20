// ============================================================================
// AI Service — MiniMax 2.1 on Amazon Bedrock for graph queries and node analysis
// ============================================================================

import { GraphNode, GraphLink, GraphData, CATEGORY_LABELS } from '@/data/graphData';
import { pinReports } from '@/data/locations';

async function chatCompletion(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 500,
): Promise<string> {
  console.log('🔑 Using MiniMax 2.1 on Amazon Bedrock');
  console.log('📤 Sending request to Bedrock...');

  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemPrompt,
      userMessage,
      maxTokens,
      temperature: 0.3,
      action: 'graph-query',
    }),
  });

  console.log('📥 Response status:', res.status, res.statusText);

  if (!res.ok) {
    const err = await res.text();
    console.error('❌ Bedrock API error:', res.status, err);
    throw new Error(`Bedrock API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  console.log('✅ Bedrock response received (model:', data.model, 'latency:', data.latencyMs + 'ms)');
  return data.content?.trim() || '';
}

// ── Quick Test Function ─────────────────────────────────────────────────────

export async function testBedrockConnection(): Promise<string> {
  try {
    const response = await chatCompletion(
      'You are a helpful assistant. Answer in one short sentence.',
      'What is a banana?',
      50
    );
    return `✅ Bedrock API working! Response: "${response}"`;
  } catch (error) {
    return `❌ Bedrock API failed: ${error instanceof Error ? error.message : String(error)}`;
  }
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

// ── AI Command Interpreter: Fully AI-powered voice control ─────────────────

export interface AICommandResult {
  action: string;
  target?: string;
  confidence: number;
  reasoning?: string;
}

export async function interpretVoiceCommand(
  userSpeech: string,
): Promise<AICommandResult> {
  const locationsList = pinReports.map(p =>
    `- ${p.id}: ${p.neighborhood} (${p.city}, ${p.state}) - ${p.title} [${p.category}, ${p.severity}]`
  ).join('\n');

  const systemPrompt = `You are the AI brain for Deep Environment's voice control system. Interpret natural language commands and return structured actions.

═══ AVAILABLE LOCATIONS ═══
${locationsList}

═══ ALL AVAILABLE ACTIONS ═══

Navigation & Views:
• "navigate" (target: location-id or name) - Go to specific location
• "view-map" - Switch to map view
• "view-graph" - Switch to 3D knowledge graph
• "view-odyssey" - Switch to Odyssey immersive view
• "view-feed" - Show location feed sidebar
• "view-agents" - Show AI agents panel
• "odyssey-location" (target: location) - Go to Odyssey for specific location
• "next-pin" - Navigate to next location
• "prev-pin" - Navigate to previous location

Map Overlays (use "enable" or "disable" action with target):
• "enable" (target: satellite) - Enable satellite imagery
• "enable" (target: terrain) - Enable 3D terrain
• "enable" (target: weather) - Enable precipitation/weather data
• "enable" (target: heatmap) - Enable threat heat map
• "enable" (target: globe) - Enable globe view
• "disable" (target: satellite/terrain/weather/heatmap/globe) - Disable specific overlay
• "enable-all" - Enable all overlays at once
• "disable-all" - Disable all overlays at once

Filters:
• "filter-category" (target: Air|Water|Land|Bio|Climate) - Filter by category
• "filter-severity" (target: critical|high|medium|low) - Filter by severity
• "clear-filters" - Reset all filters

Zoom:
• "zoom-in" - Zoom closer
• "zoom-out" - Zoom further

Information:
• "describe-location" (target: location) - Get location details
• "agent-count" - How many AI agents are active
• "list-high" - List high-severity threats
• "list-category" (target: category) - List threats in category
• "help" - Show available commands

Special:
• "stop" - Stop voice control (emergency)
• "unknown" - When you can't interpret the command

═══ RESPONSE FORMAT ═══
ALWAYS respond with ONLY valid JSON (no markdown, no explanation):

{
  "action": "action-name",
  "target": "optional-target-value",
  "confidence": 85,
  "reasoning": "Brief explanation of interpretation"
}

Now interpret the user's command:`;

  try {
    const raw = await chatCompletion(systemPrompt, userSpeech, 250);
    const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    return {
      action: parsed.action || 'unknown',
      target: parsed.target,
      confidence: parsed.confidence || 50,
      reasoning: parsed.reasoning,
    };
  } catch (e) {
    console.error('❌ AI command interpretation failed:', e);
    console.error('Full error:', e);
    return { action: 'unknown', confidence: 0, reasoning: 'AI interpretation error' };
  }
}
