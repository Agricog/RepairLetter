import { useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { Shield, Camera, Mic, Mail, Clock, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../components/ui/LanguageSelector';

export function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-dvh bg-navy text-white flex flex-col">
      {/* Hero */}
      <div className="px-6 pt-12 pb-10 flex-1 flex flex-col">
        {/* Header with language selector */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <Shield className="h-7 w-7 text-shield-mid" />
            <span className="text-xl font-bold tracking-tight">
              Rent<span className="text-shield-mid">Shield</span>
            </span>
          </div>
          <LanguageSelector />
        </div>

        <h1 className="text-3xl font-bold leading-tight mb-4 max-w-sm">
          {t('landing.headline')}
          <br />
          <span className="text-shield-mid">{t('landing.headline_cta')}</span>
        </h1>

        <p className="text-white/55 text-sm leading-relaxed mb-8 max-w-sm">
          {t('landing.description')}
        </p>

        {/* Steps */}
        <div className="flex flex-col gap-4 mb-10">
          <Step
            icon={<Camera className="h-4 w-4" />}
            label={t('landing.step1_label')}
            detail={t('landing.step1_detail')}
          />
          <Step
            icon={<Mic className="h-4 w-4" />}
            label={t('landing.step2_label')}
            detail={t('landing.step2_detail')}
          />
          <Step
            icon={<Mail className="h-4 w-4" />}
            label={t('landing.step3_label')}
            detail={t('landing.step3_detail')}
          />
          <Step
            icon={<Clock className="h-4 w-4" />}
            label={t('landing.step4_label')}
            detail={t('landing.step4_detail')}
          />
        </div>

        {/* CTA */}
        <div className="mt-auto">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="w-full bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-6 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                {t('landing.cta_report')}
                <ArrowRight className="h-4 w-4" />
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-6 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {t('landing.cta_dashboard')}
              <ArrowRight className="h-4 w-4" />
            </button>
          </SignedIn>

          <p className="text-white/30 text-xs text-center mt-4">
            {t('landing.evidence_note')}
          </p>
        </div>
      </div>

      {/* Trust bar */}
      <div className="bg-navy-mid px-6 py-4 flex items-center justify-center gap-6 text-[10px] text-white/35 uppercase tracking-widest">
        <span>{t('landing.trust_gdpr')}</span>
        <span className="text-white/15">·</span>
        <span>{t('landing.trust_encrypted')}</span>
        <span className="text-white/15">·</span>
        <span>{t('landing.trust_tracking')}</span>
        <span className="text-white/15">·</span>
        <span>{t('landing.trust_ico')}</span>
      </div>
    </div>
  );
}

function Step({
  icon,
  label,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-shield/15 border border-shield/25 flex items-center justify-center text-shield-mid">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-white/90">{label}</p>
        <p className="text-xs text-white/40">{detail}</p>
      </div>
    </div>
  );
}
