import { useNavigate, Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { Helmet } from 'react-helmet-async';
import { FileText, ArrowRight, CheckCircle, ChevronDown, Shield, AlertTriangle } from 'lucide-react';
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
      '@id': 'https://repairletter.co.uk/landlord-repair-obligations-uk#webpage',
      url: 'https://repairletter.co.uk/landlord-repair-obligations-uk',
      name: 'Landlord Repair Obligations UK 2026 | RepairLetter',
      description: 'Complete guide to landlord repair obligations in the UK. What landlords must fix under s.11 LTA 1985, HHSRS, and the Homes Act 2018. Know your rights as a tenant.',
      isPartOf: { '@id': 'https://repairletter.co.uk/#organization' },
      speakable: { '@type': 'SpeakableSpecification', cssSelector: ['#quick-answer', 'h1'] },
      inLanguage: 'en-GB',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://repairletter.co.uk/' },
          { '@type': 'ListItem', position: 2, name: 'Landlord Repair Obligations UK', item: 'https://repairletter.co.uk/landlord-repair-obligations-uk' },
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
      name: 'How to Enforce Your Landlord\'s Repair Obligations',
      description: 'Step-by-step guide to enforcing your UK landlord\'s legal repair duties.',
      totalTime: 'PT1M',
      step: [
        { '@type': 'HowToStep', position: 1, name: 'Identify the repair obligation', text: 'Determine whether the defect falls under s.11 LTA 1985, HHSRS, or the Homes Act 2018.' },
        { '@type': 'HowToStep', position: 2, name: 'Give written notice', text: 'Send a formal repair letter. Your landlord\'s obligation only arises once they have notice.' },
        { '@type': 'HowToStep', position: 3, name: 'Allow reasonable time', text: 'Give your landlord a reasonable period — 14 to 28 days for non-emergency repairs.' },
        { '@type': 'HowToStep', position: 4, name: 'Escalate if ignored', text: 'Report to environmental health or apply to the First-tier Tribunal.' },
      ],
    },
    {
      '@type': 'Article',
      headline: 'Landlord Repair Obligations UK: The Complete 2026 Guide',
      author: { '@type': 'Organization', name: 'RepairLetter' },
      publisher: { '@id': 'https://repairletter.co.uk/#organization' },
      datePublished: '2026-04-10',
      dateModified: '2026-04-10',
      description: 'Everything tenants need to know about landlord repair obligations in England under s.11 LTA 1985, the Housing Act 2004, and the Homes (Fitness for Human Habitation) Act 2018.',
      mainEntityOfPage: 'https://repairletter.co.uk/landlord-repair-obligations-uk',
    },
    {
      '@type': 'DefinedTermSet',
      name: 'UK Landlord Repair Obligations Terminology',
      definedTerm: [
        { '@type': 'DefinedTerm', name: 'Implied Repairing Covenant', description: 'The obligation under s.11 LTA 1985 that exists in all residential tenancies regardless of what the agreement says.' },
        { '@type': 'DefinedTerm', name: 'Fitness for Human Habitation', description: 'The standard required under s.9A LTA 1985 inserted by the Homes Act 2018 that properties must meet throughout the tenancy.' },
        { '@type': 'DefinedTerm', name: 'Reasonable Time', description: 'The period within which a landlord must complete repairs after receiving notice. Determined by urgency of the defect.' },
      ],
    },
  ],
};

