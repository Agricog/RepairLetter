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
      '@id': 'https://repairletter.co.uk/environmental-health-complaint-landlord#webpage',
      url: 'https://repairletter.co.uk/environmental-health-complaint-landlord',
      name: 'Environmental Health Complaint Against Landlord UK | RepairLetter',
      description: 'How to make an environmental health complaint against your landlord in the UK. HHSRS inspections, improvement notices, and what the 29 hazard categories mean for your case.',
      isPartOf: { '@id': 'https://repairletter.co.uk/#organization' },
      speakable: { '@type': 'SpeakableSpecification', cssSelector: ['#quick-answer', 'h1'] },
      inLanguage: 'en-GB',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://repairletter.co.uk/' },
          { '@type': 'ListItem', position: 2, name: 'Environmental Health Complaint Landlord', item: 'https://repairletter.co.uk/environmental-health-complaint-landlord' },
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
      name: 'How to Make an Environmental Health Complaint Against Your Landlord',
      description: 'Step-by-step guide to the HHSRS complaint process in the UK.',
      totalTime: 'PT2D',
      step: [
        { '@type': 'HowToStep', position: 1, name: 'Send formal repair letter', text: 'Always send a legal repair letter first. This is essential evidence for your complaint.' },
        { '@type': 'HowToStep', position: 2, name: 'Gather evidence', text: 'Photographs, medical records, and correspondence. RepairLetter creates your evidence pack automatically.' },
        { '@type': 'HowToStep', position: 3, name: 'Contact environmental health', text: 'Find your local council at gov.uk/find-local-council. Contact the environmental health or housing department.' },
        { '@type': 'HowToStep', position: 4, name: 'HHSRS inspection', text: 'An officer inspects and classifies any hazards. Category 1 triggers a duty to act.' },
        { '@type': 'HowToStep', position: 5, name: 'Improvement Notice served', text: 'The council serves an Improvement Notice on your landlord with a deadline. Non-compliance is a criminal offence.' },
      ],
    },
    {
      '@type': 'Article',
      headline: 'Environmental Health Complaint Against Landlord: UK Guide 2026',
      author: { '@type': 'Organization', name: 'RepairLetter' },
      publisher: { '@id': 'https://repairletter.co.uk/#organization' },
      datePublished: '2026-04-10',
      dateModified: '2026-04-10',
      description: 'Complete guide to making an environmental health complaint against a landlord in the UK — HHSRS inspections, the 29 hazard categories, improvement notices, and escalation routes.',
      mainEntityOfPage: 'https://repairletter.co.uk/environmental-health-complaint-landlord',
    },
    {
      '@type': 'DefinedTermSet',
      name: 'HHSRS Hazard Categories',
      definedTerm: [
        { '@type': 'DefinedTerm', name: 'Damp and Mould Growth', description: 'HHSRS Hazard 1: biological growth including mould, due to dampness. Associated with respiratory conditions.' },
        { '@type': 'DefinedTerm', name: 'Excess Cold', description: 'HHSRS Hazard 2: inadequate heating or insulation leading to cold homes. Associated with cardiovascular and respiratory conditions.' },
        { '@type': 'DefinedTerm', name: 'Electrical Hazards', description: 'HHSRS Hazard 6: risks from faulty electrical installations. Can cause shock, burns, or fire.' },
      ],
    },
  ],
};

