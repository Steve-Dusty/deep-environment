// ============================================================================
// Datadog Observability — Agentless log + metric shipping & in-memory buffer
// ============================================================================

const DD_API_KEY = process.env.DD_API_KEY || '';
const DD_SITE = process.env.DD_SITE || 'us5.datadoghq.com';

// ── In-memory ring buffer ───────────────────────────────────────────────────

export interface ObsEntry {
  type: 'llm' | 'tts' | 'narrate' | 'poster';
  timestamp: string;
  latencyMs: number;
  status: 'success' | 'error';
  error?: string;
  meta: Record<string, unknown>;
}

const MAX_BUFFER = 200;
const obsBuffer: ObsEntry[] = [];

export function pushObs(entry: ObsEntry) {
  obsBuffer.push(entry);
  if (obsBuffer.length > MAX_BUFFER) obsBuffer.shift();
}

export function getObsBuffer(): ObsEntry[] {
  return [...obsBuffer];
}

export function getObsStats() {
  const entries = getObsBuffer();
  const total = entries.length;
  const errors = entries.filter((e) => e.status === 'error').length;
  const errorRate = total > 0 ? +(errors / total).toFixed(3) : 0;
  const avgLatency =
    total > 0
      ? Math.round(entries.reduce((s, e) => s + e.latencyMs, 0) / total)
      : 0;
  const totalTokens = entries.reduce((s, e) => {
    const pt = (e.meta.promptTokens as number) || 0;
    const ct = (e.meta.completionTokens as number) || 0;
    return s + pt + ct;
  }, 0);
  const byType: Record<string, number> = {};
  for (const e of entries) {
    byType[e.type] = (byType[e.type] || 0) + 1;
  }
  return { total, errors, errorRate, avgLatency, totalTokens, byType };
}

// ── Datadog HTTP helpers (fire-and-forget) ──────────────────────────────────

async function ddLog(
  message: string,
  level: 'info' | 'warn' | 'error',
  attributes: Record<string, unknown>,
) {
  if (!DD_API_KEY) return;
  try {
    await fetch(`https://http-intake.logs.${DD_SITE}/api/v2/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': DD_API_KEY,
      },
      body: JSON.stringify([
        {
          ddsource: 'nodejs',
          ddtags: `env:${process.env.DD_ENV || 'hackathon'},service:deep-environment`,
          hostname: 'deep-env-next',
          service: 'deep-environment',
          status: level,
          message,
          ...attributes,
        },
      ]),
    });
  } catch {
    // swallow — fire-and-forget
  }
}

async function ddMetric(
  metric: string,
  value: number,
  tags: string[],
  type: 'gauge' | 'count' = 'gauge',
) {
  if (!DD_API_KEY) return;
  const now = Math.floor(Date.now() / 1000);
  try {
    await fetch(`https://api.${DD_SITE}/api/v2/series`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': DD_API_KEY,
      },
      body: JSON.stringify({
        series: [
          {
            metric,
            type: type === 'count' ? 1 : 3,
            points: [{ timestamp: now, value }],
            tags: ['service:deep-environment', `env:${process.env.DD_ENV || 'hackathon'}`, ...tags],
          },
        ],
      }),
    });
  } catch {
    // swallow — fire-and-forget
  }
}

// ── logLLMCall ──────────────────────────────────────────────────────────────

export interface LLMCallParams {
  action: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs: number;
  status: 'success' | 'error';
  error?: string;
  inputPreview?: string;
  outputPreview?: string;
}

export function logLLMCall(params: LLMCallParams) {
  const ts = new Date().toISOString();
  const tags = [
    `action:${params.action}`,
    `model:${params.model}`,
    `status:${params.status}`,
  ];

  // 1) In-memory buffer
  pushObs({
    type: 'llm',
    timestamp: ts,
    latencyMs: params.latencyMs,
    status: params.status,
    error: params.error,
    meta: {
      action: params.action,
      model: params.model,
      promptTokens: params.promptTokens,
      completionTokens: params.completionTokens,
      inputPreview: params.inputPreview,
      outputPreview: params.outputPreview,
    },
  });

  // 2) Console (local debugging)
  console.log('[DD_LLM_OBS]', JSON.stringify({ ts, ...params }));

  // 3) Datadog metrics (fire-and-forget)
  ddMetric('deep_env.llm.latency_ms', params.latencyMs, tags).catch(() => {});
  ddMetric('deep_env.llm.calls', 1, tags, 'count').catch(() => {});
  if (params.promptTokens) {
    ddMetric('deep_env.llm.prompt_tokens', params.promptTokens, tags).catch(() => {});
  }
  if (params.completionTokens) {
    ddMetric('deep_env.llm.completion_tokens', params.completionTokens, tags).catch(() => {});
  }
  if (params.status === 'error') {
    ddMetric('deep_env.llm.errors', 1, tags, 'count').catch(() => {});
  }

  // 4) Datadog structured log
  ddLog(`LLM call [${params.action}] ${params.status} ${params.latencyMs}ms`, params.status === 'error' ? 'error' : 'info', {
    llm: {
      action: params.action,
      model: params.model,
      promptTokens: params.promptTokens,
      completionTokens: params.completionTokens,
      latencyMs: params.latencyMs,
      status: params.status,
      error: params.error,
      inputPreview: params.inputPreview,
      outputPreview: params.outputPreview,
    },
  }).catch(() => {});
}

