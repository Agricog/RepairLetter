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
 * Voice recording hook using ScriptProcessorNode for raw PCM capture.
 *
 * WHY ScriptProcessorNode instead of AudioWorklet:
 * - Two different AudioWorklet implementations (custom + Speechmatics official)
 *   both produced intermittent silence on Chrome/macOS
 * - ScriptProcessorNode has worked reliably for 10+ years across all browsers
 * - For 10-30 second voice recordings, main-thread processing is fine
 * - Gives us raw Float32 PCM directly — no encoding, no container format
 * - Zero module loading, zero cross-thread messaging issues
 *
 * Flow:
 * 1. getUserMedia → AudioContext → ScriptProcessorNode captures raw PCM
 * 2. On stop: resample to 16kHz, encode as 16-bit PCM WAV
 * 3. Upload WAV to R2 (evidence storage)
 * 4. POST /api/transcribe → Speechmatics (primary) or Whisper (fallback)
 * 5. Return transcription with language detection + English translation
 *
 * Audio format sent to backend: 16kHz mono 16-bit PCM WAV
 */
export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [state, setState] = useState<RecorderState>('idle');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const samplesRef = useRef<Float32Array[]>([]);
  const totalSamplesRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const stoppingRef = useRef(false);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
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
      // Request microphone access FIRST — this is the user gesture boundary
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Create AudioContext AFTER we have the stream
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      // Ensure AudioContext is running (Chrome suspends until user gesture)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Connect: Microphone → ScriptProcessor
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      // Buffer size 4096 is a good balance: ~85ms at 48kHz
      // Smaller = more callbacks but lower latency
      // Larger = fewer callbacks but higher latency
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event: AudioProcessingEvent) => {
        if (stoppingRef.current) return;

        const inputData = event.inputBuffer.getChannelData(0);

        // Copy the samples — the input buffer is reused by the audio system
        const copy = new Float32Array(inputData.length);
        copy.set(inputData);

        samplesRef.current.push(copy);
        totalSamplesRef.current += copy.length;
      };

      source.connect(processor);
      // ScriptProcessorNode requires connection to destination to work
      processor.connect(audioContext.destination);

      setState('recording');
      startTimeRef.current = Date.now();

      // Duration timer
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);

      // Auto-stop after 3 minutes
      autoStopRef.current = setTimeout(() => {
        if (!stoppingRef.current) {
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
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
    setDuration(0);

    // Process immediately — ScriptProcessorNode is synchronous,
    // so all data is already in samplesRef
    processRecording();
  }, []);

  const processRecording = useCallback(async () => {
    const allChunks = samplesRef.current;
    const totalLength = totalSamplesRef.current;

    // Capture the native sample rate before cleanup closes the context
    const nativeSampleRate = audioContextRef.current?.sampleRate ?? 48000;

    // Clean up audio resources — we have all the samples we need
    cleanup();

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

