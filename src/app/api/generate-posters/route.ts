import { NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY as string;
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent';

const POSTER_STYLES = [
  'Use a cyan and teal color palette with dark background.',
  'Use a green and emerald color palette with dark background.',
  'Use a purple and violet color palette with dark background.',
  'Use an amber and gold color palette with dark background.',
];

export async function POST(req: Request) {
  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ error: 'GOOGLE_API_KEY not configured' }, { status: 500 });
  }

  const { topic } = await req.json();
  if (!topic || typeof topic !== 'string') {
    return NextResponse.json({ error: 'topic is required' }, { status: 400 });
  }

  // Generate 4 poster images in parallel
  const promises = POSTER_STYLES.map(async (style, i) => {
    const prompt = `Create an educational poster about "${topic}". ${style} The poster should include a bold headline title, one key environmental fact or statistic, and a short call-to-action. Make it visually striking with an infographic style. Poster ${i + 1} of 4 — each should have a unique angle on the topic.`;

    const res = await fetch(`${GEMINI_URL}?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: { aspectRatio: '4:3' },
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`Nano Banana Pro error (poster ${i}):`, err);
      return null;
    }

    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts || [];

    let imageData: string | null = null;
    let mimeType = 'image/png';
    let text = '';

    for (const part of parts) {
      // Gemini returns camelCase keys (inlineData, mimeType)
      if (part.inlineData) {
        imageData = part.inlineData.data;
        mimeType = part.inlineData.mimeType || 'image/png';
      }
      if (part.text) {
        text = part.text;
      }
    }

    return { imageData, mimeType, text, index: i };
  });

  const results = await Promise.all(promises);
  const posters = results.filter(Boolean);

  return NextResponse.json({ posters });
}
