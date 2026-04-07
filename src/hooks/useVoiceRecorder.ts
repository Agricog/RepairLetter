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
 * Hook for recording voice notes via the browser's MediaRecorder API.
 *
 * Flow:
 * 1. Request microphone permission
 * 2. Record audio (browser chooses best container — OGG, WebM, or MP4)
 * 3. On stop: convert to 16kHz mono WAV for maximum transcription accuracy
 * 4. Upload WAV to R2
 * 5. Call /api/transcribe → Speechmatics (primary) or Whisper (fallback)
 * 6. Return transcription with language detection + English translation
 *
 * WAV format rationale:
 * - Universally supported by Speechmatics, Whisper, and all STT providers
 * - Uncompressed PCM delivers the best word error rate (0% degradation vs 2% OGG, 10% MP3)
 * - 16kHz sample rate is optimal for human speech — higher rates add no STT value
 * - Mono channel is standard for speech recognition
 *
 * Audio is uploaded to R2 then deleted server-side within 1 hour.
 */
export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [state, setState] = useState<RecorderState>('idle');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscription(null);
    chunksRef.current = [];

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000, // Optimal for speech recognition
        },
      });

      streamRef.current = stream;

      // Determine best supported MIME type for recording
      const mimeType = getSupportedMimeType();

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 64000,
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        processRecording();
      };

      mediaRecorder.onerror = () => {
        setError('Recording failed. Please try again.');
        setState('error');
        stopStream();
      };

      // Start recording — single blob on stop (avoids chunk timing race)
      mediaRecorder.start();
      setState('recording');
      startTimeRef.current = Date.now();

      // Duration timer
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);

      // Auto-stop after 3 minutes — prevent accidental long recordings
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording();
        }
      }, 180000);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access in your browser settings.');
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setError('Could not start recording. Please try again.');
      }
      setState('error');
    }
  }, [stopStream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      // Flush any buffered audio data before stopping
      mediaRecorderRef.current.requestData();
      mediaRecorderRef.current.stop();
    }
    // Don't call stopStream() here — let onstop/processRecording finish first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setDuration(0);
  }, []);

  const processRecording = useCallback(async () => {
    const chunks = chunksRef.current;
    if (chunks.length === 0) {
      setError('No audio recorded.');
      setState('error');
      return;
    }

    const rawBlob = new Blob(chunks, { type: chunks[0]?.type || 'audio/webm' });

    // Check minimum duration — reject very short recordings
    const recordingDuration = (Date.now() - startTimeRef.current) / 1000;
    if (recordingDuration < 1) {
      setError('Recording too short. Please speak for at least a few seconds.');
      setState('error');
      return;
    }

    setState('uploading');

    try {
      // Convert to 16kHz mono WAV for maximum transcription accuracy
      // WAV is universally supported and delivers the best word error rate
      const wavBlob = await convertToWav(rawBlob);

      // Validate the converted WAV
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

      // Send for transcription
      const transcribeRes = await api.post<TranscriptionResult>('/api/transcribe', {
        r2Key: urlRes.data.r2Key,
      });

      if (!transcribeRes.success || !transcribeRes.data) {
        throw new Error(transcribeRes.error ?? 'Transcription failed');
      }

      setTranscription(transcribeRes.data);
      setState('idle');
    } catch (err) {
      console.error('Voice processing failed:', err);
      setError(err instanceof Error ? err.message : 'Processing failed. Please try again.');
      setState('error');
    } finally {
      stopStream();
    }
  }, [stopStream]);

  const reset = useCallback(() => {
    setState('idle');
    setDuration(0);
    setError(null);
    setTranscription(null);
    chunksRef.current = [];
    stopStream();
  }, [stopStream]);

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

/**
 * Convert any browser-recorded audio blob to 16kHz mono 16-bit PCM WAV.
 *
 * Uses the Web Audio API to decode whatever format the browser recorded
 * (WebM/Opus on Chrome, OGG/Opus on Firefox, MP4/AAC on Safari) and
 * re-encode as uncompressed WAV — the gold standard for speech-to-text.
 *
 * 16kHz mono is the optimal configuration for speech recognition:
 * - Human speech sits within the 0–8kHz range (Nyquist of 16kHz)
 * - Mono eliminates stereo overhead — speech is not spatial
 * - 16-bit depth provides sufficient dynamic range for voice
 */
async function convertToWav(audioBlob: Blob): Promise<Blob> {
  const TARGET_SAMPLE_RATE = 16000;

  const audioContext = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE });

  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Mix down to mono if stereo
    const samples = audioBuffer.numberOfChannels > 1
      ? mixToMono(audioBuffer)
      : audioBuffer.getChannelData(0);

    // Resample if needed (AudioContext should handle this, but verify)
    const finalSamples = audioBuffer.sampleRate !== TARGET_SAMPLE_RATE
      ? resample(samples, audioBuffer.sampleRate, TARGET_SAMPLE_RATE)
      : samples;

    // Convert float32 samples to 16-bit PCM
    const pcmData = float32ToInt16(finalSamples);

    // Build WAV file
    const wavBuffer = encodeWav(pcmData, TARGET_SAMPLE_RATE, 1);

    return new Blob([wavBuffer], { type: 'audio/wav' });
  } finally {
    await audioContext.close();
  }
}

/**
 * Mix multi-channel audio down to mono by averaging all channels.
 */
function mixToMono(audioBuffer: AudioBuffer): Float32Array {
  const length = audioBuffer.length;
  const mono = new Float32Array(length);
  const numChannels = audioBuffer.numberOfChannels;

  for (let ch = 0; ch < numChannels; ch++) {
    const channelData = audioBuffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      mono[i]! += channelData[i]! / numChannels;
    }
  }

  return mono;
}

/**
 * Simple linear interpolation resampler.
 * Used as a safety net — AudioContext({ sampleRate }) handles most cases.
 */
function resample(
  samples: Float32Array,
  fromRate: number,
  toRate: number
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
 * Encode 16-bit PCM samples into a WAV file buffer.
 * Produces a standards-compliant RIFF/WAVE file.
 */
function encodeWav(
  samples: Int16Array,
  sampleRate: number,
  numChannels: number
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
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
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

/**
 * Get the best supported audio MIME type for MediaRecorder.
 * The recording format doesn't matter — we convert to WAV before upload.
 * Preference order optimises for recording quality and browser compatibility.
 */
function getSupportedMimeType(): string {
  const types = [
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return '';
}
