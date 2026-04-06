import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Mic,
  X,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Square,
} from 'lucide-react';
import type { DefectType, AIAnalysis, TranscriptionResult, UploadUrlResponse } from '../types';
import { stripExif, validateImageFile } from '../lib/files';
import { api } from '../lib/api';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

// ── Stripe ──────────────────────────────────────────────────

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

type Step = 'type' | 'photos' | 'voice' | 'review';

interface ReportState {
  defectType: DefectType | null;
  photos: PhotoEntry[];
  landlordEmail: string;
}

interface PhotoEntry {
  id: string;
  file: File;
  preview: string;
  analysis: AIAnalysis | null;
  uploading: boolean;
  r2Key: string | null;
}

const MAX_PHOTOS = 5;

export function ReportPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const voice = useVoiceRecorder();

  const [step, setStep] = useState<Step>('type');
  const [state, setState] = useState<ReportState>({
    defectType: null,
    photos: [],
    landlordEmail: '',
  });

  const updatePhotos = useCallback(
    (updater: (prev: PhotoEntry[]) => PhotoEntry[]) => {
      setState((s) => ({ ...s, photos: updater(s.photos) }));
    },
    []
  );

  const canAdvance = (): boolean => {
    switch (step) {
      case 'type':
        return state.defectType !== null;
      case 'photos':
        return state.photos.length > 0 && state.photos.every((p) => !p.uploading);
      case 'voice':
        return voice.state === 'idle';
      case 'review':
        return state.landlordEmail.includes('@') && state.landlordEmail.includes('.');
      default:
        return false;
    }
  };

  const steps: Step[] = ['type', 'photos', 'voice', 'review'];
  const currentIndex = steps.indexOf(step);

  const next = () => {
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]!);
    }
  };

  const back = () => {
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]!);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="pb-4">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        <button onClick={back} className="p-1 -ml-1 text-slate hover:text-navy transition-colors" aria-label={t('report.back')}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 flex gap-1.5">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= currentIndex ? 'bg-shield' : 'bg-border'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-slate font-mono ml-2">
          {currentIndex + 1}/{steps.length}
        </span>
      </div>

      {step === 'type' && (
        <DefectTypeStep
          selected={state.defectType}
          onSelect={(dt) => setState((s) => ({ ...s, defectType: dt }))}
        />
      )}
      {step === 'photos' && (
        <PhotoStep photos={state.photos} updatePhotos={updatePhotos} />
      )}
      {step === 'voice' && <VoiceStep voice={voice} />}
      {step === 'review' && (
        <Elements stripe={stripePromise}>
          <ReviewStep
            state={state}
            transcription={voice.transcription}
            onEmailChange={(email) => setState((s) => ({ ...s, landlordEmail: email }))}
            canAdvance={canAdvance()}
          />
        </Elements>
      )}

      {/* Next button — only shown for non-review steps */}
      {step !== 'review' && (
        <div className="mt-8">
          <button
            onClick={next}
            disabled={!canAdvance()}
            className="w-full bg-navy hover:bg-navy-light disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            {t('report.continue')}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Step 1: Defect Type ───────────────────────────────────

function DefectTypeStep({
  selected,
  onSelect,
}: {
  selected: DefectType | null;
  onSelect: (type: DefectType) => void;
}) {
  const { t } = useTranslation();
  const types: DefectType[] = ['damp', 'mould', 'leak', 'heating', 'electrics', 'other'];

  return (
    <div>
      <h2 className="text-lg font-bold text-navy mb-1">{t('report.step_type_title')}</h2>
      <p className="text-sm text-slate mb-5">{t('report.step_type_description')}</p>
      <div className="grid grid-cols-2 gap-3">
        {types.map((dt) => (
          <button
            key={dt}
            onClick={() => onSelect(dt)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              selected === dt
                ? 'border-shield bg-shield-light'
                : 'border-border bg-white hover:border-slate-light'
            }`}
          >
            <span className="text-sm font-semibold text-navy">{t(`defect.${dt}`)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Step 2: Photos ────────────────────────────────────────

function PhotoStep({
  photos,
  updatePhotos,
}: {
  photos: PhotoEntry[];
  updatePhotos: (updater: (prev: PhotoEntry[]) => PhotoEntry[]) => void;
}) {
  const { t } = useTranslation();
  const photoCountRef = useRef(photos.length);
  photoCountRef.current = photos.length;

  const handleCapture = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      for (const rawFile of Array.from(files)) {
        if (photoCountRef.current >= MAX_PHOTOS) break;

        const validation = validateImageFile(rawFile);
        if (!validation.valid) {
          alert(validation.error);
          continue;
        }

        const cleanFile = await stripExif(rawFile);
        const preview = URL.createObjectURL(cleanFile);
        const entryId = crypto.randomUUID();

        const entry: PhotoEntry = {
          id: entryId,
          file: cleanFile,
          preview,
          analysis: null,
          uploading: true,
          r2Key: null,
        };

        updatePhotos((prev) => {
          if (prev.length >= MAX_PHOTOS) return prev;
          return [...prev, entry];
        });
        photoCountRef.current++;

        processPhoto(entryId, cleanFile, updatePhotos);
      }

      e.target.value = '';
    },
    [updatePhotos]
  );

  const removePhoto = useCallback(
    (id: string) => {
      updatePhotos((prev) => {
        const removed = prev.find((p) => p.id === id);
        if (removed) URL.revokeObjectURL(removed.preview);
        return prev.filter((p) => p.id !== id);
      });
      photoCountRef.current = Math.max(0, photoCountRef.current - 1);
    },
    [updatePhotos]
  );

  return (
    <div>
      <h2 className="text-lg font-bold text-navy mb-1">{t('report.step_photos_title')}</h2>
      <p className="text-sm text-slate mb-5">
        {t('report.step_photos_description', { max: MAX_PHOTOS })}
      </p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {photos.map((p, i) => (
          <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100">
            <img src={p.preview} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
            {p.uploading && (
              <div className="absolute inset-0 bg-navy/60 flex items-center justify-center">
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              </div>
            )}
            {p.analysis && (
              <div className="absolute bottom-0 inset-x-0 bg-navy/80 px-2 py-1">
                <p className="text-[10px] text-white font-medium truncate">{p.analysis.hhsrsCategory}</p>
                <p className="text-[10px] text-shield-mid">Severity {p.analysis.severity}/5</p>
              </div>
            )}
            <button
              onClick={() => removePhoto(p.id)}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-navy/70 text-white flex items-center justify-center hover:bg-navy"
              aria-label={`Remove photo ${i + 1}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {photos.length < MAX_PHOTOS && (
          <label className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-shield cursor-pointer flex flex-col items-center justify-center gap-1 transition-colors">
            <Camera className="h-6 w-6 text-slate" />
            <span className="text-[10px] text-slate font-medium">{t('report.step_photos_add')}</span>
            <input
              type="file"
              accept="image/jpeg,image/png"
              capture="environment"
              multiple
              onChange={handleCapture}
              className="sr-only"
            />
          </label>
        )}
      </div>

      <p className="text-xs text-slate-light">
        {t('report.step_photos_count', { current: photos.length, max: MAX_PHOTOS })}
      </p>
    </div>
  );
}

async function processPhoto(
  entryId: string,
  file: File,
  updatePhotos: (updater: (prev: PhotoEntry[]) => PhotoEntry[]) => void
) {
  try {
    const urlRes = await api.post<UploadUrlResponse>('/api/upload-url', { contentType: file.type });

    if (!urlRes.success || !urlRes.data) {
      updatePhotos((prev) => prev.map((p) => (p.id === entryId ? { ...p, uploading: false } : p)));
      return;
    }

    const uploaded = await api.uploadToR2(urlRes.data.uploadUrl, file);
    if (!uploaded) {
      updatePhotos((prev) => prev.map((p) => (p.id === entryId ? { ...p, uploading: false } : p)));
      return;
    }

    const analysisRes = await api.post<AIAnalysis>('/api/analyse-photo', { r2Key: urlRes.data.r2Key });

    updatePhotos((prev) =>
      prev.map((p) =>
        p.id === entryId
          ? { ...p, uploading: false, r2Key: urlRes.data!.r2Key, analysis: analysisRes.data ?? null }
          : p
      )
    );
  } catch {
    updatePhotos((prev) => prev.map((p) => (p.id === entryId ? { ...p, uploading: false } : p)));
  }
}

// ── Step 3: Voice (real MediaRecorder) ────────────────────

function VoiceStep({ voice }: { voice: ReturnType<typeof useVoiceRecorder> }) {
  const { t } = useTranslation();

  const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isRecording = voice.state === 'recording';
  const isProcessing = voice.state === 'uploading' || voice.state === 'transcribing';

  return (
    <div>
      <h2 className="text-lg font-bold text-navy mb-1">{t('report.step_voice_title')}</h2>
      <p className="text-sm text-slate mb-6">{t('report.step_voice_description')}</p>

      <div className="flex flex-col items-center gap-4 py-6">
        {/* Record button */}
        <button
          onClick={isRecording ? voice.stopRecording : voice.startRecording}
          disabled={isProcessing}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            isRecording
              ? 'bg-danger animate-pulse'
              : isProcessing
              ? 'bg-slate-200'
              : 'bg-shield hover:bg-shield-dark'
          }`}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isProcessing ? (
            <Loader2 className="h-8 w-8 text-slate animate-spin" />
          ) : isRecording ? (
            <Square className="h-7 w-7 text-white fill-white" />
          ) : (
            <Mic className="h-8 w-8 text-white" />
          )}
        </button>

        {/* Status text */}
        <div className="text-center">
          <p className="text-sm text-slate">
            {isRecording
              ? t('report.step_voice_recording')
              : isProcessing
              ? voice.state === 'uploading'
                ? t('common.loading')
                : t('report.step_voice_processing')
              : t('report.step_voice_tap_record')}
          </p>
          {isRecording && (
            <p className="text-lg font-mono font-bold text-danger mt-1">
              {formatDuration(voice.duration)}
            </p>
          )}
        </div>

        {/* Error */}
        {voice.error && (
          <div className="bg-danger-light border border-danger/20 rounded-lg px-4 py-2 text-sm text-danger max-w-xs text-center">
            {voice.error}
          </div>
        )}
      </div>

      {/* Transcription result */}
      {voice.transcription && (
        <div className="bg-white border border-border rounded-xl p-4 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-shield" />
            <span className="text-xs font-semibold text-shield uppercase tracking-wide">
              {t('report.step_voice_transcribed')}
            </span>
            <span className="text-xs text-slate font-mono ml-auto">
              {voice.transcription.language.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-navy leading-relaxed">
            {voice.transcription.text || t('report.step_voice_no_speech')}
          </p>
          {voice.transcription.translatedText && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-slate font-semibold mb-1">{t('report.step_voice_translation')}</p>
              <p className="text-sm text-navy">{voice.transcription.translatedText}</p>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-slate-light text-center mt-6">
        {t('report.step_voice_privacy')}
      </p>
    </div>
  );
}

// ── Step 4: Review with Stripe Payment ────────────────────

function ReviewStep({
  state,
  transcription,
  onEmailChange,
  canAdvance,
}: {
  state: ReportState;
  transcription: TranscriptionResult | null;
  onEmailChange: (email: string) => void;
  canAdvance: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements || !canAdvance) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setPaying(true);
    setPayError(null);

    try {
      // 1. Create case
      const analysis = state.photos[0]?.analysis;
      const caseRes = await api.post<{ id: string }>('/api/cases', {
        defectType: state.defectType,
        defectSeverity: analysis?.severity ?? 3,
        hhsrsCategory: analysis?.hhsrsCategory ?? null,
        landlordEmail: state.landlordEmail,
      });

      if (!caseRes.success || !caseRes.data) {
        throw new Error(caseRes.error ?? 'Failed to create case');
      }

      const caseId = caseRes.data.id;

      // 2. Create payment intent
      const paymentRes = await api.post<{ clientSecret: string }>('/api/stripe/create-payment', {
        caseId,
      });

      if (!paymentRes.success || !paymentRes.data) {
        throw new Error(paymentRes.error ?? 'Failed to create payment');
      }

      // 3. Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        paymentRes.data.clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (error) {
        throw new Error(error.message ?? 'Payment failed');
      }

      if (paymentIntent?.status === 'succeeded') {
        // 4. Navigate to case detail — letter generation triggered by webhook
        navigate(`/case/${caseId}`);
      }
    } catch (err) {
      console.error('Payment failed:', err);
      setPayError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-navy mb-1">{t('report.step_review_title')}</h2>
      <p className="text-sm text-slate mb-5">{t('report.step_review_description')}</p>

      {/* Summary */}
      <div className="bg-white border border-border rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <span className="text-sm font-semibold text-navy">
            {state.defectType ? t(`defect.${state.defectType}`) : '—'}
          </span>
        </div>
        <p className="text-xs text-slate">
          {t('report.step_review_photos_count', { count: state.photos.length })}
          {transcription ? ` · ${t('report.step_review_voice_included')}` : ''}
        </p>
        {state.photos[0]?.analysis && (
          <p className="text-xs text-slate mt-1">
            {t('report.step_review_ai_assessment', {
              category: state.photos[0].analysis.hhsrsCategory,
              severity: state.photos[0].analysis.severity,
            })}
          </p>
        )}
      </div>

      {/* Landlord email */}
      <div className="mb-4">
        <label htmlFor="landlord-email" className="block text-sm font-semibold text-navy mb-1.5">
          {t('report.step_review_landlord_email')}
        </label>
        <input
          id="landlord-email"
          type="email"
          value={state.landlordEmail}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder={t('report.step_review_landlord_placeholder')}
          className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm text-navy placeholder:text-slate-light focus:outline-none focus:ring-2 focus:ring-shield focus:border-shield"
          autoComplete="email"
        />
        <p className="text-xs text-slate-light mt-1.5">{t('report.step_review_landlord_note')}</p>
      </div>

      {/* Stripe Card Element */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-navy mb-1.5">
          Card details
        </label>
        <div className="border border-border rounded-lg px-3.5 py-3 bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '14px',
                  color: '#1a2b4a',
                  '::placeholder': { color: '#94a3b8' },
                },
                invalid: { color: '#ef4444' },
              },
              hidePostalCode: true,
            }}
          />
        </div>
      </div>

      {/* Payment error */}
      {payError && (
        <div className="bg-danger-light border border-danger/20 rounded-lg px-4 py-2 text-sm text-danger mb-4">
          {payError}
        </div>
      )}

      {/* Legal notice */}
      <div className="bg-surface border border-border rounded-xl p-4 text-xs text-slate leading-relaxed mb-8">
        <p className="font-semibold text-navy mb-1">{t('report.step_review_what_next')}</p>
        <p>{t('report.step_review_what_next_detail')}</p>
        <p className="mt-2 text-slate-light">{t('report.step_review_disclaimer')}</p>
      </div>

      {/* Pay button */}
      <button
        onClick={handlePay}
        disabled={!canAdvance || paying || !stripe}
        className="w-full bg-shield hover:bg-shield-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
      >
        {paying ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          t('report.pay_send')
        )}
      </button>
    </div>
  );
}
