import { useState, useRef, useCallback, useEffect } from 'react';
import { PCMRecorder, type InputAudioEvent } from '@speechmatics/browser-audio-input';
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
 * Voice recording hook using Speechmatics' official browser-audio-input library.
 *
 * WHY this library instead of a custom AudioWorklet:
 * - Built and maintained by Speechmatics — the same company processing our audio
 * - Battle-tested across Chrome, Firefox, Safari, Edge, Android, iOS
 * - Handles AudioContext resuming, mic permissions, and all browser edge cases
 * - Captures raw Float32 PCM via AudioWorklet on a dedicated audio thread
 * - Zero main-thread blocking, zero format conversion issues
 *
 * Flow:
 * 1. PCMRecorder captures raw Float32 PCM from the microphone
 * 2. On stop: resample to 16kHz, encode as 16-bit PCM WAV
 * 3. Upload WAV to R2 (evidence storage)
 * 4. POST /api/transcribe → Speechmatics (primary) or Whisper (fallback)
 * 5. Return transcription with language detection + English translation
 *
 * Audio format sent to backend: 16kHz mono 16-bit PCM WAV
 */

// Path to Speechmatics' AudioWorklet processor script (copied to public/js/)
const WORKLET_URL = '/js/pcm-audio-worklet.min.js';

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [state, setState] = useState<RecorderState>('idle');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);

  const recorderRef = useRef<PCMRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const samplesRef = useRef<Float32Array[]>([]);
  const totalSamplesRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const stoppingRef = useRef(false);
  const audioListenerRef = useRef<((event: InputAudioEvent) => void) | null>(null);

  // Initialise the PCMRecorder once on mount
  useEffect(() => {
    recorderRef.current = new PCMRecorder(WORKLET_URL);
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // Remove the audio listener to prevent leaks
    if (recorderRef.current && audioListenerRef.current) {
      recorderRef.current.removeEventListener('audio', audioListenerRef.current as EventListener);
      audioListenerRef.current = null;
    }
    if (recorderRef.current?.isRecording) {
      recorderRef.current.stopRecording();
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!recorderRef.current) {
      setError('Audio recorder not initialised. Please refresh the page.');
      setState('error');
      return;
    }

    setError(null);
    setTranscription(null);
    samplesRef.current = [];
    totalSamplesRef.current = 0;
    stoppingRef.current = false;

    try {
      // Create a fresh AudioContext each session
      // Use the browser's native sample rate — we resample to 16kHz in software
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      // Ensure AudioContext is running (Chrome suspends until user gesture)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Listen for PCM audio events from the worklet
      // Speechmatics' library emits 'audio' events with data on event.data
      const onAudio = (event: InputAudioEvent) => {
        if (stoppingRef.current) return;
        const samples = event.data;
        if (samples && samples.length > 0) {
          samplesRef.current.push(new Float32Array(samples));
          totalSamplesRef.current += samples.length;
        }
      };

      // Store reference for cleanup
      audioListenerRef.current = onAudio;
      recorderRef.current.addEventListener('audio', onAudio as EventListener);

      // Start recording — Speechmatics' library handles:
      // - AudioWorklet module loading
      // - getUserMedia with optimal speech settings
      // - Cross-browser compatibility
      await recorderRef.current.startRecording({
        audioContext,
        recordingOptions: {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
        },
      });

      setState('recording');
      startTimeRef.current = Date.now();

      // Duration timer
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);

      // Auto-stop after 3 minutes
      setTimeout(() => {
        if (recorderRef.current?.isRecording && !stoppingRef.current) {
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
        console.error('Recording start failed:', err);
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

    // Stop recording via Speechmatics' library
    if (recorderRef.current?.isRecording) {
      recorderRef.current.stopRecording();
    }

    // Small delay to ensure final audio events arrive
    setTimeout(() => {
      processRecording();
    }, 200);
  }, []);

  const processRecording = useCallback(async () => {
    const allChunks = samplesRef.current;
    const totalLength = totalSamplesRef.current;

    // Capture the native sample rate before cleanup closes the context
    const nativeSampleRate = audioContextRef.current?.sampleRate ?? 48000;

    // Clean up audio resources — we have all the samples we need
    if (recorderRef.current && audioListenerRef.current) {
      recorderRef.current.removeEventListener('audio', audioListenerRef.current as EventListener);
      audioListenerRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (totalLength === 0) {
      setError('No audio recorded. Please check your microphone and try again.');
      setState('error');
      return;
    }

    // Check minimum duration — 1 second of audio
    const minSamples = nativeSampleRate;
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

      // Encode as 16-bit PCM WAV — pure math, cannot fail
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
  }, []);

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

/**
 * Linear interpolation resampler.
 * Converts from native browser rate (typically 48kHz) to 16kHz for STT.
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
 * Encode 16-bit PCM samples into a RIFF/WAVE file.
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

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, bytesPerSample * 8, true);

  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < samples.length; i++) {
    view.setInt16(44 + i * bytesPerSample, samples[i]!, true);
  }

  return buffer;
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

