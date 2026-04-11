import { useNavigate, Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { Helmet } from 'react-helmet-async';
import {
  FileText,
  ArrowRight,
  AlertTriangle,
  ChevronDown,
  Shield,
  CheckCircle,
  Clock,
} from 'lucide-react';
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
      description: 'AI-powered repair letter generator for UK tenants.',
      foundingDate: '2026',
      founder: { '@type': 'Organization', name: 'Autaimate' },
      contactPoint: { '@type': 'ContactPoint', email: 'hello@repairletter.co.uk', contactType: 'customer service' },
    },
    {
      '@type': 'WebPage',
      '@id': 'https://repairletter.co.uk/damp-and-mould-landlord-letter#webpage',
      url: 'https://repairletter.co.uk/damp-and-mould-landlord-letter',
      name: 'Damp and Mould Landlord Letter UK 2026 | RepairLetter',
      description: 'Send a legal letter to your landlord about damp and mould in the UK. Cites Awaab\'s Law, HHSRS, and s.11 LTA 1985. Photo evidence attached. £4.99.',
      isPartOf: { '@id': 'https://repairletter.co.uk/#organization' },
      speakable: { '@type': 'SpeakableSpecification', cssSelector: ['#quick-answer', 'h1'] },
      inLanguage: 'en-GB',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://repairletter.co.uk/' },
          { '@type': 'ListItem', position: 2, name: 'Damp and Mould Landlord Letter', item: 'https://repairletter.co.uk/damp-and-mould-landlord-letter' },
        ],
      },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'RepairLetter',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web, iOS, Android',
      offers: { '@type': 'Offer', price: '4.99', priceCurrency: 'GBP' },
      description: 'Generate a legal damp and mould letter to your landlord in 60 seconds with photo evidence and UK law citations.',
    },
    {
      '@type': 'HowTo',
      name: 'How to Write a Damp and Mould Letter to Your Landlord',
      description: 'Step-by-step guide to sending a legal letter about damp and mould to your UK landlord.',
      totalTime: 'PT1M',
      step: [
        { '@type': 'HowToStep', position: 1, name: 'Photograph the damp and mould', text: 'Take clear photos of all affected areas. AI classifies the hazard against HHSRS categories.' },
        { '@type': 'HowToStep', position: 2, name: 'Describe the problem by voice', text: 'Record a voice note describing how long it has been present and how it affects your health and use of the property.' },
        { '@type': 'HowToStep', position: 3, name: 'Review the legal letter', text: 'A letter citing Awaab\'s Law, HHSRS Damp and Mould Growth hazard, s.11 LTA 1985 and the Homes Act 2018 is generated.' },
        { '@type': 'HowToStep', position: 4, name: 'Pay £4.99 and send', text: 'Your landlord receives the letter with photo evidence. A 14-day deadline is tracked automatically.' },
      ],
    },
    {
      '@type': 'Article',
      headline: 'Damp and Mould Landlord Letter: The Complete UK Guide 2026',
      author: { '@type': 'Organization', name: 'RepairLetter' },
      publisher: { '@id': 'https://repairletter.co.uk/#organization' },
      datePublished: '2026-04-10',
      dateModified: '2026-04-10',
      description: 'How UK tenants can write a legal letter to their landlord about damp and mould, citing Awaab\'s Law, HHSRS, and s.11 LTA 1985.',
      mainEntityOfPage: 'https://repairletter.co.uk/damp-and-mould-landlord-letter',
    },
    {
      '@type': 'DefinedTermSet',
      name: "UK Damp and Mould Tenant Rights Terminology",
      definedTerm: [
        { '@type': 'DefinedTerm', name: "Awaab's Law", description: "Legislation named after Awaab Ishak requiring landlords to address damp and mould within strict timescales, extended to private rentals from 2026." },
        { '@type': 'DefinedTerm', name: 'HHSRS Damp and Mould Growth', description: 'Hazard category 1 under the Housing Health and Safety Rating System covering biological growth including mould, which poses respiratory health risks.' },
        { '@type': 'DefinedTerm', name: 'Category 1 Hazard', description: 'The most serious hazard classification under HHSRS, triggering a local authority duty to take enforcement action.' },
      ],
    },
  ],
};

