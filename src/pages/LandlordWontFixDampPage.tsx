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
      '@id': 'https://repairletter.co.uk/landlord-wont-fix-damp#webpage',
      url: 'https://repairletter.co.uk/landlord-wont-fix-damp',
      name: "Landlord Won't Fix Damp or Mould? Act Now | RepairLetter",
      description: "Landlord won't fix damp or mould? Under Awaab's Law and HHSRS, they must act within strict timescales. Legal letter with photo evidence in 60 seconds — £4.99.",
      isPartOf: { '@id': 'https://repairletter.co.uk/#organization' },
      speakable: { '@type': 'SpeakableSpecification', cssSelector: ['#quick-answer', 'h1'] },
      inLanguage: 'en-GB',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://repairletter.co.uk/' },
          { '@type': 'ListItem', position: 2, name: "Landlord Won't Fix Damp", item: 'https://repairletter.co.uk/landlord-wont-fix-damp' },
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
      name: "What to Do When Your Landlord Won't Fix Damp",
      description: 'Step-by-step guide to getting damp and mould fixed when your landlord refuses.',
      totalTime: 'PT14D',
      step: [
        { '@type': 'HowToStep', position: 1, name: 'Document before cleaning', text: 'Photograph all affected areas thoroughly before any cleaning. This evidence is essential.' },
        { '@type': 'HowToStep', position: 2, name: 'Send formal written notice', text: "Cite Awaab's Law, HHSRS Damp and Mould Growth, s.11 LTA 1985. Your landlord must acknowledge within 14 days." },
        { '@type': 'HowToStep', position: 3, name: 'Contact environmental health if ignored', text: 'Report to your local council. Extensive damp and mould is typically a Category 1 HHSRS hazard.' },
        { '@type': 'HowToStep', position: 4, name: 'Claim compensation', text: 'For health impact, inconvenience, and damaged belongings. Keep all records.' },
      ],
    },
    {
      '@type': 'Article',
      headline: "Landlord Won't Fix Damp: Your Legal Rights UK 2026",
      author: { '@type': 'Organization', name: 'RepairLetter' },
      publisher: { '@id': 'https://repairletter.co.uk/#organization' },
      datePublished: '2026-04-10',
      dateModified: '2026-04-10',
      description: "Complete guide to what UK tenants can do when their landlord refuses to fix damp — Awaab's Law, HHSRS, compensation, and escalation routes.",
      mainEntityOfPage: 'https://repairletter.co.uk/landlord-wont-fix-damp',
    },
    {
      '@type': 'DefinedTermSet',
      name: 'Damp Rights Terminology',
      definedTerm: [
        { '@type': 'DefinedTerm', name: 'HHSRS Damp and Mould Growth', description: 'Hazard Category 1 under the Housing Health and Safety Rating System. Local authorities have a duty to act when this hazard is found at Category 1 level.' },
        { '@type': 'DefinedTerm', name: "Awaab's Law", description: "Legislation requiring landlords to acknowledge damp and mould reports within 14 days and complete urgent repairs within 14 days. Extended to private landlords from May 2026." },
      ],
    },
  ],
};

