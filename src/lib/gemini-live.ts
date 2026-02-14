import { GoogleGenAI, Modality, type Session } from '@google/genai';
import { log } from '@/lib/logger';

const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';

/**
 * Client-side wrapper for Gemini Live API (real-time audio WebSocket).
 */
export class LiveAudioSession {
  private ai: GoogleGenAI;
  private session: Session | null = null;
  private _isConnected = false;
  private onAudioChunk: (data: ArrayBuffer) => void;
  private onTranscription: (text: string, isInput: boolean) => void;
  private onDisconnect: (() => void) | null;
  private msgCount = 0;
  private audioChunksReceived = 0;

  constructor(
    apiKey: string,
    onAudioChunk: (data: ArrayBuffer) => void,
    onTranscription: (text: string, isInput: boolean) => void,
    onDisconnect?: () => void
  ) {
    this.ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: 'v1alpha' } });
    this.onAudioChunk = onAudioChunk;
    this.onTranscription = onTranscription;
    this.onDisconnect = onDisconnect ?? null;
    log.debug('[GEMINI] LiveAudioSession created');
  }

  async connect(city: string, language: string) {
    log.info(`[GEMINI] Connecting to ${LIVE_MODEL} (city=${city}, lang=${language})`);

    const systemText = `You are a real-time voice assistant for a traveler in ${city}, India. The local language is ${language}. You have two modes:

## MODE 1: TRANSLATOR (default)
- When you hear English, speak ONLY the ${language} translation. Nothing else.
- When you hear ${language}, speak ONLY the English translation. Nothing else.
- Say the translation exactly once. Do NOT repeat it.
- Do NOT add commentary, explanations, or footnotes.
- Keep translations natural and conversational.
- Prioritize speed. Be concise.

## MODE 2: TAKEOVER
The user can ask you to "take over" the conversation (e.g. "take over for me", "handle this", "you talk to them", "negotiate for me"). When they do:
- Switch to speaking directly with the other person in ${language} ON BEHALF of the user.
- You become the user's representative. Negotiate, ask questions, respond — all in ${language}.
- Be friendly, culturally appropriate, and assertive when needed (e.g. haggling).
- If the user gives you instructions in English during takeover (e.g. "offer 500 rupees", "ask about the quality", "say no thanks"), follow them and speak to the other person in ${language} accordingly.
- When the other person speaks in ${language}, understand and respond to them directly in ${language}. Also briefly tell the user in English what was said and what you replied, so they stay informed.

## ENDING TAKEOVER
When the user says something like "I'll take it from here", "stop", "give me a summary", or "what happened":
- Switch back to translator mode.
- Give the user a brief English summary of the conversation: what was discussed, any prices agreed on, key points, and outcome.

## GENERAL
- If you can't understand the audio, say "Sorry, could you repeat that?" in the appropriate language.
- Stay in whichever mode you're in until explicitly told to switch.`;

    try {
      this.session = await this.ai.live.connect({
        model: LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: {
            parts: [{ text: systemText }],
          },
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onmessage: (msg) => {
            this.msgCount++;

            if (this.msgCount <= 5 || this.msgCount % 20 === 0) {
              const keys = Object.keys(msg.serverContent || {});
              log.debug(`[GEMINI] Message #${this.msgCount}, keys: [${keys.join(', ')}]`);
            }

            if (msg.serverContent?.modelTurn?.parts) {
              for (const part of msg.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                  this.audioChunksReceived++;
                  const binaryString = atob(part.inlineData.data);
                  const bytes = new Uint8Array(binaryString.length);
                  for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                  }
                  if (this.audioChunksReceived <= 3) {
                    log.debug(`[GEMINI] Audio chunk #${this.audioChunksReceived}: ${bytes.length} bytes`);
                  }
                  this.onAudioChunk(bytes.buffer);
                }
                if (part.text) {
                  log.debug(`[GEMINI] Model text: "${part.text.substring(0, 100)}"`);
                  this.onTranscription(part.text, false);
                }
              }
            }

            if (msg.serverContent?.inputTranscription?.text) {
              log.info(`[GEMINI] You said: "${msg.serverContent.inputTranscription.text}"`);
              this.onTranscription(msg.serverContent.inputTranscription.text, true);
            }

            if (msg.serverContent?.outputTranscription?.text) {
              log.info(`[GEMINI] Translated: "${msg.serverContent.outputTranscription.text}"`);
              this.onTranscription(msg.serverContent.outputTranscription.text, false);
            }
          },
          onclose: (e: CloseEvent) => {
            log.warn(`[GEMINI] WebSocket closed: code=${e.code}, reason="${e.reason}"`);
            this._isConnected = false;
            this.session = null;
            this.onDisconnect?.();
          },
          onerror: (e: ErrorEvent) => {
            log.error(`[GEMINI] WebSocket error:`, e.message || e);
            this._isConnected = false;
          },
        },
      });

      this._isConnected = true;
      log.info('[GEMINI] Connected successfully');
    } catch (err) {
      log.error('[GEMINI] Connection failed:', err);
      throw err;
    }
  }

  sendAudio(pcmData: ArrayBuffer) {
    if (!this.session || !this._isConnected) return;

    try {
      const uint8 = new Uint8Array(pcmData);
      let binary = '';
      for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      const base64 = btoa(binary);

      this.session.sendRealtimeInput({
        audio: {
          data: base64,
          mimeType: 'audio/pcm;rate=16000',
        },
      });
    } catch (err) {
      log.warn('[GEMINI] sendAudio failed, marking disconnected:', err);
      this._isConnected = false;
    }
  }

  disconnect() {
    log.info(`[GEMINI] Disconnecting (${this.msgCount} messages, ${this.audioChunksReceived} audio chunks received)`);
    this._isConnected = false;
    if (this.session) {
      try {
        this.session.close();
      } catch {
        // Already closed
      }
      this.session = null;
    }
  }

  get isConnected(): boolean {
    return this._isConnected;
  }
}
