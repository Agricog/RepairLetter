import { useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { Helmet } from 'react-helmet-async';
import {
  Camera,
  Mic,
  Mail,
  Clock,
  ArrowRight,
  Shield,
  Globe,
  FileText,
  Scale,
  ChevronDown,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../components/ui/LanguageSelector';
import { useState } from 'react';

const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://repairletter.co.uk/#organization',
      name: 'RepairLetter',
      url: 'https://repairletter.co.uk',
      logo: 'https://repairletter.co.uk/logo.png',
      description: 'AI-powered repair letter generator for UK tenants. Photo your problem, describe it in any language, and a legal letter is sent to your landlord in 60 seconds.',
      foundingDate: '2026',
      founder: { '@type': 'Organization', name: 'Autaimate' },
      sameAs: [],
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'hello@repairletter.co.uk',
        contactType: 'customer service',
      },
    },
    {
      '@type': 'WebPage',
      '@id': 'https://repairletter.co.uk/#webpage',
      url: 'https://repairletter.co.uk',
      name: 'Repair Letter to Landlord UK 2026 | Free Legal Letter Generator | RepairLetter',
      description: 'Free UK repair letter generator for tenants. Photo your problem, describe it in any language, and a legal letter citing the Renters\' Rights Act 2025, s.11 LTA 1985 and HHSRS is sent to your landlord in 60 seconds.',
      isPartOf: { '@id': 'https://repairletter.co.uk/#organization' },
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['#quick-answer', 'h1'],
      },
      inLanguage: 'en-GB',
    },
    {
      '@type': 'SoftwareApplication',
      name: 'RepairLetter',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web, iOS, Android',
      offers: {
        '@type': 'Offer',
        price: '4.99',
        priceCurrency: 'GBP',
        description: 'Per letter sent to landlord with photo evidence and legal citations',
      },
      description: 'AI-powered tenant repair letter generator. Photo defects, describe in any language via voice, receive a legal letter citing UK housing law sent to your landlord with evidence attached.',
      featureList: [
        'AI photo analysis against 29 HHSRS hazard categories',
        'Voice input in 50+ languages with auto-translation',
        'Legal letters citing s.11 LTA 1985, HHSRS, Homes Act 2018',
        'Branded PDF with embedded evidence photos',
        'Auto-escalation to environmental health after 14 days',
        'Timestamped evidence pack with SHA-256 integrity proofs',
      ],
    },
    {
      '@type': 'HowTo',
      name: 'How to Send a Repair Letter to Your Landlord Using RepairLetter',
      description: 'Send a legal repair letter to your landlord in 60 seconds using AI photo analysis and voice description.',
      totalTime: 'PT1M',
      step: [
        { '@type': 'HowToStep', position: 1, name: 'Photo the defect', text: 'Take up to 5 photos of the housing problem. GPS data is automatically stripped for your privacy. AI analyses the defect against 29 HHSRS hazard categories.' },
        { '@type': 'HowToStep', position: 2, name: 'Describe in any language', text: 'Record a voice note in any language. Speechmatics transcribes and auto-detects language. If not English, the description is translated automatically.' },
        { '@type': 'HowToStep', position: 3, name: 'Review the letter', text: 'A legal letter citing s.11 Landlord and Tenant Act 1985, HHSRS, and the Homes (Fitness for Human Habitation) Act 2018 is generated with your evidence.' },
        { '@type': 'HowToStep', position: 4, name: 'Pay and send', text: 'Pay £4.99. The branded PDF letter with embedded photos is emailed to your landlord. A 14-day response deadline is tracked automatically.' },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://repairletter.co.uk/' },
      ],
    },
    {
      '@type': 'Article',
      headline: 'Renters\' Rights Act 2025: How to Get Your Landlord to Fix Repairs',
      author: { '@type': 'Organization', name: 'RepairLetter' },
      publisher: { '@id': 'https://repairletter.co.uk/#organization' },
      datePublished: '2026-04-05',
      dateModified: '2026-04-05',
      description: 'A comprehensive guide to tenant repair rights under the Renters\' Rights Act 2025, which comes into force on 1 May 2026. Covers s.11 LTA 1985, HHSRS, and the Homes Act 2018.',
      mainEntityOfPage: 'https://repairletter.co.uk/',
    },
  ],
};

