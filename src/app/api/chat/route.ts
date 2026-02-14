import { streamChat } from '@/lib/gemini';
import { SYSTEM_PROMPTS, LOCATION_UNKNOWN_INSTRUCTION } from '@/lib/prompts';
import { getPriceData } from '@/lib/price-data';
import type { PromptMode } from '@/lib/prompts';

// Allow streaming responses up to 60s on Vercel
export const maxDuration = 60;

const VALID_MODES = Object.keys(SYSTEM_PROMPTS) as PromptMode[];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // ~10MB base64
const MAX_HISTORY_LENGTH = 20;
const MAX_FIELD_LENGTH = 100;

export async function POST(req: Request) {
  // Safe JSON parsing
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { mode, message, imageBase64, history, city, language, script } = body;

  // Validate required fields
  if (!mode || typeof mode !== 'string' || !message || typeof message !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing mode or message' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate mode against known prompt modes
  if (!VALID_MODES.includes(mode as PromptMode)) {
    return new Response(JSON.stringify({ error: 'Invalid mode' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate imageBase64 size
  if (imageBase64 && (typeof imageBase64 !== 'string' || imageBase64.length > MAX_IMAGE_SIZE)) {
    return new Response(JSON.stringify({ error: 'Image too large' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Sanitize history
  const safeHistory = Array.isArray(history)
    ? history.slice(0, MAX_HISTORY_LENGTH).filter(
        (h: unknown) =>
          h && typeof h === 'object' &&
          typeof (h as Record<string, unknown>).role === 'string' &&
          typeof (h as Record<string, unknown>).text === 'string'
      )
    : [];

  // Sanitize string fields (city, language, script) — cap length to prevent prompt injection
  const safeCity = typeof city === 'string' ? city.slice(0, MAX_FIELD_LENGTH).trim() : '';
  const safeLang = typeof language === 'string' ? language.slice(0, MAX_FIELD_LENGTH).trim() : '';
  const safeScript = typeof script === 'string' ? script.slice(0, MAX_FIELD_LENGTH).trim() : '';

  // Select and customize system prompt
  let systemPrompt: string = SYSTEM_PROMPTS[mode as PromptMode];

  // Inject price data for haggling mode
  if (mode === 'hagglingCopilot') {
    systemPrompt = systemPrompt.replace('{PRICE_DATA}', JSON.stringify(getPriceData()));
  }

  // Handle location context
  const hasCity = safeCity && safeCity !== 'unknown';

  if (hasCity) {
    systemPrompt = systemPrompt.replaceAll('{CITY}', safeCity);
  } else {
    systemPrompt = systemPrompt.replaceAll('{CITY}', 'an unknown location in India');
    systemPrompt += LOCATION_UNKNOWN_INSTRUCTION;
  }

  // Inject language/script
  systemPrompt = systemPrompt.replaceAll('{LANGUAGE}', safeLang || 'Hindi');
  systemPrompt = systemPrompt.replaceAll('{SCRIPT}', safeScript || 'Devanagari');

  // Stream response as SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamChat(
          systemPrompt,
          safeHistory as Array<{ role: string; text: string }>,
          message as string,
          imageBase64 as string | undefined
        )) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`)
          );
        }
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
        );
        controller.close();
      } catch (error) {
        console.error('Chat streaming error:', error instanceof Error ? error.message : error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: 'Something went wrong. Please try again.' })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
