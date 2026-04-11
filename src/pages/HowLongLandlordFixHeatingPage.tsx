import { useNavigate, Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { Helmet } from 'react-helmet-async';
import { FileText, ArrowRight, Scale, CheckCircle, ChevronDown, Shield, AlertTriangle, Clock } from 'lucide-react';
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
      '@id': 'https://repairletter.co.uk/how-long-landlord-fix-heating#webpage',
      url: 'https://repairletter.co.uk/how-long-landlord-fix-heating',
      name: 'How Long Does a Landlord Have to Fix Heating UK | RepairLetter',
      description: 'How long does a landlord have to fix heating in the UK? 24–48 hours for emergencies in winter. Full timescale guide for all heating defects — send a legal notice in 60 seconds.',
      isPartOf: { '@id': 'https://repairletter.co.uk/#organization' },
      speakable: { '@type': 'SpeakableSpecification', cssSelector: ['#quick-answer', 'h1'] },
      inLanguage: 'en-GB',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://repairletter.co.uk/' },
          { '@type': 'ListItem', position: 2, name: 'How Long Does a Landlord Have to Fix Heating', item: 'https://repairletter.co.uk/how-long-landlord-fix-heating' },
        ],
      },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'RepairLetter',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web, iOS, Android',
      offers: { '@type': 'Offer', price: '4.99', priceCurrency: 'GBP' },
    },
    {
      '@type': 'HowTo',
      name: 'How to Enforce Heating Repair Timescales Against Your Landlord',
      description: 'Practical guide to using repair timescales to get your heating fixed.',
      totalTime: 'PT2D',
      step: [
        { '@type': 'HowToStep', position: 1, name: 'Identify the urgency level', text: 'Complete failure in winter = emergency (24–48 hours). Partial failure = urgent (7 days). Minor fault = standard (14–28 days).' },
        { '@type': 'HowToStep', position: 2, name: 'Send a formal notice stating the deadline', text: 'Your letter should state the exact timescale you expect repair within, citing s.11(1)(c) LTA 1985.' },
        { '@type': 'HowToStep', position: 3, name: 'Contact environmental health if deadline missed', text: 'An emergency heating failure with no response: contact environmental health the same day.' },
      ],
    },
    {
      '@type': 'Article',
      headline: 'How Long Does a Landlord Have to Fix Heating? UK Guide 2026',
      author: { '@type': 'Organization', name: 'RepairLetter' },
      publisher: { '@id': 'https://repairletter.co.uk/#organization' },
      datePublished: '2026-04-10',
      dateModified: '2026-04-10',
      description: 'Complete timescale guide for landlord heating repair obligations in the UK — from 24-hour emergencies to 28-day standard repairs, and what to do when deadlines are missed.',
      mainEntityOfPage: 'https://repairletter.co.uk/how-long-landlord-fix-heating',
    },
    {
      '@type': 'DefinedTermSet',
      name: 'Heating Repair Timescale Terminology',
      definedTerm: [
        { '@type': 'DefinedTerm', name: 'Reasonable Time', description: 'The legally required period within which a landlord must complete repairs after receiving formal notice. Varies by urgency and defect type.' },
        { '@type': 'DefinedTerm', name: 'Emergency Repair', description: 'A repair that must begin within 24 hours because it poses an immediate risk to health or safety — such as complete loss of heating in cold weather.' },
      ],
    },
  ],
};

