import { NextResponse } from 'next/server';
import { getObsBuffer, getObsStats } from '@/lib/datadog';

export async function GET() {
  const stats = getObsStats();
  const recentCalls = getObsBuffer().slice(-50).reverse();

  return NextResponse.json({
    service: 'deep-environment',
    timestamp: new Date().toISOString(),
    stats,
    recentCalls,
    models: {
      text: 'minimax.minimax-m2.1 (Bedrock)',
      speech: 'speech-2.8-hd (MiniMax)',
      narration: 'gpt-4o-mini (OpenAI)',
      posters: 'gemini-3-pro-image-preview (Google)',
    },
  });
}