const FAQ_DATA = [
  { q: 'Is my landlord responsible for fixing damp and mould?', a: 'In most cases, yes. Under s.11 of the Landlord and Tenant Act 1985, your landlord is responsible for repairing the structure and exterior of your home, including roofs, walls, and windows that allow damp penetration. If the cause is structural — rising damp, penetrating damp, condensation caused by inadequate ventilation or heating — your landlord is responsible. Damp caused solely by the tenant\'s lifestyle choices may be contested, but most damp in UK private rentals has a structural component.' },
  { q: 'What is Awaab\'s Law and does it apply to private renters?', a: 'Awaab\'s Law is named after Awaab Ishak, a two-year-old boy who died in 2020 from a respiratory condition caused by mould in his family\'s housing association flat. The law requires landlords to address damp and mould within strict, legally prescribed timescales. Under the Renters\' Rights Act 2025, Awaab\'s Law is extended to the private rented sector from 2026, meaning private landlords face the same obligations as social housing providers.' },
  { q: 'Can damp and mould make me ill?', a: 'Yes. The NHS and HHSRS both recognise damp and mould growth as a significant health hazard. Exposure is associated with respiratory conditions including asthma and allergic rhinitis, worsening of COPD, fungal infections, and increased susceptibility to respiratory infections. Children, elderly people, and those with pre-existing respiratory conditions are most at risk. If you or a family member have experienced health problems linked to damp and mould, keep records and mention it in your repair letter.' },
  { q: 'What is the HHSRS classification for damp and mould?', a: 'Damp and Mould Growth is Hazard Category 1 under the Housing Health and Safety Rating System — the most serious category. Local authorities have a statutory duty to take enforcement action when a Category 1 hazard is identified. RepairLetter\'s AI analyses your photos and identifies the specific HHSRS hazard category, which is then cited in your letter.' },
  { q: 'How quickly must my landlord deal with damp and mould?', a: 'Under Awaab\'s Law as extended to private rentals: emergency hazards — 24 hours to begin repair; urgent hazards — 14 days to complete; other hazards — reasonable time (typically 28 days). Black mould covering large areas is typically classified as an urgent or emergency hazard, particularly where children or vulnerable people are present.' },
  { q: 'What if my landlord says the mould is caused by my lifestyle?', a: 'Landlords commonly argue that mould is caused by "lifestyle factors" — insufficient ventilation, not enough heating, or drying clothes indoors. While condensation mould can sometimes be influenced by occupant behaviour, in most cases the root cause is structural: inadequate insulation, poor ventilation design, cold thermal bridging, or missing extractor fans. An environmental health inspection will assess the actual cause objectively.' },
  { q: 'Can I withhold rent because of damp and mould?', a: 'Withholding rent carries serious legal risk. Your landlord can apply for possession on rent arrears grounds. Instead, consider: (1) sending a formal repair letter; (2) reporting to environmental health; (3) applying for a rent repayment order via the First-tier Tribunal. These routes address the damp and mould without putting your tenancy at risk.' },
  { q: 'Should I photograph the mould before cleaning it?', a: 'Yes — always photograph before cleaning. Photos of the extent of the mould growth are essential evidence. If you clean the mould without photographing it first, you lose evidence of the severity. Photograph from multiple angles, include reference objects for scale, and note the date. RepairLetter stores your photos with SHA-256 integrity hashes.' },
  { q: 'What if the damp is from my upstairs neighbour?', a: 'If the source of damp is from another unit (a leak from the flat above), your landlord is still responsible for repairing the damage to your flat — they cannot simply say "it\'s not our fault." Your landlord owns the building and is responsible for maintaining it so that each unit is habitable.' },
  { q: 'Can I report damp and mould to the council?', a: 'Yes. Your local council\'s environmental health department can inspect under the HHSRS. If they classify damp and mould as a Category 1 hazard, they have a duty to take action — including serving an Improvement Notice with legal penalties for non-compliance. RepairLetter auto-generates your environmental health complaint if your landlord doesn\'t respond within 14 days.' },
  { q: 'What should a damp and mould letter to my landlord include?', a: 'Your letter should include: the specific location and extent of damp/mould in the property; when you first noticed it and how it has progressed; how it affects your health and the habitability of the property; citation of Awaab\'s Law, the HHSRS Damp and Mould Growth hazard category, s.11 LTA 1985, and the Homes Act 2018; a deadline for action; and photo evidence. RepairLetter generates all of this automatically.' },
  { q: 'Is black mould more serious than other types?', a: 'Black mould (Stachybotrys chartarum) is commonly associated with severe damp and poor ventilation. It releases mycotoxins and is linked to more serious health effects than common surface mould. Under HHSRS, extensive black mould typically qualifies as a Category 1 hazard, triggering a local authority duty to act.' },
];

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_DATA.map(faq => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: { '@type': 'Answer', text: faq.a },
  })),
};

export function DampAndMouldLandlordLetterPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-navy">
      <Helmet>
        <title>Damp and Mould Landlord Letter UK 2026 | RepairLetter</title>
        <meta name="description" content="Send a legal letter to your landlord about damp and mould in the UK. Cites Awaab's Law, HHSRS, and s.11 LTA 1985. Photo evidence attached. £4.99." />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href="https://repairletter.co.uk/damp-and-mould-landlord-letter" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://repairletter.co.uk/damp-and-mould-landlord-letter" />
        <meta property="og:title" content="Damp and Mould Landlord Letter UK 2026 | RepairLetter" />
        <meta property="og:description" content="Legal letter to landlord about damp and mould — citing Awaab's Law, HHSRS and s.11 LTA 1985. Photo evidence attached. £4.99." />
        <meta property="og:image" content="https://repairletter.co.uk/og-repair-letter.jpg" />
        <meta property="og:locale" content="en_GB" />
        <meta property="og:site_name" content="RepairLetter" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Damp and Mould Landlord Letter UK 2026" />
        <meta name="twitter:description" content="Legal letter to your landlord about damp and mould — Awaab's Law, HHSRS, s.11 LTA 1985. £4.99." />
        <meta name="twitter:image" content="https://repairletter.co.uk/og-repair-letter.jpg" />
        <meta name="author" content="RepairLetter — Autaimate" />
        <script type="application/ld+json">{JSON.stringify(STRUCTURED_DATA)}</script>
        <script type="application/ld+json">{JSON.stringify(FAQ_SCHEMA)}</script>
      </Helmet>

      <header className="px-6 pt-10 pb-12 max-w-3xl mx-auto">
        <div className="flex items-center gap-2.5 mb-10">
          <Link to="/" className="flex items-center gap-2.5">
            <FileText className="h-7 w-7 text-shield-mid" />
            <span className="text-xl font-bold text-white tracking-tight">Repair<span className="text-shield-mid">Letter</span></span>
          </Link>
        </div>
        <nav className="mb-6">
          <Link to="/" className="text-white/40 hover:text-white/70 text-xs transition-colors">← Back to RepairLetter</Link>
        </nav>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <p id="quick-answer" className="text-amber-400 text-xs uppercase tracking-widest font-semibold">Awaab's Law Now Applies to Private Renters</p>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4 max-w-xl">
          Damp and Mould in Your Rental?
          <br />
          <span className="text-shield-mid">Your Landlord Is Legally Responsible.</span>
        </h1>
        <p className="text-white/55 text-sm sm:text-base leading-relaxed mb-8 max-w-lg">
          Damp and mould growth is the most common housing defect reported by UK tenants — and one of the most legally powerful. It triggers Awaab's Law, the HHSRS Damp and Mould Growth hazard, s.11 LTA 1985, and the Homes Act 2018. A formal letter with photo evidence puts your landlord on notice and starts the legal clock.
        </p>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="w-full sm:w-auto bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              Send a damp and mould letter — £4.99 <ArrowRight className="h-4 w-4" />
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <button onClick={() => navigate('/dashboard')} className="w-full sm:w-auto bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
            Go to dashboard <ArrowRight className="h-4 w-4" />
          </button>
        </SignedIn>
      </header>

      <div className="bg-navy-mid px-6 py-4 flex items-center justify-center gap-6 text-[10px] text-white/35 uppercase tracking-widest flex-wrap">
        <span>Awaab's Law</span><span className="text-white/15">·</span>
        <span>HHSRS Category 1</span><span className="text-white/15">·</span>
        <span>s.11 LTA 1985</span><span className="text-white/15">·</span>
        <span>Homes Act 2018</span>
      </div>

      <div className="bg-surface">
        <div className="max-w-3xl mx-auto px-6 py-16">

          {/* Awaabs Law highlight */}
          <section className="mb-16">
            <div className="bg-white border border-border rounded-2xl p-6 sm:p-8">
              <div className="flex items-start gap-3 mb-4">
                <Shield className="h-6 w-6 text-shield flex-shrink-0 mt-0.5" />
                <h2 className="text-2xl font-bold text-navy">Awaab's Law: What Private Tenants Need to Know</h2>
              </div>
              <p className="text-sm text-slate leading-relaxed mb-4">
                Awaab Ishak was two years old when he died in December 2020 from a respiratory condition caused by extensive mould in the housing association flat in Rochdale where his family lived. A coroner's inquest found that the mould was the cause of death, and that the landlord had failed to address repeated complaints from the family.
              </p>
              <p className="text-sm text-slate leading-relaxed mb-4">
                The government's response was Awaab's Law — legislation that requires landlords to address damp and mould within strict, legally prescribed timescales. It was originally enacted for the social housing sector but under the Renters' Rights Act 2025, it is extended to private rentals from 2026.
              </p>
              <p className="text-sm text-slate leading-relaxed mb-4">
                The timescales are specific: landlords must acknowledge reports of damp and mould within 14 days, complete emergency repairs within 24 hours, and urgently required repairs within 14 days. Failure to comply is a breach of the tenancy agreement and can result in enforcement action, financial penalties, and compensation claims.
              </p>
              <p className="text-sm text-slate leading-relaxed">
                RepairLetter cites Awaab's Law in every damp and mould letter it generates. For many landlords, seeing this specific legal reference changes their response immediately.
              </p>
            </div>
          </section>

          {/* Types of damp */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Types of Damp — and Who Is Responsible</h2>
            <p className="text-sm text-slate leading-relaxed mb-6">
              Landlords often try to argue that damp is caused by tenant behaviour. Understanding the different types of damp helps you make the correct legal argument.
            </p>
            <div className="flex flex-col gap-4">
              {[
                {
                  type: 'Rising Damp',
                  responsible: 'Always landlord',
                  desc: 'Water from the ground rising through walls due to failed or absent damp-proof course. Landlords are legally responsible for the structure and exterior of the building. Rising damp is a structural defect — always the landlord\'s responsibility under s.11 LTA 1985.',
                  color: 'border-l-red-500',
                },
                {
                  type: 'Penetrating Damp',
                  responsible: 'Always landlord',
                  desc: 'Water entering through the walls, roof, windows, or guttering due to structural defects. Examples: failed pointing, cracked render, blocked gutters, defective roof tiles, poor window seals. Always the landlord\'s responsibility under s.11 LTA 1985.',
                  color: 'border-l-red-500',
                },
                {
                  type: 'Condensation and Mould from Poor Ventilation',
                  responsible: 'Usually landlord',
                  desc: 'Condensation forms when warm, moist air meets cold surfaces. While tenants can exacerbate it, the root cause is usually structural: inadequate insulation, poor ventilation design, blocked or missing extractor fans, or insufficient heating. Environmental health inspections typically identify structural causes in the majority of UK private rental damp complaints.',
                  color: 'border-l-amber-500',
                },
                {
                  type: 'Leak from Neighbouring Property',
                  responsible: 'Landlord',
                  desc: 'If damp originates from a neighbouring property or a unit above, your landlord is still responsible for the repairs to your property. They must address the damage to your home regardless of where the water originated.',
                  color: 'border-l-shield',
                },
              ].map((item, i) => (
                <div key={i} className={`bg-white border border-border border-l-4 ${item.color} rounded-xl p-5`}>
                  <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                    <h3 className="text-sm font-bold text-navy">{item.type}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.responsible === 'Always landlord' ? 'bg-red-100 text-red-700' : item.responsible === 'Usually landlord' ? 'bg-amber-100 text-amber-700' : 'bg-shield/10 text-shield'}`}>
                      {item.responsible}
                    </span>
                  </div>
                  <p className="text-xs text-slate leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Health impact */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Health Impacts of Damp and Mould — and Why They Matter Legally</h2>
            <p className="text-sm text-slate leading-relaxed mb-4">
              Damp and mould growth is classified as a Category 1 hazard under the HHSRS — the most serious category — precisely because of its well-documented health impacts. The NHS, the British Medical Association, and the World Health Organisation all recognise the link between indoor mould exposure and serious health conditions.
            </p>
            <p className="text-sm text-slate leading-relaxed mb-6">
              Documenting health impacts strengthens your legal position considerably. If you or a family member have experienced any of the following since the damp or mould appeared, mention it in your repair letter and keep GP or hospital records.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                'Asthma — new onset or worsening of existing',
                'Allergic rhinitis (hay fever symptoms year-round)',
                'Chronic cough or chest infections',
                'Skin conditions — eczema, rashes',
                'Eye, nose or throat irritation',
                'Fungal respiratory infections',
                'Worsening of COPD or other respiratory conditions',
                'Sleep disturbance or general malaise',
              ].map((item, i) => (
                <div key={i} className="bg-white border border-border rounded-xl p-4 flex gap-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Timescales */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Awaab's Law Timescales for Damp and Mould Repairs</h2>
            <div className="flex flex-col gap-4">
              {[
                { timeframe: '14 days', label: 'Acknowledgement', desc: 'Your landlord must acknowledge your report of damp or mould within 14 days. No response within this period is itself a breach.', icon: <Clock className="h-5 w-5 text-shield" /> },
                { timeframe: '24 hours', label: 'Emergency repairs begin', desc: 'Where damp or mould poses an immediate health risk — particularly with children, pregnant women, or immunocompromised individuals present — repairs must begin within 24 hours.', icon: <AlertTriangle className="h-5 w-5 text-red-500" /> },
                { timeframe: '14 days', label: 'Urgent repairs complete', desc: 'Urgent damp and mould repairs — Category 1 HHSRS hazards — must be completed within 14 days of the report being made.', icon: <Clock className="h-5 w-5 text-amber-500" /> },
                { timeframe: '28–56 days', label: 'Non-urgent repairs', desc: 'Other damp and mould repairs that do not pose an immediate risk must be completed within a reasonable period.', icon: <CheckCircle className="h-5 w-5 text-shield" /> },
              ].map((item, i) => (
                <div key={i} className="bg-white border border-border rounded-xl p-5 flex gap-4">
                  <div className="flex-shrink-0">{item.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="text-sm font-bold text-navy">{item.label}</h3>
                      <span className="text-xs font-bold text-shield">{item.timeframe}</span>
                    </div>
                    <p className="text-xs text-slate leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Related pages */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Related Tenant Rights Guides</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { to: '/letter-to-landlord-about-repairs', title: 'Letter to Landlord About Repairs', desc: 'The complete guide to writing a legal repair letter to your landlord.' },
                { to: '/landlord-not-fixing-repairs', title: 'Landlord Not Fixing Repairs', desc: 'Step-by-step escalation if your landlord ignores your damp complaint.' },
                { to: '/environmental-health-complaint-landlord', title: 'Environmental Health Complaint', desc: 'How to report damp and mould to your local council under HHSRS.' },
                { to: '/renters-rights-act-2025', title: 'Renters\' Rights Act 2025', desc: 'How Awaab\'s Law and the Decent Homes Standard now protect private tenants.' },
              ].map((link, i) => (
                <Link key={i} to={link.to} className="bg-white border border-border rounded-xl p-4 hover:border-shield/40 transition-colors">
                  <h3 className="text-sm font-bold text-navy mb-1">{link.title}</h3>
                  <p className="text-xs text-slate leading-relaxed">{link.desc}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* FAQs */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Frequently Asked Questions</h2>
            <div className="flex flex-col gap-3">
              {FAQ_DATA.map((faq, i) => (<FaqItem key={i} question={faq.q} answer={faq.a} />))}
            </div>
          </section>

          <section className="text-center py-8">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-amber-700 font-medium">Awaab's Law applies to private renters from 2026</span>
            </div>
            <h2 className="text-2xl font-bold text-navy mb-3">Send Your Damp and Mould Letter Today</h2>
            <p className="text-sm text-slate mb-6 max-w-md mx-auto">
              Photograph the affected areas. Describe the problem by voice. A legal letter citing Awaab's Law, HHSRS, and UK housing legislation is sent to your landlord in 60 seconds.
            </p>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors inline-flex items-center gap-2">
                  Send your damp letter — £4.99 <ArrowRight className="h-4 w-4" />
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <button onClick={() => navigate('/dashboard')} className="bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors inline-flex items-center gap-2">
                Go to dashboard <ArrowRight className="h-4 w-4" />
              </button>
            </SignedIn>
          </section>
        </div>
      </div>

      <footer className="bg-navy border-t border-white/5 px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-shield-mid" />
            <span className="text-base font-bold text-white tracking-tight">Repair<span className="text-shield-mid">Letter</span></span>
          </div>
          <p className="text-xs text-white/30 leading-relaxed mb-4 max-w-md">
            RepairLetter generates correspondence based on UK housing legislation. It does not constitute legal advice. For specific legal guidance, contact Citizens Advice, Shelter, or a qualified solicitor.
          </p>
          <div className="flex flex-wrap gap-4 text-xs">
            <Link to="/" className="text-white/40 hover:text-white/70 transition-colors">Home</Link>
            <Link to="/privacy" className="text-white/40 hover:text-white/70 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-white/40 hover:text-white/70 transition-colors">Terms of Service</Link>
          </div>
          <p className="text-[10px] text-white/15 mt-6">© {new Date().getFullYear()} RepairLetter · Autaimate · ICO Registered · UK GDPR Compliant</p>
        </div>
      </footer>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left" aria-expanded={open}>
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
