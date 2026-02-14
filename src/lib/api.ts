/**
 * API bridge layer.
 *
 * The frontend components use mode names like 'context', 'haggling', 'visual', 'audio'
 * and expect interfaces like ChatRequest / ChatResponse with specific field names.
 *
 * Our Next.js API routes use mode names like 'contextBridge', 'hagglingCopilot', etc.
 * and stream SSE in the format { text: "..." } + { done: true }.
 *
 * This module bridges the gap so hooks/components don't need to know about
 * the backend format.
 */

import { getLanguageForCity } from '@/lib/language-map';

// ── Mode mapping ──────────────────────────────────────────────────────────────

type FrontendMode = 'context' | 'haggling' | 'visual' | 'audio';
type BackendMode = 'contextBridge' | 'hagglingCopilot' | 'visualDecoder' | 'audioBridge';

const MODE_MAP: Record<FrontendMode, BackendMode> = {
  context: 'contextBridge',
  haggling: 'hagglingCopilot',
  visual: 'visualDecoder',
  audio: 'audioBridge',
};

// ── Exported interfaces (what the hooks expect) ───────────────────────────────

export interface ChatRequest {
  mode: FrontendMode;
  message: string;
  city: string;
  targetLanguage?: string;
  targetScript?: string;
  imageBase64?: string;
}

export interface ChatResponse {
  content: string;
  explanation?: string;
  priceCard?: {
    item: string;
    localPrice: string;
    touristPrice: string;
    openingOffer: string;
    walkAwayPrice: string;
  };
  culturalNotes?: Array<{
    type: 'info' | 'warning' | 'tip';
    content: string;
  }>;
}

export interface AudioSessionRequest {
  city: string;
  targetLanguage: string;
  direction: 'outgoing' | 'incoming';
}

export interface AudioSessionResponse {
  token: string;
  model: string;
  city: string;
}

// ── Conversation history (kept per-session for context) ───────────────────────

let conversationHistory: Array<{ role: string; text: string }> = [];
const MAX_HISTORY = 20;

export function clearHistory() {
  conversationHistory = [];
}

// ── API functions ─────────────────────────────────────────────────────────────

/**
 * Send a chat message (non-streaming). Calls our /api/chat and collects the
 * full SSE stream into a single ChatResponse.
 */
export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  let fullText = '';

  for await (const chunk of streamChatMessage(request)) {
    fullText += chunk;
  }

  return { content: fullText };
}

/**
 * Stream chat response from our /api/chat endpoint.
 *
 * Bridges:
 *  - Frontend mode ('context') → backend mode ('contextBridge')
 *  - Our SSE format: data: {"text":"..."}\n\n  ...  data: {"done":true}\n\n
 *  - Image upload: sends base64 in JSON body (not FormData)
 */
export async function* streamChatMessage(request: ChatRequest): AsyncGenerator<string> {
  const { language, script } = getLanguageForCity(request.city);

  const body = {
    mode: MODE_MAP[request.mode],
    message: request.message,
    imageBase64: request.imageBase64,
    history: conversationHistory.slice(-10),
    city: request.city,
    language: request.targetLanguage || language,
    script: request.targetScript || script,
  };

  // Add user message to history and trim
  conversationHistory.push({ role: 'user', text: request.message });
  if (conversationHistory.length > MAX_HISTORY) {
    conversationHistory = conversationHistory.slice(-MAX_HISTORY);
  }

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('Response body is not readable');
  }

  let fullResponse = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          try {
            const parsed = JSON.parse(data);

            if (parsed.done) {
              // Stream complete
              conversationHistory.push({ role: 'model', text: fullResponse });
              return;
            }

            if (parsed.error) {
              throw new Error(parsed.error);
            }

            if (parsed.text) {
              fullResponse += parsed.text;
              yield parsed.text;
            }
          } catch (e) {
            if (e instanceof SyntaxError) {
              // Skip invalid JSON lines
              // Skip invalid JSON lines (e.g. empty lines between SSE events)
            } else {
              throw e;
            }
          }
        }
      }
    }

    // If we got here without a done signal, still save history
    if (fullResponse) {
      conversationHistory.push({ role: 'model', text: fullResponse });
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Initialize an audio session. Calls our /api/audio route.
 */
export async function initAudioSession(request: AudioSessionRequest): Promise<AudioSessionResponse> {
  const response = await fetch('/api/audio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city: request.city }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Convert an image File to base64 for sending in the JSON body.
 */
export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
