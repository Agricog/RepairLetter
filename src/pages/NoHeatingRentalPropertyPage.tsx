import { useNavigate, Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { Helmet } from 'react-helmet-async';
import { FileText, ArrowRight, CheckCircle, ChevronDown, AlertTriangle } from 'lucide-react';
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
      '@id': 'https://repairletter.co.uk/no-heating-rental-property-rights#webpage',
      url: 'https://repairletter.co.uk/no-heating-rental-property-rights',
      name: 'No Heating in Rental Property: Your Rights UK | RepairLetter',
      description: 'No heating in your rental? Your landlord must act within 24–48 hours under s.11 LTA 1985 and HHSRS Excess Cold. Legal letter in 60 seconds — £4.99.',
      isPartOf: { '@id': 'https://repairletter.co.uk/#organization' },
      speakable: { '@type': 'SpeakableSpecification', cssSelector: ['#quick-answer', 'h1'] },
      inLanguage: 'en-GB',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://repairletter.co.uk/' },
          { '@type': 'ListItem', position: 2, name: 'No Heating Rental Property Rights', item: 'https://repairletter.co.uk/no-heating-rental-property-rights' },
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
      name: 'What to Do If You Have No Heating in a Rental Property',
      description: 'Step-by-step emergency guide for tenants with no heating in a rental.',
      totalTime: 'PT2D',
      step: [
        { '@type': 'HowToStep', position: 1, name: 'Send a formal notice immediately', text: 'Cite s.11(1)(c) LTA 1985 and HHSRS Excess Cold. Demand repair within 24 hours.' },
        { '@type': 'HowToStep', position: 2, name: 'Contact environmental health same day if no response', text: 'No heating is a housing emergency. Environmental health can require emergency action.' },
        { '@type': 'HowToStep', position: 3, name: 'Document everything', text: 'Temperature readings, receipts for alternative heating, health impact records.' },
        { '@type': 'HowToStep', position: 4, name: 'Claim compensation', text: 'Your landlord owes compensation for every day without heating after formal notice.' },
      ],
    },
    {
      '@type': 'Article',
      headline: 'No Heating in Rental Property: Your Rights UK 2026',
      author: { '@type': 'Organization', name: 'RepairLetter' },
      publisher: { '@id': 'https://repairletter.co.uk/#organization' },
      datePublished: '2026-04-10',
      dateModified: '2026-04-10',
      description: 'Complete guide to tenant rights when a rental property has no heating — legal obligations, emergency action, compensation, and escalation routes.',
      mainEntityOfPage: 'https://repairletter.co.uk/no-heating-rental-property-rights',
    },
    {
      '@type': 'DefinedTermSet',
      name: 'No Heating Rights Terminology',
      definedTerm: [
        { '@type': 'DefinedTerm', name: 'Excess Cold', description: 'HHSRS Hazard 2 — a property unable to maintain safe temperatures due to inadequate heating or insulation. Associated with cardiovascular and respiratory conditions.' },
        { '@type': 'DefinedTerm', name: 'Space Heating', description: "Under s.11(1)(c) LTA 1985, landlords must keep installations for space heating in repair and proper working order. This is the core legal basis for a heating failure claim." },
      ],
    },
  ],
};

