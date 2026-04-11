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
      '@id': 'https://repairletter.co.uk/section-21-abolished#webpage',
      url: 'https://repairletter.co.uk/section-21-abolished',
      name: 'Section 21 Abolished: What Tenants Need to Know | RepairLetter',
      description: 'Section 21 no-fault evictions abolished from 1 May 2026. What replaces it, how Section 8 works, and what this means for demanding repairs from your landlord.',
      isPartOf: { '@id': 'https://repairletter.co.uk/#organization' },
      speakable: { '@type': 'SpeakableSpecification', cssSelector: ['#quick-answer', 'h1'] },
      inLanguage: 'en-GB',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://repairletter.co.uk/' },
          { '@type': 'ListItem', position: 2, name: 'Section 21 Abolished', item: 'https://repairletter.co.uk/section-21-abolished' },
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
      headline: 'Section 21 Abolished: Complete Guide for UK Tenants 2026',
      author: { '@type': 'Organization', name: 'RepairLetter' },
      publisher: { '@id': 'https://repairletter.co.uk/#organization' },
      datePublished: '2026-04-10',
      dateModified: '2026-04-10',
      description: 'Section 21 no-fault evictions abolished from 1 May 2026 under the Renters\' Rights Act 2025. What replaces it, Section 8 grounds, and what it means for repair demands.',
      mainEntityOfPage: 'https://repairletter.co.uk/section-21-abolished',
    },
    {
      '@type': 'DefinedTermSet',
      name: 'Section 21 and Section 8 Legal Terms',
      definedTerm: [
        { '@type': 'DefinedTerm', name: 'Section 21', description: 'The mechanism under the Housing Act 1988 that allowed landlords to evict tenants without giving a reason. Abolished from 1 May 2026.' },
        { '@type': 'DefinedTerm', name: 'Section 8', description: 'The mechanism under the Housing Act 1988 allowing landlords to seek possession on specific legal grounds. The only remaining route for landlord-initiated evictions after May 2026.' },
        { '@type': 'DefinedTerm', name: 'Retaliatory Eviction', description: 'The practice of a landlord serving an eviction notice in response to a tenant\'s legitimate complaint — particularly repair requests. Abolished with Section 21.' },
      ],
    },
  ],
};

