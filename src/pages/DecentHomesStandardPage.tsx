import { useNavigate, Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { Helmet } from 'react-helmet-async';
import { FileText, ArrowRight, ChevronDown, Shield, Clock } from 'lucide-react';
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
      '@id': 'https://repairletter.co.uk/decent-homes-standard-private-renting#webpage',
      url: 'https://repairletter.co.uk/decent-homes-standard-private-renting',
      name: 'Decent Homes Standard Private Renting 2026 | RepairLetter',
      description: 'The Decent Homes Standard now applies to private rentals from 1 May 2026. What it requires, how it affects your repair rights, and how to enforce it.',
      isPartOf: { '@id': 'https://repairletter.co.uk/#organization' },
      speakable: { '@type': 'SpeakableSpecification', cssSelector: ['#quick-answer', 'h1'] },
      inLanguage: 'en-GB',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://repairletter.co.uk/' },
          { '@type': 'ListItem', position: 2, name: 'Decent Homes Standard Private Renting', item: 'https://repairletter.co.uk/decent-homes-standard-private-renting' },
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
      '@type': 'Article',
      headline: 'Decent Homes Standard Private Renting: What Tenants Need to Know in 2026',
      author: { '@type': 'Organization', name: 'RepairLetter' },
      publisher: { '@id': 'https://repairletter.co.uk/#organization' },
      datePublished: '2026-04-10',
      dateModified: '2026-04-10',
      description: 'The Decent Homes Standard extends to private rentals from May 2026. What the four criteria mean, how they interact with HHSRS, and how private tenants can enforce them.',
      mainEntityOfPage: 'https://repairletter.co.uk/decent-homes-standard-private-renting',
    },
    {
      '@type': 'DefinedTermSet',
      name: 'Decent Homes Standard Terminology',
      definedTerm: [
        { '@type': 'DefinedTerm', name: 'Decent Homes Standard', description: 'A minimum housing standard with four criteria: free from Category 1 HHSRS hazards; in reasonable state of repair; reasonably modern facilities; adequate thermal comfort.' },
        { '@type': 'DefinedTerm', name: 'Thermal Comfort', description: 'One of the four Decent Homes criteria — the property must have an efficient heating system and adequate insulation to maintain a reasonable temperature.' },
        { '@type': 'DefinedTerm', name: 'Reasonably Modern Facilities', description: 'One of the four Decent Homes criteria — kitchens and bathrooms should not be excessively outdated, typically 30 years for a kitchen and 40 years for a bathroom.' },
      ],
    },
  ],
};

