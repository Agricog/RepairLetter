import { useNavigate, Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { Helmet } from 'react-helmet-async';
import { FileText, ArrowRight, Scale, CheckCircle, ChevronDown, Shield, Clock } from 'lucide-react';
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
      '@id': 'https://repairletter.co.uk/renters-rights-act-2025#webpage',
      url: 'https://repairletter.co.uk/renters-rights-act-2025',
      name: "Renters' Rights Act 2025: Tenant Repairs Guide | RepairLetter",
      description: "Complete guide to the Renters' Rights Act 2025. Section 21 abolished, Decent Homes Standard, Awaab's Law, and what it means for repair rights. In force 1 May 2026.",
      isPartOf: { '@id': 'https://repairletter.co.uk/#organization' },
      speakable: { '@type': 'SpeakableSpecification', cssSelector: ['#quick-answer', 'h1'] },
      inLanguage: 'en-GB',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://repairletter.co.uk/' },
          { '@type': 'ListItem', position: 2, name: "Renters' Rights Act 2025", item: 'https://repairletter.co.uk/renters-rights-act-2025' },
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
      headline: "Renters' Rights Act 2025: What It Means for Repairs and Tenant Rights",
      author: { '@type': 'Organization', name: 'RepairLetter' },
      publisher: { '@id': 'https://repairletter.co.uk/#organization' },
      datePublished: '2026-04-10',
      dateModified: '2026-04-10',
      description: "Complete guide to the Renters' Rights Act 2025 coming into force 1 May 2026 — Section 21 abolition, Decent Homes Standard, Awaab's Law, Ombudsman, and landlord register.",
      mainEntityOfPage: 'https://repairletter.co.uk/renters-rights-act-2025',
    },
    {
      '@type': 'DefinedTermSet',
      name: "Renters' Rights Act 2025 Key Terms",
      definedTerm: [
        { '@type': 'DefinedTerm', name: 'Section 21', description: 'The no-fault eviction mechanism abolished under the Renters\' Rights Act 2025 from 1 May 2026.' },
        { '@type': 'DefinedTerm', name: 'Decent Homes Standard', description: 'A minimum housing standard previously applicable only to social housing, extended to private rentals from 2026.' },
        { '@type': 'DefinedTerm', name: "Awaab's Law", description: 'Legislation requiring landlords to address damp and mould within strict timescales, extended to private rentals from 2026.' },
      ],
    },
  ],
};

