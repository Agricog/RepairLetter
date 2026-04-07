import { useState, useRef, useCallback, useEffect } from 'react';
import { api } from '../lib/api';
import { validateAudioFile } from '../lib/files';
import type { TranscriptionResult, UploadUrlResponse } from '../types';

export type RecorderState = 'idle' | 'recording' | 'uploading' | 'transcribing' | 'error';

interface UseVoiceRecorderReturn {
  state: RecorderState;
  duration: number;
  error: string | null;
  transcription: TranscriptionResult | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  reset: () => void;
}

/**
 * Voice recording hook using AudioWorklet for raw PCM capture.
 *
 * WHY AudioWorklet instead of MediaRecorder:
 * - MediaRecorder outputs compressed containers (WebM on Chrome, OGG on Firefox, MP4 on Safari)
 * - Converting these back to PCM via decodeAudioData() fails unpredictably across browsers
 * - Speechmatics themselves recommend AudioWorklet over MediaRecorder for PCM capture
 * - AudioWorklet runs on a dedicated audio thread — zero main-thread blocking
 * - Raw Float32 PCM → WAV encoding is trivial (44-byte header + samples) and cannot fail
 *
 * Flow:
 * 1. Request microphone → AudioContext at native rate → AudioWorklet captures raw PCM
 * 2. On stop: resample to 16kHz, encode as 16-bit PCM WAV
 * 3. Upload WAV to R2 (evidence storage)
 * 4. POST /api/transcribe → Speechmatics (primary) or Whisper (fallback)
 * 5. Return transcription with language detection + English translation
 *
 * Audio format: 16kHz mono 16-bit PCM WAV
 * - Universally supported by Speechmatics, Whisper, and all STT providers
 * - 16kHz captures the full human speech frequency range (0–8kHz Nyquist)
 * - Uncompressed PCM delivers the best word error rate (0% degradation)
 *
 * Sample rate strategy:
 * - Capture at the browser's native rate (typically 44.1kHz or 48kHz)
 * - Forcing 16kHz via AudioContext({ sampleRate }) produces silence on some hardware
 * - Resample to 16kHz in software after capture — reliable on every platform
 */
