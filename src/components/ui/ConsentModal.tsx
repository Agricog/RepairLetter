import { useState } from 'react';
import { Shield, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';

interface ConsentModalProps {
  onAccept: () => void;
}

/**
 * GDPR consent modal — shown once after first sign-up.
 * Records explicit consent with timestamp via the API.
 * User cannot use the app without accepting.
 *
 * Required by UK GDPR Article 7 — consent must be:
 * - Freely given
 * - Specific
 * - Informed
 * - Unambiguous
 */
export function ConsentModal({ onAccept }: ConsentModalProps) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [checks, setChecks] = useState({
    dataProcessing: false,
    voiceRecording: false,
    photoEvidence: false,
  });

  const allChecked = checks.dataProcessing && checks.voiceRecording && checks.photoEvidence;

  const handleAccept = async () => {
    if (!allChecked) return;

    setSubmitting(true);
    try {
      await api.post('/api/users/consent', {
        dataProcessing: true,
        voiceRecording: true,
        photoEvidence: true,
        consentedAt: new Date().toISOString(),
      });
      onAccept();
    } catch {
      // Non-fatal — consent will be re-prompted
      onAccept();
    } finally {
      setSubmitting(false);
    }
  };

  const toggle = (key: keyof typeof checks) => {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy/80 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-4">
            <Shield className="h-6 w-6 text-shield" />
            <span className="text-lg font-bold text-navy tracking-tight">
              {t('consent.title', 'Your Data, Your Control')}
            </span>
          </div>

          <p className="text-sm text-slate leading-relaxed mb-6">
            {t(
              'consent.intro',
              'RentShield needs your permission to process the following data to generate and send legal letters on your behalf.'
            )}
          </p>

          {/* Consent items */}
          <div className="flex flex-col gap-4 mb-6">
            <ConsentItem
              checked={checks.dataProcessing}
              onChange={() => toggle('dataProcessing')}
              title={t('consent.data_title', 'Personal data processing')}
              detail={t(
                'consent.data_detail',
                'We collect your email (encrypted) and landlord contact details solely to send legal correspondence. We never share your data with third parties. You can delete your account and all data at any time.'
              )}
            />

            <ConsentItem
              checked={checks.voiceRecording}
              onChange={() => toggle('voiceRecording')}
              title={t('consent.voice_title', 'Voice recording & transcription')}
              detail={t(
                'consent.voice_detail',
                'Voice recordings are processed by Speechmatics (UK data residency) to create text transcriptions. Recordings are deleted within 1 hour of processing and are never stored long-term.'
              )}
            />

            <ConsentItem
              checked={checks.photoEvidence}
              onChange={() => toggle('photoEvidence')}
              title={t('consent.photo_title', 'Photo evidence & AI analysis')}
              detail={t(
                'consent.photo_detail',
                'Photos are analysed by AI to classify defects. GPS data is stripped before upload. Photos are retained for the duration of your case plus 90 days, and you can delete them at any time.'
              )}
            />
          </div>

          {/* Links */}
          <div className="flex gap-4 mb-6">
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-shield font-medium flex items-center gap-1"
            >
              {t('consent.privacy_link', 'Privacy Policy')}
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-shield font-medium flex items-center gap-1"
            >
              {t('consent.terms_link', 'Terms of Service')}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Accept button */}
          <button
            onClick={handleAccept}
            disabled={!allChecked || submitting}
            className="w-full bg-shield hover:bg-shield-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            {submitting
              ? t('consent.submitting', 'Saving...')
              : t('consent.accept', 'I agree — let me report my problem')}
          </button>

          <p className="text-[10px] text-slate-light text-center mt-3 leading-relaxed">
            {t(
              'consent.withdraw',
              'You can withdraw consent at any time by deleting your account in Settings.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function ConsentItem({
  checked,
  onChange,
  title,
  detail,
}: {
  checked: boolean;
  onChange: () => void;
  title: string;
  detail: string;
}) {
  return (
    <label className="flex gap-3 cursor-pointer group">
      <div className="flex-shrink-0 pt-0.5">
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            checked
              ? 'bg-shield border-shield'
              : 'border-border group-hover:border-slate-light'
          }`}
        >
          {checked && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-navy">{title}</p>
        <p className="text-xs text-slate leading-relaxed mt-0.5">{detail}</p>
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only"
          aria-label={title}
        />
      </div>
    </label>
  );
}