const FAQ_DATA = [
  { q: 'What is a repair letter to a landlord?', a: 'A repair letter is a formal written notice to your landlord demanding they fix a defect in your rental property. Under s.11 of the Landlord and Tenant Act 1985, landlords must keep the structure, exterior, and installations in repair. A written letter creates a legal record that you notified your landlord, which is essential if you later need to escalate to environmental health or take legal action.' },
  { q: 'What laws does the repair letter cite?', a: 'Every RepairLetter cites three UK statutes: Section 11 of the Landlord and Tenant Act 1985 (obligation to repair structure, exterior and installations), the Housing Health and Safety Rating System under the Housing Act 2004 (with the specific hazard category identified by AI), and Section 9A of the Landlord and Tenant Act 1985 as inserted by the Homes (Fitness for Human Habitation) Act 2018.' },
  { q: 'How does RepairLetter work in other languages?', a: 'You can speak into RepairLetter in any of 50+ languages. The voice recording is transcribed using Speechmatics with UK data residency, the language is auto-detected, and the transcription is translated to English. The legal letter is always generated in English because it cites UK law. You also receive a translated copy in your language so you can verify exactly what was sent.' },
  { q: 'What happens after the 14-day deadline?', a: 'If your landlord does not respond within 14 days, RepairLetter automatically generates an environmental health complaint document for your local council. You are notified and can review the complaint before submitting it. The complaint references the Housing Act 2004 and requests an HHSRS inspection of your property.' },
  { q: 'Is RepairLetter legal advice?', a: 'No. RepairLetter generates correspondence based on UK housing legislation but does not constitute legal advice. The letters cite accurate statutory references but have not been reviewed by a solicitor. For specific legal advice, contact Citizens Advice, Shelter, or a qualified solicitor. RepairLetter is a tool to help you exercise your existing legal rights.' },
  { q: 'How does the Renters\' Rights Act 2025 affect repairs?', a: 'The Renters\' Rights Act 2025, coming into force on 1 May 2026, strengthens tenant protections significantly. Section 21 no-fault evictions are abolished, so landlords cannot evict you for requesting repairs. The Decent Homes Standard is extended to private rentals, and Awaab\'s Law requires landlords to address damp and mould within strict timescales. These changes make it safer than ever to demand repairs.' },
  { q: 'What is the HHSRS and why does it matter?', a: 'The Housing Health and Safety Rating System is a risk-based evaluation tool under the Housing Act 2004 used by local authorities to assess hazards in residential properties. It covers 29 hazard categories including damp and mould, excess cold, electrical hazards, and structural collapse. When RepairLetter identifies the HHSRS category in your photos, it strengthens your letter because it connects your specific problem to a legally defined hazard that your council can act on.' },
  { q: 'How much does RepairLetter cost?', a: 'A single repair letter costs £4.99. This includes AI photo analysis, voice transcription in any language, legal letter generation, branded PDF with evidence photos, and email delivery to your landlord. Your evidence pack — all photos, letters, and timestamps — is always free to download. A monthly subscription at £9.99 provides unlimited letters for ongoing disputes.' },
  { q: 'What evidence does RepairLetter collect?', a: 'RepairLetter creates a comprehensive evidence pack: timestamped photos with SHA-256 integrity hashes proving they were not modified after upload, AI defect analysis with HHSRS classification, voice transcription and translation records, copies of all letters sent, delivery confirmation, and a full timeline of every action taken. All timestamps are server-generated and immutable.' },
  { q: 'Can my landlord evict me for sending a repair letter?', a: 'From 1 May 2026, Section 21 no-fault evictions are abolished under the Renters\' Rights Act 2025. Your landlord can only evict you with a valid legal reason under Section 8. Retaliatory eviction for requesting repairs is illegal. RepairLetter creates a documented evidence trail that protects you if your landlord attempts retaliation.' },
  { q: 'Is my data safe with RepairLetter?', a: 'All personal data is encrypted at rest using pgcrypto (AES-256). Voice recordings are deleted within 1 hour of processing. GPS data is stripped from photos before upload. IP addresses are hashed, never stored plain. We use no analytics or tracking SDKs. We are registered with the ICO and fully UK GDPR compliant. You can delete your account and all data at any time.' },
  { q: 'What types of repairs can I report?', a: 'RepairLetter covers all common housing defects: damp, mould, water leaks, heating failures, electrical issues, and other problems. The AI photo analysis classifies your defect against the 29 HHSRS hazard categories and assigns a severity rating from 1 to 5. Whether it is black mould on a bedroom wall or a boiler that has not worked for weeks, RepairLetter generates the appropriate legal letter.' },
];

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_DATA.map((faq) => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.a,
    },
  })),
};

