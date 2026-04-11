import { useNavigate, Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { Helmet } from 'react-helmet-async';
import { FileText, ArrowRight, Scale, CheckCircle, ChevronDown, Shield, AlertTriangle } from 'lucide-react';
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
      '@id': 'https://repairletter.co.uk/hhsrs-complaint-letter#webpage',
      url: 'https://repairletter.co.uk/hhsrs-complaint-letter',
      name: 'HHSRS Complaint Letter to Landlord UK | RepairLetter',
      description: 'How to write an HHSRS complaint letter to your landlord citing the specific Housing Health and Safety Rating System hazard category. AI identifies your category. £4.99.',
      isPartOf: { '@id': 'https://repairletter.co.uk/#organization' },
      speakable: { '@type': 'SpeakableSpecification', cssSelector: ['#quick-answer', 'h1'] },
      inLanguage: 'en-GB',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://repairletter.co.uk/' },
          { '@type': 'ListItem', position: 2, name: 'HHSRS Complaint Letter', item: 'https://repairletter.co.uk/hhsrs-complaint-letter' },
        ],
      },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'RepairLetter',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web, iOS, Android',
      offers: { '@type': 'Offer', price: '4.99', priceCurrency: 'GBP' },
      description: 'AI analyses your photos against 29 HHSRS categories and generates a complaint letter citing the specific hazard. £4.99.',
    },
    {
      '@type': 'Article',
      headline: 'HHSRS Complaint Letter to Landlord: Complete UK Guide 2026',
      author: { '@type': 'Organization', name: 'RepairLetter' },
      publisher: { '@id': 'https://repairletter.co.uk/#organization' },
      datePublished: '2026-04-10',
      dateModified: '2026-04-10',
      description: 'How to write a complaint letter to your landlord citing the specific HHSRS hazard category — why it matters, how to identify your category, and what happens next.',
      mainEntityOfPage: 'https://repairletter.co.uk/hhsrs-complaint-letter',
    },
    {
      '@type': 'DefinedTermSet',
      name: 'HHSRS Complaint Letter Key Terms',
      definedTerm: [
        { '@type': 'DefinedTerm', name: 'HHSRS', description: 'Housing Health and Safety Rating System — the risk-based framework used by local authorities to assess 29 hazard categories in residential properties.' },
        { '@type': 'DefinedTerm', name: 'Category 1 Hazard', description: 'The most serious HHSRS classification, triggering a local authority duty to take enforcement action against the landlord.' },
        { '@type': 'DefinedTerm', name: 'Improvement Notice', description: 'A formal notice served by a local authority under s.11 Housing Act 2004 requiring specified repairs within a set timeframe.' },
      ],
    },
  ],
};