const FAQ_DATA = [
  { q: "What is the Renters' Rights Act 2025?", a: "The Renters' Rights Act 2025 is the most significant reform of the private rented sector in England for over 30 years. It received Royal Assent in 2025 and comes into force on 1 May 2026. Its key provisions include: abolition of Section 21 no-fault evictions; extension of the Decent Homes Standard to private rentals; application of Awaab's Law to private landlords; creation of a new Private Rented Sector Landlord Ombudsman; and a mandatory national landlord and property register." },
  { q: "When does the Renters' Rights Act 2025 come into force?", a: "The Renters' Rights Act 2025 comes into force on 1 May 2026. From that date, Section 21 no-fault evictions are abolished, the Decent Homes Standard applies to private rentals, and Awaab's Law timescales for damp and mould apply to private landlords." },
  { q: 'What does the abolition of Section 21 mean for tenants requesting repairs?', a: 'Before May 2026, many tenants were afraid to request repairs because their landlord could respond by serving a Section 21 notice — a no-fault eviction requiring just two months\' notice with no reason given. This practice, known as retaliatory eviction, affected thousands of families each year. With Section 21 abolished, landlords can only evict tenants through Section 8 with specific legal grounds. The fear that prevented tenants from demanding repairs is removed.' },
  { q: "What is the Decent Homes Standard and how does it affect private renters?", a: "The Decent Homes Standard sets minimum conditions for housing: the property must be free from Category 1 HHSRS hazards; in a reasonable state of repair; with reasonably modern facilities; and provide adequate thermal comfort. Previously, this standard only applied to social housing. From 1 May 2026, private landlords must meet the same minimum standard. Properties that fail to meet it are in breach of the new law." },
  { q: "What is Awaab's Law and does it now apply to private renters?", a: "Awaab's Law was enacted following the death of Awaab Ishak, a two-year-old who died from mould-related respiratory illness in a housing association flat in 2020. It requires landlords to acknowledge reports of damp and mould within 14 days, begin emergency repairs within 24 hours, and complete urgent repairs within 14 days. Under the Renters' Rights Act 2025, these obligations now apply to private landlords as well as social housing providers." },
  { q: "What is the new Private Rented Sector Landlord Ombudsman?", a: "The Renters' Rights Act 2025 creates a new statutory ombudsman for the private rented sector. All private landlords must join the scheme. Tenants can submit complaints about landlord conduct without going to court. The Ombudsman can require landlords to apologise, pay compensation, or take remedial action. It provides a lower-cost, faster alternative to court proceedings for dispute resolution." },
  { q: "What is the new landlord register?", a: "Under the Renters' Rights Act 2025, all private landlords must register themselves and their properties on a national database. This makes it easier for tenants to verify their landlord's registration status, and easier for local authorities to identify and take action against unregistered or non-compliant landlords. Failure to register is a criminal offence." },
  { q: "Does the Renters' Rights Act 2025 change s.11 LTA 1985?", a: "Section 11 of the Landlord and Tenant Act 1985 remains unchanged. The Renters' Rights Act 2025 adds to tenants' rights — it does not replace the existing framework. Tenants continue to have rights under s.11, the HHSRS, and the Homes Act 2018, with the Renters' Rights Act 2025 providing additional protections." },
  { q: "Can my landlord still evict me after May 2026?", a: "Yes — but only through Section 8 with specific legal grounds. Valid grounds include: persistent rent arrears; breach of tenancy agreement; the landlord genuinely needing to sell or move in; the tenant causing serious damage. A landlord cannot evict you simply because you asked for repairs, because they want to rent to someone else at a higher price, or for any reason not listed in the Act." },
  { q: "How does the Act affect rent increases?", a: "Landlords can still increase rent but must follow a specific process under the Act. Rent review clauses must be reasonable. Tenants have the right to challenge excessive rent increases at the First-tier Tribunal. Landlords cannot use rent increases as a tool to force tenants to leave — that is classified as a de facto eviction." },
  { q: "Does the Act apply to all private renters in England?", a: "The Renters' Rights Act 2025 applies to private residential tenancies in England. Wales has its own renting legislation under the Renting Homes (Wales) Act 2016. Scotland and Northern Ireland operate under separate legislative frameworks." },
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

const KEY_CHANGES = [
  { title: 'Section 21 Abolished', date: '1 May 2026', desc: 'No-fault evictions are gone. Your landlord can only evict you through Section 8 with a specific legal reason. The threat of retaliatory eviction for requesting repairs is removed permanently.', impact: 'High' },
  { title: 'Decent Homes Standard', date: '1 May 2026', desc: 'Private rental properties must be free from Category 1 HHSRS hazards, in reasonable repair, with modern facilities, and adequate thermal comfort. The same standard previously applied only to social housing now covers all private rentals.', impact: 'High' },
  { title: "Awaab's Law", date: '1 May 2026', desc: 'Private landlords must acknowledge damp and mould reports within 14 days, begin emergency repairs within 24 hours, and complete urgent repairs within 14 days. Failure to comply is a breach of the tenancy and grounds for legal action.', impact: 'High' },
  { title: 'Landlord Ombudsman', date: '1 May 2026', desc: 'All landlords must join the new Private Rented Sector Ombudsman scheme. Tenants can submit complaints without going to court — a faster, cheaper route for dispute resolution.', impact: 'Medium' },
  { title: 'Mandatory Landlord Register', date: '1 May 2026', desc: 'All landlords must register themselves and their properties nationally. Easier for tenants to verify landlord credentials and for councils to take action against rogue landlords.', impact: 'Medium' },
  { title: 'Rent Increase Protections', date: '1 May 2026', desc: 'Landlords must follow a specific process for rent increases. Tenants can challenge excessive increases at the First-tier Tribunal. Rent cannot be used as a mechanism to force tenants out.', impact: 'Medium' },
];

export function RentersRightsAct2025Page() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-navy">
      <Helmet>
        <title>Renters' Rights Act 2025: Tenant Repairs Guide | RepairLetter</title>
        <meta name="description" content="Renters' Rights Act 2025: Section 21 abolished, Decent Homes Standard, Awaab's Law — in force 1 May 2026. What it means for your repair rights and how to use them." />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href="https://repairletter.co.uk/renters-rights-act-2025" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://repairletter.co.uk/renters-rights-act-2025" />
        <meta property="og:title" content="Renters' Rights Act 2025: Tenant Repairs Guide | RepairLetter" />
        <meta property="og:description" content="Section 21 abolished. Decent Homes Standard extended. Awaab's Law in force. Complete Renters' Rights Act 2025 guide for UK tenants." />
        <meta property="og:image" content="https://repairletter.co.uk/og-repair-letter.jpg" />
        <meta property="og:locale" content="en_GB" />
        <meta property="og:site_name" content="RepairLetter" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Renters' Rights Act 2025: Tenant Repairs Guide" />
        <meta name="twitter:description" content="Section 21 abolished, Decent Homes Standard, Awaab's Law — in force 1 May 2026." />
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
          <span className="text-xs text-shield-mid font-semibold">In force 1 May 2026</span>
        </div>
        <p id="quick-answer" className="text-white/40 text-xs uppercase tracking-widest mb-3 font-semibold">The Biggest Reform in 30 Years</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4 max-w-xl">
          Renters' Rights Act 2025
          <br />
          <span className="text-shield-mid">What It Means for Your Home</span>
        </h1>
        <p className="text-white/55 text-sm sm:text-base leading-relaxed mb-8 max-w-lg">
          In force from 1 May 2026, the Renters' Rights Act 2025 is the most significant change to private renting in a generation. Section 21 is abolished. The Decent Homes Standard applies to private rentals. Awaab's Law covers damp and mould. You now have the strongest legal protection in English renting history.
        </p>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="w-full sm:w-auto bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              Enforce your rights now — £4.99 <ArrowRight className="h-4 w-4" />
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
        <span>Section 21 Abolished</span><span className="text-white/15">·</span>
        <span>Decent Homes Standard</span><span className="text-white/15">·</span>
        <span>Awaab's Law</span><span className="text-white/15">·</span>
        <span>1 May 2026</span>
      </div>

      <div className="bg-surface">
        <div className="max-w-3xl mx-auto px-6 py-16">

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Key Changes at a Glance</h2>
            <div className="flex flex-col gap-4">
              {KEY_CHANGES.map((item, i) => (
                <div key={i} className="bg-white border border-border rounded-xl p-5">
                  <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                    <h3 className="text-sm font-bold text-navy">{item.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-widest bg-shield/10 text-shield px-2 py-0.5 rounded-full font-semibold">{item.date}</span>
                      <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-semibold ${item.impact === 'High' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{item.impact} impact</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <div className="bg-white border border-border rounded-2xl p-6 sm:p-8">
              <div className="flex items-start gap-3 mb-4">
                <Scale className="h-6 w-6 text-shield flex-shrink-0 mt-0.5" />
                <h2 className="text-2xl font-bold text-navy">Why Section 21 Abolition Changes Everything for Repairs</h2>
              </div>
              <p className="text-sm text-slate leading-relaxed mb-4">
                Before the Renters' Rights Act 2025, the most effective tool a landlord had against a tenant who complained about repairs was the Section 21 notice. No reason required. Just two months' notice and the tenant had to leave. Survey after survey found that tenants in disrepair lived in silence rather than risk their home.
              </p>
              <p className="text-sm text-slate leading-relaxed mb-4">
                The Deregulation Act 2015 introduced some protection against retaliatory eviction — landlords could not serve Section 21 within six months of a formal repair complaint. But the threat was never fully removed: a landlord could simply wait six months and then serve the notice.
              </p>
              <p className="text-sm text-slate leading-relaxed mb-4">
                From 1 May 2026, that threat is gone permanently. Your landlord cannot serve a Section 21 notice. They can only seek possession through Section 8, citing specific, enumerated legal grounds. None of those grounds include "the tenant asked me to fix the heating."
              </p>
              <p className="text-sm text-slate leading-relaxed">
                This is the change that makes RepairLetter possible as a tool for all tenants — not just the ones brave enough to risk their home. The law has caught up with what tenants needed.
              </p>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">What the Act Means for Repair Rights Specifically</h2>
            <div className="flex flex-col gap-3">
              {[
                { title: 'You can demand repairs without fear of eviction', desc: 'The Section 21 threat that silenced tenants for decades is gone. Demand repairs, write formal letters, contact environmental health — your tenancy is protected.' },
                { title: 'Damp and mould must be addressed within strict timescales', desc: "Awaab's Law now applies to private landlords. Emergency repairs begin within 24 hours, urgent repairs complete within 14 days. Your landlord cannot claim ignorance of the law." },
                { title: 'Your home must meet the Decent Homes Standard', desc: 'Freedom from Category 1 HHSRS hazards, reasonable state of repair, reasonably modern facilities, adequate thermal comfort — these are now minimum legal requirements, not aspirations.' },
                { title: 'You have a new Ombudsman for disputes', desc: 'The new Private Rented Sector Ombudsman gives you a free, independent route to resolve disputes without court. All landlords must participate.' },
                { title: 'Your landlord must be registered', desc: 'All landlords must register on the national database. A landlord who is not registered cannot legally claim possession. Check your landlord is registered before and after May 2026.' },
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
                { to: '/section-21-abolished', title: 'Section 21 Abolished', desc: 'Full details on the end of no-fault evictions and what replaces them.' },
                { to: '/awaabs-law-landlord', title: "Awaab's Law for Private Renters", desc: "How Awaab's Law timescales for damp and mould now apply to your landlord." },
                { to: '/damp-and-mould-landlord-letter', title: 'Damp and Mould Letter', desc: 'Send a legal letter citing both Awaab\'s Law and HHSRS.' },
                { to: '/letter-to-landlord-about-repairs', title: 'Write a Repair Letter', desc: 'Start enforcing your rights under the new Act today.' },
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
              <span className="text-xs text-shield-mid font-medium">RepairLetter cites the Renters' Rights Act 2025 in every letter</span>
            </div>
            <h2 className="text-2xl font-bold text-navy mb-3">The Law Is on Your Side. Use It.</h2>
            <p className="text-sm text-slate mb-6 max-w-md mx-auto">
              The Renters' Rights Act 2025 gives you the strongest repair rights in English renting history. RepairLetter helps you exercise them — in 60 seconds, in any language, with photo evidence.
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
