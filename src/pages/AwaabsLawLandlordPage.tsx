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
      '@id': 'https://repairletter.co.uk/awaabs-law-landlord#webpage',
      url: 'https://repairletter.co.uk/awaabs-law-landlord',
      name: "Awaab's Law: What It Means for Tenants | RepairLetter",
      description: "Awaab's Law now applies to private landlords from 1 May 2026. Damp and mould must be acknowledged in 14 days and fixed within strict timescales. Know your rights.",
      isPartOf: { '@id': 'https://repairletter.co.uk/#organization' },
      speakable: { '@type': 'SpeakableSpecification', cssSelector: ['#quick-answer', 'h1'] },
      inLanguage: 'en-GB',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://repairletter.co.uk/' },
          { '@type': 'ListItem', position: 2, name: "Awaab's Law Landlord", item: 'https://repairletter.co.uk/awaabs-law-landlord' },
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
      name: "How to Use Awaab's Law to Get Your Landlord to Fix Damp and Mould",
      description: "Step-by-step guide to invoking Awaab's Law against a private landlord.",
      totalTime: 'PT14D',
      step: [
        { '@type': 'HowToStep', position: 1, name: 'Document the damp and mould', text: 'Photograph all affected areas clearly before any cleaning.' },
        { '@type': 'HowToStep', position: 2, name: 'Send a formal written notice', text: "A written letter citing Awaab's Law starts the legal clock. Your landlord must acknowledge within 14 days." },
        { '@type': 'HowToStep', position: 3, name: 'Wait for acknowledgement', text: 'Your landlord must acknowledge within 14 days. If they do not, they are already in breach.' },
        { '@type': 'HowToStep', position: 4, name: 'Enforce if ignored', text: 'Report to environmental health or apply to the First-tier Tribunal.' },
      ],
    },
    {
      '@type': 'Article',
      headline: "Awaab's Law: Complete Guide for Private Tenants 2026",
      author: { '@type': 'Organization', name: 'RepairLetter' },
      publisher: { '@id': 'https://repairletter.co.uk/#organization' },
      datePublished: '2026-04-10',
      dateModified: '2026-04-10',
      description: "Everything private tenants in England need to know about Awaab's Law — the timescales, how to invoke it, and what happens if your landlord ignores it.",
      mainEntityOfPage: 'https://repairletter.co.uk/awaabs-law-landlord',
    },
    {
      '@type': 'DefinedTermSet',
      name: "Awaab's Law Key Terms",
      definedTerm: [
        { '@type': 'DefinedTerm', name: "Awaab's Law", description: 'Legislation named after Awaab Ishak requiring landlords to address damp and mould reports within legally prescribed timescales.' },
        { '@type': 'DefinedTerm', name: 'Acknowledgement Period', description: "Under Awaab's Law, landlords must acknowledge a report of damp or mould within 14 days of receiving it." },
        { '@type': 'DefinedTerm', name: 'Emergency Repair', description: "Under Awaab's Law, where damp and mould poses an immediate risk to health, emergency repairs must begin within 24 hours." },
      ],
    },
  ],
};