const FAQ_DATA = [
  { q: 'What was Section 21 and why has it been abolished?', a: 'Section 21 of the Housing Act 1988 was the "no-fault eviction" mechanism. It allowed landlords to end a tenancy by giving two months\' written notice, with no reason required. This meant a landlord could evict a tenant simply for asking for repairs, for having children, or for any other reason — even discriminatory ones. The Renters\' Rights Act 2025 abolishes Section 21 from 1 May 2026, meaning landlords can only seek possession through Section 8 with specific legal grounds.' },
  { q: 'When is Section 21 abolished?', a: 'Section 21 is abolished from 1 May 2026 under the Renters\' Rights Act 2025. Any Section 21 notice served on or after that date is invalid. Section 21 notices served before 1 May 2026 may still be valid if they meet the pre-existing requirements and are acted on promptly.' },
  { q: 'What replaces Section 21?', a: 'Landlords who wish to regain possession of their property must use Section 8 of the Housing Act 1988, citing one of the specific, enumerated grounds in Schedule 2 of that Act. The grounds include: mandatory grounds (the court must grant possession) such as significant rent arrears, conviction for serious crimes, or the landlord genuinely wanting to sell or move in; and discretionary grounds (the court may grant possession) such as breach of tenancy agreement or persistent minor rent arrears.' },
  { q: 'What are the Section 8 grounds for eviction?', a: 'The main mandatory grounds under Section 8 are: Ground 1 (landlord or close family member needs to move in — 4 months\' notice required); Ground 1A (landlord wants to sell — 4 months\' notice required); Ground 7A (conviction for serious criminal offence); Ground 8 (at least 3 months\' rent arrears at time of notice and hearing). Discretionary grounds include: Ground 10 (some rent arrears); Ground 11 (persistent rent arrears even if cleared); Ground 12 (breach of tenancy agreement). Demanding repairs is not a ground.' },
  { q: 'What was retaliatory eviction and is it still possible?', a: 'Retaliatory eviction was the practice of a landlord serving a Section 21 notice in response to a tenant complaining about repairs or housing conditions. It was a significant problem — surveys suggested large numbers of tenants in disrepair declined to complain for fear of losing their home. With Section 21 abolished, retaliatory eviction is no longer possible. A landlord cannot evict you for complaining about repairs.' },
  { q: 'Can a landlord still evict me for rent arrears after May 2026?', a: 'Yes. Ground 8 of Section 8 remains a mandatory ground where a tenant has at least 3 months of rent arrears at both the time the notice is served and the court hearing. This is one of the few grounds where the court has no discretion — if the arrears are proved, possession will be granted. Paying rent remains essential.' },
  { q: 'Can a landlord evict me to sell the property after May 2026?', a: 'Yes — but with conditions. Under the new Ground 1A, a landlord can seek possession to sell the property, but must give 4 months\' notice, must not re-let the property within 12 months of recovering possession, and must actually sell it. If the landlord fails to sell or re-lets within 12 months, the tenant may have a claim.' },
  { q: 'What notice period does a landlord have to give under Section 8?', a: 'Notice periods under Section 8 vary by ground: 4 months for Grounds 1 and 1A (moving in or selling); 4 weeks for Ground 8 (rent arrears); 4 weeks for most discretionary grounds. These are minimum periods — the notice must also follow the correct prescribed form.' },
  { q: 'Can my landlord increase my rent now Section 21 is gone?', a: 'Yes, rent increases are still permitted. Your landlord must follow the statutory process — typically using a Section 13 notice — and must give proper notice. You can challenge excessive increases at the First-tier Tribunal. A rent increase in itself is not grounds for possession. Your landlord cannot use rent as a mechanism to force you out.' },
  { q: 'Does Section 21 abolition apply to existing tenancies?', a: 'Yes. From 1 May 2026, Section 21 abolition applies to all private residential tenancies in England, including those granted before that date. There is no grandfathering for existing tenancies. All tenants are protected from that date.' },
  { q: 'How does Section 21 abolition change my rights when asking for repairs?', a: 'It removes the primary threat that stopped tenants from demanding repairs. Previously, a landlord could respond to a repair request by serving a Section 21 notice and the tenant would have to leave. From May 2026, that response is no longer available. You can send a formal repair letter, contact environmental health, or take the landlord to tribunal — without risking your home.' },
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

export function Section21AbolishedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-navy">
      <Helmet>
        <title>Section 21 Abolished: What Tenants Need to Know | RepairLetter</title>
        <meta name="description" content="Section 21 no-fault evictions abolished from 1 May 2026. What replaces it, how Section 8 works, and why you can now demand repairs without fear of eviction." />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <link rel="canonical" href="https://repairletter.co.uk/section-21-abolished" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://repairletter.co.uk/section-21-abolished" />
        <meta property="og:title" content="Section 21 Abolished: What Tenants Need to Know | RepairLetter" />
        <meta property="og:description" content="Section 21 no-fault evictions abolished from 1 May 2026. Section 8 replaces it. Retaliatory eviction is no longer possible." />
        <meta property="og:image" content="https://repairletter.co.uk/og-repair-letter.jpg" />
        <meta property="og:locale" content="en_GB" />
        <meta property="og:site_name" content="RepairLetter" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Section 21 Abolished: What Tenants Need to Know" />
        <meta name="twitter:description" content="Section 21 gone from 1 May 2026. Your landlord cannot evict you for requesting repairs." />
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
        <div className="inline-flex items-center gap-2 bg-green-900/40 border border-green-700/40 rounded-full px-3 py-1.5 mb-4">
          <CheckCircle className="h-3.5 w-3.5 text-green-400" />
          <span className="text-xs text-green-400 font-semibold">Abolished from 1 May 2026</span>
        </div>
        <p id="quick-answer" className="text-white/40 text-xs uppercase tracking-widest mb-3 font-semibold">The End of No-Fault Evictions</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4 max-w-xl">
          Section 21 Is Abolished.
          <br />
          <span className="text-shield-mid">Your Rights Are Protected.</span>
        </h1>
        <p className="text-white/55 text-sm sm:text-base leading-relaxed mb-8 max-w-lg">
          From 1 May 2026, landlords can no longer evict tenants without a reason. The Section 21 no-fault notice — the tool used for decades to silence tenants who complained about repairs — is gone. Here is exactly what that means for you.
        </p>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="w-full sm:w-auto bg-shield hover:bg-shield-dark text-white font-semibold py-3.5 px-8 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              Demand repairs without fear — £4.99 <ArrowRight className="h-4 w-4" />
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
        <span>Section 21 Gone</span><span className="text-white/15">·</span>
        <span>Section 8 Replaces It</span><span className="text-white/15">·</span>
        <span>No Retaliatory Eviction</span><span className="text-white/15">·</span>
        <span>1 May 2026</span>
      </div>

      <div className="bg-surface">
        <div className="max-w-3xl mx-auto px-6 py-16">

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">What Section 21 Was — and Why It Mattered</h2>
            <p className="text-sm text-slate leading-relaxed mb-4">
              Section 21 of the Housing Act 1988 gave landlords the right to end a tenancy by serving a notice requiring the tenant to leave within two months. No reason had to be given. No court approval was needed before serving the notice. The tenant simply had to go.
            </p>
            <p className="text-sm text-slate leading-relaxed mb-4">
              In theory, this was designed for landlords to reclaim their property at the end of a fixed term. In practice, it became the most powerful tool in any landlord's armoury — and one routinely used against tenants who complained about repairs, asked for their deposit back, or simply became inconvenient.
            </p>
            <p className="text-sm text-slate leading-relaxed mb-4">
              The practical effect on repair rights was devastating. Survey data consistently showed that large numbers of tenants living in properties with serious defects — damp, mould, broken heating, electrical hazards — did not complain to their landlord because they feared receiving a Section 21 notice in response. Many more received Section 21 after making legitimate complaints.
            </p>
            <p className="text-sm text-slate leading-relaxed">
              From 1 May 2026, this is over. Section 21 is abolished under the Renters' Rights Act 2025. Landlords can only seek possession through Section 8, with specific, enumerated legal grounds. None of those grounds include "tenant asked for repairs."
            </p>
          </section>

          <section className="mb-16">
            <div className="bg-white border border-border rounded-2xl p-6 sm:p-8">
              <div className="flex items-start gap-3 mb-6">
                <Scale className="h-6 w-6 text-shield flex-shrink-0 mt-0.5" />
                <h2 className="text-2xl font-bold text-navy">Section 8: What Replaces Section 21</h2>
              </div>
              <p className="text-sm text-slate leading-relaxed mb-6">
                After May 2026, landlords who need to regain possession must use Section 8. The grounds are specific and listed in Schedule 2 of the Housing Act 1988 as amended. Here are the main ones tenants should know.
              </p>
              <div className="flex flex-col gap-3">
                {[
                  { ground: 'Ground 1', type: 'Mandatory', title: 'Landlord or family member moving in', notice: '4 months', detail: 'Landlord or close family member genuinely needs the property as their principal home. Cannot be used in the first 12 months of a tenancy.' },
                  { ground: 'Ground 1A', type: 'Mandatory', title: 'Landlord intends to sell', notice: '4 months', detail: 'Landlord wants to sell the property. Cannot re-let within 12 months without the original tenant having right of first refusal.' },
                  { ground: 'Ground 8', type: 'Mandatory', title: 'Rent arrears (3+ months)', notice: '4 weeks', detail: 'At least 3 months of rent arrears at both the time of the notice and the court hearing. Court has no discretion — must grant possession.' },
                  { ground: 'Ground 10', type: 'Discretionary', title: 'Some rent arrears', notice: '4 weeks', detail: 'Tenant owes rent. Court has discretion whether to grant possession.' },
                  { ground: 'Ground 12', type: 'Discretionary', title: 'Breach of tenancy', notice: '2 weeks', detail: 'Tenant has broken a specific term of the tenancy agreement. Court has discretion.' },
                ].map((item, i) => (
                  <div key={i} className="border border-border rounded-xl p-4">
                    <div className="flex items-start justify-between mb-1 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-shield">{item.ground}</span>
                        <span className="text-sm font-bold text-navy">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.type === 'Mandatory' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{item.type}</span>
                        <span className="text-[10px] bg-navy/10 text-navy px-2 py-0.5 rounded-full">{item.notice} notice</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate leading-relaxed">{item.detail}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-shield/5 border border-shield/20 rounded-xl p-4">
                <p className="text-xs text-slate leading-relaxed">
                  <span className="font-bold text-navy">Not in this list:</span> Requesting repairs, contacting environmental health, complaining to the council, exercising any legal right under housing legislation. None of these are grounds for possession under Section 8.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-4">What This Means For You Right Now</h2>
            <div className="flex flex-col gap-3">
              {[
                { title: 'You can demand repairs without fear', desc: 'Write a formal repair letter. Contact environmental health. Apply to the tribunal. Your tenancy is protected as long as you pay your rent and comply with your tenancy agreement.' },
                { title: 'You can report your landlord to the council', desc: 'An environmental health complaint cannot result in you being evicted. Your landlord\'s only route to possession is Section 8, and "tenant complained to the council" is not on the list.' },
                { title: 'You can pursue a rent repayment order', desc: 'Applying to the First-tier Tribunal for a rent repayment order — a remedy worth up to 12 months of rent — cannot trigger eviction.' },
                { title: 'Your evidence matters more than ever', desc: 'Section 8 cases are contested in court. A tenant with a strong evidence pack — formal letters, timestamped photos, delivery records — is in a much stronger position than one with only verbal conversations.' },
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
            <div className="bg-white border border-border border-l-4 border-l-amber-400 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-navy mb-2">Keep paying your rent</h3>
                  <p className="text-sm text-slate leading-relaxed">
                    Ground 8 — persistent rent arrears — remains a mandatory ground for possession. Regardless of how serious the disrepair is, withholding rent puts your tenancy at risk. Use the legal routes — formal letters, environmental health, tribunal — rather than rent withholding. If you want to pursue a set-off or deduction, seek advice from Citizens Advice or a housing solicitor first.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-navy mb-6">Related Guides</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { to: '/renters-rights-act-2025', title: "Renters' Rights Act 2025", desc: 'Full overview of the Act — all the new protections in one place.' },
                { to: '/letter-to-landlord-about-repairs', title: 'Write a Repair Letter', desc: 'Exercise your rights without fear — formal letter in 60 seconds.' },
                { to: '/landlord-not-fixing-repairs', title: 'Landlord Not Fixing Repairs', desc: 'The full escalation ladder now that Section 21 is gone.' },
                { to: '/environmental-health-complaint-landlord', title: 'Environmental Health Complaint', desc: 'Report your landlord safely — no eviction risk from May 2026.' },
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
            <div className="inline-flex items-center gap-2 bg-green-900/40 border border-green-700/40 rounded-full px-4 py-2 mb-4">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-xs text-green-400 font-medium">Section 21 abolished — your tenancy is protected</span>
            </div>
            <h2 className="text-2xl font-bold text-navy mb-3">Demand the Repairs You Are Owed</h2>
            <p className="text-sm text-slate mb-6 max-w-md mx-auto">
              The threat that kept millions of tenants silent is gone. Photo the defect. Describe it by voice. A legal letter citing UK housing law is sent to your landlord in 60 seconds — and your tenancy is protected.
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
