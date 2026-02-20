import { NextRequest, NextResponse } from 'next/server';
import { logNarrateCall } from '@/lib/datadog';

const OPENAI_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  if (!OPENAI_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  let type: string | undefined;

  try {
    const body = await req.json();
    const { pin, choiceLabel, choiceType } = body;
    type = body.type;

    let prompt = '';
    if (type === 'opening') {
      prompt = `You are a deep, warm male documentary narrator (like David Attenborough narrating an environmental film). Write a short opening narration (3-4 sentences max) for a scene showing:

Location: ${pin.neighborhood}, ${pin.city}
Issue: ${pin.title}
Category: ${pin.category}
Details: ${pin.summary}

Set the scene. Describe what we're seeing. End by hinting that we'll explore what restoration could look like. Write in second person ("you"). Be vivid but concise. No markdown, just plain spoken text.`;
    } else if (type === 'consequence') {
      prompt = `You are a documentary narrator. Write a very brief reaction (2 sentences max) after the viewer chose "${choiceLabel}" (a ${choiceType} action) for an environmental issue at ${pin.neighborhood}, ${pin.city} (${pin.title}). Describe what we're now seeing change in the environment. Be vivid. No markdown.`;
    } else if (type === 'finale') {
      const outcome = choiceType === 'positive' ? 'mostly restoration choices' : choiceType === 'negative' ? 'mostly inaction' : 'mixed choices';
      prompt = `You are a documentary narrator. Write a short closing narration (2-3 sentences) wrapping up an environmental visualization journey through ${pin.neighborhood}, ${pin.city} (${pin.title}). The viewer made ${outcome}. Reflect on what was shown and what's possible. Hopeful but grounded. No markdown.`;
    } else {
      return NextResponse.json({ error: 'Invalid narration type' }, { status: 400 });
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.8,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      logNarrateCall({ type: type || 'unknown', model: 'gpt-4o-mini', latencyMs: Date.now() - startTime, status: 'error', error: `OpenAI ${res.status}` });
      return NextResponse.json({ error: `OpenAI error: ${err}` }, { status: 502 });
    }

    const data = await res.json();
    const text = data.choices[0]?.message?.content?.trim() || '';

    logNarrateCall({ type: type || 'unknown', model: 'gpt-4o-mini', latencyMs: Date.now() - startTime, status: 'success' });

    return NextResponse.json({ text });
  } catch (e) {
    logNarrateCall({ type: type || 'unknown', model: 'gpt-4o-mini', latencyMs: Date.now() - startTime, status: 'error', error: e instanceof Error ? e.message : 'Unknown' });
    return NextResponse.json({ error: `Narration failed: ${e instanceof Error ? e.message : 'Unknown'}` }, { status: 500 });
  }
}