const FAQ_DATA = [
  { q: 'What are a landlord\'s repair obligations in the UK?', a: 'Under s.11 of the Landlord and Tenant Act 1985, landlords must keep in repair: the structure and exterior of the dwelling (roof, walls, windows, drains, gutters, external pipes); installations for the supply of water, gas, and electricity; installations for sanitation (basins, sinks, baths, toilets); installations for space heating and hot water. Additionally, under the Homes (Fitness for Human Habitation) Act 2018, the property must be fit for human habitation throughout the tenancy.' },
  { q: 'Can a landlord make tenants responsible for repairs in the tenancy agreement?', a: 'No. The repairing obligations under s.11 LTA 1985 cannot be contracted out of. Any clause in a tenancy agreement that attempts to transfer these obligations to the tenant is unenforceable. Landlords can make tenants responsible for minor repairs and decoration, but the core structural and installation obligations remain with the landlord regardless of what the contract says.' },
  { q: 'Does a landlord have to fix repairs they didn\'t cause?', a: 'Yes, for the items covered by s.11. Your landlord must repair the boiler whether it broke due to age, manufacturer defect, or normal wear and tear. They are not responsible for damage deliberately caused by the tenant, but they cannot refuse to fix a defect simply because they did not cause it.' },
  { q: 'What repairs are tenants responsible for?', a: 'Tenants are generally responsible for: minor repairs such as replacing light bulbs, batteries, and fuses; keeping the property clean and in good decorative order; maintaining any garden unless the agreement specifies otherwise; repairs arising from the tenant\'s own misuse or negligence; bleeding radiators and similar minor maintenance. Anything affecting the structure, exterior, or core installations remains the landlord\'s responsibility.' },
  { q: 'Does a landlord have to repair a property between tenancies?', a: 'A landlord must ensure the property is fit for human habitation at the start of a new tenancy under the Homes Act 2018. The HHSRS standard also applies from day one. If a landlord rents a property with Category 1 hazards, they are in breach from the moment the tenancy begins.' },
  { q: 'What counts as "reasonable time" for repairs?', a: 'Emergency repairs (no heating, flooding, gas leak) — 24–48 hours. Urgent repairs affecting habitability — 3–7 days. Standard repairs — 14–28 days. Minor repairs — up to 3 months. The more severe the hazard under HHSRS, the shorter the reasonable time. Awaab\'s Law (extended to private rentals from 2026) sets specific timescales for damp and mould repairs.' },
  { q: 'Is a landlord responsible for repairs to shared areas?', a: 'Yes. In flats or properties with shared areas (stairwells, hallways, lifts, communal gardens), the landlord is responsible for maintaining these under the Landlord and Tenant Act 1985 and general property law. Disrepair in shared areas that affects the safety or use of individual flats is a legitimate repair complaint.' },
  { q: 'What if my landlord argues a repair is due to tenant neglect?', a: 'Your landlord must prove neglect to escape their obligation. Where there is any doubt, an environmental health inspection will assess the actual cause. Structural defects — rising damp, penetrating damp, failed boilers, roof leaks — cannot credibly be attributed to tenant neglect. If your landlord makes this argument, request a formal inspection.' },
  { q: 'Are landlords responsible for white goods and appliances?', a: 'Only if they were provided as part of the tenancy. If your landlord supplied a washing machine, fridge, or oven, they are responsible for keeping it in working order. If you provided the appliance yourself, the responsibility is yours. Any built-in appliances (hob, oven) in a furnished property are the landlord\'s responsibility.' },
  { q: 'What is the Decent Homes Standard and does it apply to private renters?', a: 'The Decent Homes Standard sets minimum standards for housing: the property must be free from Category 1 hazards; in a reasonable state of repair; with reasonably modern facilities; and providing adequate thermal comfort. From 2026 under the Renters\' Rights Act 2025, the standard is extended to private rentals — meaning private landlords face the same minimum standards previously applicable only to social housing.' },
  { q: 'Can a landlord increase rent after carrying out repairs?', a: 'A landlord cannot increase rent during a fixed-term tenancy without agreement. For periodic tenancies, they must follow the correct notice procedure. Carrying out repairs — which are a legal obligation — does not in itself justify a rent increase.' },
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

const LANDLORD_MUST_FIX = [
  { category: 'Structure and exterior', items: ['Roof and roof structure', 'External walls and render', 'Windows and external doors', 'Drains, gutters, and external pipes', 'Foundations'] },
  { category: 'Water, gas and electricity', items: ['Water supply pipes and tanks', 'Gas pipes and meter', 'Electrical wiring, sockets, and consumer unit', 'Gas and electric meters'] },
  { category: 'Sanitation', items: ['Toilets and cisterns', 'Basins, baths, and showers', 'Soil pipes and waste pipes', 'Drainage connections'] },
  { category: 'Heating and hot water', items: ['Boiler and central heating system', 'Radiators and pipework', 'Hot water cylinder or immersion heater', 'Thermostats and heating controls'] },
];

export function LandlordRepairObligationsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-navy">
      <Helmet>
        <title>Landlord Repair Obligations UK 2026 | RepairLetter</title>
        <meta name="description" content="Complete guide to landlord repair obligations in the UK. What landlords must fix under s.11 LTA 1985, HHSRS and Homes Act 2018. Enforce your rights with a legal letter — £4.99." />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href="https://repairletter.co.uk/landlord-repair-obligations-uk" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://repairletter.co.uk/landlord-repair-obligations-uk" />
        <meta property="og:title" content="Landlord Repair Obligations UK 2026 | RepairLetter" />
        <meta property="og:description" content="What are landlord repair obligations in the UK? Complete guide to s.11 LTA 1985, HHSRS, and the Homes Act 2018." />
        <meta property="og:image" content="https://repairletter.co.uk/og-repair-letter.jpg" />
        <meta property="og:locale" content="en_GB" />
        <meta property="og:site_name" content="RepairLetter" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Landlord Repair Obligations UK 2026 | RepairLetter" />
        <meta name="twitter:description" content="What must your landlord fix? Complete UK repair obligations guide — s.11 LTA 1985, HHSRS, Homes Act 2018." />
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
        <p id="quick-answer" className="text-white/40 text-xs uppercase tracking-widest mb-3 font-semibold">UK Tenant Rights — Legal Reference 2026</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4 max-w-xl">
          Landlord Repair Obligations UK
          <br />
          <span className="text-shield-mid">What They Must Fix by Law</span>
        </h1>
        <p className="text-white/55 text-sm sm:text-base leading-relaxed mb-8 max-w-lg">
          Three pieces of UK legislation define what your landlord is legally required to repair. Understanding these obligations means you know exactly what you can demand — and what happens if your landlord refuses.
        </p>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="w-full sm:w-auto bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              Enforce your rights — £4.99 <ArrowRight className="h-4 w-4" />
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
        <span>s.11 LTA 1985</span><span className="text-white/15">·</span>
        <span>Housing Act 2004</span><span className="text-white/15">·</span>
        <span>Homes Act 2018</span><span className="text-white/15">·</span>
        <span>Renters' Rights Act 2025</span>
      </div>

      <div className="bg-surface">
        <div className="max-w-3xl mx-auto px-6 py-16">

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">The Three Laws That Govern Landlord Repair Obligations</h2>
            <div className="flex flex-col gap-4">
              {[
                {
                  title: 'Section 11 — Landlord and Tenant Act 1985',
                  tag: 'Core obligation',
                  desc: 'The foundation of tenant repair rights. Section 11 creates an implied covenant — meaning it exists in every residential tenancy automatically, regardless of what the tenancy agreement says. Your landlord cannot contract out of it. It covers structure, exterior, and all core installations. The obligation is triggered by notice: once you inform your landlord of a defect in writing, they are legally obliged to repair it within a reasonable time.',
                },
                {
                  title: 'Housing Act 2004 — HHSRS',
                  tag: 'Hazard standard',
                  desc: 'The Housing Health and Safety Rating System defines 29 hazard categories used by local authorities to assess residential properties. Category 1 hazards are the most serious — councils have a statutory duty to take enforcement action. When RepairLetter analyses your photos, it classifies the defect against these 29 categories. Citing the specific HHSRS category in your letter strengthens your position because it connects your problem to a category that your local council has legal powers to act on.',
                },
                {
                  title: 'Section 9A — Homes (Fitness for Human Habitation) Act 2018',
                  tag: 'Fitness standard',
                  desc: 'Since 2019, all residential tenancies must be fit for human habitation at the outset and throughout. If your home is unfit — due to serious damp, structural instability, inadequate sanitation, or other defects — you have a direct route to the courts without needing to involve the local authority first. This Act sits alongside s.11 and gives tenants an additional cause of action, particularly for defects that make the property uninhabitable even if they are difficult to classify under s.11.',
                },
              ].map((item, i) => (
                <div key={i} className="bg-white border border-border border-l-4 border-l-shield rounded-xl p-5">
                  <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                    <h3 className="text-sm font-bold text-navy">{item.title}</h3>
                    <span className="text-[10px] uppercase tracking-widest bg-shield/10 text-shield font-semibold px-2 py-0.5 rounded-full">{item.tag}</span>
                  </div>
                  <p className="text-xs text-slate leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-4">What Your Landlord Must Fix — Full Reference</h2>
            <p className="text-sm text-slate leading-relaxed mb-6">
              The following items fall within the landlord's repairing obligation under s.11 LTA 1985. If any of these are defective, your landlord is legally required to repair them once you give written notice.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {LANDLORD_MUST_FIX.map((group, i) => (
                <div key={i} className="bg-white border border-border rounded-xl p-5">
                  <h3 className="text-sm font-bold text-navy mb-3">{group.category}</h3>
                  <ul className="flex flex-col gap-2">
                    {group.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-shield flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-slate">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <div className="bg-white border border-border rounded-2xl p-6 sm:p-8">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
                <h2 className="text-2xl font-bold text-navy">What Landlords Are NOT Responsible For</h2>
              </div>
              <p className="text-sm text-slate leading-relaxed mb-4">
                Understanding the boundaries of s.11 helps you assess your situation accurately and avoid disputes over repairs that are genuinely the tenant's responsibility.
              </p>
              <div className="flex flex-col gap-3">
                {[
                  { item: 'Damage caused by the tenant\'s deliberate misuse or negligence', note: 'Though normal wear and tear is always the landlord\'s responsibility.' },
                  { item: 'Internal decoration', note: 'Painting, wallpaper, and general redecoration are typically the tenant\'s responsibility unless the tenancy agreement specifies otherwise.' },
                  { item: 'Appliances brought in by the tenant', note: 'If you installed a washing machine or other appliance yourself, you are responsible for maintaining it.' },
                  { item: 'Minor maintenance items', note: 'Light bulbs, fuses, batteries for smoke alarms, and similar consumables are generally the tenant\'s responsibility.' },
                  { item: 'Damage caused by a third party', note: 'If a break-in damages the property, your landlord must still repair structural damage — but you should report the break-in to the police first.' },
                ].map((item, i) => (
                  <div key={i} className="border border-border rounded-xl p-4">
                    <p className="text-sm font-medium text-navy mb-1">{item.item}</p>
                    <p className="text-xs text-slate">{item.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">The Notice Requirement — Why Written Letters Matter</h2>
            <p className="text-sm text-slate leading-relaxed mb-4">
              The most important principle in landlord repair law is this: your landlord's obligation to repair arises on notice. Until they have been informed of the defect, they have no legal duty to act. A verbal complaint, a text message, or a casual mention in conversation may not constitute sufficient legal notice.
            </p>
            <p className="text-sm text-slate leading-relaxed mb-4">
              A formal written repair letter — citing the specific legislation, describing the defect precisely, attaching photographic evidence, and setting a clear deadline — is the correct way to give notice. It creates a timestamped record that your landlord cannot dispute.
            </p>
            <p className="text-sm text-slate leading-relaxed">
              From the date your landlord receives your letter, the clock starts. They must complete the repair within a reasonable time. If they do not, you have a documented record of the defect, the notice, and the failure to act — which supports every subsequent escalation route.
            </p>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Renters' Rights Act 2025: New Obligations from May 2026</h2>
            <p className="text-sm text-slate leading-relaxed mb-4">
              The Renters' Rights Act 2025, coming into force on 1 May 2026, significantly strengthens the repair landscape for private tenants. The key changes relevant to repairs are: the Decent Homes Standard is extended to private rentals for the first time; Awaab's Law timescales for damp and mould apply to private landlords; Section 21 no-fault evictions are abolished, removing the fear of retaliatory eviction; a new Landlord Ombudsman provides an alternative dispute resolution route; and all landlords must register on a national database, making enforcement easier.
            </p>
            <p className="text-sm text-slate leading-relaxed">
              For tenants, the abolition of Section 21 is transformative. Previously, many tenants tolerated disrepair rather than risk their landlord serving a no-fault eviction notice in response. From 1 May 2026, that threat is gone. You can demand repairs with confidence, knowing your tenancy is protected as long as you are compliant with its terms.
            </p>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Related Guides</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { to: '/letter-to-landlord-about-repairs', title: 'Letter to Landlord About Repairs', desc: 'How to give formal notice and trigger your landlord\'s legal obligation.' },
                { to: '/landlord-not-fixing-repairs', title: 'Landlord Not Fixing Repairs', desc: 'Escalation steps if your landlord ignores their obligations.' },
                { to: '/how-to-report-landlord-to-council', title: 'Report Landlord to Council', desc: 'How to involve environmental health when your landlord refuses to act.' },
                { to: '/renters-rights-act-2025', title: 'Renters\' Rights Act 2025', desc: 'New obligations on landlords from 1 May 2026.' },
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
              <span className="text-xs text-shield-mid font-medium">Three UK statutes cited in every letter</span>
            </div>
            <h2 className="text-2xl font-bold text-navy mb-3">Enforce Your Landlord's Obligations</h2>
            <p className="text-sm text-slate mb-6 max-w-md mx-auto">
              Knowing the law is the first step. The second is giving your landlord formal notice. RepairLetter generates the correct legal letter in 60 seconds — with photo evidence and all three statutes cited.
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
