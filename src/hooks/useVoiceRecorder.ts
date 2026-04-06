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
 * 2. Record audio as OGG/Opus (Speechmatics compatible) or MP4 (Safari)
 * 3. On stop: validate file, upload to R2
 * 4. Call /api/transcribe → Speechmatics (primary) or Whisper (fallback)
 * 5. Return transcription with language detection + English translation
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

      // Determine best supported MIME type
      const mimeType = getSupportedMimeType();

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 64000, // Good quality for speech
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

      // Start recording — collect data every second
      mediaRecorder.start(1000);
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
      mediaRecorderRef.current.stop();
    }
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

    // Determine the actual content type from the recorded chunks
    const rawType = chunks[0]?.type || 'audio/ogg';
    const baseType = rawType.split(';')[0] ?? 'audio/ogg';
    const audioBlob = new Blob(chunks, { type: rawType });

    // Validate
    const validation = validateAudioFile(audioBlob);
    if (!validation.valid) {
      setError(validation.error ?? 'Invalid audio file.');
      setState('error');
      return;
    }

    // Check minimum duration — reject very short recordings
    const recordingDuration = (Date.now() - startTimeRef.current) / 1000;
    if (recordingDuration < 1) {
      setError('Recording too short. Please speak for at least a few seconds.');
      setState('error');
      return;
    }

    setState('uploading');

    // Map base MIME type to file extension
    const ext = baseType === 'audio/ogg' ? 'ogg'
      : baseType === 'audio/mp4' ? 'm4a'
      : baseType === 'audio/webm' ? 'webm'
      : 'ogg';

    try {
      // Get upload URL using the actual content type
      const urlRes = await api.post<UploadUrlResponse>('/api/upload-url', {
        contentType: baseType,
      });

      if (!urlRes.success || !urlRes.data) {
        throw new Error(urlRes.error ?? 'Failed to get upload URL');
      }

      // Upload to R2
      const audioFile = new File([audioBlob], `recording.${ext}`, { type: baseType });
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
 * Get the best supported audio MIME type for MediaRecorder.
 * OGG/Opus preferred — supported by Speechmatics Batch API.
 * Falls back to WebM (needs conversion) or MP4/AAC (Safari).
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

  // Fallback — let the browser decide
  return '';
}