const FAQ_DATA = [
  { q: "What is Awaab's Law?", a: "Awaab's Law is named after Awaab Ishak, a two-year-old boy who died in December 2020 from a respiratory condition caused by extensive black mould in his family's housing association flat in Rochdale. A coroner's inquest found the mould was the cause of death and that the landlord had repeatedly failed to address the family's complaints. The government's response was legislation requiring landlords to acknowledge and repair damp and mould within strict, legally defined timescales. Originally enacted for social housing, Awaab's Law is extended to private landlords from 1 May 2026 under the Renters' Rights Act 2025." },
  { q: "Does Awaab's Law apply to private landlords?", a: "Yes. From 1 May 2026, Awaab's Law applies to all private residential landlords in England under the Renters' Rights Act 2025. Previously, the law only covered social housing providers. Private landlords now face the same legally prescribed timescales for acknowledging and repairing damp and mould." },
  { q: "What are the timescales under Awaab's Law?", a: "Acknowledgement: your landlord must acknowledge your report of damp or mould within 14 days. Emergency repairs: where damp or mould poses an immediate health risk (particularly for children, elderly people, or those with health conditions), repairs must begin within 24 hours. Urgent repairs: damp and mould classified as an urgent hazard must be completed within 14 days. Non-urgent repairs: a reasonable period, typically 28 to 56 days depending on the nature of the work." },
  { q: "What counts as an emergency under Awaab's Law?", a: "An emergency requiring repair to begin within 24 hours is one where damp and mould poses an immediate risk to the health or safety of the occupants. This is most likely to be found where: there are young children in the property; there are occupants with respiratory conditions such as asthma or COPD; there is extensive black mould covering large areas of living or sleeping spaces; the mould is in or adjacent to a baby's or young child's bedroom." },
  { q: "What must my landlord do after I report damp and mould?", a: "After receiving your written report: within 14 days — acknowledge receipt and confirm they are investigating; within 14 days of investigation — provide a written report of findings and a remediation plan; within the applicable repair period — carry out all necessary works. Failure at any stage is a breach of the law and grounds for complaint, enforcement, or compensation." },
  { q: "How do I make a formal report under Awaab's Law?", a: "Send a written notice to your landlord describing the location and extent of the damp and mould, how long it has been present, and any health effects on occupants. Attach photographs. RepairLetter generates this letter automatically, citing Awaab's Law alongside HHSRS and s.11 LTA 1985. The letter is emailed to your landlord as a branded PDF with your evidence photos embedded." },
  { q: "What if my landlord blames me for the mould?", a: "Landlords frequently argue that mould is caused by tenant behaviour — insufficient ventilation, drying clothes indoors, inadequate heating. Awaab's Law does not exempt landlords from their obligations simply because they assert a tenant cause. If there is a dispute, an environmental health inspection will independently assess the cause. In the majority of cases, structural factors — poor insulation, cold bridging, inadequate ventilation design — are found to be the primary cause." },
  { q: "Can I claim compensation if my landlord ignores Awaab's Law?", a: "Yes. If your landlord breaches the Awaab's Law timescales, you may be able to claim compensation through: the First-tier Tribunal (rent repayment order of up to 12 months' rent); county court proceedings for breach of the tenancy agreement and damages for discomfort, inconvenience, and health impact; the new Private Rented Sector Ombudsman (from May 2026). Medical records documenting health effects significantly strengthen any compensation claim." },
  { q: "Does Awaab's Law cover all types of damp?", a: "Awaab's Law covers biological growth — damp and mould — rather than damp alone. However, structural damp that is likely to lead to mould growth is also within scope. Rising damp, penetrating damp, and condensation causing mould growth are all covered. The law is focused on the health risk, which is most acute where mould is present." },
  { q: "What evidence should I keep for an Awaab's Law claim?", a: "Keep: photographs of all affected areas (before any cleaning); records of when you first noticed the problem; copies of all correspondence with your landlord; medical records if health has been affected; GP letters linking health problems to the mould exposure; a record of the landlord's responses or lack of them. RepairLetter's evidence pack — timestamped, SHA-256 integrity-verified — is designed for exactly this purpose." },
  { q: "Is Awaab's Law the same as the HHSRS damp and mould hazard?", a: "They are separate but related. The HHSRS Damp and Mould Growth hazard category is the framework environmental health officers use to assess severity. Awaab's Law sets legally prescribed timescales for landlord action after a report is made. A property with extensive mould could trigger both: the HHSRS framework for local authority enforcement, and Awaab's Law timescales for the landlord's direct obligation." },
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

export function AwaabsLawLandlordPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-navy">
      <Helmet>
        <title>Awaab's Law: What It Means for Tenants | RepairLetter</title>
        <meta name="description" content="Awaab's Law now applies to private landlords from 1 May 2026. Damp and mould must be acknowledged in 14 days, emergency repairs within 24 hours. Send your legal letter — £4.99." />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href="https://repairletter.co.uk/awaabs-law-landlord" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://repairletter.co.uk/awaabs-law-landlord" />
        <meta property="og:title" content="Awaab's Law: What It Means for Tenants | RepairLetter" />
        <meta property="og:description" content="Awaab's Law applies to private landlords from May 2026 — strict timescales for damp and mould repairs. Know your rights." />
        <meta property="og:image" content="https://repairletter.co.uk/og-repair-letter.jpg" />
        <meta property="og:locale" content="en_GB" />
        <meta property="og:site_name" content="RepairLetter" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Awaab's Law: What It Means for Tenants" />
        <meta name="twitter:description" content="Awaab's Law now covers private renters — damp and mould timescales your landlord must meet." />
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
          <span className="text-xs text-shield-mid font-semibold">Applies to private landlords from 1 May 2026</span>
        </div>
        <p id="quick-answer" className="text-white/40 text-xs uppercase tracking-widest mb-3 font-semibold">Damp and Mould — Legal Timescales</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4 max-w-xl">
          Awaab's Law and
          <br />
          <span className="text-shield-mid">Your Private Landlord</span>
        </h1>
        <p className="text-white/55 text-sm sm:text-base leading-relaxed mb-8 max-w-lg">
          Named after a two-year-old who died from mould in a rented flat, Awaab's Law sets legally binding timescales for damp and mould repairs. From 1 May 2026, every private landlord in England is subject to it. Your landlord must acknowledge your report within 14 days and begin emergency repairs within 24 hours.
        </p>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="w-full sm:w-auto bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              Cite Awaab's Law in your letter — £4.99 <ArrowRight className="h-4 w-4" />
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
        <span>14-day acknowledgement</span><span className="text-white/15">·</span>
        <span>24-hour emergency repairs</span><span className="text-white/15">·</span>
        <span>14-day urgent repairs</span><span className="text-white/15">·</span>
        <span>Private renters from May 2026</span>
      </div>

      <div className="bg-surface">
        <div className="max-w-3xl mx-auto px-6 py-16">

          <section className="mb-16">
            <div className="bg-white border border-border rounded-2xl p-6 sm:p-8">
              <div className="flex items-start gap-3 mb-4">
                <Scale className="h-6 w-6 text-shield flex-shrink-0 mt-0.5" />
                <h2 className="text-2xl font-bold text-navy">The Story Behind Awaab's Law</h2>
              </div>
              <p className="text-sm text-slate leading-relaxed mb-4">
                Awaab Ishak was born in May 2018 and died in December 2020, aged two years and seven months. A coroner's inquest in November 2022 found that Awaab died from a respiratory condition caused by prolonged exposure to extensive black mould in the flat in Rochdale where he lived with his parents.
              </p>
              <p className="text-sm text-slate leading-relaxed mb-4">
                The inquest found that his family had repeatedly reported the mould to their housing association, Rochdale Boroughwide Housing. The landlord had failed to take adequate action, instead suggesting the family's lifestyle as the cause. The family had no alternative but to continue living in the mould-affected property.
              </p>
              <p className="text-sm text-slate leading-relaxed mb-4">
                The case prompted a national conversation about the state of social housing and the power imbalance between tenants and landlords. The government enacted Awaab's Law — named in Awaab's memory — requiring landlords to address damp and mould within legally prescribed timescales. Non-compliance is not a matter of discretion: it is a breach of the law.
              </p>
              <p className="text-sm text-slate leading-relaxed">
                Under the Renters' Rights Act 2025, Awaab's Law is extended from social housing to all private residential tenancies in England from 1 May 2026. The protections that Awaab's family did not have are now available to every tenant in England.
              </p>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">The Awaab's Law Timescales — What Your Landlord Must Do</h2>
            <div className="flex flex-col gap-4">
              {[
                { timeframe: '14 days', label: 'Acknowledge your report', icon: <Clock className="h-5 w-5 text-shield" />, desc: 'From the date your landlord receives your written report of damp or mould, they have 14 days to acknowledge it in writing and confirm they are investigating. No response within 14 days is itself a breach of Awaab\'s Law.', colour: 'border-shield/30' },
                { timeframe: '14 days after investigation', label: 'Provide written assessment and remediation plan', icon: <CheckCircle className="h-5 w-5 text-shield" />, desc: 'After investigation, your landlord must provide a written assessment of the cause and extent of the damp or mould, and a remediation plan with timescales for completing the works.', colour: 'border-shield/30' },
                { timeframe: '24 hours', label: 'Begin emergency repairs', icon: <AlertTriangle className="h-5 w-5 text-red-500" />, desc: 'Where damp and mould poses an immediate health risk — particularly where children, pregnant women, elderly people, or those with respiratory conditions are present — emergency repairs must begin within 24 hours of the report being made.', colour: 'border-red-300' },
                { timeframe: '14 days', label: 'Complete urgent repairs', icon: <Clock className="h-5 w-5 text-amber-500" />, desc: 'Damp and mould classified as an urgent hazard under the HHSRS must be fully remediated within 14 days of the report.', colour: 'border-amber-300' },
                { timeframe: '28–56 days', label: 'Complete non-urgent repairs', icon: <CheckCircle className="h-5 w-5 text-slate" />, desc: 'Less severe damp and mould that does not pose an immediate health risk must be remediated within a reasonable period, typically 28 to 56 days.', colour: 'border-border' },
              ].map((item, i) => (
                <div key={i} className={`bg-white border ${item.colour} border-l-4 rounded-xl p-5`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="text-sm font-bold text-navy">{item.label}</h3>
                        <span className="text-xs font-bold text-shield bg-shield/10 px-2 py-0.5 rounded-full">{item.timeframe}</span>
                      </div>
                      <p className="text-xs text-slate leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">How to Invoke Awaab's Law</h2>
            <p className="text-sm text-slate leading-relaxed mb-6">
              The timescales under Awaab's Law are triggered by a formal written report. Verbal complaints, texts, or WhatsApp messages do not provide the same legal certainty. A formal written notice — sent as a PDF with photos attached, citing Awaab's Law by name — creates an unambiguous record of the date your landlord was informed.
            </p>
            <div className="flex flex-col gap-3">
              {[
                { title: 'Photograph everything before cleaning', desc: 'The extent of mould growth at the time of your report is crucial evidence. Photograph from multiple angles, include context shots showing the whole wall, and close-ups of the most affected areas. Never clean first.' },
                { title: 'Note any health effects', desc: 'Record any respiratory symptoms, asthma attacks, skin conditions, or other health effects you or your family have experienced since the mould appeared. If you have seen a GP, keep those records.' },
                { title: 'Send a formal written notice', desc: 'RepairLetter generates a letter citing Awaab\'s Law, the HHSRS Damp and Mould Growth hazard, s.11 LTA 1985, and the Homes Act 2018. It is emailed to your landlord with your photos embedded as a branded PDF.' },
                { title: 'Track the 14-day acknowledgement deadline', desc: 'From the date your landlord receives the letter, the 14-day clock starts. RepairLetter tracks this automatically and alerts you if your landlord has not responded.' },
                { title: 'Escalate if deadlines are missed', desc: 'If your landlord misses the Awaab\'s Law timescales, report to environmental health immediately. The breach is already documented — your evidence pack demonstrates exactly when notice was given and when timescales expired.' },
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
                { to: '/damp-and-mould-landlord-letter', title: 'Damp and Mould Landlord Letter', desc: "Send a legal letter citing Awaab's Law and HHSRS in 60 seconds." },
                { to: '/renters-rights-act-2025', title: "Renters' Rights Act 2025", desc: "How the Act extended Awaab's Law to private renters." },
                { to: '/environmental-health-complaint-landlord', title: 'Environmental Health Complaint', desc: 'Escalate if your landlord misses the Awaab\'s Law timescales.' },
                { to: '/landlord-not-fixing-repairs', title: 'Landlord Not Fixing Repairs', desc: 'Full escalation guide when your landlord fails to act.' },
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
              <span className="text-xs text-shield-mid font-medium">Awaab's Law cited in every damp and mould letter</span>
            </div>
            <h2 className="text-2xl font-bold text-navy mb-3">Start the Clock on Your Landlord</h2>
            <p className="text-sm text-slate mb-6 max-w-md mx-auto">
              Awaab's Law timescales begin when your landlord receives formal written notice. RepairLetter generates that notice in 60 seconds — with photo evidence, HHSRS classification, and Awaab's Law cited by name.
            </p>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors inline-flex items-center gap-2">
                  Send your damp and mould letter — £4.99 <ArrowRight className="h-4 w-4" />
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