const FAQ_DATA = [
  { q: 'What is an environmental health complaint against a landlord?', a: 'An environmental health complaint is a formal report to your local council\'s environmental health department about housing conditions in your rental property. Under the Housing Act 2004, environmental health officers have powers to inspect residential properties using the Housing Health and Safety Rating System (HHSRS) and take enforcement action against landlords who fail to maintain safe and habitable homes.' },
  { q: 'What is the HHSRS and how does it affect my complaint?', a: 'The Housing Health and Safety Rating System is the framework environmental health officers use to assess hazards in residential properties. It defines 29 hazard categories — from damp and mould to excess cold, fire, structural collapse, and electrical hazards. Each hazard is scored for severity and likelihood. Category 1 hazards are the most serious, triggering a statutory duty on the council to take action. Category 2 hazards are less severe but still require consideration.' },
  { q: 'How long does an environmental health complaint take?', a: 'After submitting a complaint, you can typically expect an inspection within 4 to 8 weeks, though urgent cases — no heating, flooding, serious structural risk — should be prioritised faster. After inspection, if the officer identifies a Category 1 hazard, they must decide on action within a reasonable time. The total process from complaint to Improvement Notice can take 2 to 4 months in straightforward cases.' },
  { q: 'What happens during an HHSRS inspection?', a: 'An environmental health officer visits your property and assesses it against the 29 HHSRS hazard categories. They examine the structure, installations, and conditions. You should accompany the officer if possible and point out all defects. After the inspection, the officer produces a written assessment and decides whether any Category 1 or Category 2 hazards are present. If Category 1 hazards are found, they have a statutory duty to take action.' },
  { q: 'What is an Improvement Notice?', a: 'An Improvement Notice is a formal notice served by the council on your landlord under s.11 of the Housing Act 2004. It specifies the hazard, the works required to remedy it, and a deadline for completion. Failure to comply is a criminal offence. Your landlord can appeal an Improvement Notice to the First-tier Tribunal, but must still comply unless the appeal is successful.' },
  { q: 'Can I make a complaint for multiple defects?', a: 'Yes. You can include all defects in your complaint. Each will be assessed separately under HHSRS. Environmental health officers often find additional hazards during inspection beyond those in the original complaint. The more defects you document with photographs and repair letters, the stronger your overall case.' },
  { q: 'Does an environmental health complaint cost anything?', a: 'No. Making an environmental health complaint to your local council is free. There are no fees for the inspection or for the council\'s enforcement action. RepairLetter charges £4.99 for generating the initial repair letter, and auto-generates your environmental health complaint document for free after 14 days of non-response.' },
  { q: 'What if environmental health says there is no Category 1 hazard?', a: 'If the officer finds only Category 2 hazards, they have discretion (not a duty) to take action. You can request a copy of the full HHSRS assessment in writing. If you disagree with the assessment, you can request a review within the council\'s complaints procedure, or seek advice from Citizens Advice or a housing solicitor about your options.' },
  { q: 'Can my landlord evict me after an environmental health complaint?', a: 'From 1 May 2026, Section 21 no-fault evictions are abolished under the Renters\' Rights Act 2025. Your landlord cannot evict you in response to a legitimate complaint to environmental health. Retaliatory eviction is illegal. If your landlord attempts to evict you after a complaint, this is itself unlawful.' },
  { q: 'What are the 29 HHSRS hazard categories?', a: 'The 29 HHSRS hazard categories cover: damp and mould growth; excess cold; excess heat; asbestos; biocides; carbon monoxide; lead; radiation; uncombusted fuel gas; volatile organic compounds; crowding and space; entry by intruders; lighting; noise; domestic hygiene; pests; refuse; food safety; personal hygiene; water supply; falls on level surfaces; falls on stairs; falls between levels; electrical hazards; fire; flames and hot surfaces; collision and entrapment; explosions; and position and operability of amenities.' },
  { q: 'What is a Prohibition Order?', a: 'A Prohibition Order is more serious than an Improvement Notice. It prevents use of all or part of a property where hazards are so severe that repair alone would not be cost-effective or where there is an immediate risk to health or safety. If a Prohibition Order is served, your landlord must arrange alternative accommodation for you. Violation of a Prohibition Order is a criminal offence.' },
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

const HHSRS_CATEGORIES = [
  { num: '1', name: 'Damp and Mould Growth', desc: 'Biological growth including mould and dust mites due to excess moisture.' },
  { num: '2', name: 'Excess Cold', desc: 'Inadequate heating or insulation — cold homes cause cardiovascular and respiratory conditions.' },
  { num: '3', name: 'Excess Heat', desc: 'Overheating due to poor design or heating controls.' },
  { num: '4–9', name: 'Pollutants', desc: 'Asbestos, biocides, carbon monoxide, lead, radiation, volatile organic compounds.' },
  { num: '10', name: 'Crowding and Space', desc: 'Insufficient space for safe and healthy occupation.' },
  { num: '14', name: 'Noise', desc: 'Inadequate sound insulation between dwellings.' },
  { num: '19', name: 'Personal Hygiene', desc: 'Inadequate sanitation facilities — toilets, baths, showers.' },
  { num: '22–24', name: 'Falls', desc: 'Falls on level surfaces, stairs, and between levels.' },
  { num: '25', name: 'Electrical Hazards', desc: 'Faulty wiring, sockets, and installations risking shock, burns, or fire.' },
  { num: '26', name: 'Fire', desc: 'Risk of fire spreading due to inadequate detection, escape routes, or construction.' },
];

export function EnvironmentalHealthComplaintPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-navy">
      <Helmet>
        <title>Environmental Health Complaint Against Landlord UK | RepairLetter</title>
        <meta name="description" content="How to make an environmental health complaint against your landlord in the UK. HHSRS inspections, the 29 hazard categories, improvement notices, and auto-escalation after 14 days." />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href="https://repairletter.co.uk/environmental-health-complaint-landlord" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://repairletter.co.uk/environmental-health-complaint-landlord" />
        <meta property="og:title" content="Environmental Health Complaint Against Landlord UK | RepairLetter" />
        <meta property="og:description" content="HHSRS inspections, improvement notices, and the 29 hazard categories — complete environmental health complaint guide for UK tenants." />
        <meta property="og:image" content="https://repairletter.co.uk/og-repair-letter.jpg" />
        <meta property="og:locale" content="en_GB" />
        <meta property="og:site_name" content="RepairLetter" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Environmental Health Complaint Against Landlord UK" />
        <meta name="twitter:description" content="HHSRS inspections, improvement notices, 29 hazard categories — environmental health complaint guide for UK tenants." />
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
        <p id="quick-answer" className="text-white/40 text-xs uppercase tracking-widest mb-3 font-semibold">HHSRS — 29 Hazard Categories — Enforcement Powers</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4 max-w-xl">
          Environmental Health Complaint
          <br />
          <span className="text-shield-mid">Against Your Landlord</span>
        </h1>
        <p className="text-white/55 text-sm sm:text-base leading-relaxed mb-8 max-w-lg">
          An environmental health complaint triggers an HHSRS inspection of your property. If the officer finds a Category 1 hazard, your local council has a statutory duty to take enforcement action — no matter what your landlord says. Here is exactly how the process works.
        </p>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="w-full sm:w-auto bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              Start with a repair letter — £4.99 <ArrowRight className="h-4 w-4" />
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
        <span>29 HHSRS Hazard Categories</span><span className="text-white/15">·</span>
        <span>Category 1 Duty to Act</span><span className="text-white/15">·</span>
        <span>Improvement Notices</span><span className="text-white/15">·</span>
        <span>Up to £30,000 Fines</span>
      </div>

      <div className="bg-surface">
        <div className="max-w-3xl mx-auto px-6 py-16">

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">What Is the HHSRS?</h2>
            <p className="text-sm text-slate leading-relaxed mb-4">
              The Housing Health and Safety Rating System is the framework environmental health officers use to assess residential properties. Introduced under the Housing Act 2004, it replaced the older fitness standard with a more sophisticated risk-based approach.
            </p>
            <p className="text-sm text-slate leading-relaxed mb-4">
              HHSRS defines 29 hazard categories and scores each hazard for two factors: the probability of a harmful occurrence, and the severity of the likely outcome. These combine to produce a numerical score. Hazards scoring above a threshold are classified as Category 1 — the most serious. Those below are Category 2.
            </p>
            <p className="text-sm text-slate leading-relaxed">
              The significance of Category 1 is legal. When an environmental health officer finds a Category 1 hazard, they have a statutory duty under the Housing Act 2004 to take enforcement action. They cannot simply note the hazard and move on — they are legally required to act. This is why the HHSRS classification in your RepairLetter is so important: it connects your specific defect to a category that compels council action.
            </p>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">The 29 HHSRS Hazard Categories — Key Ones for Tenants</h2>
            <p className="text-sm text-slate leading-relaxed mb-6">
              Of the 29 HHSRS hazard categories, these are the ones most commonly identified in private rental properties and most likely to be relevant to your complaint.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {HHSRS_CATEGORIES.map((cat, i) => (
                <div key={i} className="bg-white border border-border rounded-xl p-4 flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-shield/10 text-shield text-xs font-bold flex items-center justify-center flex-shrink-0">{cat.num}</div>
                  <div>
                    <h3 className="text-sm font-bold text-navy mb-1">{cat.name}</h3>
                    <p className="text-xs text-slate leading-relaxed">{cat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate mt-4 italic">RepairLetter's AI analyses your photos against all 29 HHSRS categories and identifies the applicable hazard in your letter.</p>
          </section>

          <section className="mb-16">
            <div className="bg-white border border-border rounded-2xl p-6 sm:p-8">
              <div className="flex items-start gap-3 mb-6">
                <Scale className="h-6 w-6 text-shield flex-shrink-0 mt-0.5" />
                <h2 className="text-2xl font-bold text-navy">After the Inspection: What Happens Next</h2>
              </div>
              <div className="flex flex-col gap-4">
                {[
                  { title: 'Category 1 hazard found', action: 'Council has a statutory duty to take action', desc: 'The officer must serve an Improvement Notice or take other formal action. They cannot choose to do nothing.', urgent: true },
                  { title: 'Category 2 hazard found', action: 'Council has discretion to act', desc: 'The officer may serve a Hazard Awareness Notice (advisory) or take formal action. Less certain than Category 1.', urgent: false },
                  { title: 'No hazard found', action: 'Council takes no action', desc: 'You can request the full written HHSRS assessment, challenge via the council\'s complaints process, or seek advice from Citizens Advice.', urgent: false },
                  { title: 'Improvement Notice served', action: 'Landlord must comply within stated period', desc: 'Failure to comply is a criminal offence. The council can carry out works and recover the cost. Penalties up to £30,000.', urgent: true },
                  { title: 'Prohibition Order served', action: 'Property or part of property cannot be used', desc: 'Your landlord must provide alternative accommodation. This is the most serious enforcement outcome.', urgent: true },
                ].map((item, i) => (
                  <div key={i} className={`border rounded-xl p-4 ${item.urgent ? 'border-shield/30 bg-shield/5' : 'border-border'}`}>
                    <div className="flex items-start justify-between mb-1 flex-wrap gap-2">
                      <h3 className="text-sm font-bold text-navy">{item.title}</h3>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.urgent ? 'bg-shield/10 text-shield' : 'bg-gray-100 text-gray-600'}`}>{item.action}</span>
                    </div>
                    <p className="text-xs text-slate leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-4">RepairLetter and Environmental Health</h2>
            <div className="flex flex-col gap-4">
              <div className="bg-white border border-border rounded-xl p-5 flex gap-3">
                <Clock className="h-5 w-5 text-shield flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-navy mb-1">Auto-generated complaint after 14 days</h3>
                  <p className="text-xs text-slate leading-relaxed">If your landlord has not responded within 14 days of your repair letter, RepairLetter automatically generates an environmental health complaint document referencing the Housing Act 2004, the HHSRS hazard category, and your full evidence pack.</p>
                </div>
              </div>
              <div className="bg-white border border-border rounded-xl p-5 flex gap-3">
                <CheckCircle className="h-5 w-5 text-shield flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-navy mb-1">HHSRS classification in your letter</h3>
                  <p className="text-xs text-slate leading-relaxed">RepairLetter's AI analyses your photos against all 29 HHSRS categories. The specific hazard category is cited in your repair letter, making the connection to council enforcement explicit from the start.</p>
                </div>
              </div>
              <div className="bg-white border border-border rounded-xl p-5 flex gap-3">
                <Shield className="h-5 w-5 text-shield flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-navy mb-1">Integrity-verified evidence pack</h3>
                  <p className="text-xs text-slate leading-relaxed">Every photo is SHA-256 hashed and timestamped at upload. Every letter is stored with a generation timestamp. Your evidence pack is cryptographically verifiable — it stands up to scrutiny at a tribunal or in court.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-16">
            <div className="bg-white border border-border border-l-4 border-l-amber-400 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-navy mb-2">Section 21 is abolished — you cannot be evicted for complaining</h3>
                  <p className="text-sm text-slate leading-relaxed">
                    From 1 May 2026, Section 21 no-fault evictions no longer exist. Your landlord cannot terminate your tenancy simply because you contacted environmental health. Retaliatory eviction in response to a legitimate complaint is illegal and can itself be the subject of legal action. You now have full protection to complain without risking your home.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Related Guides</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { to: '/letter-to-landlord-about-repairs', title: 'Write a Repair Letter First', desc: 'Your formal letter is essential evidence for any environmental health complaint.' },
                { to: '/how-to-report-landlord-to-council', title: 'How to Report to the Council', desc: 'Step-by-step guide to finding your local council and submitting your complaint.' },
                { to: '/landlord-not-fixing-repairs', title: 'Landlord Not Fixing Repairs', desc: 'Full escalation guide from letter to tribunal.' },
                { to: '/damp-and-mould-landlord-letter', title: 'Damp and Mould Letter', desc: 'Damp and mould is the most common Category 1 HHSRS hazard in private rentals.' },
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
              <span className="text-xs text-shield-mid font-medium">Auto-escalation to environmental health after 14 days</span>
            </div>
            <h2 className="text-2xl font-bold text-navy mb-3">Build Your Case From the Start</h2>
            <p className="text-sm text-slate mb-6 max-w-md mx-auto">
              Every environmental health complaint is stronger with a formal repair letter behind it. RepairLetter generates the letter, cites the HHSRS category, and auto-generates your complaint document if your landlord doesn't respond.
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
