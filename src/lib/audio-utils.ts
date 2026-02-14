import { log } from '@/lib/logger';

const TARGET_SAMPLE_RATE = 16000;

/**
 * Downsample audio from source rate to target rate (linear interpolation).
 */
function downsample(buffer: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return buffer;

  const ratio = fromRate / toRate;
  const newLength = Math.floor(buffer.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const low = Math.floor(srcIndex);
    const high = Math.min(low + 1, buffer.length - 1);
    const frac = srcIndex - low;
    result[i] = buffer[low] * (1 - frac) + buffer[high] * frac;
  }

  return result;
}

/**
 * Convert Float32 samples to Int16 PCM.
 */
function float32ToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    int16[i] = Math.max(-32768, Math.min(32767, Math.floor(float32[i] * 32768)));
  }
  return int16;
}

/**
 * Capture mic audio as PCM 16kHz mono and stream chunks via callback.
 * Handles resampling from the browser's native sample rate to 16kHz.
 * Returns a cleanup function to stop capture.
 */
export async function startMicCapture(
  onAudioChunk: (pcmData: ArrayBuffer) => void
): Promise<() => void> {
  log.debug('[MIC] Requesting microphone access...');

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });

  log.debug('[MIC] Microphone access granted');

  // Use the browser's native sample rate — don't try to force 16kHz
  const audioContext = new AudioContext();
  const nativeRate = audioContext.sampleRate;
  log.info(`[MIC] AudioContext sample rate: ${nativeRate}Hz (will resample to ${TARGET_SAMPLE_RATE}Hz)`);

  const source = audioContext.createMediaStreamSource(stream);
  const processor = audioContext.createScriptProcessor(4096, 1, 1);

  let chunkCount = 0;

  processor.onaudioprocess = (e) => {
    const float32 = e.inputBuffer.getChannelData(0);

    // Resample from native rate to 16kHz
    const resampled = downsample(float32, nativeRate, TARGET_SAMPLE_RATE);
    const int16 = float32ToInt16(resampled);

    chunkCount++;
    if (chunkCount % 50 === 1) {
      log.debug(`[MIC] Chunk #${chunkCount}: ${int16.length} samples (${int16.byteLength} bytes)`);
    }

    onAudioChunk(int16.buffer as ArrayBuffer);
  };

  source.connect(processor);
  processor.connect(audioContext.destination);

  log.info('[MIC] Audio capture started');

  return () => {
    log.info(`[MIC] Stopping capture after ${chunkCount} chunks`);
    processor.disconnect();
    source.disconnect();
    stream.getTracks().forEach((t) => t.stop());
    audioContext.close();
  };
}

/**
 * Audio playback manager — queues PCM chunks and plays them sequentially
 * using a single AudioContext.
 */
class AudioPlayer {
  private context: AudioContext | null = null;
  private nextPlayTime = 0;
  private chunkCount = 0;

  play(pcmData: ArrayBuffer, sampleRate = 24000) {
    if (!this.context || this.context.state === 'closed') {
      this.context = new AudioContext({ sampleRate });
      this.nextPlayTime = 0;
      log.debug(`[PLAYBACK] Created AudioContext at ${sampleRate}Hz`);
    }

    const int16 = new Int16Array(pcmData);
    if (int16.length === 0) return;

    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }

    const buffer = this.context.createBuffer(1, float32.length, sampleRate);
    buffer.getChannelData(0).set(float32);

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);

    const now = this.context.currentTime;
    const startTime = Math.max(now, this.nextPlayTime);
    source.start(startTime);
    this.nextPlayTime = startTime + buffer.duration;

    this.chunkCount++;
    if (this.chunkCount % 10 === 1) {
      log.debug(`[PLAYBACK] Chunk #${this.chunkCount}: ${int16.length} samples`);
    }
  }

  stop() {
    if (this.context && this.context.state !== 'closed') {
      this.context.close();
      log.debug(`[PLAYBACK] Closed after ${this.chunkCount} chunks`);
    }
    this.context = null;
    this.nextPlayTime = 0;
    this.chunkCount = 0;
  }
}

const audioPlayer = new AudioPlayer();

export function playPcmAudio(pcmData: ArrayBuffer, sampleRate = 24000) {
  audioPlayer.play(pcmData, sampleRate);
}

export function stopPlayback() {
  audioPlayer.stop();
}