const FAQ_DATA = [
  { q: 'What are my rights if there is no heating in my rental property?', a: 'Under s.11(1)(c) of the Landlord and Tenant Act 1985, your landlord must keep in repair and proper working order the installations for space heating. A property without functioning heating is a breach of this obligation once you have given written notice. A complete heating failure in cold weather is also an HHSRS Excess Cold hazard, potentially triggering a council duty to require emergency repairs. Your landlord must act within 24 to 48 hours in winter.' },
  { q: 'How quickly must my landlord restore heating?', a: 'For complete loss of heating in cold weather: 24 hours where vulnerable occupants are present (children, elderly, those with health conditions); 48 hours as a standard emergency response. For partial heating failure — some rooms affected — up to 7 days. Your landlord must also provide temporary heating arrangements if the repair takes longer than 24 hours in cold weather.' },
  { q: 'What counts as adequate heating under the law?', a: 'The Decent Homes Standard (extended to private rentals from May 2026) requires heating capable of maintaining main living areas at 21°C and bedrooms at 18°C. The HHSRS Excess Cold hazard framework assesses whether a property can maintain safe indoor temperatures. Storage heaters, gas radiators, electric panel heaters, and underfloor heating all count — provided they are functional and sufficient for the property size.' },
  { q: 'Can environmental health help with a heating failure?', a: 'Yes. A heating failure in cold weather is an emergency. Contact your local council\'s environmental health department the same day you send your formal repair letter. They can require emergency action from your landlord and, if your landlord fails to act, carry out the works themselves and recover the cost.' },
  { q: 'Can I claim the cost of electric heaters from my landlord?', a: 'Yes. If your landlord has failed to repair the heating within the required timeframe after written notice, you can purchase portable electric heaters and claim the cost from your landlord. Keep all receipts. This is a direct loss caused by the landlord\'s breach and is recoverable as damages.' },
  { q: 'What if my landlord says the heating system is too old to fix?', a: 'The age of the heating system is not a defence. Your landlord\'s obligation under s.11(1)(c) is to keep the heating installations in repair and proper working order. If the system is beyond economic repair, they must replace it. A landlord who refuses to replace a failed heating system on grounds of cost or age is in breach of s.11 and the Decent Homes Standard.' },
  { q: 'Is partial heating failure still a breach?', a: 'Yes. If some rooms have no heating — particularly living rooms, main bedrooms, or rooms used by children — this is still a breach of s.11 and may constitute an HHSRS Excess Cold hazard depending on the rooms affected and the outdoor temperature. Your formal letter should describe exactly which rooms or areas are affected.' },
  { q: 'Can my landlord charge me for heating repairs?', a: 'No. The cost of keeping heating installations in repair and proper working order is the landlord\'s responsibility under s.11 LTA 1985. Your landlord cannot pass this cost on to you, deduct it from your deposit, or add it to your rent. Any attempt to do so is unenforceable.' },
  { q: 'What if I have no heating and no hot water?', a: 'Both space heating (s.11(1)(c)) and hot water (s.11(1)(c)) are covered by the same landlord obligation. A complete boiler failure affecting both is the most urgent possible heating failure. Your formal letter should state both problems explicitly. Environmental health will prioritise this as a Category 1 HHSRS hazard.' },
  { q: 'Can I leave the property if there is no heating?', a: 'You are not legally required to leave. However, if the property is genuinely uninhabitable due to cold, you may be able to claim the cost of temporary accommodation from your landlord. This requires you to have given formal notice, allowed a reasonable time to respond, and have documented the temperature and conditions. Seek advice from Citizens Advice before leaving the property.' },
  { q: 'How do I prove there is no heating for my claim?', a: 'Document: the date the heating failed; temperature readings in each room (a cheap digital thermometer is sufficient); photographs of the boiler, radiators, or affected areas; your written formal notice and the date your landlord received it; any communications with your landlord; receipts for temporary heating. RepairLetter\'s evidence pack — timestamped and SHA-256 verified — provides a professional-grade record for any subsequent claim.' },
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

export function NoHeatingRentalPropertyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-navy">
      <Helmet>
        <title>No Heating in Rental Property: Your Rights UK | RepairLetter</title>
        <meta name="description" content="No heating in your rental? Landlord must act within 24–48 hours under s.11 LTA 1985 and HHSRS Excess Cold. Emergency legal notice in 60 seconds — £4.99." />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href="https://repairletter.co.uk/no-heating-rental-property-rights" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://repairletter.co.uk/no-heating-rental-property-rights" />
        <meta property="og:title" content="No Heating in Rental Property: Your Rights UK | RepairLetter" />
        <meta property="og:description" content="No heating? Your landlord must act within 24–48 hours. Emergency legal notice citing HHSRS Excess Cold and s.11 LTA 1985 in 60 seconds." />
        <meta property="og:image" content="https://repairletter.co.uk/og-repair-letter.jpg" />
        <meta property="og:locale" content="en_GB" />
        <meta property="og:site_name" content="RepairLetter" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="No Heating in Rental Property: Your Rights UK" />
        <meta name="twitter:description" content="No heating in your rental? 24–48 hour emergency obligation. Send your notice now." />
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
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <p id="quick-answer" className="text-red-400 text-xs uppercase tracking-widest font-semibold">Housing Emergency — 24–48 Hour Obligation</p>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4 max-w-xl">
          No Heating in Your Rental?
          <br />
          <span className="text-shield-mid">Your Landlord Has 24–48 Hours.</span>
        </h1>
        <p className="text-white/55 text-sm sm:text-base leading-relaxed mb-8 max-w-lg">
          No heating is a housing emergency. Under s.11(1)(c) of the Landlord and Tenant Act 1985 and the HHSRS Excess Cold hazard, your landlord must restore heating within 24 to 48 hours in cold weather. Send formal written notice now — the clock starts when they receive it.
        </p>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="w-full sm:w-auto bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              Send emergency heating notice — £4.99 <ArrowRight className="h-4 w-4" />
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
        <span>s.11(1)(c) LTA 1985</span><span className="text-white/15">·</span>
        <span>HHSRS Excess Cold</span><span className="text-white/15">·</span>
        <span>24–48 hour obligation</span><span className="text-white/15">·</span>
        <span>Compensation rights</span>
      </div>

      <div className="bg-surface">
        <div className="max-w-3xl mx-auto px-6 py-16">

          <section className="mb-16">
            <div className="bg-white border border-red-200 bg-red-50 rounded-2xl p-6 sm:p-8">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                <h2 className="text-2xl font-bold text-navy">This Is a Housing Emergency — Act Today</h2>
              </div>
              <p className="text-sm text-slate leading-relaxed mb-4">
                A rental property without heating in cold weather is not merely uncomfortable — it is a legal emergency. Excess Cold is classified as a potential Category 1 hazard under the Housing Health and Safety Rating System, associated with cardiovascular conditions, respiratory illness, and — in the most extreme cases — death.
              </p>
              <p className="text-sm text-slate leading-relaxed mb-6">
                Your landlord's obligations are clear and immediate. Under s.11(1)(c) LTA 1985, they must keep heating installations in repair and proper working order. The clock starts the moment they receive your formal written notice.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { label: '24 hours', desc: 'Vulnerable occupants present (children, elderly, health conditions)' },
                  { label: '48 hours', desc: 'Standard emergency — complete heating failure in cold weather' },
                  { label: '7 days', desc: 'Partial heating failure — some rooms affected' },
                  { label: 'Same day', desc: 'Report to environmental health if no landlord response' },
                ].map((item, i) => (
                  <div key={i} className="bg-white border border-red-200 rounded-xl p-3">
                    <p className="text-sm font-bold text-shield mb-1">{item.label}</p>
                    <p className="text-xs text-slate">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">The Legal Basis — Four Overlapping Obligations</h2>
            <div className="flex flex-col gap-4">
              {[
                { law: 's.11(1)(c) LTA 1985', title: 'Heating must be in repair and working order', desc: 'The core obligation. Boiler, radiators, central heating system, and controls must function. The landlord cannot use age, cost, or fault as an excuse. The obligation exists as long as you are a tenant.' },
                { law: 'HHSRS — Excess Cold', title: 'No heating may be a Category 1 hazard', desc: 'Excess Cold is Hazard 2 under the HHSRS. Complete heating failure in cold weather typically classifies as Category 1, triggering a council duty to require emergency repairs from your landlord.' },
                { law: 'Decent Homes Standard', title: 'Properties must maintain safe temperatures from May 2026', desc: 'Under the Decent Homes Standard extended to private rentals from 1 May 2026, properties must have effective heating capable of maintaining safe indoor temperatures. No heating fails this standard.' },
                { law: 'Homes Act 2018', title: 'A cold property may not be fit for habitation', desc: 'A property in which safe temperatures cannot be maintained may not be fit for human habitation under s.9A LTA 1985, particularly for young children or those with medical conditions.' },
              ].map((item, i) => (
                <div key={i} className="bg-white border border-border border-l-4 border-l-shield rounded-xl p-5">
                  <span className="text-[10px] uppercase tracking-widest bg-shield/10 text-shield font-bold px-2 py-0.5 rounded-full">{item.law}</span>
                  <h3 className="text-sm font-bold text-navy mt-2 mb-1">{item.title}</h3>
                  <p className="text-xs text-slate leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">What to Do Right Now</h2>
            <div className="flex flex-col gap-3">
              {[
                { title: 'Send a formal written notice immediately', desc: 'Cite s.11(1)(c) LTA 1985, HHSRS Excess Cold, and the Homes Act 2018. State the date heating failed, the current temperature if known, and any vulnerable occupants. Demand repair within 24 to 48 hours.' },
                { title: 'Contact environmental health the same day if no response', desc: 'A heating failure is an emergency. Environmental health can require emergency action. Do not wait 14 days — contact them within hours if your landlord is unresponsive.' },
                { title: 'Record indoor temperatures', desc: 'A cheap digital thermometer will give you verifiable temperature readings. Record them twice daily. Temperatures below 18°C in bedrooms and 16°C in living areas are hazardous, particularly for children and the elderly.' },
                { title: 'Keep all receipts for temporary heating', desc: 'Electric heaters, heated blankets, extra bedding — all recoverable costs if the landlord is in breach. Keep every receipt.' },
                { title: 'Document health effects', desc: 'If anyone in the household develops cold-related symptoms, respiratory problems, or requires medical attention, keep records. This strengthens any compensation claim.' },
              ].map((item, i) => (
                <div key={i} className="bg-white border border-border rounded-xl p-4 flex gap-3">
                  <CheckCircle className="h-4 w-4 text-shield flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-navy mb-1">{item.title}</h3>
                    <p className="text-xs text-slate leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Related Guides</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { to: '/landlord-wont-fix-boiler', title: "Landlord Won't Fix Boiler", desc: 'Specific guide for boiler failure — the most common cause of no heating.' },
                { to: '/how-long-landlord-fix-heating', title: 'How Long Does a Landlord Have to Fix Heating', desc: 'Exact timescales by type of heating failure and urgency.' },
                { to: '/how-to-report-landlord-to-council', title: 'Report to Environmental Health', desc: 'Emergency route when your landlord ignores a heating failure.' },
                { to: '/letter-to-landlord-about-repairs', title: 'Write a Repair Letter', desc: 'Send the formal notice that starts your landlord\'s legal clock.' },
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
            <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-4 py-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-red-700 font-medium">Housing emergency — 24–48 hour legal obligation</span>
            </div>
            <h2 className="text-2xl font-bold text-navy mb-3">Send the Emergency Notice Now</h2>
            <p className="text-sm text-slate mb-6 max-w-md mx-auto">
              Your landlord's obligation begins when they receive your written notice. RepairLetter generates the correct emergency notice in 60 seconds — citing all four applicable UK housing laws.
            </p>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors inline-flex items-center gap-2">
                  Send emergency notice — £4.99 <ArrowRight className="h-4 w-4" />
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