// ── logTTSCall ──────────────────────────────────────────────────────────────

export interface TTSCallParams {
  textLength: number;
  latencyMs: number;
  audioSize?: number;
  status: 'success' | 'error';
  error?: string;
}

export function logTTSCall(params: TTSCallParams) {
  const ts = new Date().toISOString();
  const tags = [`status:${params.status}`, 'model:speech-2.8-hd'];

  pushObs({
    type: 'tts',
    timestamp: ts,
    latencyMs: params.latencyMs,
    status: params.status,
    error: params.error,
    meta: { textLength: params.textLength, audioSize: params.audioSize },
  });

  console.log('[DD_TTS_OBS]', JSON.stringify({ ts, ...params }));

  ddMetric('deep_env.tts.latency_ms', params.latencyMs, tags).catch(() => {});
  ddMetric('deep_env.tts.calls', 1, tags, 'count').catch(() => {});
  if (params.audioSize) {
    ddMetric('deep_env.tts.audio_bytes', params.audioSize, tags).catch(() => {});
  }
  if (params.status === 'error') {
    ddMetric('deep_env.tts.errors', 1, tags, 'count').catch(() => {});
  }

  ddLog(`TTS call ${params.status} ${params.latencyMs}ms`, params.status === 'error' ? 'error' : 'info', {
    tts: {
      textLength: params.textLength,
      audioSize: params.audioSize,
      latencyMs: params.latencyMs,
      status: params.status,
      error: params.error,
    },
  }).catch(() => {});
}

// ── logNarrateCall ──────────────────────────────────────────────────────────

export interface NarrateCallParams {
  type: string;
  model: string;
  latencyMs: number;
  status: 'success' | 'error';
  error?: string;
}

export function logNarrateCall(params: NarrateCallParams) {
  const ts = new Date().toISOString();
  const tags = [
    `narration_type:${params.type}`,
    `model:${params.model}`,
    `status:${params.status}`,
  ];

  pushObs({
    type: 'narrate',
    timestamp: ts,
    latencyMs: params.latencyMs,
    status: params.status,
    error: params.error,
    meta: { narrateType: params.type, model: params.model },
  });

  console.log('[DD_NARRATE_OBS]', JSON.stringify({ ts, ...params }));

  ddMetric('deep_env.narrate.latency_ms', params.latencyMs, tags).catch(() => {});
  ddMetric('deep_env.narrate.calls', 1, tags, 'count').catch(() => {});
  if (params.status === 'error') {
    ddMetric('deep_env.narrate.errors', 1, tags, 'count').catch(() => {});
  }

  ddLog(`Narrate call [${params.type}] ${params.status} ${params.latencyMs}ms`, params.status === 'error' ? 'error' : 'info', {
    narrate: {
      type: params.type,
      model: params.model,
      latencyMs: params.latencyMs,
      status: params.status,
      error: params.error,
    },
  }).catch(() => {});
}

// ── logPosterCall ───────────────────────────────────────────────────────────

export interface PosterCallParams {
  topic: string;
  model: string;
  count: number;
  latencyMs: number;
  status: 'success' | 'error';
  error?: string;
}

export function logPosterCall(params: PosterCallParams) {
  const ts = new Date().toISOString();
  const tags = [`model:${params.model}`, `status:${params.status}`];

  pushObs({
    type: 'poster',
    timestamp: ts,
    latencyMs: params.latencyMs,
    status: params.status,
    error: params.error,
    meta: { topic: params.topic, model: params.model, count: params.count },
  });

  console.log('[DD_POSTER_OBS]', JSON.stringify({ ts, ...params }));

  ddMetric('deep_env.poster.latency_ms', params.latencyMs, tags).catch(() => {});
  ddMetric('deep_env.poster.calls', 1, tags, 'count').catch(() => {});
  ddMetric('deep_env.poster.count', params.count, tags).catch(() => {});
  if (params.status === 'error') {
    ddMetric('deep_env.poster.errors', 1, tags, 'count').catch(() => {});
  }

  ddLog(`Poster call ${params.status} ${params.latencyMs}ms (${params.count} posters)`, params.status === 'error' ? 'error' : 'info', {
    poster: {
      topic: params.topic,
      model: params.model,
      count: params.count,
      latencyMs: params.latencyMs,
      status: params.status,
      error: params.error,
    },
  }).catch(() => {});
}
