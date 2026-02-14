import { GoogleGenAI } from '@google/genai';

const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.city !== 'string' || !body.city.trim()) {
      return Response.json({ error: 'Missing or invalid city' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    // Generate a short-lived ephemeral token instead of exposing the raw API key.
    // The token is single-use and expires quickly.
    const ai = new GoogleGenAI({ apiKey });
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
        httpOptions: { apiVersion: 'v1alpha' },
      },
    });

    return Response.json({
      token: token.name,
      model: LIVE_MODEL,
      city: body.city.trim(),
    });
  } catch (error) {
    console.error('Audio session error:', error);
    return Response.json({ error: 'Failed to create audio session' }, { status: 500 });
  }
}