const FAQ_DATA = [
  { q: 'What is an HHSRS complaint letter?', a: 'An HHSRS complaint letter is a formal repair notice to your landlord that cites the specific Housing Health and Safety Rating System hazard category applicable to your defect. Rather than using general language ("there is mould in my flat"), it uses the precise HHSRS classification ("your property has an HHSRS Damp and Mould Growth hazard"). This connects your complaint to a legally defined hazard category and signals that you are prepared to involve your local council\'s environmental health department.' },
  { q: 'Why does citing the HHSRS hazard category matter?', a: 'The HHSRS is the framework local authorities use to assess residential properties and decide whether to take enforcement action. When your letter cites the specific hazard category, it does three things: it demonstrates you have assessed the defect against the same framework the council uses; it shows your landlord you are prepared to involve environmental health; and it makes any subsequent council inspection more straightforward because the relevant hazard is already identified.' },
  { q: 'How do I identify my HHSRS hazard category?', a: 'RepairLetter\'s AI analyses your photographs against all 29 HHSRS categories and identifies the applicable hazard automatically. For reference, the most common categories for private rental defects are: Hazard 1 Damp and Mould Growth (mould, condensation); Hazard 2 Excess Cold (no heating, poor insulation); Hazard 6 Electrical Hazards (faulty wiring); Hazard 26 Fire (fire detection, escape routes); Hazard 22 Falls on Stairs (broken steps, missing handrails).' },
  { q: 'What is the difference between Category 1 and Category 2 hazards?', a: 'Category 1 hazards are the most serious — scored above a threshold that indicates the risk of harm is unacceptably high. Local authorities have a statutory duty to take enforcement action when they find a Category 1 hazard. Category 2 hazards are less severe. Councils have discretion (not a duty) to act on Category 2 hazards. In practice, extensive damp, no heating in winter, and dangerous electrics will typically be classified as Category 1.' },
  { q: 'Do I need an HHSRS inspection before writing the letter?', a: 'No. You do not need an official HHSRS inspection before sending your repair letter. RepairLetter\'s AI provides an initial hazard classification from your photos. This is sufficient for a formal repair letter. An official HHSRS inspection by an environmental health officer comes after you have reported to the council — not before you write to your landlord.' },
  { q: 'What laws should an HHSRS complaint letter cite?', a: 'An HHSRS complaint letter should cite: the specific HHSRS hazard category under the Housing Act 2004; s.11 of the Landlord and Tenant Act 1985 (the core repairing covenant); s.9A of the LTA 1985 inserted by the Homes (Fitness for Human Habitation) Act 2018; and Awaab\'s Law where the complaint involves damp and mould. RepairLetter cites all applicable legislation automatically.' },
  { q: 'Can I cite HHSRS in a letter to my letting agent?', a: 'Yes. Notice to your letting agent constitutes notice to your landlord. Send your HHSRS complaint letter to your agent at their registered address, with a copy to your landlord if you have their address. The HHSRS citation is equally effective whether addressed to the landlord directly or via their agent.' },
  { q: 'What happens after I send an HHSRS complaint letter?', a: 'Your landlord has 14 days (for Awaab\'s Law applicable complaints) or a reasonable time (for other repairs) to respond and arrange repair. If they ignore you, you report to environmental health with your letter, photos, and evidence of non-response. RepairLetter auto-generates your environmental health complaint document after 14 days.' },
  { q: 'Can an HHSRS complaint letter be used in tribunal proceedings?', a: 'Yes. An HHSRS complaint letter citing the specific hazard category, with delivery confirmation and timestamped photos, is strong evidence in First-tier Tribunal and county court proceedings. It demonstrates: you identified the hazard correctly; you gave your landlord formal notice; you cited the relevant legislation; and your landlord failed to act.' },
  { q: 'Does the HHSRS apply to all rental properties?', a: 'The HHSRS applies to all residential properties in England that are subject to a residential tenancy. This includes houses, flats, HMOs, and mobile homes. It does not apply to commercial properties. Local authorities have powers to inspect any residential property under the HHSRS — they do not need the landlord\'s permission to inspect where there is a complaint of hazardous conditions.' },
  { q: 'How many HHSRS hazard categories are there?', a: 'There are 29 HHSRS hazard categories covering: biological growth (damp and mould); thermal conditions (excess cold, excess heat); chemical hazards (asbestos, carbon monoxide, lead); psychological requirements (crowding, lighting, noise); sanitation (hygiene, water supply, refuse); physical security (entry by intruders); structural hazards (falls, fire, explosions, structural collapse, and others).' },
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

const TOP_HAZARDS = [
  { num: '1', name: 'Damp and Mould Growth', trigger: 'Black mould, condensation, rising or penetrating damp', typical: 'Category 1' },
  { num: '2', name: 'Excess Cold', trigger: 'No heating, broken boiler, inadequate insulation', typical: 'Category 1 in winter' },
  { num: '6', name: 'Electrical Hazards', trigger: 'Faulty wiring, overloaded circuits, exposed conductors', typical: 'Category 1' },
  { num: '14', name: 'Noise', trigger: 'Inadequate sound insulation between dwellings', typical: 'Category 2' },
  { num: '19', name: 'Personal Hygiene', trigger: 'Broken toilet, no bath/shower, inadequate drainage', typical: 'Category 1' },
  { num: '22', name: 'Falls on Level Surfaces', trigger: 'Uneven flooring, trip hazards, slippery surfaces', typical: 'Category 2' },
  { num: '23', name: 'Falls on Stairs', trigger: 'Broken steps, missing handrails, steep gradient', typical: 'Category 1 or 2' },
  { num: '26', name: 'Fire', trigger: 'No smoke alarms, blocked escape routes, unsafe electrics', typical: 'Category 1' },
];

export function HHSRSComplaintLetterPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-navy">
      <Helmet>
        <title>HHSRS Complaint Letter to Landlord UK | RepairLetter</title>
        <meta name="description" content="How to write an HHSRS complaint letter to your landlord. AI identifies your specific hazard category from photos. Letter generated with Housing Act 2004 citation in 60 seconds — £4.99." />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href="https://repairletter.co.uk/hhsrs-complaint-letter" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://repairletter.co.uk/hhsrs-complaint-letter" />
        <meta property="og:title" content="HHSRS Complaint Letter to Landlord UK | RepairLetter" />
        <meta property="og:description" content="HHSRS complaint letter citing your specific hazard category — AI identifies it from your photos. Letter generated in 60 seconds." />
        <meta property="og:image" content="https://repairletter.co.uk/og-repair-letter.jpg" />
        <meta property="og:locale" content="en_GB" />
        <meta property="og:site_name" content="RepairLetter" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="HHSRS Complaint Letter to Landlord UK" />
        <meta name="twitter:description" content="AI identifies your HHSRS hazard from photos. Legal complaint letter in 60 seconds." />
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
        <p id="quick-answer" className="text-white/40 text-xs uppercase tracking-widest mb-3 font-semibold">29 Hazard Categories — AI Classification</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4 max-w-xl">
          HHSRS Complaint Letter
          <br />
          <span className="text-shield-mid">to Your Landlord</span>
        </h1>
        <p className="text-white/55 text-sm sm:text-base leading-relaxed mb-8 max-w-lg">
          A complaint letter that cites the specific HHSRS hazard category is more powerful than a generic repair request. It signals to your landlord that you know which category their property fails — and that you are prepared to involve the council, who will assess it against the same 29 categories. RepairLetter's AI identifies your category from your photos automatically.
        </p>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="w-full sm:w-auto bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              Generate your HHSRS letter — £4.99 <ArrowRight className="h-4 w-4" />
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
        <span>29 HHSRS Categories</span><span className="text-white/15">·</span>
        <span>AI Photo Analysis</span><span className="text-white/15">·</span>
        <span>Category 1 duty to act</span><span className="text-white/15">·</span>
        <span>Housing Act 2004</span>
      </div>

      <div className="bg-surface">
        <div className="max-w-3xl mx-auto px-6 py-16">

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-4">Why HHSRS Citation Transforms a Repair Letter</h2>
            <p className="text-sm text-slate leading-relaxed mb-4">
              Most repair letters say something like: "There is mould on the bedroom wall and I would like it fixed." That is a repair request. An HHSRS complaint letter says: "Your property has an HHSRS Damp and Mould Growth hazard under the Housing Act 2004 (Hazard Category 1). I am giving you formal notice under s.11 LTA 1985 and requesting repair within 14 days. If you fail to act, I will report this hazard to the council's environmental health department, who have a statutory duty to take enforcement action on Category 1 hazards."
            </p>
            <p className="text-sm text-slate leading-relaxed mb-4">
              These are legally different communications. The first is a request. The second is formal notice with a specific statutory framework attached. The second demonstrates that you understand the council's enforcement mechanism and are prepared to use it.
            </p>
            <p className="text-sm text-slate leading-relaxed">
              RepairLetter's AI analyses your photos against all 29 HHSRS categories and identifies the specific hazard that applies to your defect. It then cites that hazard — by number and name — in your letter alongside s.11 LTA 1985 and the Homes Act 2018.
            </p>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">The Most Common HHSRS Hazards in Private Rentals</h2>
            <div className="flex flex-col gap-3">
              {TOP_HAZARDS.map((hazard, i) => (
                <div key={i} className="bg-white border border-border rounded-xl p-4 flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-shield/10 text-shield text-xs font-bold flex items-center justify-center flex-shrink-0">{hazard.num}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1 flex-wrap gap-2">
                      <h3 className="text-sm font-bold text-navy">{hazard.name}</h3>
                      <span className="text-[10px] bg-navy/10 text-navy px-2 py-0.5 rounded-full font-medium">Typically {hazard.typical}</span>
                    </div>
                    <p className="text-xs text-slate">{hazard.trigger}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <div className="bg-white border border-border rounded-2xl p-6 sm:p-8">
              <div className="flex items-start gap-3 mb-4">
                <Scale className="h-6 w-6 text-shield flex-shrink-0 mt-0.5" />
                <h2 className="text-2xl font-bold text-navy">What Happens After an HHSRS Complaint Letter</h2>
              </div>
              <div className="flex flex-col gap-4">
                {[
                  { step: '1', title: 'Landlord receives your letter', desc: 'Your landlord receives a formal notice citing the specific HHSRS hazard. For many landlords, this is the signal that this complaint will escalate if ignored.' },
                  { step: '2', title: '14-day deadline expires with no response', desc: 'RepairLetter auto-generates your environmental health complaint document, referencing the Housing Act 2004, the HHSRS hazard category, and your full evidence pack.' },
                  { step: '3', title: 'Environmental health inspection', desc: 'An officer inspects and assesses using the HHSRS. If they confirm a Category 1 hazard, they have a statutory duty to take enforcement action — typically serving an Improvement Notice.' },
                  { step: '4', title: 'Improvement Notice served', desc: 'Your landlord must complete specified repairs within a set period. Non-compliance is a criminal offence. The council can carry out the works and recover the cost from the landlord.' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3">
                    <div className="w-7 h-7 rounded-lg bg-shield text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{item.step}</div>
                    <div>
                      <h3 className="text-sm font-bold text-navy mb-1">{item.title}</h3>
                      <p className="text-xs text-slate leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Related Guides</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { to: '/environmental-health-complaint-landlord', title: 'Environmental Health Complaint', desc: 'Full guide to the HHSRS inspection process and what follows.' },
                { to: '/letter-to-landlord-about-repairs', title: 'Write a Repair Letter', desc: 'How to structure a complete repair letter with HHSRS citation.' },
                { to: '/repair-letter-template-uk', title: 'Repair Letter Template UK', desc: 'Why an AI-generated letter beats any fill-in template.' },
                { to: '/landlord-not-fixing-repairs', title: 'Landlord Not Fixing Repairs', desc: 'Escalation steps once your HHSRS letter has been sent.' },
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
              <span className="text-xs text-shield-mid font-medium">AI identifies your HHSRS category from your photos</span>
            </div>
            <h2 className="text-2xl font-bold text-navy mb-3">The Strongest Possible Complaint Letter</h2>
            <p className="text-sm text-slate mb-6 max-w-md mx-auto">
              Photo your defect. Our AI identifies the specific HHSRS hazard category. Your letter cites it — alongside s.11 LTA 1985, the Housing Act 2004, and the Homes Act 2018 — and is sent to your landlord in 60 seconds.
            </p>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors inline-flex items-center gap-2">
                  Generate your HHSRS letter — £4.99 <ArrowRight className="h-4 w-4" />
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