export function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-dvh bg-navy">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(STRUCTURED_DATA)}</script>
        <script type="application/ld+json">{JSON.stringify(FAQ_SCHEMA)}</script>
      </Helmet>

      {/* ── HERO ──────────────────────────────────────────── */}
      <header className="px-6 pt-10 pb-12 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2.5">
            <FileText className="h-7 w-7 text-shield-mid" />
            <span className="text-xl font-bold text-white tracking-tight">
              Repair<span className="text-shield-mid">Letter</span>
            </span>
          </div>
          <LanguageSelector />
        </div>

        {/* Quick Answer Box — voice search optimised */}
        <p id="quick-answer" className="text-white/40 text-xs uppercase tracking-widest mb-3 font-semibold">
          Free UK Repair Letter Generator
        </p>

        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4 max-w-xl">
          {t('landing.headline', 'Your landlord won\'t fix it?')}
          <br />
          <span className="text-shield-mid">{t('landing.headline_cta', 'We\'ll make it legal.')}</span>
        </h1>

        <p className="text-white/55 text-sm sm:text-base leading-relaxed mb-8 max-w-lg">
          Photo the problem. Speak about it in any language. A legal repair letter citing the
          Renters' Rights Act 2025, s.11 Landlord and Tenant Act 1985, and the Housing Health
          and Safety Rating System is sent to your landlord in 60 seconds.
        </p>

        {/* Steps */}
        <div className="flex flex-col gap-4 mb-10">
          <Step icon={<Camera className="h-4 w-4" />} label={t('landing.step1_label', 'Photo the defect')} detail={t('landing.step1_detail', 'AI classifies against 29 HHSRS hazard categories')} />
          <Step icon={<Mic className="h-4 w-4" />} label={t('landing.step2_label', 'Describe it in any language')} detail={t('landing.step2_detail', 'Voice-to-text in 50+ languages with auto-translation')} />
          <Step icon={<Mail className="h-4 w-4" />} label={t('landing.step3_label', 'Legal letter sent instantly')} detail={t('landing.step3_detail', 'Branded PDF with photos, citing three UK statutes')} />
          <Step icon={<Clock className="h-4 w-4" />} label={t('landing.step4_label', '14-day deadline tracked')} detail={t('landing.step4_detail', 'Auto-escalation to environmental health if ignored')} />
        </div>

        {/* CTA */}
        <SignedOut>
          <SignInButton mode="modal">
            <button className="w-full sm:w-auto bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              Send a repair letter — £4.99
              <ArrowRight className="h-4 w-4" />
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            {t('landing.cta_dashboard', 'Go to dashboard')}
            <ArrowRight className="h-4 w-4" />
          </button>
        </SignedIn>

        <p className="text-white/25 text-xs mt-4">
          Your evidence is yours. Download anytime. Free forever.
        </p>
      </header>

      {/* Trust bar */}
      <div className="bg-navy-mid px-6 py-4 flex items-center justify-center gap-6 text-[10px] text-white/35 uppercase tracking-widest">
        <span>UK GDPR</span><span className="text-white/15">·</span>
        <span>Encrypted</span><span className="text-white/15">·</span>
        <span>No tracking</span><span className="text-white/15">·</span>
        <span>ICO registered</span><span className="text-white/15">·</span>
        <span>50+ languages</span>
      </div>

      {/* ── SEO CONTENT ───────────────────────────────────── */}
      <div className="bg-surface">
        <div className="max-w-3xl mx-auto px-6 py-16">

          {/* How it works — detailed */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-8">How RepairLetter Works</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <HowItWorksCard number="1" title="Photo the Problem" description="Open RepairLetter on your phone and take up to 5 photos of the defect — damp patches, mould growth, leaking pipes, broken boilers, faulty wiring. GPS metadata is automatically stripped from every photo before upload to protect your privacy. Our AI analyses each image against the 29 hazard categories defined in the Housing Health and Safety Rating System (HHSRS) under the Housing Act 2004, identifying the defect type and assigning a severity rating from 1 to 5." />
              <HowItWorksCard number="2" title="Describe It in Any Language" description="Tap the microphone and speak. Describe the problem in Polish, Romanian, Bengali, Urdu, Arabic, Somali, or any of 50+ languages. Speechmatics (with UK data residency) transcribes your voice in real time and auto-detects the language. If you are not speaking English, the transcription is automatically translated so your legal letter is accurate. Voice recordings are deleted within 1 hour of processing — never stored long-term." />
              <HowItWorksCard number="3" title="Review Your Legal Letter" description="RepairLetter generates a formal legal demand letter citing three UK statutes: Section 11 of the Landlord and Tenant Act 1985 (your landlord's obligation to repair the structure, exterior, and installations), the specific HHSRS hazard category identified in your photos, and Section 9A of the Landlord and Tenant Act 1985 as inserted by the Homes (Fitness for Human Habitation) Act 2018. You review the letter before it is sent. You are always in control." />
              <HowItWorksCard number="4" title="Pay £4.99 and Send" description="After payment, a branded PDF letter with your evidence photos embedded is emailed directly to your landlord. You receive a confirmation and a translated copy in your own language. A 14-day response deadline is tracked automatically. If your landlord does not respond, RepairLetter generates an environmental health complaint for your local council — ready for you to review and submit." />
            </div>
          </section>

          {/* Renters' Rights Act section — timed for 1 May */}
          <section className="mb-16">
            <div className="bg-white border border-border rounded-2xl p-6 sm:p-8">
              <div className="flex items-start gap-3 mb-4">
                <Scale className="h-6 w-6 text-shield flex-shrink-0 mt-0.5" />
                <h2 className="text-2xl font-bold text-navy">The Renters' Rights Act 2025 — What It Means for Repairs</h2>
              </div>
              <p className="text-sm text-slate leading-relaxed mb-4">
                On 1 May 2026, the Renters' Rights Act 2025 comes into force — the most significant reform of the private rented sector in over 30 years. For 11 million private renters in England, this changes everything about how you deal with a landlord who refuses to fix problems in your home.
              </p>
              <p className="text-sm text-slate leading-relaxed mb-4">
                The most important change for tenants with repair problems is the abolition of Section 21 "no-fault" evictions. Previously, many tenants were afraid to ask for repairs because their landlord could simply issue a Section 21 notice and force them out with no reason given. This practice, known as retaliatory eviction, affected thousands of families every year. From 1 May 2026, this is no longer possible. Your landlord can only seek possession of your property through a Section 8 notice, and only for specific legally valid reasons such as serious rent arrears or antisocial behaviour — not because you asked them to fix the mould on your bedroom wall.
              </p>
              <p className="text-sm text-slate leading-relaxed mb-4">
                The Act also extends the Decent Homes Standard to the private rented sector for the first time. Until now, this standard only applied to social housing. From 2026, your privately rented home must meet minimum standards for safety, security, and repair. Awaab's Law — named after Awaab Ishak, a two-year-old boy who died in 2020 from a respiratory condition caused by mould in his family's housing association flat — will require landlords to address damp and mould within strict timescales.
              </p>
              <p className="text-sm text-slate leading-relaxed mb-4">
                A new Private Rented Sector Landlord Ombudsman will give tenants an independent route to resolve disputes without going to court. All landlords must register themselves and their properties on a national database, making it easier to identify and take action against rogue landlords. Local authorities will have greater powers to investigate landlords and enforce compliance, with higher fines and penalties for breaches.
              </p>
              <p className="text-sm text-slate leading-relaxed">
                RepairLetter is built for this new reality. With retaliatory eviction abolished, you can demand repairs with confidence. Your letter cites the legislation that protects you, your evidence is timestamped and integrity-verified, and if your landlord ignores you, the escalation path to environmental health is built in. The law is on your side — RepairLetter helps you use it.
              </p>
            </div>
          </section>

          {/* Your Legal Rights */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Your Legal Rights as a Tenant</h2>

            <div className="flex flex-col gap-6">
              <LegalCard title="Section 11 — Landlord and Tenant Act 1985" description="Your landlord has an implied obligation to keep in repair the structure and exterior of your dwelling, and to keep in repair and proper working order the installations for the supply of water, gas, electricity, sanitation, space heating, and hot water. This obligation exists regardless of what your tenancy agreement says — it cannot be contracted out of. If your roof leaks, your boiler fails, your pipes burst, or your electrics are dangerous, your landlord must repair them once they have been notified. A written repair letter creates the legal record of that notification." />
              <LegalCard title="HHSRS — Housing Act 2004" description="The Housing Health and Safety Rating System defines 29 categories of housing hazard, including damp and mould growth, excess cold, electrical hazards, fire, and structural collapse. Local authorities use the HHSRS to assess risks in residential properties. Category 1 hazards are serious and your local authority has a duty to take enforcement action — such as serving an improvement notice on your landlord. When RepairLetter identifies the specific HHSRS category in your photos, it connects your problem to a legally defined hazard that gives your council the power to act." />
              <LegalCard title="Section 9A — Homes (Fitness for Human Habitation) Act 2018" description="Since 2019, all residential tenancies in England must be fit for human habitation at the start of the tenancy and throughout its duration. If your home is unfit — for example due to serious damp, mould, structural instability, or inadequate drainage — you can take legal action against your landlord. This Act gave tenants a direct route to the courts for the first time, without needing to go through the local authority. RepairLetter cites this Act in every letter, putting your landlord on notice that their property may not meet the legal standard." />
            </div>
          </section>

          {/* What makes RepairLetter different */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">What Makes RepairLetter Different</h2>
            <p className="text-sm text-slate leading-relaxed mb-6">
              Shelter, Citizens Advice, and your local council all offer free repair letter templates — Word documents you download, fill in by hand, and send yourself. Those templates are a good starting point. RepairLetter does something fundamentally different.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <DifferenceCard icon={<Camera className="h-5 w-5" />} title="AI Photo Analysis" description="Every photo is analysed against the 29 HHSRS hazard categories. The defect type, severity, and specific hazard category are identified automatically. No template can do this." />
              <DifferenceCard icon={<Globe className="h-5 w-5" />} title="Any Language, Any Tenant" description="Speak in Polish, Romanian, Bengali, Urdu, Arabic, Somali, or 50+ other languages. A Word template cannot help a tenant who does not read English. RepairLetter can." />
              <DifferenceCard icon={<Mail className="h-5 w-5" />} title="Sent Automatically" description="The branded PDF letter with evidence photos is emailed directly to your landlord. No printing, no posting, no stamps. Delivery is confirmed and tracked." />
              <DifferenceCard icon={<Clock className="h-5 w-5" />} title="Auto-Escalation" description="If your landlord ignores the 14-day deadline, an environmental health complaint is generated automatically. No other tool follows up for you." />
              <DifferenceCard icon={<Shield className="h-5 w-5" />} title="Evidence Integrity" description="Every photo is SHA-256 hashed at upload. Every timestamp is server-generated and immutable. Your evidence pack stands up at a tribunal because it is cryptographically verifiable." />
              <DifferenceCard icon={<FileText className="h-5 w-5" />} title="Professional PDF" description="Your landlord receives a branded PDF with your case reference, legal citations, embedded photos with HHSRS labels, and a complete evidence chain. Not a text email." />
            </div>
          </section>

          {/* FAQs with Schema */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Frequently Asked Questions</h2>
            <div className="flex flex-col gap-3">
              {FAQ_DATA.map((faq, i) => (
                <FaqItem key={i} question={faq.q} answer={faq.a} />
              ))}
            </div>
          </section>

          {/* Bottom CTA */}
          <section className="text-center py-8">
            <h2 className="text-2xl font-bold text-navy mb-3">Ready to Send Your Repair Letter?</h2>
            <p className="text-sm text-slate mb-6 max-w-md mx-auto">
              Photo the problem. Describe it in any language. Legal letter sent in 60 seconds.
              Your evidence is yours — download anytime, free forever.
            </p>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors inline-flex items-center gap-2">
                  Send a repair letter — £4.99
                  <ArrowRight className="h-4 w-4" />
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors inline-flex items-center gap-2"
              >
                Go to dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
            </SignedIn>
          </section>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-navy border-t border-white/5 px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-shield-mid" />
            <span className="text-base font-bold text-white tracking-tight">
              Repair<span className="text-shield-mid">Letter</span>
            </span>
          </div>
          <p className="text-xs text-white/30 leading-relaxed mb-4 max-w-md">
            RepairLetter generates correspondence based on UK housing legislation. It does not
            constitute legal advice. For specific legal guidance, contact
            Citizens Advice, Shelter, or a qualified solicitor.
          </p>
          <div className="flex flex-wrap gap-4 text-xs">
            <a href="/privacy" className="text-white/40 hover:text-white/70 transition-colors">Privacy Policy</a>
            <a href="/terms" className="text-white/40 hover:text-white/70 transition-colors">Terms of Service</a>
          </div>
          <p className="text-[10px] text-white/15 mt-6">
            © {new Date().getFullYear()} RepairLetter · Autaimate · ICO Registered · UK GDPR Compliant
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ── Components ──────────────────────────────────────────── */

function Step({ icon, label, detail }: { icon: React.ReactNode; label: string; detail: string }) {
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

function HowItWorksCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="bg-white border border-border rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-7 h-7 rounded-lg bg-shield text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {number}
        </span>
        <h3 className="text-sm font-bold text-navy">{title}</h3>
      </div>
      <p className="text-sm text-slate leading-relaxed">{description}</p>
    </div>
  );
}

function LegalCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white border border-border border-l-4 border-l-shield rounded-xl p-5">
      <h3 className="text-sm font-bold text-navy mb-2">{title}</h3>
      <p className="text-sm text-slate leading-relaxed">{description}</p>
    </div>
  );
}

function DifferenceCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white border border-border rounded-xl p-4 flex gap-3">
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-shield-light text-shield flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-bold text-navy mb-1">{title}</h3>
        <p className="text-xs text-slate leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-navy pr-4">{question}</span>
        <ChevronDown className={`h-4 w-4 text-slate flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm text-slate leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