const FAQ_DATA = [
  { q: 'What is the Decent Homes Standard?', a: 'The Decent Homes Standard is a minimum quality standard for residential properties. It has four criteria: the property must be free from Category 1 hazards under the HHSRS; it must be in a reasonable state of repair; it must have reasonably modern facilities and services; and it must provide a reasonable degree of thermal comfort. Previously, this standard applied only to social housing. From 1 May 2026, it extends to all private residential rentals in England.' },
  { q: 'When does the Decent Homes Standard apply to private rentals?', a: 'The Decent Homes Standard extends to private residential tenancies in England from 1 May 2026 under the Renters\' Rights Act 2025. All private landlords must ensure their properties meet the standard from that date.' },
  { q: 'What are the four criteria of the Decent Homes Standard?', a: 'Criterion 1: the property must be free from Category 1 hazards as defined by the Housing Health and Safety Rating System. Category 1 hazards include severe damp and mould, excess cold, dangerous electrics, and structural collapse risk. Criterion 2: the property must be in a reasonable state of repair — key building components must not be old and deteriorated. Criterion 3: the property must have reasonably modern facilities — kitchens not more than 30 years old, bathrooms not more than 40 years old. Criterion 4: adequate thermal comfort — effective heating and sufficient insulation.' },
  { q: 'How does the Decent Homes Standard interact with HHSRS?', a: 'The first and most important criterion of the Decent Homes Standard is that the property must be free from Category 1 HHSRS hazards. If an environmental health inspection identifies a Category 1 hazard, the property automatically fails the Decent Homes Standard. The two frameworks work together: HHSRS provides the hazard assessment tool, while the Decent Homes Standard provides the minimum quality threshold.' },
  { q: 'What counts as "reasonably modern" facilities?', a: 'Government guidance on the Decent Homes Standard suggests: kitchens should have been fitted or replaced within the last 30 years and have adequate space and layout; bathrooms should have been fitted or replaced within the last 40 years. Beyond age, facilities should be in reasonable working condition. A kitchen or bathroom that is old but fully functional and in good repair may still meet the standard.' },
  { q: 'What counts as adequate thermal comfort?', a: 'Adequate thermal comfort requires: an efficient heating system (a modern, working boiler or equivalent) capable of heating the main living areas to 21°C and the bedroom to 18°C; adequate insulation of roof, walls, and windows to retain heat. A property with a broken boiler, inadequate heating capacity, or no insulation fails this criterion.' },
  { q: 'What if my property fails the Decent Homes Standard?', a: 'If your property fails the Decent Homes Standard, you can: send a formal repair letter citing the standard and the specific criterion it fails; report to your local council\'s environmental health department; apply to the First-tier Tribunal. Local authorities have enforcement powers under the Housing Act 2004, including serving Improvement Notices on landlords whose properties fail the standard.' },
  { q: 'Can I use the Decent Homes Standard in my repair letter?', a: 'Yes. A repair letter that cites the Decent Homes Standard alongside s.11 LTA 1985, HHSRS, and the Homes Act 2018 presents the strongest possible legal basis for your repair demand. RepairLetter generates letters citing all applicable legislation automatically from your photo and voice description.' },
  { q: 'Does the Decent Homes Standard cover all types of repair?', a: 'The Decent Homes Standard focuses on the four criteria above rather than every individual repair. However, the first criterion — freedom from Category 1 HHSRS hazards — covers a very wide range of defects including structural problems, heating failures, damp, mould, and electrical hazards. Properties with these defects will fail the standard.' },
  { q: 'Who enforces the Decent Homes Standard in private rentals?', a: 'Local authorities enforce the Decent Homes Standard through their environmental health departments using HHSRS inspection powers under the Housing Act 2004. If an inspection finds a property fails the standard — particularly due to Category 1 hazards — the council has a duty to take enforcement action. The new Private Rented Sector Ombudsman (from May 2026) provides an additional non-court route.' },
  { q: 'Is the Decent Homes Standard different from s.11 LTA 1985?', a: 'Yes. Section 11 LTA 1985 is a contractual obligation in the tenancy agreement covering specific items (structure, exterior, and core installations). The Decent Homes Standard is a statutory quality threshold covering broader housing conditions. Both can be breached simultaneously. A property that fails the Decent Homes Standard will often also breach s.11, but the two frameworks address different aspects of housing quality.' },
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

const CRITERIA = [
  {
    number: '1',
    title: 'Free from Category 1 HHSRS Hazards',
    desc: 'The most important criterion. The property must have no Category 1 hazards under the Housing Health and Safety Rating System. Category 1 hazards include: severe damp and mould growth; excess cold (inadequate heating); dangerous electrical installations; structural collapse risk; fire hazards; fall hazards on stairs or between levels.',
    examples: ['Severe damp or black mould', 'No working heating system', 'Dangerous electrics', 'Structural instability', 'No smoke or CO alarms'],
    critical: true,
  },
  {
    number: '2',
    title: 'In a Reasonable State of Repair',
    desc: 'Key components of the building must not be in a state of serious disrepair. This covers: roofs, windows, gutters, chimneys, walls, and all core installations. Components that are old and failing — leaking roofs, rotting windows, failed damp-proof courses — fail this criterion.',
    examples: ['Leaking roof', 'Rotting window frames', 'Failed damp-proof course', 'Broken guttering causing damp penetration'],
    critical: false,
  },
  {
    number: '3',
    title: 'Reasonably Modern Facilities',
    desc: 'Kitchens and bathrooms should not be excessively outdated. Government guidance: kitchen not more than 30 years old; bathroom not more than 40 years old. Facilities must be in reasonable working condition regardless of age.',
    examples: ['Kitchen over 30 years old in poor condition', 'Bathroom over 40 years old', 'Inadequate kitchen space or layout'],
    critical: false,
  },
  {
    number: '4',
    title: 'Adequate Thermal Comfort',
    desc: 'The property must have an effective heating system and sufficient insulation. Main living areas must be heatable to 21°C and bedrooms to 18°C. Inadequate insulation, a broken boiler, or insufficient heating capacity fails this criterion.',
    examples: ['No central heating', 'Broken boiler with no replacement', 'No loft or wall insulation', 'Insufficient radiators for the space'],
    critical: false,
  },
];

export function DecentHomesStandardPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-navy">
      <Helmet>
        <title>Decent Homes Standard Private Renting 2026 | RepairLetter</title>
        <meta name="description" content="The Decent Homes Standard now applies to private rentals from 1 May 2026. Four criteria your landlord must meet — free from HHSRS hazards, reasonable repair, modern facilities, thermal comfort." />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href="https://repairletter.co.uk/decent-homes-standard-private-renting" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://repairletter.co.uk/decent-homes-standard-private-renting" />
        <meta property="og:title" content="Decent Homes Standard Private Renting 2026 | RepairLetter" />
        <meta property="og:description" content="Decent Homes Standard extends to private rentals from May 2026. What the four criteria mean for your repair rights." />
        <meta property="og:image" content="https://repairletter.co.uk/og-repair-letter.jpg" />
        <meta property="og:locale" content="en_GB" />
        <meta property="og:site_name" content="RepairLetter" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Decent Homes Standard Private Renting 2026" />
        <meta name="twitter:description" content="Decent Homes Standard now covers private rentals — four criteria your landlord must meet from May 2026." />
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
        <div className="inline-flex items-center gap-2 bg-shield/20 border border-shield/30 rounded-full px-3 py-1.5 mb-4">
          <Clock className="h-3.5 w-3.5 text-shield-mid" />
          <span className="text-xs text-shield-mid font-semibold">Extended to private rentals from 1 May 2026</span>
        </div>
        <p id="quick-answer" className="text-white/40 text-xs uppercase tracking-widest mb-3 font-semibold">Minimum Housing Standards — 2026</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4 max-w-xl">
          Decent Homes Standard
          <br />
          <span className="text-shield-mid">Now Covers Private Renters</span>
        </h1>
        <p className="text-white/55 text-sm sm:text-base leading-relaxed mb-8 max-w-lg">
          The Decent Homes Standard sets four minimum criteria for housing quality. Previously only applying to social housing, it extends to all private rentals in England from 1 May 2026. Your landlord must now meet a legally defined minimum standard — and you have rights when they don't.
        </p>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="w-full sm:w-auto bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              Enforce the standard — £4.99 <ArrowRight className="h-4 w-4" />
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
        <span>4 criteria</span><span className="text-white/15">·</span>
        <span>HHSRS Category 1 free</span><span className="text-white/15">·</span>
        <span>Thermal comfort</span><span className="text-white/15">·</span>
        <span>All private rentals from May 2026</span>
      </div>

      <div className="bg-surface">
        <div className="max-w-3xl mx-auto px-6 py-16">

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-4">Why the Decent Homes Standard Matters for Private Renters</h2>
            <p className="text-sm text-slate leading-relaxed mb-4">
              For decades, the Decent Homes Standard defined the minimum quality expected of social housing in England. Private landlords faced no equivalent statutory minimum. A private landlord could rent a property with a broken boiler, a 50-year-old bathroom, and inadequate insulation — and while this might breach s.11 LTA 1985 in part, there was no overarching quality threshold that applied across all four dimensions.
            </p>
            <p className="text-sm text-slate leading-relaxed mb-4">
              From 1 May 2026, that changes. The Renters' Rights Act 2025 extends the Decent Homes Standard to private residential tenancies. Your landlord's property must meet all four criteria. A property that fails any one of them is in breach of the standard — and you have legal routes to enforce it.
            </p>
            <p className="text-sm text-slate leading-relaxed">
              The most important criterion is the first: freedom from Category 1 HHSRS hazards. A property with severe damp, no working heating, or dangerous electrics fails the Decent Homes Standard automatically. Local authorities have enforcement powers to require landlords to remedy such failures.
            </p>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">The Four Criteria — What Your Property Must Meet</h2>
            <div className="flex flex-col gap-5">
              {CRITERIA.map((criterion) => (
                <div key={criterion.number} className={`bg-white border ${criterion.critical ? 'border-shield/30' : 'border-border'} rounded-2xl p-6`}>
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-8 h-8 rounded-lg text-white text-sm font-bold flex items-center justify-center flex-shrink-0 ${criterion.critical ? 'bg-shield' : 'bg-navy/70'}`}>{criterion.number}</div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-navy mb-2">{criterion.title}</h3>
                      <p className="text-xs text-slate leading-relaxed mb-3">{criterion.desc}</p>
                      <div>
                        <p className="text-xs font-semibold text-navy mb-2">Examples of failure:</p>
                        <ul className="flex flex-col gap-1">
                          {criterion.examples.map((ex, j) => (
                            <li key={j} className="flex items-center gap-2 text-xs text-slate">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate/40 flex-shrink-0" />
                              {ex}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Related Guides</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { to: '/renters-rights-act-2025', title: "Renters' Rights Act 2025", desc: 'The Act that extended the Decent Homes Standard to private renters.' },
                { to: '/letter-to-landlord-about-repairs', title: 'Write a Repair Letter', desc: 'Cite the Decent Homes Standard in a formal repair notice.' },
                { to: '/landlord-repair-obligations-uk', title: 'Full Repair Obligations', desc: 'All the laws that now govern your landlord\'s repair duties.' },
                { to: '/environmental-health-complaint-landlord', title: 'Environmental Health Complaint', desc: 'How councils enforce the Decent Homes Standard using HHSRS.' },
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
              <span className="text-xs text-shield-mid font-medium">Decent Homes Standard — in force May 2026</span>
            </div>
            <h2 className="text-2xl font-bold text-navy mb-3">Your Home Must Meet the Standard</h2>
            <p className="text-sm text-slate mb-6 max-w-md mx-auto">
              If your property fails any of the four Decent Homes criteria, your landlord is in breach from 1 May 2026. RepairLetter generates the legal letter to put them on notice — in 60 seconds.
            </p>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors inline-flex items-center gap-2">
                  Send a repair letter — £4.99 <ArrowRight className="h-4 w-4" />
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
