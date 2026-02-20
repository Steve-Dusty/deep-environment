import { NextRequest, NextResponse } from 'next/server';
import { logTTSCall } from '@/lib/datadog';

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MODEL_ID = 'speech-2.8-hd';
const VOICE_ID = 'male-qn-qingse'; // Deep male narrator voice

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  if (!MINIMAX_API_KEY) {
    return NextResponse.json({ error: 'MiniMax API key not configured' }, { status: 500 });
  }

  let text: string | undefined;

  try {
    const body = await req.json();
    text = body.text;
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    // MiniMax T2A v2 (Text-to-Audio) — international endpoint
    const res = await fetch('https://api.minimaxi.chat/v1/t2a_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL_ID,
        text,
        stream: false,
        voice_setting: {
          voice_id: VOICE_ID,
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
        audio_setting: {
          sample_rate: 32000,
          bitrate: 128000,
          format: 'mp3',
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('MiniMax TTS error:', res.status, err);
      logTTSCall({ textLength: text.length, latencyMs: Date.now() - startTime, status: 'error', error: `${res.status} ${err}` });
      return NextResponse.json({ error: `MiniMax TTS error: ${res.status} ${err}` }, { status: 502 });
    }

    const data = await res.json();

    // MiniMax returns hex-encoded audio in data.data.audio
    if (data.data?.audio) {
      const audioBuffer = Buffer.from(data.data.audio, 'hex');
      logTTSCall({ textLength: text.length, latencyMs: Date.now() - startTime, audioSize: audioBuffer.byteLength, status: 'success' });
      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // Fallback: audio_file at top level (older format)
    if (data.audio_file) {
      const audioBuffer = Buffer.from(data.audio_file, 'hex');
      logTTSCall({ textLength: text.length, latencyMs: Date.now() - startTime, audioSize: audioBuffer.byteLength, status: 'success' });
      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    console.error('Unexpected MiniMax TTS response:', JSON.stringify(data).slice(0, 500));
    logTTSCall({ textLength: text.length, latencyMs: Date.now() - startTime, status: 'error', error: 'Unexpected TTS response format' });
    return NextResponse.json({ error: 'Unexpected TTS response format' }, { status: 502 });
  } catch (e) {
    console.error('TTS failed:', e);
    logTTSCall({ textLength: text?.length || 0, latencyMs: Date.now() - startTime, status: 'error', error: e instanceof Error ? e.message : 'Unknown' });
    return NextResponse.json({ error: `TTS failed: ${e instanceof Error ? e.message : 'Unknown'}` }, { status: 500 });
  }
}
