import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function* streamChat(
  systemPrompt: string,
  history: Array<{ role: string; text: string }>,
  userMessage: string,
  imageBase64?: string
) {
  const contents = [];

  // Add conversation history
  for (const msg of history) {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    });
  }

  // Add current message (with optional image for Visual Decoder)
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
  if (imageBase64) {
    parts.push({
      inlineData: { mimeType: 'image/jpeg', data: imageBase64 },
    });
  }
  parts.push({ text: userMessage });
  contents.push({ role: 'user', parts });

  const response = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  });

  for await (const chunk of response) {
    const text = chunk.text;
    if (text) yield text;
  }
}