const FAQ_DATA = [
  { q: "Is my landlord legally responsible for fixing damp?", a: "In most cases, yes. Under s.11 of the Landlord and Tenant Act 1985, your landlord is responsible for keeping the structure and exterior of your home in repair — including roofs, walls, and windows that allow damp penetration. Rising damp, penetrating damp, and condensation caused by structural defects (inadequate insulation, poor ventilation design, cold bridging) are all the landlord's responsibility. From 1 May 2026, Awaab's Law requires private landlords to address damp and mould within strict timescales." },
  { q: "What should I do if my landlord refuses to fix damp?", a: "Step 1: Send a formal written repair letter citing Awaab's Law, the HHSRS Damp and Mould Growth hazard, s.11 LTA 1985, and the Homes Act 2018. Attach photographs. Step 2: If no response within 14 days, contact your local council's environmental health department. Step 3: If the council identifies a Category 1 HHSRS hazard, they have a duty to serve an Improvement Notice on your landlord. Step 4: Consider applying to the First-tier Tribunal for a rent repayment order." },
  { q: "Can my landlord blame me for damp?", a: "Landlords frequently claim damp is caused by tenant lifestyle — poor ventilation, drying clothes indoors. While condensation can be influenced by occupant behaviour, the root cause is almost always structural: inadequate insulation, cold thermal bridging, missing or broken extractor fans, or poor ventilation design. An environmental health inspection will assess the actual structural cause objectively. Awaab's Law does not exempt landlords from their obligations because they assert tenant fault." },
  { q: "How quickly must my landlord fix damp under Awaab's Law?", a: "From 1 May 2026: acknowledgement within 14 days of your written report; emergency repairs (immediate health risk) must begin within 24 hours; urgent repairs (Category 1 HHSRS) must be completed within 14 days; other damp repairs within a reasonable period, typically 28 to 56 days." },
  { q: "Can I claim compensation for damp and mould?", a: "Yes. If your landlord has failed to fix damp after receiving formal written notice, you may be able to claim: compensation for inconvenience and discomfort; the cost of damaged belongings (clothing, bedding, furniture); medical costs if your health has been affected; the cost of dehumidifiers, anti-mould paint, or other measures you took yourself. Apply through the First-tier Tribunal or county court with your evidence pack." },
  { q: "What if damp has damaged my belongings?", a: "If damp has damaged your clothing, furniture, or other possessions, keep a photographic record of the damage and the cost of replacement. This is recoverable as a damages claim against your landlord. Your landlord's liability depends on whether you gave them notice of the damp — which is why the formal repair letter is so important." },
  { q: "Should I clean the mould before or after photographing it?", a: "Always photograph before cleaning. The photographs you take now are the evidence of the severity of the problem at the time of your formal notice. If you clean the mould before photographing it, you lose that evidence. Take wide shots, close-ups, and measurements if possible. Then photograph again after cleaning to show it returns — this demonstrates the structural nature of the problem." },
  { q: "What is the HHSRS Damp and Mould Growth hazard?", a: "Damp and Mould Growth is Hazard Category 1 under the Housing Health and Safety Rating System — one of the most serious housing hazards. It is associated with respiratory conditions including asthma, allergic rhinitis, and fungal infections. When environmental health classifies damp and mould in your property as Category 1, the council has a statutory duty to take enforcement action against your landlord." },
  { q: "Can I withhold rent because of damp?", a: "Withholding rent is legally risky and not recommended without specific legal advice. Your landlord can apply for possession on rent arrears grounds regardless of the state of the property. There are safer legal routes — formal letter, environmental health, tribunal — that address the damp without putting your tenancy at risk." },
  { q: "What if damp is from the property above?", a: "If the damp originates from a leak or defect in a flat above yours, your landlord remains responsible for repairing the damage to your property. The source of the water does not affect your landlord's obligation — they own the building and must keep it maintained so that each flat is habitable." },
  { q: "Can the council make my landlord pay for damp repairs?", a: "Yes. If the council serves an Improvement Notice and your landlord fails to comply, the council can carry out the works themselves and recover the full cost from the landlord. Failure to comply with an Improvement Notice is also a criminal offence carrying unlimited fines." },
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

export function LandlordWontFixDampPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-navy">
      <Helmet>
        <title>Landlord Won't Fix Damp or Mould? Act Now | RepairLetter</title>
        <meta name="description" content="Landlord won't fix damp or mould? Awaab's Law requires action within 14 days. Legal letter with photo evidence citing HHSRS and UK housing law in 60 seconds — £4.99." />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href="https://repairletter.co.uk/landlord-wont-fix-damp" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://repairletter.co.uk/landlord-wont-fix-damp" />
        <meta property="og:title" content="Landlord Won't Fix Damp or Mould? Act Now | RepairLetter" />
        <meta property="og:description" content="Landlord ignoring damp and mould? Awaab's Law requires acknowledgement in 14 days. Legal letter in 60 seconds." />
        <meta property="og:image" content="https://repairletter.co.uk/og-repair-letter.jpg" />
        <meta property="og:locale" content="en_GB" />
        <meta property="og:site_name" content="RepairLetter" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Landlord Won't Fix Damp or Mould? Act Now" />
        <meta name="twitter:description" content="Awaab's Law: your landlord must acknowledge damp reports in 14 days and fix urgent cases in 14 days." />
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
          <p id="quick-answer" className="text-amber-400 text-xs uppercase tracking-widest font-semibold">Awaab's Law — 14-Day Acknowledgement Required</p>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4 max-w-xl">
          Landlord Won't Fix Damp?
          <br />
          <span className="text-shield-mid">Here's What the Law Says.</span>
        </h1>
        <p className="text-white/55 text-sm sm:text-base leading-relaxed mb-8 max-w-lg">
          Damp and mould is the most common — and most legally powerful — housing defect in UK private rentals. Awaab's Law, HHSRS, s.11 LTA 1985, and the Homes Act 2018 all apply. Your landlord must acknowledge your formal report within 14 days and complete urgent repairs within 14 days after that. If they ignore you, the law does not.
        </p>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="w-full sm:w-auto bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              Send your damp repair notice — £4.99 <ArrowRight className="h-4 w-4" />
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
        <span>14-day acknowledgement</span><span className="text-white/15">·</span>
        <span>Compensation rights</span>
      </div>

      <div className="bg-surface">
        <div className="max-w-3xl mx-auto px-6 py-16">

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Why Your Landlord Cannot Ignore Damp</h2>
            <p className="text-sm text-slate leading-relaxed mb-4">
              Damp and mould in a rental property is not a matter of aesthetic preference — it is a legal hazard classified under the Housing Health and Safety Rating System as one of the 29 categories of serious risk. Extensive damp and mould typically qualifies as a Category 1 hazard: the most serious classification, triggering a council duty to act.
            </p>
            <p className="text-sm text-slate leading-relaxed mb-4">
              Under Awaab's Law, extended to private landlords from 1 May 2026, your landlord must acknowledge your written report within 14 days. Under s.11 of the Landlord and Tenant Act 1985, they are responsible for the structural causes of damp — the roof, walls, windows, and drainage that allow water to penetrate. Under the Homes Act 2018, a property with severe damp may not be fit for human habitation.
            </p>
            <p className="text-sm text-slate leading-relaxed">
              The combination of four overlapping legal obligations means that a landlord who ignores damp is not just failing to be a good landlord — they are breaking the law on multiple fronts simultaneously. A formal written letter citing all four puts your landlord on notice of the full extent of their legal exposure.
            </p>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">The Four Laws That Apply to Damp</h2>
            <div className="flex flex-col gap-4">
              {[
                { law: "Awaab's Law", title: '14-day acknowledgement, 14-day urgent repair', desc: "From 1 May 2026, private landlords must acknowledge your report of damp within 14 days, provide an investigation report and remediation plan within 14 days of that, and complete urgent repairs within 14 days. Emergency hazards (immediate health risk) must have repairs begin within 24 hours." },
                { law: 'HHSRS — Housing Act 2004', title: 'Category 1 hazard — council duty to act', desc: 'Damp and Mould Growth is Hazard 1 under the HHSRS. Extensive black mould or structural damp affecting habitability typically qualifies as Category 1, triggering a statutory enforcement duty on your local council.' },
                { law: 's.11 LTA 1985', title: 'Structural causes are always the landlord\'s responsibility', desc: 'Rising damp, penetrating damp, roof leaks, failed guttering, defective pointing — all fall under the landlord\'s obligation to keep structure and exterior in repair. Cannot be excluded by contract.' },
                { law: 'Homes Act 2018', title: 'Severe damp makes a property unfit for habitation', desc: 'Under s.9A LTA 1985 as inserted by the Homes Act 2018, a property with serious damp affecting habitability may not be fit for human habitation. This gives you a direct route to the courts without involving the local authority.' },
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
            <h2 className="text-2xl font-bold text-navy mb-6">What to Do If Your Landlord Won't Fix Damp — Step by Step</h2>
            <div className="flex flex-col gap-4">
              {[
                { step: '1', title: 'Photograph everything before cleaning', desc: 'The extent of mould growth at the time of your formal notice is essential evidence. Wide shots and close-ups of every affected area. Do not clean first. Photograph again monthly to show the damp returning.', urgent: false },
                { step: '2', title: 'Send a formal written notice citing all four laws', desc: "RepairLetter generates a letter citing Awaab's Law, HHSRS, s.11 LTA 1985, and the Homes Act 2018 with your photos embedded. Your landlord's 14-day Awaab's Law acknowledgement clock starts from receipt.", urgent: true },
                { step: '3', title: 'Note any health effects and keep medical records', desc: 'Record any respiratory symptoms, asthma attacks, skin conditions, or sleep disturbance. If you see a GP, keep the consultation records. Medical evidence significantly strengthens any compensation claim.', urgent: false },
                { step: '4', title: 'Report to environmental health if ignored after 14 days', desc: 'Contact your local council. Extensive damp and mould is typically a Category 1 HHSRS hazard. The council can inspect independently and serve an Improvement Notice requiring repairs within a set timeframe.', urgent: true },
                { step: '5', title: 'Claim compensation', desc: 'Keep receipts for damaged belongings, dehumidifiers, anti-mould treatments. Document the period of disrepair. Apply to the First-tier Tribunal for a rent repayment order or county court for damages.', urgent: false },
              ].map((item) => (
                <div key={item.step} className={`bg-white border rounded-xl p-5 ${item.urgent ? 'border-shield/30' : 'border-border'}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-shield text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{item.step}</div>
                    <div>
                      <h3 className="text-sm font-bold text-navy mb-1">{item.title}</h3>
                      <p className="text-xs text-slate leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <div className="bg-white border border-border border-l-4 border-l-amber-400 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-navy mb-2">Damp linked to health problems — escalate immediately</h3>
                  <p className="text-sm text-slate leading-relaxed">
                    If you or any occupant has developed or worsened respiratory problems, asthma, skin conditions, or other health issues that you believe are linked to damp and mould in your home, this changes the urgency of your complaint significantly. Mention the health impact explicitly in your repair letter, keep all medical records, and escalate to environmental health without waiting the full 14-day period if health is deteriorating. The Awaab's Law emergency timescale — 24 hours to begin repairs — applies where there is an immediate health risk.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Related Guides</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { to: '/damp-and-mould-landlord-letter', title: 'Damp and Mould Landlord Letter', desc: 'Full guide to the damp letter — what to include and which laws to cite.' },
                { to: '/awaabs-law-landlord', title: "Awaab's Law for Private Renters", desc: "Timescales, obligations, and how to invoke Awaab's Law." },
                { to: '/environmental-health-complaint-landlord', title: 'Environmental Health Complaint', desc: 'How to escalate when your landlord ignores the damp.' },
                { to: '/landlord-not-fixing-repairs', title: 'Landlord Not Fixing Repairs', desc: 'Full escalation guide from letter to tribunal.' },
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
              <Shield className="h-4 w-4 text-shield-mid" />
              <span className="text-xs text-shield-mid font-medium">Four laws cited in every damp letter</span>
            </div>
            <h2 className="text-2xl font-bold text-navy mb-3">Give Your Landlord Formal Notice Today</h2>
            <p className="text-sm text-slate mb-6 max-w-md mx-auto">
              The 14-day Awaab's Law clock starts when your landlord receives written notice. RepairLetter generates the letter in 60 seconds — photo evidence embedded, all four UK housing laws cited.
            </p>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors inline-flex items-center gap-2">
                  Send your damp notice — £4.99 <ArrowRight className="h-4 w-4" />
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