export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [state, setState] = useState<RecorderState>('idle');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const samplesRef = useRef<Float32Array[]>([]);
  const totalSamplesRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const stoppingRef = useRef(false);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (workletNodeRef.current) {
      workletNodeRef.current.port.postMessage({ command: 'stop' });
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscription(null);
    samplesRef.current = [];
    totalSamplesRef.current = 0;
    stoppingRef.current = false;

    try {
      // Use the browser's native sample rate for reliable mic capture.
      // Forcing 16kHz via AudioContext({ sampleRate }) produces silence
      // on some browser/hardware combinations. We resample to 16kHz
      // in software after capture — guaranteed to work on every platform.
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      // Load the AudioWorklet processor module
      // The worklet runs on a separate audio thread — no main thread blocking
      const workletUrl = new URL('/pcm-recorder-worklet.js', window.location.origin).href;
      await audioContext.audioWorklet.addModule(workletUrl);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,        // Mono — speech is not spatial
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      // Connect: Microphone → AudioWorklet
      const source = audioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioContext, 'pcm-recorder-processor');
      workletNodeRef.current = workletNode;

      // Receive raw PCM samples from the worklet thread
      workletNode.port.onmessage = (event: MessageEvent) => {
        if (event.data.type === 'audio' && !stoppingRef.current) {
          const samples = event.data.samples as Float32Array;
          samplesRef.current.push(samples);
          totalSamplesRef.current += samples.length;
        }
      };

      source.connect(workletNode);
      // AudioWorklet doesn't need to connect to destination — it's input-only
      // But some browsers require a connection to keep the graph alive
      workletNode.connect(audioContext.destination);

      // Tell the worklet to start capturing
      workletNode.port.postMessage({ command: 'start' });

      setState('recording');
      startTimeRef.current = Date.now();

      // Duration timer
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);

      // Auto-stop after 3 minutes
      setTimeout(() => {
        if (audioContextRef.current && !stoppingRef.current) {
          stopRecording();
        }
      }, 180000);
    } catch (err) {
      cleanup();
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access in your browser settings.');
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setError('Could not start recording. Please try again.');
      }
      setState('error');
    }
  }, [cleanup]);

  const stopRecording = useCallback(() => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;

    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setDuration(0);

    // Tell the worklet to flush any remaining samples and stop
    if (workletNodeRef.current) {
      workletNodeRef.current.port.postMessage({ command: 'stop' });
    }

    // Small delay to ensure the final flush message arrives
    setTimeout(() => {
      processRecording();
    }, 100);
  }, []);

  const processRecording = useCallback(async () => {
    const allChunks = samplesRef.current;
    const totalLength = totalSamplesRef.current;

    // Capture the native sample rate before cleanup closes the context
    const nativeSampleRate = audioContextRef.current?.sampleRate ?? 48000;

    // Clean up audio resources immediately — we have all the samples we need
    cleanup();

    if (totalLength === 0) {
      setError('No audio recorded. Please check your microphone and try again.');
      setState('error');
      return;
    }

    // Check minimum duration based on native sample rate
    const minSamples = nativeSampleRate; // 1 second of audio
    if (totalLength < minSamples) {
      setError('Recording too short. Please speak for at least a few seconds.');
      setState('error');
      return;
    }

    setState('uploading');

    try {
      // Concatenate all PCM chunks into a single Float32Array
      const allSamples = new Float32Array(totalLength);
      let offset = 0;
      for (const chunk of allChunks) {
        allSamples.set(chunk, offset);
        offset += chunk.length;
      }

      // Resample from native rate to 16kHz (optimal for speech recognition)
      const targetRate = 16000;
      const finalSamples = nativeSampleRate !== targetRate
        ? resample(allSamples, nativeSampleRate, targetRate)
        : allSamples;

      // Silence detection — warn user before wasting a Speechmatics call
      let sumSquares = 0;
      for (let i = 0; i < finalSamples.length; i++) {
        sumSquares += finalSamples[i]! * finalSamples[i]!;
      }
      const rms = Math.sqrt(sumSquares / finalSamples.length);
      if (rms < 0.005) {
        setError('No audio detected — your microphone may be muted or too far away. Please try again.');
        setState('error');
        return;
      }

      // Encode as 16-bit PCM WAV — this is pure math, cannot fail
      const wavBuffer = encodeWav(float32ToInt16(finalSamples), targetRate, 1);
      const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });

      // Validate
      const validation = validateAudioFile(wavBlob);
      if (!validation.valid) {
        setError(validation.error ?? 'Invalid audio file.');
        setState('error');
        return;
      }

      // Get upload URL
      const urlRes = await api.post<UploadUrlResponse>('/api/upload-url', {
        contentType: 'audio/wav',
      });

      if (!urlRes.success || !urlRes.data) {
        throw new Error(urlRes.error ?? 'Failed to get upload URL');
      }

      // Upload WAV to R2
      const audioFile = new File([wavBlob], 'recording.wav', { type: 'audio/wav' });
      const uploaded = await api.uploadToR2(urlRes.data.uploadUrl, audioFile);

      if (!uploaded) {
        throw new Error('Upload failed');
      }

      setState('transcribing');

      // Transcribe via Speechmatics (primary) / Whisper (fallback)
      const transcribeRes = await api.post<TranscriptionResult>('/api/transcribe', {
        r2Key: urlRes.data.r2Key,
      });

      if (!transcribeRes.success || !transcribeRes.data) {
        throw new Error(transcribeRes.error ?? 'Transcription failed. Please try again.');
      }

      setTranscription(transcribeRes.data);
      setState('idle');
    } catch (err) {
      console.error('Voice processing failed:', err);
      setError(err instanceof Error ? err.message : 'Processing failed. Please try again.');
      setState('error');
    }
  }, [cleanup]);

  const reset = useCallback(() => {
    cleanup();
    setState('idle');
    setDuration(0);
    setError(null);
    setTranscription(null);
    samplesRef.current = [];
    totalSamplesRef.current = 0;
    stoppingRef.current = false;
  }, [cleanup]);

  return {
    state,
    duration,
    error,
    transcription,
    startRecording,
    stopRecording,
    reset,
  };
}

// ─── Audio Processing Utilities ────────────────────────────
// Pure math operations — these cannot fail.

/**
 * Linear interpolation resampler.
 *
 * Converts audio from the browser's native sample rate (typically 44.1kHz
 * or 48kHz) down to 16kHz for speech recognition. Linear interpolation
 * is sufficient for speech — the frequency content above 8kHz (Nyquist
 * at 16kHz) is not useful for STT and can be safely discarded.
 */
function resample(
  samples: Float32Array,
  fromRate: number,
  toRate: number,
): Float32Array {
  if (fromRate === toRate) return samples;
  const ratio = fromRate / toRate;
  const newLength = Math.round(samples.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const srcFloor = Math.floor(srcIndex);
    const srcCeil = Math.min(srcFloor + 1, samples.length - 1);
    const fraction = srcIndex - srcFloor;
    result[i] = samples[srcFloor]! * (1 - fraction) + samples[srcCeil]! * fraction;
  }
  return result;
}

/**
 * Convert Float32Array audio samples to Int16Array (16-bit PCM).
 * Clamps values to [-1, 1] range before conversion.
 */
function float32ToInt16(samples: Float32Array): Int16Array {
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]!));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return pcm;
}

/**
 * Encode 16-bit PCM samples into a standards-compliant RIFF/WAVE file.
 *
 * WAV is the gold standard for speech-to-text:
 * - Universally supported by every STT provider
 * - No compression artifacts — 0% word error rate degradation
 * - Speechmatics recommends 16kHz sample rate for speech
 */
function encodeWav(
  samples: Int16Array,
  sampleRate: number,
  numChannels: number,
): ArrayBuffer {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);          // Chunk size
  view.setUint16(20, 1, true);           // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, bytesPerSample * 8, true);

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM samples
  for (let i = 0; i < samples.length; i++) {
    view.setInt16(44 + i * bytesPerSample, samples[i]!, true);
  }

  return buffer;
}

/**
 * Write an ASCII string to a DataView at a given offset.
 */
function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