const FAQ_DATA = [
  { q: 'How long does a landlord have to fix heating in the UK?', a: 'The timescale depends on urgency. Complete loss of heating in cold weather with vulnerable occupants present: 24 hours. Complete loss of heating as a standard emergency: 48 hours. Partial heating failure: 3 to 7 days. Minor heating fault not affecting habitability: 14 to 28 days. These timescales begin from the moment your landlord receives your formal written notice. The law requires repair within a "reasonable time" — and for heating, reasonable is defined by the urgency of the situation.' },
  { q: 'Does the season affect how quickly my landlord must fix heating?', a: 'Yes. A heating failure in October to April is significantly more urgent than one in July. In winter, complete loss of heating is classified as an HHSRS Excess Cold hazard — potentially Category 1 — requiring emergency action within 24 to 48 hours. In summer, the same failure may be treated as standard and given 14 to 28 days. Your formal repair letter should note the outdoor temperature and the period of the year.' },
  { q: 'What if my landlord cannot get a heating engineer within 24 hours?', a: 'Your landlord must make every reasonable effort to arrange emergency repair. If a gas-safe engineer cannot attend within 24 hours, your landlord should provide temporary heating — portable electric heaters — until the boiler is repaired. Simply saying "we cannot get anyone" is not a valid excuse for leaving a property without heating. If your landlord fails to provide temporary heating, keep receipts for heaters you purchase yourself.' },
  { q: 'Does the 24-hour timescale apply to hot water as well as heating?', a: 'Yes. Under s.11(1)(c) LTA 1985, both space heating and hot water installations must be kept in repair and proper working order. A complete boiler failure affecting both is an emergency. The same 24 to 48 hour timescale applies to loss of hot water, particularly where there is no alternative (no electric shower, no immersion heater backup).' },
  { q: 'What counts as "vulnerable occupants" for the 24-hour timescale?', a: 'Vulnerable occupants include: children under 16; adults over 65; pregnant women; anyone with a respiratory condition (asthma, COPD, bronchitis); anyone with a cardiovascular condition; anyone with a compromised immune system. If any of these are present in the property, the 24-hour emergency timescale applies. State this explicitly in your formal repair letter.' },
  { q: 'What if my landlord fixes the boiler but it breaks again?', a: 'A repair that fails shortly afterwards is not a proper repair. Your landlord\'s obligation is to keep heating in "proper working order" — not just temporarily functional. If the boiler fails again within weeks or months of a repair, your landlord is in breach again. Send a new formal notice. Repeated failures may indicate the boiler needs replacement rather than repair, which remains the landlord\'s responsibility.' },
  { q: 'Can I claim compensation for the period without heating?', a: 'Yes. For every day your property was without adequate heating after formal notice, you are entitled to compensation for: inconvenience and discomfort; costs of temporary heating; any health impact. The longer the period and the more severe the conditions, the greater the potential compensation. Apply to the First-tier Tribunal or county court with your evidence pack.' },
  { q: 'What if my landlord claims they never received my repair notice?', a: 'RepairLetter sends your letter by email with delivery confirmation. The email provides timestamped proof of when your notice was sent and received. This is why a formal written notice is far more effective than a phone call or text — it creates an undeniable record that your landlord cannot claim they did not receive.' },
  { q: 'How does the timescale change if I have storage heaters instead of a boiler?', a: 'Storage heaters, electric panel heaters, and other heating systems are all covered by s.11(1)(c) LTA 1985. The same timescales apply. A complete failure of storage heaters in winter is an emergency requiring 24 to 48 hour action, regardless of the type of system.' },
  { q: 'Can my landlord charge me for a call-out if I reported the heating problem?', a: 'No. If the heating is broken, your landlord cannot charge you a call-out fee for their legal obligation under s.11(1)(c) to maintain it. Charges for repairs that fall within s.11 are unenforceable. Any clause in your tenancy agreement attempting to make you pay for heating repairs is void.' },
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

const TIMESCALES = [
  { urgency: 'Emergency', time: '24 hours', colour: 'bg-red-500', lightColour: 'bg-red-50 border-red-200', situations: ['Complete loss of heating AND hot water in cold weather', 'Vulnerable occupants present (children, elderly, health conditions)', 'Temperature in property below 16°C', 'Gas boiler failure with no alternative heating'], note: 'Environmental health can require emergency action within 24 hours if landlord fails to respond.' },
  { urgency: 'Urgent', time: '48 hours', colour: 'bg-amber-500', lightColour: 'bg-amber-50 border-amber-200', situations: ['Complete loss of heating in cold weather (no vulnerable occupants)', 'No hot water with no alternative available', 'Boiler failure — October to April'], note: 'If no response within 48 hours, contact environmental health immediately.' },
  { urgency: 'Standard', time: '3–7 days', colour: 'bg-shield', lightColour: 'bg-shield/5 border-shield/20', situations: ['Partial heating failure — some rooms unaffected', 'Heating intermittent but functioning at reduced capacity', 'Loss of heating in mild weather (May–September)'], note: 'State the 7-day deadline explicitly in your formal letter.' },
  { urgency: 'Non-urgent', time: '14–28 days', colour: 'bg-slate-500', lightColour: 'bg-slate-50 border-slate-200', situations: ['Heating working but thermostat or controls faulty', 'Individual radiator not functioning in a well-heated property', 'Heating system noisy but functional'], note: 'Standard repair timescale. Send formal notice and track the 14-day deadline.' },
];

export function HowLongLandlordFixHeatingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-navy">
      <Helmet>
        <title>How Long Does a Landlord Have to Fix Heating UK | RepairLetter</title>
        <meta name="description" content="How long does a landlord have to fix heating? 24 hours for winter emergencies, 48 hours standard, 14 days for non-urgent. Full UK timescale guide — send legal notice in 60 seconds." />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href="https://repairletter.co.uk/how-long-landlord-fix-heating" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://repairletter.co.uk/how-long-landlord-fix-heating" />
        <meta property="og:title" content="How Long Does a Landlord Have to Fix Heating UK | RepairLetter" />
        <meta property="og:description" content="24 hours for emergencies, 48 hours standard, 14–28 days non-urgent. Full landlord heating repair timescale guide for UK tenants." />
        <meta property="og:image" content="https://repairletter.co.uk/og-repair-letter.jpg" />
        <meta property="og:locale" content="en_GB" />
        <meta property="og:site_name" content="RepairLetter" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="How Long Does a Landlord Have to Fix Heating UK" />
        <meta name="twitter:description" content="24 hours in a winter emergency. Full landlord heating repair timescale guide." />
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
        <p id="quick-answer" className="text-white/40 text-xs uppercase tracking-widest mb-3 font-semibold">Heating Repair Timescales — UK Reference Guide</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4 max-w-xl">
          How Long Does a Landlord
          <br />
          <span className="text-shield-mid">Have to Fix Heating?</span>
        </h1>
        <p className="text-white/55 text-sm sm:text-base leading-relaxed mb-8 max-w-lg">
          The law does not give a single fixed timescale — it requires repair within a "reasonable time" after formal notice. What is reasonable depends entirely on urgency. In a winter emergency with children in the property: 24 hours. Standard non-urgent fault: 14 to 28 days. Here is the full reference guide.
        </p>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="w-full sm:w-auto bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              Send a heating repair notice — £4.99 <ArrowRight className="h-4 w-4" />
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
        <span>24 hrs emergency</span><span className="text-white/15">·</span>
        <span>48 hrs urgent</span><span className="text-white/15">·</span>
        <span>7 days partial</span><span className="text-white/15">·</span>
        <span>14–28 days standard</span>
      </div>

      <div className="bg-surface">
        <div className="max-w-3xl mx-auto px-6 py-16">

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Heating Repair Timescales — Full Reference</h2>
            <div className="flex flex-col gap-5">
              {TIMESCALES.map((item, i) => (
                <div key={i} className={`bg-white border rounded-2xl p-6 ${item.lightColour}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`${item.colour} text-white text-xs font-bold px-3 py-1.5 rounded-full`}>{item.urgency}</div>
                    <span className="text-2xl font-bold text-navy">{item.time}</span>
                  </div>
                  <p className="text-xs font-semibold text-navy mb-2">Applies when:</p>
                  <ul className="flex flex-col gap-1.5 mb-3">
                    {item.situations.map((s, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-slate">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate/40 flex-shrink-0 mt-1.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-shield font-medium">{item.note}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-4">The Legal Basis for These Timescales</h2>
            <p className="text-sm text-slate leading-relaxed mb-4">
              The law — s.11(1)(c) of the Landlord and Tenant Act 1985 — requires landlords to keep heating installations "in repair and proper working order" and to complete repairs within a "reasonable time" after notice. The concept of reasonable time is not defined in the statute — it has been developed through case law and regulatory guidance.
            </p>
            <p className="text-sm text-slate leading-relaxed mb-4">
              The HHSRS Excess Cold hazard framework underpins the emergency timescales. Where no heating in cold weather creates an Excess Cold Category 1 hazard, local authorities have powers to require emergency remedial action within 24 hours. This is why environmental health is the immediate escalation route for heating emergencies.
            </p>
            <p className="text-sm text-slate leading-relaxed">
              The Decent Homes Standard, extended to private rentals from 1 May 2026, adds a further obligation: properties must have effective heating systems capable of maintaining safe temperatures. This reinforces the position that a landlord cannot delay heating repairs by claiming the system is old or parts are hard to source.
            </p>
          </section>

          <section className="mb-16">
            <div className="bg-white border border-border border-l-4 border-l-amber-400 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-navy mb-2">The clock starts from formal notice — not from when the boiler broke</h3>
                  <p className="text-sm text-slate leading-relaxed">
                    All timescales run from the date your landlord receives your formal written notice. If your boiler broke on Monday and you send a formal letter on Friday, the 24-hour clock starts on Friday — not Monday. This is why you should send your formal notice the moment you discover a heating failure. Every day of delay is a day your landlord has no legal deadline.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Related Guides</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { to: '/landlord-wont-fix-boiler', title: "Landlord Won't Fix Boiler", desc: 'Specific guide for boiler failure — the most common heating emergency.' },
                { to: '/no-heating-rental-property-rights', title: 'No Heating in Rental Property', desc: 'Full rights guide for tenants with no heating at all.' },
                { to: '/letter-to-landlord-about-repairs', title: 'Write a Repair Letter', desc: 'Send the formal notice that starts the timescale clock.' },
                { to: '/how-to-report-landlord-to-council', title: 'Report to Environmental Health', desc: 'Emergency escalation when timescales are missed.' },
              ].map((link, i) => (
                <Link key={i} to={link.to} className="bg-white border border-border rounded-xl p-4 hover:border-shield/40 transition-colors">
                  <h3 className="text-sm font-bold text-navy mb-1">{link.title}</h3>
                  <p className="text-xs text-slate leading-relaxed">{link.desc}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Frequently Asked Questions</h2>
            <div className="flex flex-col gap-3">
              {FAQ_DATA.map((faq, i) => (<FaqItem key={i} question={faq.q} answer={faq.a} />))}
            </div>
          </section>

          <section className="text-center py-8">
            <div className="inline-flex items-center gap-2 bg-shield/10 border border-shield/20 rounded-full px-4 py-2 mb-4">
              <Clock className="h-4 w-4 text-shield-mid" />
              <span className="text-xs text-shield-mid font-medium">The clock starts when your landlord receives formal notice</span>
            </div>
            <h2 className="text-2xl font-bold text-navy mb-3">Start the Clock Now</h2>
            <p className="text-sm text-slate mb-6 max-w-md mx-auto">
              Every day without formal notice is a day your landlord has no legal deadline. RepairLetter generates the correct heating repair notice in 60 seconds — citing s.11(1)(c) LTA 1985, HHSRS Excess Cold, and the Homes Act 2018.
            </p>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors inline-flex items-center gap-2">
                  Send heating repair notice — £4.99 <ArrowRight className="h-4 w-4" />
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
